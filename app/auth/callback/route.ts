// LEARN: When a user clicks the magic link in their email, Supabase sends them
// to /auth/callback. This route exchanges auth params for a real session
// (sets the auth cookie) and then redirects home.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAllowedEmail } from "@/lib/access";
import { getCookieOptions } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Parameters<typeof cookieStore.set>[2];
          }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  async function admittedRedirect() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isAllowedEmail(user.email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=not_invited`);
    }
    return NextResponse.redirect(`${origin}/`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return admittedRedirect();
  }

  if (
    tokenHash &&
    type &&
    ["email", "magiclink", "invite", "signup"].includes(type)
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email_change"
        | "email",
    });

    if (!error) return admittedRedirect();
  }

  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
