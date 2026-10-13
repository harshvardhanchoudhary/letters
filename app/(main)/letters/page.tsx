import { relationship } from "@/lib/relationship";
import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import LettersListClient from "./LettersListClient";
export default async function LettersPage() {
  const { supabase, user, partnerName } = await relationship();
  const { data, error } = await supabase
    .from("letters")
    .select(
      "id,subject,body,sent_at,read_at,from_id,to_id,from_profile:profiles!from_id(display_name)",
    )
    .order("sent_at", { ascending: false });
  if (error) throw new Error("Letters unavailable");
  return (
    <>
      <PageHeading
        number="01"
        title="In your own words."
        description={`Your letters with ${partnerName}. Every word you have kept, together.`}
        action={
          <Link className="button" href="/letters/write">
            Write to {partnerName} ↗
          </Link>
        }
      />
      <LettersListClient letters={data || []} userId={user.id} />
    </>
  );
}
