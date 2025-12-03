import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

type Params = {
  slug?: string | string[];
};

const COUCHDB_USERNAME = "admin";
const COUCHDB_PASSWORD = "admin";

const proxy = async (
  request: NextRequest, 
  context: RouteContext
) => {
  const couchDBEndpoint = await buildCouchAPIEndpoint(request, await context.params);

  // Copy headers but override Authorization
  const headers = new Headers(request.headers);
  headers.set("Authorization", couchAuthHeader());

  try {
    return await fetch(couchDBEndpoint, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-expect-error -- if this isn't included, typescript throws an error and not including duplex: "half" slows down the fetches
      duplex: "half",
    });
  } 
  catch (error) {
    console.error("Proxy error:", error);
    return new Response("CouchDB Proxy Error", { status: 500 });
  }
};

const buildCouchAPIEndpoint = async (
  request: NextRequest, 
  params: Params
) => {
  const { slug = [] } = await params;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  return `http://localhost:5984/${path}${request.nextUrl.search}`;
};

const couchAuthHeader = () => {
  const encoded = Buffer.from(`${COUCHDB_USERNAME}:${COUCHDB_PASSWORD}`).toString("base64");
  return `Basic ${encoded}`;
};

export const GET = async (request: NextRequest, context: RouteContext) => {
  return proxy(request, context);
};

export const POST = async (request: NextRequest, context: RouteContext) => {
  return proxy(request, context);
};

export const PUT = async (request: NextRequest, context: RouteContext) => {
  return proxy(request, context);
};

export const DELETE = async (request: NextRequest, context: RouteContext) => {
  return proxy(request, context);
};

export const HEAD = async (request: NextRequest, context: RouteContext) => {
  return proxy(request, context);
};

export const OPTIONS = async (request: NextRequest, context: RouteContext) => {
  return proxy(request, context);
};