import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";

const REDIRECT_TO_FOR_LOGIN = "/login";
const REDIRECT_TO_WHEN_LOGGED_IN = "/";
const PUBLIC_PATHS_FOR_LOGIN = [REDIRECT_TO_FOR_LOGIN];

export const proxy = async (request: NextRequest) => {
  const session = await auth.api.getSession({
    headers: request.headers
  });
  const { pathname } = request.nextUrl;
  const isPublicPathForAuth = PUBLIC_PATHS_FOR_LOGIN.includes(pathname);

  // Redirect user to login/sign-up page if they are not authenticated and try to access protected pages
  if (!session && !isPublicPathForAuth) {
    const loginUrl = new URL(REDIRECT_TO_FOR_LOGIN, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect user if they try to access login/sign-up page when already logged in
  if (session && isPublicPathForAuth) {
    return NextResponse.redirect(new URL(REDIRECT_TO_WHEN_LOGGED_IN, request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - manifest.webmanifest (PWA manifest)
     * - serwist
     * - sw.js file as a serwist static asset
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|serwist|sw.js).*)',
  ],
};