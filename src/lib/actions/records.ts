"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { MODULES, type Row } from "@/lib/modules";
import { uploadFile } from "@/lib/storage";
import { friendlyActionError } from "@/lib/actions/errors";

async function buildPayload(moduleKey: string, formData: FormData, supabase: SupabaseClient) {
  const mod = MODULES[moduleKey];
  if (!mod) throw new Error(`Módulo desconocido: ${moduleKey}`);

  const payload: Row = {};
  for (const field of mod.fields) {
    if (field.type === "file") {
      const file = formData.get(field.key);
      if (file instanceof File && file.size > 0) {
        payload[field.key] = await uploadFile(supabase, mod.table, file);
      }
      // sin archivo nuevo seleccionado: no tocar la columna, conserva el valor actual
      continue;
    }

    const raw = formData.get(field.key);
    const value = typeof raw === "string" ? raw.trim() : raw;

    if (value === "" || value === null) {
      payload[field.key] = null;
      continue;
    }
    if (field.type === "number") {
      payload[field.key] = Number(value);
    } else {
      payload[field.key] = value;
    }
  }
  return { mod, payload };
}

export async function upsertRecord(moduleKey: string, id: string | null, formData: FormData) {
  const supabase = await createClient();

  let mod, payload;
  try {
    ({ mod, payload } = await buildPayload(moduleKey, formData, supabase));
  } catch (e) {
    return { error: friendlyActionError(e instanceof Error ? e.message : String(e)) };
  }

  const { error } = id
    ? await supabase.from(mod.table).update(payload).eq("id", id)
    : await supabase.from(mod.table).insert(payload);

  if (error) {
    return { error: friendlyActionError(error.message) };
  }

  revalidatePath(`/${moduleKey}`);
  return { error: null };
}

export async function deleteRecord(moduleKey: string, id: string) {
  const mod = MODULES[moduleKey];
  if (!mod) throw new Error(`Módulo desconocido: ${moduleKey}`);

  const supabase = await createClient();
  const { error } = await supabase.from(mod.table).delete().eq("id", id);

  if (error) {
    return { error: friendlyActionError(error.message) };
  }

  revalidatePath(`/${moduleKey}`);
  return { error: null };
}
