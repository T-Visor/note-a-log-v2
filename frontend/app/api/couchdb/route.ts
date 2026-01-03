import { NextRequest } from "next/server";
import {
  GET as GET_WITH_SLUG, 
  POST as POST_WITH_SLUG, 
  PUT as PUT_WITH_SLUG, 
  DELETE as DELETE_WITH_SLUG, 
  HEAD as HEAD_WITH_SLUG, 
  OPTIONS as OPTIONS_WITH_SLUG
} from "./[...slug]/route";

const emptyContext = { params: Promise.resolve({ slug: [] as string[] }) };

export const GET = (request: NextRequest) => GET_WITH_SLUG(request, emptyContext as any);
export const POST = (request: NextRequest) => POST_WITH_SLUG(request, emptyContext as any);
export const PUT = (request: NextRequest) => PUT_WITH_SLUG(request, emptyContext as any);
export const DELETE = (request: NextRequest) => DELETE_WITH_SLUG(request, emptyContext as any);
export const HEAD = (request: NextRequest) => HEAD_WITH_SLUG(request, emptyContext as any);
export const OPTIONS = (request: NextRequest) => OPTIONS_WITH_SLUG(request, emptyContext as any);