import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

type RouteContext = { params: Promise<{ slug?: string[] }> };

const COUCHDB_URL_BASE = "http://localhost:5984";
const COUCHDB_USERNAME = "admin";
const COUCHDB_PASSWORD = "admin";

const couchDbNameFromUserId = (userId: string) => {
  const hash = crypto
    .createHash("sha256")
    .update(userId)
    .digest("hex");
  return `u_${hash}`;
};

function couchAuthHeader() {
  const base64 = Buffer.from(`${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}`).toString("base64");
  return `Basic ${base64}`;
}

// Block dangerous global endpoints even though we rewrite to a user DB
const BLOCKED_PREFIXES = ["_all_dbs", "_users", "_replicator", "_node", "_membership", "_dbs_info"];

async function getUserDbName(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return null;

  // safest: stable id-based name (avoid email)
  return `user_${session.user.id}`;
}

function isBlocked(path: string) {
  const first = path.split("/")[0];
  return BLOCKED_PREFIXES.includes(first);
}

async function proxy(request: NextRequest, context?: RouteContext) {
  const userDb = await getUserDbName(request);
  if (!userDb) return new Response("Unauthorized", { status: 401 });

  const slug = (await context?.params)?.slug ?? [];
  const path = slug.join("/"); // everything AFTER /api/couchdb/

  if (path && isBlocked(path)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Rewrite into the per-user DB
  const target = `${COUCHDB_URL_BASE}/${couchDbNameFromUserId(userDb)}${path ? `/${path}` : ""}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.set("Authorization", couchAuthHeader());

  // Optional: you may want to strip hop-by-hop headers, but keeping it simple for MVP
  try {
    return await fetch(target, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-expect-error Node fetch streaming
      duplex: "half",
    });
  } catch (err) {
    console.error("CouchDB proxy error:", err);
    return new Response("CouchDB Proxy Error", { status: 500 });
  }
}

export const GET = (req: NextRequest, ctx: RouteContext) => proxy(req, ctx);
export const POST = (req: NextRequest, ctx: RouteContext) => proxy(req, ctx);
export const PUT = (req: NextRequest, ctx: RouteContext) => proxy(req, ctx);
export const DELETE = (req: NextRequest, ctx: RouteContext) => proxy(req, ctx);
export const HEAD = (req: NextRequest, ctx: RouteContext) => proxy(req, ctx);
export const OPTIONS = (req: NextRequest, ctx: RouteContext) => proxy(req, ctx);