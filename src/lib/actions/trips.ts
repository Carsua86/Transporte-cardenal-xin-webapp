"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MODULES, type Row } from "@/lib/modules";
import { friendlyActionError } from "@/lib/actions/errors";

export async function upsertTrip(id: string | null, formData: FormData) {
  const supabase = await createClient();
  const mod = MODULES.trips;

  const payload: Row = {};
  for (const field of mod.fields) {
    const raw = formData.get(field.key);
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (value === "" || value === null) {
      payload[field.key] = null;
      continue;
    }
    payload[field.key] = field.type === "number" ? Number(value) : value;
  }

  const combustibleMontoRaw = formData.get("combustible_monto");
  const combustibleLitrosRaw = formData.get("combustible_litros");
  const hasCombustible = typeof combustibleMontoRaw === "string" && combustibleMontoRaw.trim() !== "";

  let fuelId: string | null = null;
  if (id) {
    const { data: existing } = await supabase.from("trips").select("fuel_id").eq("id", id).single();
    fuelId = existing?.fuel_id ?? null;
  }

  if (hasCombustible) {
    const fuelPayload = {
      truck_id: payload.truck_id,
      fecha: payload.fecha,
      litros: combustibleLitrosRaw ? Number(combustibleLitrosRaw) : null,
      costo_total: Number(combustibleMontoRaw),
    };

    if (fuelId) {
      const { error: fuelError } = await supabase.from("fuel").update(fuelPayload).eq("id", fuelId);
      if (fuelError) return { error: friendlyActionError(fuelError.message) };
    } else {
      const { data: newFuel, error: fuelError } = await supabase.from("fuel").insert(fuelPayload).select("id").single();
      if (fuelError) return { error: friendlyActionError(fuelError.message) };
      fuelId = newFuel?.id ?? null;
    }
    payload.fuel_id = fuelId;
  }

  const { error } = id
    ? await supabase.from("trips").update(payload).eq("id", id)
    : await supabase.from("trips").insert(payload);

  if (error) return { error: friendlyActionError(error.message) };

  revalidatePath("/trips");
  revalidatePath("/fuel");
  revalidatePath("/reportes");
  return { error: null };
}
