"use server";
import { requireUser } from "@/lib/session";
import { text, validDate } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
export async function addMoment(
  form: FormData,
): Promise<{ error?: string } | void> {
  const { supabase, user } = await requireUser();
  const title = text(form, "title", 250),
    note = text(form, "note", 10000),
    date = text(form, "occurred_at");
  if (!title || !validDate(date))
    return { error: "Add a title and a valid date for this memory." };
  const { error } = await supabase.from("moments").insert({
    created_by: user.id,
    title,
    note: note || null,
    occurred_at: date + "T12:00:00Z",
  });
  if (error)
    return { error: "This moment could not be saved. Please try again." };
  revalidatePath("/");
  revalidatePath("/timeline");
  redirect("/timeline");
}
