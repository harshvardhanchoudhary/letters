import { displayName } from "@/lib/access";
import { relationship } from "@/lib/relationship";
import { Checkin, type CheckinEntry } from "@/components/Checkin";
export default async function MoodPage() {
  const { supabase, partnerName } = await relationship();
  const [{ data, error }, { data: privateEntries, error: privateError }] =
    await Promise.all([
      supabase
        .from("checkins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("checkin_private").select("*"),
    ]);
  if (error || privateError) throw new Error("Check-ins unavailable");
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,display_name");
  if (profileError) throw new Error("Profiles unavailable");
  return (
    <Checkin
      partnerName={partnerName}
      names={Object.fromEntries(
        (profiles || []).map((p) => [
          p.id,
          displayName(p.email, p.display_name),
        ]),
      )}
      entries={(data || []) as CheckinEntry[]}
      privateEntries={privateEntries || []}
    />
  );
}
