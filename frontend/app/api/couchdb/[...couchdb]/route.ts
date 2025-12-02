import axios from "axios";
import { NextResponse, NextRequest } from "next/server";

const COUCHDB_URL = "http://127.0.0.1:5984";
const COUCHDB_AUTH = "admin:admin";

export type CouchDBParams = {
  couchdb: string[];
};

export type CouchDBRouteParams = {
  params: CouchDBParams;
};

export const GET = async (
  request: NextRequest, 
  { params }: CouchDBRouteParams
) => {
  return handleProxy(request, params);
};

export const POST = async (
  request: NextRequest, 
  { params }: CouchDBRouteParams
) => {
  return handleProxy(request, params);
};

export const PUT = async (
  request: NextRequest, 
  { params }: CouchDBRouteParams
) => {
  return handleProxy(request, params);
};

export const DELETE = async (
  request: NextRequest, 
  { params }: CouchDBRouteParams
) => {
  return handleProxy(request, params);
};

const handleProxy = async (
  request: NextRequest, 
  params: CouchDBParams
) => {
  const path = params.couchdb.join("/");
  const url = `${COUCHDB_URL}/${path}`;

  const headers = new Headers(request.headers);
  headers.set(
    "Authorization",
    "Basic " + Buffer.from(COUCHDB_AUTH).toString("base64")
  );

  const response = await fetch(url, {
    method: request.method,
    headers,
    body: request.method !== "GET" ? await request.arrayBuffer() : undefined,
  });

  const data = await response.arrayBuffer();
  return new NextResponse(data, {
    status: response.status,
    headers: response.headers,
  });
};