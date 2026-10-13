"use server";
import { requireUser } from "@/lib/session";
import { text, uuid } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
export async function sendLetter(
  form: FormData,
): Promise<{ error?: string } | void> {
  const { supabase, user } = await requireUser();
  const body = text(form, "body", 100000),
    subject = text(form, "subject", 250),
    id = text(form, "id");
  if (!body || !uuid(id))
    return { error: "Write something before sealing your letter." };
  const { data: profiles, error: partnerError } = await supabase
    .from("profiles")
    .select("id")
    .neq("id", user.id)
    .limit(1);
  if (partnerError || !profiles?.length)
    return { error: "Your person needs to join before you can send a letter." };
  const { error } = await supabase.from("letters").insert({
    id,
    from_id: user.id,
    to_id: profiles[0].id,
    body,
    subject: subject || null,
  });
  if (error) {
    if (error.code !== "23505")
      return {
        error: "Your letter could not be sent. Your draft is still here.",
      };
    const { data: existing } = await supabase
      .from("letters")
      .select("id")
      .eq("id", id)
      .eq("from_id", user.id)
      .eq("body", body)
      .maybeSingle();
    if (!existing)
      return {
        error: "Could not seal this letter. Reopen your draft and try again.",
      };
  }
  await supabase
    .from("letter_drafts")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);
  revalidatePath("/");
  revalidatePath("/letters");
  revalidatePath("/timeline");
  redirect("/letters?sent=1");
}
export async function markAsRead(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  if (!uuid(id)) return;
  await supabase
    .from("letters")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("to_id", user.id)
    .is("read_at", null);
}
