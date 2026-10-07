import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.cookies.get("token")?.value) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assignments/:path*",
    "/lms/:path*",
    "/my-courses/:path*",
    "/my-classes/:path*",
    "/settings/:path*",
    "/adminDashboard/:path*",
    "/courseUpload/:path*",
  ],
};
