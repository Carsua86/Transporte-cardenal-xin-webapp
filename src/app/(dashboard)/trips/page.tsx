import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/crud/data-table";
import { TripFormModal } from "@/components/trips/trip-form-modal";
import type { Cliente } from "@/lib/supabase/types";
import { btnPrimary } from "@/lib/ui";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string }>;
}) {
  const { form } = await searchParams;
  const mod = MODULES.trips;

  const supabase = await createClient();
  const [ctx, { data: rows, error }, { data: clientes }] = await Promise.all([
    getModuleContext(),
    supabase.from("trips").select("*, fuel:fuel_id(litros, costo_total)").order("fecha", { ascending: false }),
    supabase.from("clientes").select("*").order("razon_social") as unknown as Promise<{ data: Cliente[] | null }>,
  ]);

  const rowsData = rows ?? [];
  const basePath = "/trips";
  const editing = form && form !== "new" ? rowsData.find((r) => r.id === form) ?? null : null;
  const showModal = form === "new" || Boolean(editing);

  const otrosClientesIniciales = editing
    ? (await supabase.from("trip_clientes").select("*").eq("trip_id", editing.id)).data ?? []
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{mod.title}</h1>
          <p className="text-sm text-neutral-500">{rowsData.length} registro(s)</p>
        </div>
        <Link href={`${basePath}?form=new`} className={btnPrimary}>
          + {mod.addLabel}
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Error cargando datos: {error.message}</p>}

      <DataTable
        moduleKey="trips"
        singularLabel={mod.singularLabel}
        columns={mod.columns}
        rows={rowsData}
        ctx={ctx}
        basePath={basePath}
      />

      {showModal && (
        <TripFormModal
          closeHref={basePath}
          initial={editing}
          trucks={ctx.trucks}
          drivers={ctx.drivers}
          clientes={clientes ?? []}
          otrosClientesIniciales={otrosClientesIniciales}
        />
      )}
    </div>
  );
}
