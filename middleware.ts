import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Paths to protect for logged-in users
  const protectedPaths = ["/", "/tasks"];

  // Paths for authentication pages
  const authPaths = ["/login", "/signup"];

  // Check if the current path is protected
  const isProtected = protectedPaths.some((path) =>
    req.nextUrl.pathname === path
  );

  // Check if the current path is an authentication page
  const isAuthPage = authPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // If accessing a protected route and not authenticated, redirect to login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If accessing login/signup and already authenticated, redirect to /
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow access to other pages
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/tasks", "/login", "/signup"],
};
