import { createClient } from "@/lib/supabase/server";
import { fmtMoney, fmtMonth, fmtNum, fmtPct, todayStr } from "@/lib/format";
import {
  aggregateAging, aggregateByVendedor, aggregatePorCamionCompleto, aggregateVariableCostsByTruckMonth,
  monthlyAggregate, uniqueMonths,
} from "@/lib/reports";
import { Badge } from "@/components/badge";
import type { InvoicePayment } from "@/lib/supabase/types";

function SectionHeader({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg">{icon}</span>
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
    </div>
  );
}

function Pct({ value }: { value: number }) {
  return <span className={value >= 0 ? "text-emerald-700" : "text-red-700"}>{fmtPct(value)}</span>;
}

const rowClass = "transition even:bg-neutral-50/60 hover:bg-brand-50/40";

function agingBadgeLevel(bucket: string): "ok" | "warn" | "danger" {
  if (bucket === "Vigente") return "ok";
  if (bucket === "1-30 días" || bucket === "31-45 días") return "warn";
  return "danger";
}

export default async function ReportesPage() {
  const supabase = await createClient();

  const [
    { data: trucks }, { data: trips }, { data: fuel }, { data: maintenance },
    { data: gastos }, { data: invoices }, { data: payments },
  ] = await Promise.all([
    supabase.from("trucks").select("*"),
    supabase.from("trips").select("*"),
    supabase.from("fuel").select("*"),
    supabase.from("maintenance").select("*"),
    supabase.from("gastos").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("invoice_payments").select("*"),
  ]);

  const t = trips ?? [], f = fuel ?? [], m = maintenance ?? [], g = gastos ?? [];
  const months = uniqueMonths(t, f, m, g);
  const monthly = months.map((month) => monthlyAggregate(month, t, f, m, g));

  const porCamion = aggregatePorCamionCompleto(trucks ?? [], t, f, m, g);
  const gastosVariables = aggregateVariableCostsByTruckMonth(trucks ?? [], t, f);

  const currentMonth = todayStr().slice(0, 7);
  const porVendedor = aggregateByVendedor(t, currentMonth);

  const paymentsByInvoice = new Map<string, InvoicePayment[]>();
  (payments ?? []).forEach((p) => {
    const list = paymentsByInvoice.get(p.invoice_id) ?? [];
    list.push(p);
    paymentsByInvoice.set(p.invoice_id, list);
  });
  const aging = aggregateAging(invoices ?? [], paymentsByInvoice);

  const totalIngresos = monthly.reduce((s, r) => s + r.ingresos, 0);
  const totalGastos = monthly.reduce((s, r) => s + r.gastoTotal, 0);
  const totalGanancia = totalIngresos - totalGastos;
  const rentabilidadPromedio = totalIngresos ? totalGanancia / totalIngresos : 0;
  const totalPorCobrar = aging.order.reduce((s, b) => s + aging.buckets[b], 0);

  const overview = [
    { label: "Ingresos totales", value: fmtMoney(totalIngresos), icon: "📈" },
    { label: "Gasto total", value: fmtMoney(totalGastos), icon: "💸" },
    { label: "Ganancia neta total", value: fmtMoney(totalGanancia), tone: totalGanancia >= 0 ? "good" : "bad", icon: "💵" },
    { label: "Rentabilidad promedio", value: fmtPct(rentabilidadPromedio), tone: rentabilidadPromedio >= 0 ? "good" : "bad", icon: "📊" },
    { label: "Cuentas por cobrar", value: fmtMoney(totalPorCobrar), icon: "🧾" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">📊 Reportes</h1>
        <p className="text-sm text-neutral-500">Ganancia por mes, por camión y antigüedad de cuentas por cobrar.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {overview.map((k) => (
          <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-lg">{k.icon}</span>
            <p className="mt-2 text-xs text-neutral-500">{k.label}</p>
            <p className={`text-lg font-semibold ${k.tone === "bad" ? "text-red-700" : k.tone === "good" ? "text-emerald-700" : "text-neutral-900"}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeader icon="🗓️" title="Resumen mensual" />
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Mes", "Ingresos", "Costo directo viajes", "M2 totales", "M3 totales", "Combustible", "Mantenciones", "Gastos admin.", "Gasto total", "Ganancia neta", "Rentabilidad"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {monthly.length === 0 ? (
                <tr><td colSpan={11} className="px-3 py-6 text-center text-neutral-400">Sin datos todavía.</td></tr>
              ) : monthly.map((r) => (
                <tr key={r.month} className={rowClass}>
                  <td className="px-3 py-2 font-medium text-neutral-700">{fmtMonth(r.month)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.ingresos)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.costoDirecto)}</td>
                  <td className="px-3 py-2 font-mono">{fmtNum(r.mt2Total)}</td>
                  <td className="px-3 py-2 font-mono">{fmtNum(r.mt3Total)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.combustible)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.mantenciones)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.admin)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.gastoTotal)}</td>
                  <td className={`px-3 py-2 font-mono font-semibold ${r.gananciaNeta >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmtMoney(r.gananciaNeta)}</td>
                  <td className="px-3 py-2"><Pct value={r.rentabilidad} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          icon="🚛"
          title="Ganancia por camión"
          description="Incluye costo directo de viajes, combustible, mantenciones y gastos administrativos asignados a cada camión."
        />
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Camión", "Viajes", "Ingresos", "Costo viajes", "Combustible", "Mantenciones", "Gastos asignados", "Gasto total", "Margen", "Rentab."].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {porCamion.rows.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-neutral-400">Agrega camiones y viajes para ver este reporte.</td></tr>
              ) : porCamion.rows.map((r) => (
                <tr key={r.truck.id} className={rowClass}>
                  <td className="px-3 py-2 font-semibold">{r.truck.patente}</td>
                  <td className="px-3 py-2">{r.viajes}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.ingresos)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.costoViajes)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.combustible)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.mantenciones)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.gastosAsignados)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.gastoTotal)}</td>
                  <td className={`px-3 py-2 font-mono font-semibold ${r.margen >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmtMoney(r.margen)}</td>
                  <td className="px-3 py-2"><Pct value={r.rentabilidad} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">Gastos compartidos (sin camión asignado)</p>
            <p className="mt-1 text-lg font-semibold">{fmtMoney(porCamion.gastosCompartidos)}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">Total ingresos</p>
            <p className="mt-1 text-lg font-semibold">{fmtMoney(porCamion.totalIngresos)}</p>
          </div>
          <div className={`rounded-2xl border p-4 shadow-sm ${porCamion.margenFinalEmpresa >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <p className="text-xs text-neutral-500">Margen final — todos los camiones</p>
            <p className="mt-1 text-lg font-semibold">{fmtMoney(porCamion.margenFinalEmpresa)}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          icon="⛽"
          title="Combustible, peajes y viáticos por camión y mes"
          description="Combustible viene del módulo Combustible (incluye lo cargado desde Viajes); peajes y viáticos se suman directo de cada viaje."
        />
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Camión", "Mes", "Combustible", "Peajes", "Viáticos", "Total"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {gastosVariables.rows.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-neutral-400">Sin datos todavía.</td></tr>
              ) : gastosVariables.rows.map((r) => (
                <tr key={`${r.truckId}||${r.month}`} className={rowClass}>
                  <td className="px-3 py-2 font-semibold">{r.truckPatente}</td>
                  <td className="px-3 py-2">{fmtMonth(r.month)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.combustible)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.peajes)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.viaticos)}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{fmtMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
            {gastosVariables.rows.length > 0 && (
              <tfoot className="bg-neutral-100 font-semibold">
                <tr>
                  <td className="px-3 py-2.5" colSpan={2}>Total todos los camiones</td>
                  <td className="px-3 py-2.5 font-mono">{fmtMoney(gastosVariables.totals.combustible)}</td>
                  <td className="px-3 py-2.5 font-mono">{fmtMoney(gastosVariables.totals.peajes)}</td>
                  <td className="px-3 py-2.5 font-mono">{fmtMoney(gastosVariables.totals.viaticos)}</td>
                  <td className="px-3 py-2.5 font-mono">{fmtMoney(gastosVariables.totals.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          icon="🧑‍💼"
          title={`Viajes por vendedor — ${fmtMonth(currentMonth)}`}
          description="Para cuadrar antes de facturar: cantidad de viajes, neto y total con IVA por vendedor, y su desglose por región de destino."
        />

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Vendedor", "Viajes", "Neto", "IVA", "Total"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {porVendedor.porVendedor.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-neutral-400">Sin viajes este mes todavía.</td></tr>
              ) : porVendedor.porVendedor.map((r) => (
                <tr key={r.vendedor} className={rowClass}>
                  <td className="px-3 py-2 font-semibold">{r.vendedor}</td>
                  <td className="px-3 py-2">{r.viajes}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.neto)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.iva)}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{fmtMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Vendedor", "Región destino", "Viajes", "Neto", "IVA", "Total"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {porVendedor.porVendedorRegion.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-neutral-400">Sin viajes este mes todavía.</td></tr>
              ) : porVendedor.porVendedorRegion.map((r) => (
                <tr key={`${r.vendedor}||${r.region}`} className={rowClass}>
                  <td className="px-3 py-2">{r.vendedor}</td>
                  <td className="px-3 py-2">{r.region}</td>
                  <td className="px-3 py-2">{r.viajes}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.neto)}</td>
                  <td className="px-3 py-2 font-mono">{fmtMoney(r.iva)}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{fmtMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader icon="🧾" title="Antigüedad de cuentas por cobrar" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {aging.order.map((bucket) => (
            <div key={bucket} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <Badge level={agingBadgeLevel(bucket)} text={bucket} />
              <p className="mt-2 text-lg font-semibold">{fmtMoney(aging.buckets[bucket])}</p>
              <p className="text-xs text-neutral-400">{aging.counts[bucket]} factura(s)</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
