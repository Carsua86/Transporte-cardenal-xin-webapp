import { Fragment } from "react";
import Link from "next/link";
import type { ColumnDef, ModuleContext, Row } from "@/lib/modules";
import { truckLabel } from "@/lib/modules";
import { fmtMoney, fmtNum } from "@/lib/format";
import { DeleteButton } from "@/components/crud/delete-button";

function truckMetrics(rows: Row[]) {
  const costo = rows.reduce((s, r) => s + Number(r.costo_total || 0), 0);
  const litros = rows.reduce((s, r) => s + Number(r.litros || 0), 0);
  return { count: rows.length, costo, litros, avg: litros ? costo / litros : 0 };
}

export function FuelTable({
  columns,
  rows,
  ctx,
  basePath,
  editQuery = "",
}: {
  columns: ColumnDef[];
  rows: Row[];
  ctx: ModuleContext;
  basePath: string;
  editQuery?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-400 shadow-sm">
        <span className="block text-2xl">🗂️</span>
        <span className="mt-1 block">Sin cargas de combustible este mes.</span>
      </div>
    );
  }

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = r.truck_id || "sin-camion";
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  const orderedKeys = [...groups.keys()].sort(
    (a, b) => truckMetrics(groups.get(b)!).costo - truckMetrics(groups.get(a)!).costo,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
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
            {orderedKeys.map((key) => {
              const groupRows = [...groups.get(key)!].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
              const label = key === "sin-camion" ? "Sin camión" : truckLabel(ctx, key);
              const m = truckMetrics(groupRows);

              return (
                <Fragment key={key}>
                  <tr className="border-l-4 border-brand-300 bg-brand-50/50">
                    <td colSpan={columns.length + 1} className="px-4 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 pl-2">
                        <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                          <span className="text-base">🚛</span>
                          {label}
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-normal text-neutral-400 ring-1 ring-neutral-200">
                            {m.count} carga{m.count === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span className="flex flex-wrap gap-2 text-xs text-neutral-500">
                          <span>Litros: <span className="font-mono font-medium text-neutral-700">{fmtNum(m.litros)}</span></span>
                          <span>$/Litro prom.: <span className="font-mono font-medium text-neutral-700">{fmtMoney(m.avg)}</span></span>
                          <span>Total: <span className="font-mono font-semibold text-neutral-800">{fmtMoney(m.costo)}</span></span>
                        </span>
                      </div>
                    </td>
                  </tr>
                  {groupRows.map((row, i) => (
                    <tr key={row.id} className={`transition hover:bg-brand-50/40 ${i % 2 === 1 ? "bg-neutral-50/60" : ""}`}>
                      {columns.map((c) => (
                        <td key={c.label} className="px-4 py-2.5">
                          {c.render(row, ctx)}
                        </td>
                      ))}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`${basePath}?${editQuery}form=${row.id}`} title="Editar" className="text-neutral-400 hover:text-brand-600">
                            ✎
                          </Link>
                          <DeleteButton moduleKey="fuel" id={row.id} label="carga de combustible" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
