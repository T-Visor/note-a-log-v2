import { NextRequest, NextResponse } from "next/server";

// Process the whitelist ONCE when the server/container starts (Warm Start).
// 1. Handle missing env var gracefully.
// 2. Split by comma.
// 3. Trim whitespace from every entry.
// 4. Normalize to lowercase.
// 5. Filter out empty strings to prevent matching blank inputs.
const whitelist = (process.env.EMAIL_WHITELIST || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.length > 0);

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate input exists and is a string
    if (!username || typeof username !== "string") {
      return new NextResponse("Missing or invalid email", { status: 400 });
    }

    // Normalize input to lowercase before checking
    if (!whitelist.includes(username.trim().toLowerCase())) {
      return new NextResponse("Username not whitelisted", { status: 401 });
    }

    return NextResponse.json({
      message: `${username} is whitelisted`,
    });

  } 
  catch (error) {
    // Handle JSON parsing errors
    return new NextResponse("Invalid JSON body", { status: 400 });
  }
};