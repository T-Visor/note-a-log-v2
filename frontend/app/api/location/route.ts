import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { auth } from "@/lib/auth";

export const POST = async (
  request: NextRequest
): Promise<NextResponse> => {
  // Check for active user session.
  const session = await auth.api.getSession({
    headers: request.headers
  });
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude)
      return new NextResponse("Missing latitude or longitude", { status: 400 });

    const response = await axios.get(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${
        latitude
      }&longitude=${
        longitude
      }&localityLanguage=en`
    );

    const location = [response.data.locality, response.data.principalSubdivision]
    return NextResponse.json(location);
  }
  catch (error) {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }
};