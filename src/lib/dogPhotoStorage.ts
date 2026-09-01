import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const BUCKET = "dog-photos";

export type DogPhoto = { fileName: string; label: string; url: string };

function labelFromFileName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const spaced = withoutExt.replace(/[-_]+/g, " ").trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase()) || fileName;
}

// Lists whatever photos are currently in the shared dog-photos bucket.
// Returns [] (never throws) if the bucket is empty or unreachable, so
// callers can fall back to an empty state instead of a broken image.
export async function listDogPhotos(
  supabase: SupabaseClient<Database>,
): Promise<DogPhoto[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list();
  if (error || !data) return [];

  return data
    .filter((file) => file.id) // real objects only, not folder placeholders
    .map((file) => ({
      fileName: file.name,
      label: labelFromFileName(file.name),
      url: supabase.storage.from(BUCKET).getPublicUrl(file.name).data.publicUrl,
    }));
}

export function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Uploads a photo taken/picked during dog registration or editing. Returns
// the public URL, or null if there was no file or the upload failed (the
// caller falls back to no photo rather than failing the whole submission).
export async function uploadDogPhoto(
  supabase: SupabaseClient<Database>,
  file: File,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `registrations/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg" });

  if (error) return null;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
