"use server";
import { requireUser } from "@/lib/session";
import { text, uuid } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
export async function uploadPhoto(
  form: FormData,
): Promise<{ error?: string } | void> {
  const { supabase, user } = await requireUser();
  const file = form.get("photo");
  if (!(file instanceof File) || !file.size)
    return { error: "Choose a photo first." };
  if (file.size > 8 * 1024 * 1024)
    return { error: "Choose a photo smaller than 8 MB." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return { error: "Choose a JPEG, PNG or WebP photo." };
  const { data: partner } = await supabase
    .from("profiles")
    .select("id")
    .neq("id", user.id)
    .limit(1);
  if (!partner?.length)
    return { error: "Your person needs to join before you can share a photo." };
  let image: Buffer;
  try {
    image = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40000000,
    })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 })
      .toBuffer();
  } catch {
    return { error: "We couldn’t read that image. Try a different photo." };
  }
  const path = `${user.id}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("timeline-photos")
    .upload(path, image, { contentType: "image/webp", upsert: false });
  if (uploadError) return { error: "Photo upload failed. Please try again." };
  const { error } = await supabase.from("postcards").insert({
    from_id: user.id,
    to_id: partner[0].id,
    image_url: path,
    caption: text(form, "caption", 2000) || null,
  });
  if (error) {
    await supabase.storage.from("timeline-photos").remove([path]);
    return {
      error: "The photo could not be added to your story. Please try again.",
    };
  }
  revalidatePath("/");
  revalidatePath("/timeline");
  redirect("/timeline");
}
export async function markPostcardAsRead(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  if (!uuid(id)) return;
  await supabase
    .from("postcards")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("to_id", user.id)
    .is("read_at", null);
}
