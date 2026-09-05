"use client";

import { useState } from "react";
import { DataTable } from "@/components/crud/data-table";
import { normalizeRut } from "@/lib/rut";
import type { ColumnDef, ModuleContext, Row } from "@/lib/modules";

export function SearchableDataTable({
  moduleKey,
  singularLabel,
  columns,
  rows,
  ctx,
  basePath,
}: {
  moduleKey: string;
  singularLabel: string;
  columns: ColumnDef[];
  rows: Row[];
  ctx: ModuleContext;
  basePath: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const normalizedQ = normalizeRut(query);

  const filtered = q
    ? rows.filter((r) => {
        const label = String(r.razon_social ?? r.nombre ?? "").toLowerCase();
        const rut = String(r.rut ?? "");
        return label.includes(q) || (normalizedQ !== "" && normalizeRut(rut).includes(normalizedQ));
      })
    : rows;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por RUT o nombre…"
          className="w-full rounded-xl border border-neutral-300 py-2 pl-9 pr-3 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <DataTable
        moduleKey={moduleKey}
        singularLabel={singularLabel}
        columns={columns}
        rows={filtered}
        ctx={ctx}
        basePath={basePath}
      />
    </div>
  );
}
