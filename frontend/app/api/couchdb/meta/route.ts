import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const GET = async (request: NextRequest) => {
  const session = await auth.api.getSession({ 
    headers: request.headers 
  });

  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  return NextResponse.json({
    dbName: `notes_${session.user.id}`,
  });
};