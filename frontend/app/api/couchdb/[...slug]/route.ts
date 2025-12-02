import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

type Params = {
  slug?: string | string[];
}

async function buildCouchURL(request: NextRequest, params: Params) {
  const { slug = [] } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : slug;

  // no credentials here
  return `http://localhost:5984/${path}${request.nextUrl.search}`;
}

function couchAuthHeader() {
  const username = "admin";
  const password = "admin";
  const encoded = Buffer.from(`${username}:${password}`).toString("base64");

  return `Basic ${encoded}`;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const target = await buildCouchURL(request, await context.params);

  console.log("→ Proxying CouchDB:", target);

  // copy headers but override Authorization
  const headers = new Headers(request.headers);
  headers.set("Authorization", couchAuthHeader());

  try {
    return await fetch(target, {
      method: request.method,
      headers,
      body: request.body,
    });
  } 
  catch (err) {
    console.error("Proxy error:", err);
    return new Response("CouchDB Proxy Error", { status: 500 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}