import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { TripsTable } from "@/components/trips/trips-table";
import { TripFormModal } from "@/components/trips/trip-form-modal";
import { fmtMonth, monthRange, shiftMonth, todayStr } from "@/lib/format";
import type { Cliente } from "@/lib/supabase/types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; cliente_id?: string; mes?: string }>;
}) {
  const currentMonth = todayStr().slice(0, 7);
  const { form, cliente_id: clienteId = "", mes = currentMonth } = await searchParams;
  const mod = MODULES.trips;
  const { desde, hasta } = monthRange(mes);
  const prevMes = shiftMonth(mes, -1);
  const nextMes = shiftMonth(mes, 1);

  const supabase = await createClient();

  let query = supabase
    .from("trips")
    .select("*, fuel:fuel_id(litros, costo_total), trip_clientes(count)")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);

  const editingId = form && form !== "new" ? form : null;

  const [ctx, { data: rows, error }, { data: clientes }, { data: editingRow }] = await Promise.all([
    getModuleContext(),
    query,
    supabase.from("clientes").select("*").order("razon_social") as unknown as Promise<{ data: Cliente[] | null }>,
    editingId
      ? supabase.from("trips").select("*, fuel:fuel_id(litros, costo_total)").eq("id", editingId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const rowsData = (rows ?? []).map((r) => ({
    ...r,
    _extrasCount: r.trip_clientes?.[0]?.count ?? 0,
  }));
  const basePath = "/trips";
  const editing = form === "new" ? null : editingRow ?? null;
  const showModal = form === "new" || Boolean(editing);

  const otrosClientesIniciales = editing
    ? (await supabase.from("trip_clientes").select("*").eq("trip_id", editing.id)).data ?? []
    : [];

  const exportParams = new URLSearchParams();
  if (clienteId) exportParams.set("cliente_id", clienteId);
  exportParams.set("desde", desde);
  exportParams.set("hasta", hasta);
  const exportHref = `/trips/export?${exportParams.toString()}`;

  const monthLinkParams = (targetMes: string) => {
    const p = new URLSearchParams();
    p.set("mes", targetMes);
    if (clienteId) p.set("cliente_id", clienteId);
    return `${basePath}?${p.toString()}`;
  };

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
          <Link href={`${basePath}?mes=${mes}${clienteId ? `&cliente_id=${clienteId}` : ""}&form=new`} className={btnPrimary}>
            + {mod.addLabel}
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <Link href={monthLinkParams(prevMes)} className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100" title="Mes anterior">
          ◀
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-neutral-900">{fmtMonth(mes)}</span>
          {mes !== currentMonth && (
            <Link href={monthLinkParams(currentMonth)} className="text-xs font-medium text-brand-600 underline hover:text-brand-700">
              Volver a hoy
            </Link>
          )}
        </div>
        <Link href={monthLinkParams(nextMes)} className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100" title="Mes siguiente">
          ▶
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <input type="hidden" name="mes" value={mes} />
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="filtro_cliente">Cliente</label>
          <select id="filtro_cliente" name="cliente_id" defaultValue={clienteId} className={inputClass}>
            <option value="">— Todos —</option>
            {(clientes ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.rut} — {c.razon_social}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={btnSecondary}>Filtrar</button>
        {clienteId && (
          <Link href={monthLinkParams(mes)} className="text-sm text-neutral-500 underline hover:text-neutral-700">
            Limpiar filtro de cliente
          </Link>
        )}
      </form>

      {error && <p className="text-sm text-red-600">Error cargando datos: {error.message}</p>}

      <TripsTable
        columns={mod.columns}
        rows={rowsData}
        ctx={ctx}
        basePath={basePath}
        editQuery={`mes=${mes}&${clienteId ? `cliente_id=${clienteId}&` : ""}`}
      />

      {showModal && (
        <TripFormModal
          closeHref={monthLinkParams(mes)}
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
