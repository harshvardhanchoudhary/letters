import "server-only";
import { createClient } from "./supabase/server";
import { redirect } from "next/navigation";
import { isAllowedEmail } from "./access";
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedEmail(user.email)) redirect("/login");
  return { supabase, user };
}
