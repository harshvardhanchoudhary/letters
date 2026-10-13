import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function photoUrl(supabase: SupabaseClient, value: string) {
  let path = value;
  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      const expected = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
      if (url.origin !== expected.origin) return "";
      const marker = "/timeline-photos/";
      if (!url.pathname.includes(marker)) return "";
      path = decodeURIComponent(url.pathname.split(marker)[1]);
    } catch {
      return "";
    }
  }
  const { data, error } = await supabase.storage
    .from("timeline-photos")
    .createSignedUrl(path, 3600);
  return error ? "" : data.signedUrl;
}
