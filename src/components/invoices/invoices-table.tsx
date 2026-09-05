"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import type { Invoice, InvoicePayment } from "@/lib/supabase/types";
import { fmtDate, fmtMoney, fmtMonth, monthOf } from "@/lib/format";
import { invoiceAgingStatus, invoiceTotals } from "@/lib/invoices";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/crud/delete-button";

export function InvoicesTable({
  rows,
  paymentsByInvoice,
  basePath,
}: {
  rows: Invoice[];
  paymentsByInvoice: Map<string, InvoicePayment[]>;
  basePath: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const monthGroups = new Map<string, Invoice[]>();
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
            {["Fecha", "N°", "Cliente", "RUT", "Neto", "Total c/IVA", "Saldo", "Acciones"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-neutral-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-neutral-400">
                <span className="block text-2xl">🗂️</span>
                <span className="mt-1 block">Sin registros todavía.</span>
              </td>
            </tr>
          ) : (
            orderedMonths.map((monthKey) => {
              const monthRows = monthGroups.get(monthKey)!;
              const monthTotals = monthRows.reduce(
                (acc, r) => {
                  const t = invoiceTotals(r, paymentsByInvoice.get(r.id) ?? []);
                  return {
                    neto: acc.neto + t.neto,
                    total: acc.total + t.total,
                    saldo: acc.saldo + Math.max(t.saldo, 0),
                  };
                },
                { neto: 0, total: 0, saldo: 0 },
              );

              return (
                <Fragment key={monthKey}>
                  <tr className="bg-neutral-100">
                    <td colSpan={8} className="px-4 py-2 text-sm font-semibold text-neutral-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          📅 {monthKey === "Sin fecha" ? "Sin fecha" : fmtMonth(monthKey)}{" "}
                          <span className="font-normal text-neutral-400">({monthRows.length} factura{monthRows.length === 1 ? "" : "s"})</span>
                        </span>
                        <span className="flex flex-wrap gap-4 font-normal text-neutral-500">
                          <span>Neto: <span className="font-mono font-semibold text-neutral-700">{fmtMoney(monthTotals.neto)}</span></span>
                          <span>Total c/IVA: <span className="font-mono font-semibold text-neutral-700">{fmtMoney(monthTotals.total)}</span></span>
                          <span>Saldo: <span className="font-mono font-semibold text-brand-700">{fmtMoney(monthTotals.saldo)}</span></span>
                        </span>
                      </div>
                    </td>
                  </tr>
                  {monthRows.map((r) => {
                    const payments = paymentsByInvoice.get(r.id) ?? [];
                    const t = invoiceTotals(r, payments);
                    const st = invoiceAgingStatus(r, payments);
                    const expanded = expandedId === r.id;

                    return (
                      <Fragment key={r.id}>
                        <tr
                          className="cursor-pointer transition hover:bg-brand-50/40"
                          onClick={() => setExpandedId(expanded ? null : r.id)}
                        >
                          <td className="px-4 py-2.5">{fmtDate(r.fecha)}</td>
                          <td className="px-4 py-2.5 font-mono">{r.numero || "—"}</td>
                          <td className="px-4 py-2.5">{r.cliente || "—"}</td>
                          <td className="px-4 py-2.5 font-mono">{r.cliente_rut || "—"}</td>
                          <td className="px-4 py-2.5 font-mono">{fmtMoney(r.neto)}</td>
                          <td className="px-4 py-2.5 font-mono">{fmtMoney(t.total)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Badge level={st.level} text={st.bucket} />
                              <span className="font-mono">{fmtMoney(Math.max(t.saldo, 0))}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-3">
                              <Link href={`${basePath}?abono=${r.id}`} title="Registrar abono" className="text-neutral-400 hover:text-neutral-900">
                                💰
                              </Link>
                              <Link href={`${basePath}?form=${r.id}`} title="Editar" className="text-neutral-400 hover:text-brand-600">
                                ✎
                              </Link>
                              <DeleteButton moduleKey="invoices" id={r.id} label="factura" />
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={8} className="bg-neutral-50 px-4 py-3">
                              {payments.length === 0 ? (
                                <p className="text-sm text-neutral-400">Sin abonos ni descuentos registrados todavía.</p>
                              ) : (
                                <ul className="flex flex-col gap-1.5 text-sm">
                                  {payments
                                    .slice()
                                    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                                    .map((p) => (
                                      <li key={p.id} className="flex items-center justify-between">
                                        <span>
                                          {fmtDate(p.fecha)} ·{" "}
                                          <span className={p.tipo === "Descuento" ? "text-amber-600" : "text-emerald-700"}>
                                            {p.tipo}
                                          </span>
                                          {p.concepto ? ` — ${p.concepto}` : ""}
                                        </span>
                                        <span className="font-mono">{fmtMoney(p.monto)}</span>
                                      </li>
                                    ))}
                                </ul>
                              )}
                              <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-2 text-sm font-medium">
                                <span className="text-neutral-600">Saldo pendiente</span>
                                <span className="font-mono text-brand-700">{fmtMoney(Math.max(t.saldo, 0))}</span>
                              </div>
                            </td>
                          </tr>
                        )}
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
