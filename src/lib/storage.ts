import type { SupabaseClient } from "@supabase/supabase-js";

export const ATTACHMENTS_BUCKET = "attachments";

export async function getSignedUrl(supabase: SupabaseClient, path: string | null | undefined, expiresIn = 3600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function uploadFile(supabase: SupabaseClient, folder: string, file: File) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const path = `${folder}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
