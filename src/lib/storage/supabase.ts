import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";
import { createLogger } from "@/lib/logging";

const log = createLogger("supabase-storage");

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function storageConfigured(): boolean {
  const { supabaseUrl, supabaseServiceKey, docsBucket } = config.storage;
  return isValidUrl(supabaseUrl) && supabaseServiceKey.length > 0 && docsBucket.length > 0;
}

export async function uploadMedicalDocument(
  bytes: Uint8Array,
  path: string,
  mimeType: string,
): Promise<{ path: string }> {
  if (!storageConfigured()) {
    throw new Error("Document storage is not configured");
  }
  const supabase = createClient(config.storage.supabaseUrl, config.storage.supabaseServiceKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.storage
    .from(config.storage.docsBucket)
    .upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) {
    log.error({ err: error, path }, "Supabase upload failed");
    throw new Error("Document upload failed");
  }
  return { path };
}
