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

function DetailToggle({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50/40 [&::-webkit-details-marker]:hidden">
        {label}
        <span className="text-neutral-400 transition group-open:rotate-180">▾</span>
      </summary>
      <div className="overflow-x-auto border-t border-neutral-200">{children}</div>
    </details>
  );
}

function agingBadgeLevel(bucket: string): "ok" | "warn" | "danger" {
  if (bucket === "Vigente") return "ok";
  if (bucket === "1-30 días" || bucket === "31-45 días") return "warn";
  return "danger";
}

const AGING_BAR_COLORS: Record<string, string> = {
  "Vigente": "bg-emerald-500",
  "1-30 días": "bg-amber-400",
  "31-45 días": "bg-amber-500",
  "46-60 días": "bg-red-400",
  "61-90 días": "bg-red-500",
  "+90 días": "bg-red-700",
};

const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500";
const rowClass = "transition even:bg-neutral-50/60 hover:bg-brand-50/40";

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
    { label: "Ganancia neta total", value: fmtMoney(totalGanancia), tone: totalGanancia >= 0 ? "good" : "bad", icon: "💵" },
    { label: "Rentabilidad promedio", value: fmtPct(rentabilidadPromedio), tone: rentabilidadPromedio >= 0 ? "good" : "bad", icon: "📊" },
    { label: "Cuentas por cobrar", value: fmtMoney(totalPorCobrar), icon: "🧾" },
  ];

  const maxIngresosMes = Math.max(1, ...monthly.map((r) => Math.max(r.ingresos, r.gastoTotal)));
  const monthlyChart = [...monthly].reverse(); // más reciente arriba para lectura rápida del dashboard

  const truckRanking = [...porCamion.rows].sort((a, b) => b.margen - a.margen);
  const maxAbsMargen = Math.max(1, ...truckRanking.map((r) => Math.abs(r.margen)));

  const vendorRanking = [...porVendedor.porVendedor].sort((a, b) => b.total - a.total);
  const maxVendorTotal = Math.max(1, ...vendorRanking.map((r) => r.total));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">📊 Reportes</h1>
        <p className="text-sm text-neutral-500">Cómo va tu negocio, en simple. Abre &quot;Ver detalle completo&quot; en cada sección si necesitas los números finos.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Evolución mensual */}
      <section className="flex flex-col gap-3">
        <SectionHeader icon="🗓️" title="Evolución mensual" description="Ingresos vs. gastos de cada mes, y la ganancia que quedó." />
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-neutral-400" /> Gastos</span>
          </div>
          {monthlyChart.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">Sin datos todavía.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {monthlyChart.map((r) => (
                <div key={r.month} className="flex flex-col gap-1.5 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-700">{fmtMonth(r.month)}</span>
                    <span className={`font-mono font-semibold ${r.gananciaNeta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {fmtMoney(r.gananciaNeta)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(r.ingresos / maxIngresosMes) * 100}%` }} />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-neutral-400" style={{ width: `${(r.gastoTotal / maxIngresosMes) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DetailToggle label="Ver detalle completo por mes">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Mes", "Ingresos", "Costo directo viajes", "M2 totales", "M3 totales", "Combustible", "Mantenciones", "Gastos admin.", "Gasto total", "Ganancia neta", "Rentabilidad"].map((h) => (
                  <th key={h} className={th}>{h}</th>
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
                  <td className={`px-3 py-2 ${r.rentabilidad >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmtPct(r.rentabilidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailToggle>
      </section>

      {/* Ganancia por camión */}
      <section className="flex flex-col gap-3">
        <SectionHeader icon="🚛" title="Ganancia por camión" description="De mayor a menor margen, considerando todos sus costos." />
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          {truckRanking.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">Agrega camiones y viajes para ver este reporte.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {truckRanking.map((r) => {
                const good = r.margen >= 0;
                return (
                  <div key={r.truck.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="w-20 shrink-0 font-semibold text-neutral-800">{r.truck.patente}</span>
                    <span className="w-20 shrink-0 text-xs text-neutral-400">{r.viajes} viaje{r.viajes === 1 ? "" : "s"}</span>
                    <div className="h-2.5 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-2.5 rounded-full ${good ? "bg-emerald-500" : "bg-red-400"}`}
                        style={{ width: `${(Math.abs(r.margen) / maxAbsMargen) * 100}%` }}
                      />
                    </div>
                    <span className={`w-32 shrink-0 text-right font-mono font-semibold ${good ? "text-emerald-700" : "text-red-700"}`}>
                      {fmtMoney(r.margen)}
                    </span>
                    <span className={`w-16 shrink-0 text-right text-xs ${good ? "text-emerald-600" : "text-red-600"}`}>{fmtPct(r.rentabilidad)}</span>
                  </div>
                );
              })}
            </div>
          )}
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

        <DetailToggle label="Ver detalle completo por camión">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Camión", "Viajes", "Ingresos", "Costo viajes", "Combustible", "Mantenciones", "Gastos asignados", "Gasto total", "Margen", "Rentab."].map((h) => (
                  <th key={h} className={th}>{h}</th>
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
                  <td className={`px-3 py-2 ${r.rentabilidad >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmtPct(r.rentabilidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailToggle>

        <DetailToggle label="Ver combustible, peajes y viáticos por camión y mes">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Camión", "Mes", "Combustible", "Peajes", "Viáticos", "Total"].map((h) => (
                  <th key={h} className={th}>{h}</th>
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
        </DetailToggle>
      </section>

      {/* Viajes por vendedor */}
      <section className="flex flex-col gap-3">
        <SectionHeader icon="🧑‍💼" title={`Viajes por vendedor — ${fmtMonth(currentMonth)}`} description="Para cuadrar antes de facturar, de mayor a menor total vendido." />
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          {vendorRanking.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">Sin viajes este mes todavía.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {vendorRanking.map((r) => (
                <div key={r.vendedor} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-32 shrink-0 truncate font-semibold text-neutral-800">{r.vendedor}</span>
                  <span className="w-20 shrink-0 text-xs text-neutral-400">{r.viajes} viaje{r.viajes === 1 ? "" : "s"}</span>
                  <div className="h-2.5 min-w-[6rem] flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-2.5 rounded-full bg-brand-500" style={{ width: `${(r.total / maxVendorTotal) * 100}%` }} />
                  </div>
                  <span className="w-32 shrink-0 text-right font-mono font-semibold text-neutral-800">{fmtMoney(r.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DetailToggle label="Ver desglose por vendedor y región de destino">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-brand-50/60">
              <tr>
                {["Vendedor", "Región destino", "Viajes", "Neto", "IVA", "Total"].map((h) => (
                  <th key={h} className={th}>{h}</th>
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
        </DetailToggle>
      </section>

      {/* Antigüedad de cuentas por cobrar */}
      <section className="flex flex-col gap-3">
        <SectionHeader icon="🧾" title="Antigüedad de cuentas por cobrar" description={`Total pendiente: ${fmtMoney(totalPorCobrar)}`} />
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          {totalPorCobrar <= 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">No hay cuentas pendientes. ✅</p>
          ) : (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                {aging.order
                  .filter((b) => aging.buckets[b] > 0)
                  .map((b) => (
                    <div
                      key={b}
                      className={AGING_BAR_COLORS[b] ?? "bg-neutral-400"}
                      style={{ width: `${(aging.buckets[b] / totalPorCobrar) * 100}%` }}
                      title={`${b}: ${fmtMoney(aging.buckets[b])}`}
                    />
                  ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {aging.order.map((bucket) => (
                  <div key={bucket} className="rounded-xl border border-neutral-100 p-3">
                    <Badge level={agingBadgeLevel(bucket)} text={bucket} />
                    <p className="mt-2 text-base font-semibold">{fmtMoney(aging.buckets[bucket])}</p>
                    <p className="text-xs text-neutral-400">{aging.counts[bucket]} factura(s)</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
