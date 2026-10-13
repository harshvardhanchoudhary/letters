import { relationship } from "@/lib/relationship";
import { LetterWriter } from "@/components/LetterWriter";
export default async function WritePage() {
  const { supabase, user, partnerName } = await relationship();
  const { data, error } = await supabase
    .from("letter_drafts")
    .select("id,subject,body")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Draft unavailable");
  return (
    <LetterWriter
      partnerName={partnerName}
      draft={data || { id: crypto.randomUUID(), subject: "", body: "" }}
    />
  );
}
