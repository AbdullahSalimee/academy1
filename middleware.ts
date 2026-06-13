import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PASSWORD = process.env.APP_PASSWORD || "academy2024";
const COOKIE_NAME = "academy_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, API routes, and static assets through
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get(COOKIE_NAME);
  if (!authCookie || authCookie.value !== PASSWORD) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
