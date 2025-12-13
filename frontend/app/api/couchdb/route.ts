import { NextRequest } from "next/server";
import { GET as GET_WITH_SLUG, POST as POST_WITH_SLUG, PUT as PUT_WITH_SLUG, DELETE as DELETE_WITH_SLUG, HEAD as HEAD_WITH_SLUG, OPTIONS as OPTIONS_WITH_SLUG } from "./[...slug]/route";

const emptyCtx = { params: Promise.resolve({ slug: [] as string[] }) };

export const GET = (req: NextRequest) => GET_WITH_SLUG(req, emptyCtx as any);
export const POST = (req: NextRequest) => POST_WITH_SLUG(req, emptyCtx as any);
export const PUT = (req: NextRequest) => PUT_WITH_SLUG(req, emptyCtx as any);
export const DELETE = (req: NextRequest) => DELETE_WITH_SLUG(req, emptyCtx as any);
export const HEAD = (req: NextRequest) => HEAD_WITH_SLUG(req, emptyCtx as any);
export const OPTIONS = (req: NextRequest) => OPTIONS_WITH_SLUG(req, emptyCtx as any);