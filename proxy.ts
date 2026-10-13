// LEARN: Middleware runs on every request *before* the page renders.
// It's the right place to check "is this person logged in?" and redirect
// them to /login if not — so no page ever accidentally loads without auth.
// It also refreshes the session cookie so users don't get logged out unexpectedly.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/access";
import { getCookieOptions } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (path.startsWith("/login")) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Parameters<typeof response.cookies.set>[2];
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = path.startsWith("/login") || path.startsWith("/auth");

  const admitted = user && isAllowedEmail(user.email);
  const redirectWithCookies = (url: URL) => {
    const next = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => next.cookies.set(cookie));
    next.headers.set("Cache-Control", "private, no-store");
    return next;
  };
  response.headers.set("Cache-Control", "private, no-store");
  if (!admitted && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithCookies(url);
  }

  if (admitted && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectWithCookies(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
