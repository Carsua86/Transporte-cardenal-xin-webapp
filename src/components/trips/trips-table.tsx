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
  const orderedMonths = [...monthGroups.keys()].sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-brand-50/60">
          <tr>
            {columns.map((c) => (
              <th key={c.label} className="px-4 py-3 text-left font-semibold text-neutral-600">
                {c.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-semibold text-neutral-600">Acciones</th>
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
                  <tr className="bg-neutral-100">
                    <td colSpan={columns.length + 1} className="px-4 py-2 text-sm font-semibold text-neutral-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          📅 {monthKey === "Sin fecha" ? "Sin fecha" : fmtMonth(monthKey)}{" "}
                          <span className="font-normal text-neutral-400">
                            ({monthTotals.count} viaje{monthTotals.count === 1 ? "" : "s"})
                          </span>
                        </span>
                        <span className="flex flex-wrap gap-4 font-normal text-neutral-500">
                          <span>Flete neto: <span className="font-mono font-semibold text-neutral-700">{fmtMoney(monthTotals.flete)}</span></span>
                          <span>Total c/IVA: <span className="font-mono font-semibold text-neutral-700">{fmtMoney(monthTotals.total)}</span></span>
                          <span>Gastos: <span className="font-mono font-semibold text-neutral-700">{fmtMoney(monthTotals.gastos)}</span></span>
                          <span>
                            Utilidad:{" "}
                            <span className={`font-mono font-semibold ${monthTotals.utilidad >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                              {fmtMoney(monthTotals.utilidad)}
                            </span>
                          </span>
                        </span>
                      </div>
                    </td>
                  </tr>

                  {orderedVendors.map((vendorKey) => {
                    const vendorRows = vendorGroups.get(vendorKey)!;
                    const vendorTotals = tripMetrics(vendorRows);

                    return (
                      <Fragment key={`${monthKey}-${vendorKey}`}>
                        <tr className="bg-brand-50/30">
                          <td colSpan={columns.length + 1} className="px-4 py-1.5 text-sm text-neutral-600">
                            <div className="flex flex-wrap items-center justify-between gap-2 pl-3">
                              <span>
                                👤 {vendorKey}{" "}
                                <span className="font-normal text-neutral-400">
                                  ({vendorTotals.count} viaje{vendorTotals.count === 1 ? "" : "s"})
                                </span>
                              </span>
                              <span className="flex flex-wrap gap-4 text-xs text-neutral-500">
                                <span>Flete neto: <span className="font-mono font-medium text-neutral-700">{fmtMoney(vendorTotals.flete)}</span></span>
                                <span>Total c/IVA: <span className="font-mono font-medium text-neutral-700">{fmtMoney(vendorTotals.total)}</span></span>
                                <span>
                                  Utilidad:{" "}
                                  <span className={`font-mono font-medium ${vendorTotals.utilidad >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                                    {fmtMoney(vendorTotals.utilidad)}
                                  </span>
                                </span>
                              </span>
                            </div>
                          </td>
                        </tr>
                        {vendorRows.map((row) => (
                          <tr key={row.id} className="transition hover:bg-brand-50/40">
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
