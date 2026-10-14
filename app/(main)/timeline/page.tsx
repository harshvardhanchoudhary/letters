import { requireUser } from "@/lib/session";
import { photoUrl } from "@/lib/photos";
import type { TimelineEntry } from "@/types/database";
import Link from "next/link";
import { PageHeading } from "@/components/PageHeading";
import TimelineClient from "./TimelineClient";
export default async function TimelinePage() {
  const { supabase, user } = await requireUser();
  const [letters, postcards, moments] = await Promise.all([
    supabase.from("letters").select("*"),
    supabase.from("postcards").select("*"),
    supabase.from("moments").select("*"),
  ]);
  if (letters.error || postcards.error || moments.error)
    throw new Error("Story unavailable");
  const photos = await Promise.all(
    (postcards.data || []).map(async (p) => ({
      ...p,
      image_url: await photoUrl(supabase, p.image_url),
    })),
  );
  const entries = [
    ...(letters.data || []).map((e) => ({ ...e, kind: "letter" })),
    ...photos.map((e) => ({ ...e, kind: "postcard" })),
    ...(moments.data || []).map((e) => ({ ...e, kind: "moment" })),
  ] as TimelineEntry[];
  return (
    <>
      <PageHeading
        number="02"
        title="Look where that hello went."
        description="Letters, photographs, and days that deserve more than a camera-roll date."
        action={
          <div style={{ display: "flex", gap: 16 }}>
            <Link className="button secondary" href="/postcards/send">
              Add a photo ↗
            </Link>
            <Link className="button" href="/timeline/add-moment">
              Keep a moment ↗
            </Link>
          </div>
        }
      />
      <TimelineClient entries={entries} userId={user.id} />
    </>
  );
}
