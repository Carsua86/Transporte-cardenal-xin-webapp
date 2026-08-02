import { createClient } from "@/lib/supabase/server";
import type { ModuleContext } from "@/lib/modules";
import type { Cliente, Driver, Truck } from "@/lib/supabase/types";

export async function getModuleContext(): Promise<ModuleContext> {
  const supabase = await createClient();

  const [{ data: trucks }, { data: drivers }, { data: clientes }] = await Promise.all([
    supabase.from("trucks").select("id, patente, marca, modelo").order("patente") as unknown as Promise<{
      data: Pick<Truck, "id" | "patente" | "marca" | "modelo">[] | null;
    }>,
    supabase.from("drivers").select("id, nombre").order("nombre") as unknown as Promise<{
      data: Pick<Driver, "id" | "nombre">[] | null;
    }>,
    supabase.from("clientes").select("id, rut, razon_social").order("razon_social") as unknown as Promise<{
      data: Pick<Cliente, "id" | "rut" | "razon_social">[] | null;
    }>,
  ]);

  return {
    trucks: (trucks ?? []).map((t) => ({
      value: t.id,
      label: [t.patente, [t.marca, t.modelo].filter(Boolean).join(" ")].filter(Boolean).join(" — "),
    })),
    drivers: (drivers ?? []).map((d) => ({ value: d.id, label: d.nombre })),
    clientes: (clientes ?? []).map((c) => ({ value: c.id, label: `${c.rut} — ${c.razon_social}` })),
  };
}
