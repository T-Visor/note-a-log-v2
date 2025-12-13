import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  console.log(session.user.id);

  return Response.json({
    dbName: `notes_${session.user.id}`,
  });
}