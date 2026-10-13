import { relationship } from "@/lib/relationship";
import { Library } from "@/components/Library";
export default async function LibraryPage() {
  const { supabase, user, partnerName } = await relationship();
  const [items, notes] = await Promise.all([
    supabase
      .from("library_items")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("library_notes").select("*").order("created_at"),
  ]);
  if (items.error || notes.error) throw new Error("Library unavailable");
  return (
    <Library
      partnerName={partnerName}
      items={items.data || []}
      notes={notes.data || []}
      userId={user.id}
    />
  );
}
