import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/crud/data-table";
import { TripFormModal } from "@/components/trips/trip-form-modal";
import type { Cliente } from "@/lib/supabase/types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; cliente_id?: string; desde?: string; hasta?: string }>;
}) {
  const { form, cliente_id: clienteId = "", desde = "", hasta = "" } = await searchParams;
  const mod = MODULES.trips;

  const supabase = await createClient();

  let query = supabase
    .from("trips")
    .select("*, fuel:fuel_id(litros, costo_total), trip_clientes(count)")
    .order("fecha", { ascending: false });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const [ctx, { data: rows, error }, { data: clientes }] = await Promise.all([
    getModuleContext(),
    query,
    supabase.from("clientes").select("*").order("razon_social") as unknown as Promise<{ data: Cliente[] | null }>,
  ]);

  const rowsData = (rows ?? []).map((r) => ({
    ...r,
    _extrasCount: r.trip_clientes?.[0]?.count ?? 0,
  }));
  const basePath = "/trips";
  const editing = form && form !== "new" ? rowsData.find((r) => r.id === form) ?? null : null;
  const showModal = form === "new" || Boolean(editing);

  const otrosClientesIniciales = editing
    ? (await supabase.from("trip_clientes").select("*").eq("trip_id", editing.id)).data ?? []
    : [];

  const exportParams = new URLSearchParams();
  if (clienteId) exportParams.set("cliente_id", clienteId);
  if (desde) exportParams.set("desde", desde);
  if (hasta) exportParams.set("hasta", hasta);
  const exportHref = `/trips/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{mod.title}</h1>
          <p className="text-sm text-neutral-500">{rowsData.length} registro(s)</p>
        </div>
        <div className="flex gap-2">
          <a href={exportHref} className={btnSecondary}>
            ⬇ Exportar Excel
          </a>
          <Link href={`${basePath}?form=new`} className={btnPrimary}>
            + {mod.addLabel}
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="filtro_cliente">Cliente</label>
          <select id="filtro_cliente" name="cliente_id" defaultValue={clienteId} className={inputClass}>
            <option value="">— Todos —</option>
            {(clientes ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.rut} — {c.razon_social}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="filtro_desde">Desde</label>
          <input id="filtro_desde" type="date" name="desde" defaultValue={desde} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="filtro_hasta">Hasta</label>
          <input id="filtro_hasta" type="date" name="hasta" defaultValue={hasta} className={inputClass} />
        </div>
        <button type="submit" className={btnSecondary}>Filtrar</button>
        {(clienteId || desde || hasta) && (
          <Link href={basePath} className="text-sm text-neutral-500 underline hover:text-neutral-700">
            Limpiar filtros
          </Link>
        )}
      </form>

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
