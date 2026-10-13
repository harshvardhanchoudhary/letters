import { relationship } from "@/lib/relationship";
import { Together } from "@/components/Together";
export default async function TogetherPage({
  searchParams,
}: {
  searchParams: Promise<{ energy?: string }>;
}) {
  const { supabase, user, partnerName } = await relationship();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("planned_for", { ascending: true, nullsFirst: false });
  if (error) throw new Error("Plans unavailable");
  const { energy } = await searchParams;
  return (
    <Together
      partnerName={partnerName}
      plans={data || []}
      userId={user.id}
      initialEnergy={energy}
    />
  );
}
