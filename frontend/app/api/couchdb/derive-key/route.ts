import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export const GET = async (request: NextRequest) => {
  const session = await auth.api.getSession({ 
    headers: request.headers 
  });

  if (!session?.user?.id)
    return new Response("Unauthorized", { status: 401 });

  return Response.json({
    key: generateKeyFromUserID(session.user.id),
  });
};

const generateKeyFromUserID = (userId: string) => {
  const hash = crypto
    .createHash("sha512")
    .update(userId)
    .digest("hex");
  return hash;
};