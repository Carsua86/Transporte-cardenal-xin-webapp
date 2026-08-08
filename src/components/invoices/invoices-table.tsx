"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import type { Invoice, InvoicePayment } from "@/lib/supabase/types";
import { fmtDate, fmtMoney } from "@/lib/format";
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-brand-50/60">
          <tr>
            {["Fecha", "N°", "Cliente", "Neto", "Total c/IVA", "Saldo", "Acciones"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-neutral-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                <span className="block text-2xl">🗂️</span>
                <span className="mt-1 block">Sin registros todavía.</span>
              </td>
            </tr>
          ) : (
            rows.map((r) => {
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
                      <td colSpan={7} className="bg-neutral-50 px-4 py-3">
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
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
