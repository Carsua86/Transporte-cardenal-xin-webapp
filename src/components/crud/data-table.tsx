import Link from "next/link";
import type { ColumnDef, ModuleContext, Row } from "@/lib/modules";
import { DeleteButton } from "@/components/crud/delete-button";

export function DataTable({
  moduleKey,
  singularLabel,
  columns,
  rows,
  ctx,
  basePath,
  extraActions,
}: {
  moduleKey: string;
  singularLabel: string;
  columns: ColumnDef[];
  rows: Row[];
  ctx: ModuleContext;
  basePath: string;
  extraActions?: (row: Row) => React.ReactNode;
}) {
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
            rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-brand-50/40">
                {columns.map((c) => (
                  <td key={c.label} className="px-4 py-2.5">
                    {c.render(row, ctx)}
                  </td>
                ))}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    {extraActions?.(row)}
                    <Link href={`${basePath}?form=${row.id}`} title="Editar" className="text-neutral-400 hover:text-brand-600">
                      ✎
                    </Link>
                    <DeleteButton moduleKey={moduleKey} id={row.id} label={singularLabel} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
