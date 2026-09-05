import { Fragment } from "react";
import Link from "next/link";
import type { ColumnDef, ModuleContext, Row } from "@/lib/modules";
import { tripGastosTotales } from "@/lib/modules";
import { fmtMoney, fmtMonth, monthOf } from "@/lib/format";
import { DeleteButton } from "@/components/crud/delete-button";

function tripMetrics(rows: Row[]) {
  return rows.reduce(
    (acc, r) => {
      const flete = Number(r.monto_flete || 0);
      const gastos = tripGastosTotales(r);
      return {
        count: acc.count + 1,
        flete: acc.flete + flete,
        total: acc.total + flete * 1.19,
        gastos: acc.gastos + gastos,
        utilidad: acc.utilidad + (flete - gastos),
      };
    },
    { count: 0, flete: 0, total: 0, gastos: 0, utilidad: 0 },
  );
}

function StatChip({
  label,
  value,
  tone = "neutral",
  compact = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
  compact?: boolean;
}) {
  const valueColor = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-neutral-800";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-neutral-200 ${compact ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs"}`}
    >
      <span className="text-neutral-400">{label}</span>
      <span className={`font-mono font-semibold ${valueColor}`}>{value}</span>
    </span>
  );
}

export function TripsTable({
  columns,
  rows,
  ctx,
  basePath,
}: {
  columns: ColumnDef[];
  rows: Row[];
  ctx: ModuleContext;
  basePath: string;
}) {
  const monthGroups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = monthOf(r.fecha) || "Sin fecha";
    const list = monthGroups.get(key) ?? [];
    list.push(r);
    monthGroups.set(key, list);
  }
  const orderedMonths = [...monthGroups.keys()].sort((a, b) => (a < b ? -1 : 1));

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-brand-50/60">
          <tr>
            {columns.map((c) => (
              <th key={c.label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {c.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-neutral-400">
                <span className="block text-2xl">🗂️</span>
                <span className="mt-1 block">Sin registros todavía.</span>
              </td>
            </tr>
          ) : (
            orderedMonths.map((monthKey) => {
              const monthRows = monthGroups.get(monthKey)!;
              const monthTotals = tripMetrics(monthRows);

              const vendorGroups = new Map<string, Row[]>();
              for (const r of monthRows) {
                const key = (r.vendedor && String(r.vendedor).trim()) || "Sin vendedor";
                const list = vendorGroups.get(key) ?? [];
                list.push(r);
                vendorGroups.set(key, list);
              }
              const orderedVendors = [...vendorGroups.keys()].sort(
                (a, b) => tripMetrics(vendorGroups.get(b)!).flete - tripMetrics(vendorGroups.get(a)!).flete,
              );

              return (
                <Fragment key={monthKey}>
                  <tr className="bg-gradient-to-r from-brand-700 to-brand-600">
                    <td colSpan={columns.length + 1} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base">📅</span>
                          {monthKey === "Sin fecha" ? "Sin fecha" : fmtMonth(monthKey)}
                          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-normal text-white/90">
                            {monthTotals.count} viaje{monthTotals.count === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span className="flex flex-wrap gap-2">
                          <StatChip label="Flete neto" value={fmtMoney(monthTotals.flete)} />
                          <StatChip label="Total c/IVA" value={fmtMoney(monthTotals.total)} />
                          <StatChip label="Gastos" value={fmtMoney(monthTotals.gastos)} />
                          <StatChip label="Utilidad" value={fmtMoney(monthTotals.utilidad)} tone={monthTotals.utilidad >= 0 ? "good" : "bad"} />
                        </span>
                      </div>
                    </td>
                  </tr>

                  {orderedVendors.map((vendorKey) => {
                    const vendorRows = [...vendorGroups.get(vendorKey)!].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
                    const vendorTotals = tripMetrics(vendorRows);

                    return (
                      <Fragment key={`${monthKey}-${vendorKey}`}>
                        <tr className="border-l-4 border-brand-300 bg-brand-50/50">
                          <td colSpan={columns.length + 1} className="px-4 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 pl-2">
                              <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <span className="text-base">👤</span>
                                {vendorKey}
                                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-normal text-neutral-400 ring-1 ring-neutral-200">
                                  {vendorTotals.count} viaje{vendorTotals.count === 1 ? "" : "s"}
                                </span>
                              </span>
                              <span className="flex flex-wrap gap-2">
                                <StatChip label="Flete" value={fmtMoney(vendorTotals.flete)} compact />
                                <StatChip label="Total c/IVA" value={fmtMoney(vendorTotals.total)} compact />
                                <StatChip label="Utilidad" value={fmtMoney(vendorTotals.utilidad)} tone={vendorTotals.utilidad >= 0 ? "good" : "bad"} compact />
                              </span>
                            </div>
                          </td>
                        </tr>
                        {vendorRows.map((row, i) => (
                          <tr key={row.id} className={`transition hover:bg-brand-50/40 ${i % 2 === 1 ? "bg-neutral-50/60" : ""}`}>
                            {columns.map((c) => (
                              <td key={c.label} className="px-4 py-2.5">
                                {c.render(row, ctx)}
                              </td>
                            ))}
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-3">
                                <Link href={`${basePath}?form=${row.id}`} title="Editar" className="text-neutral-400 hover:text-brand-600">
                                  ✎
                                </Link>
                                <DeleteButton moduleKey="trips" id={row.id} label="viaje" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
