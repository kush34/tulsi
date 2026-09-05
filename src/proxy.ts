import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthPath, isProtectedPath, splitLocale } from "@/lib/auth/route-match";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/v1/auth/") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const { locale, rest } = splitLocale(pathname);
  const session = await auth();
  const loginUrl = `/${locale}/auth`;

  if (isAuthPath(rest)) {
    if (session?.user) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedPath(rest) && !session?.user) {
    const redirect = new URL(loginUrl, request.url);
    redirect.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/:locale/auth",
    "/:locale/dashboard/:path*",
    "/:locale/assesment/:path*",
    "/:locale/assessment/:path*",
    "/:locale/document/:path*",
    "/:locale/confirmation/:path*",
    "/api/:path*",
  ],
};
