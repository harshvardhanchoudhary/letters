import { requireUser } from "@/lib/session";
import { displayName } from "@/lib/access";
import { photoUrl } from "@/lib/photos";
import { Home } from "@/components/Home";
export default async function HomePage() {
  const { supabase, user } = await requireUser();
  const [profiles, letters, mood, plans, books, photos, firstLetter] =
    await Promise.all([
      supabase.from("profiles").select("*"),
      supabase
        .from("letters")
        .select("id,subject,body,sent_at", { count: "exact" })
        .eq("to_id", user.id)
        .is("read_at", null)
        .order("sent_at", { ascending: false })
        .limit(1),
      supabase
        .from("checkins")
        .select("mood,need,phase")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("plans")
        .select("title,planned_for")
        .eq("status", "planned")
        .order("planned_for")
        .limit(1),
      supabase
        .from("library_items")
        .select("title,progress")
        .eq("kind", "book")
        .eq("status", "reading")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("postcards")
        .select("image_url,caption")
        .order("sent_at", { ascending: false })
        .limit(1),
      supabase.from("letters").select("sent_at").order("sent_at").limit(1),
    ]);
  if (
    [profiles, letters, mood, plans, books, photos, firstLetter].some(
      (r) => r.error,
    )
  )
    throw new Error("Journal unavailable");
  const me = profiles.data?.find((p) => p.id === user.id),
    partner = profiles.data?.find((p) => p.id !== user.id);
  const { count, error } = await supabase
    .from("letters")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error("Letters unavailable");
  const photo = photos.data?.[0];
  const signed = photo ? await photoUrl(supabase, photo.image_url) : "";
  return (
    <Home
      data={{
        myName: displayName(me?.email, me?.display_name),
        partnerName: displayName(partner?.email, partner?.display_name),
        unread: letters.data?.[0] || null,
        letterCount: count || 0,
        firstLetterDate: firstLetter.data?.[0]?.sent_at || null,
        mood: mood.data?.[0] || null,
        plan: plans.data?.[0] || null,
        book: books.data?.[0] || null,
        photo: photo && signed ? { url: signed, caption: photo.caption } : null,
      }}
    />
  );
}
