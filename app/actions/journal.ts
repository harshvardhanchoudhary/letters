"use server";
import { requireUser } from "@/lib/session";
import { text, safeUrl, validDate, uuid } from "@/lib/validation";
import { revalidatePath } from "next/cache";
type Result = { error?: string; success?: boolean };
function refresh() {
  ["/", "/mood", "/library", "/together", "/letters", "/timeline"].forEach(
    (p) => revalidatePath(p),
  );
}
export async function saveCheckin(form: FormData): Promise<Result> {
  const { supabase } = await requireUser();
  const mood = text(form, "mood", 80);
  if (!mood) return { error: "Choose a mood, or use your own words." };
  const payload = {
    mood,
    energy: text(form, "energy", 80) || "steady",
    need: text(form, "need", 500),
    phase: text(form, "phase", 200),
    cycle_phase: text(form, "cycle_phase", 80),
    note: text(form, "note", 5000),
    share_cycle: form.get("share_cycle") === "on",
    share_note: form.get("share_note") === "on",
  };
  const { error } = await supabase.rpc("save_checkin", { payload });
  if (error)
    return { error: "Your check-in could not be saved. Please try again." };
  refresh();
  return { success: true };
}
export async function addLibraryItem(form: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const title = text(form, "title", 250),
    kind = text(form, "kind", 20);
  if (!title || !["book", "video", "article"].includes(kind))
    return { error: "Add a title and choose a valid type." };
  let url;
  try {
    url = safeUrl(text(form, "url", 2000));
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (kind !== "book" && !url)
    return { error: "Add the link you want to discuss." };
  const { error } = await supabase.from("library_items").insert({
    user_id: user.id,
    title,
    kind,
    author: text(form, "author", 250),
    url,
  });
  if (error)
    return { error: "This item could not be saved. Please try again." };
  refresh();
  return { success: true };
}
export async function updateReading(form: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const id = text(form, "id"),
    status = text(form, "status"),
    raw = text(form, "progress"),
    progress = Number(raw);
  if (
    !uuid(id) ||
    !["want", "reading", "finished"].includes(status) ||
    !raw ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100
  )
    return { error: "Choose a reading status and progress from 0 to 100." };
  const { data, error } = await supabase
    .from("library_items")
    .update({ status, progress: status === "finished" ? 100 : progress })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error || !data?.length)
    return { error: "Only the person who added this item can update it." };
  refresh();
  return { success: true };
}
export async function addLibraryNote(form: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const body = text(form, "body"),
    item_id = text(form, "item_id");
  if (!body || !uuid(item_id)) return { error: "Write a note before saving." };
  const { error } = await supabase.from("library_notes").insert({
    user_id: user.id,
    item_id,
    body,
    is_private: form.get("is_private") === "on",
  });
  if (error)
    return { error: "Your note could not be saved. Please try again." };
  refresh();
  return { success: true };
}
export async function addPlan(form: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const title = text(form, "title", 250),
    energy = text(form, "energy"),
    date = text(form, "planned_for");
  if (!title) return { error: "Give your idea a name." };
  if (
    !["gentle", "steady", "adventurous"].includes(energy) ||
    (date && !validDate(date))
  )
    return { error: "Choose a valid energy level and date." };
  const { error } = await supabase.from("plans").insert({
    user_id: user.id,
    title,
    note: text(form, "note", 5000),
    energy,
    planned_for: date || null,
    status: date ? "planned" : "idea",
  });
  if (error)
    return { error: "Your plan could not be saved. Please try again." };
  refresh();
  return { success: true };
}
export async function updatePlan(form: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const id = text(form, "id"),
    status = text(form, "status"),
    date = text(form, "planned_for");
  if (!uuid(id) || !["idea", "planned", "done"].includes(status))
    return { error: "Choose a valid plan status." };
  if ((date && !validDate(date)) || (status === "planned" && !date))
    return { error: "Choose a date for a planned activity." };
  const { data, error } = await supabase
    .from("plans")
    .update({ status, planned_for: status === "idea" ? null : date || null })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error || !data?.length)
    return { error: "Only the person who added this plan can update it." };
  refresh();
  return { success: true };
}
export async function saveDraft(form: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const id = text(form, "id");
  if (!uuid(id))
    return { error: "Could not save this draft. Reopen the writer." };
  const { error } = await supabase.from("letter_drafts").upsert(
    {
      user_id: user.id,
      id,
      subject: text(form, "subject", 250),
      body: text(form, "body", 100000),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  return error
    ? { error: "Draft not saved. Keep this page open and try again." }
    : { success: true };
}
