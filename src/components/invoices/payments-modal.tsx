"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Invoice, InvoicePayment } from "@/lib/supabase/types";
import { fmtDate, fmtMoney } from "@/lib/format";
import { invoiceTotals } from "@/lib/invoices";
import { addPayment, deletePayment } from "@/lib/actions/invoices";

export function PaymentsModal({
  invoice,
  payments,
  closeHref,
}: {
  invoice: Invoice;
  payments: InvoicePayment[];
  closeHref: string;
}) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const t = invoiceTotals(invoice, payments);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            💰 Abonos — Factura {invoice.numero}
          </h2>
          <Link href={closeHref} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </Link>
        </div>
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-brand-50/60 p-3 text-sm">
            <span className="text-neutral-500">Total c/IVA</span>
            <span className="text-right font-mono">{fmtMoney(t.total)}</span>
            <span className="text-neutral-500">Abonado</span>
            <span className="text-right font-mono">{fmtMoney(t.abonado)}</span>
            <span className="text-neutral-500">Otras deducciones</span>
            <span className="text-right font-mono">{fmtMoney(t.descuentos)}</span>
            <span className="font-medium text-neutral-700">Saldo pendiente</span>
            <span className="text-right font-mono font-semibold text-brand-700">{fmtMoney(Math.max(t.saldo, 0))}</span>
          </div>

          {payments.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-neutral-700">Movimientos registrados</h3>
              <ul className="flex flex-col gap-1">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span>
                      {fmtDate(p.fecha)} — {fmtMoney(p.monto)}{" "}
                      <span className={p.tipo === "Descuento" ? "text-amber-600" : "text-emerald-700"}>
                        ({p.tipo === "Descuento" ? "Descuento" : "Abono"})
                      </span>
                      {p.concepto ? ` · ${p.concepto}` : ""}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      className="text-xs text-neutral-400 hover:text-red-600"
                      onClick={() => startTransition(async () => {
                        const res = await deletePayment(invoice.id, p.id);
                        setFormError(res.error);
                      })}
                    >
                      quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <form
            className="flex flex-wrap items-end gap-2"
            action={(formData) => startTransition(async () => {
              const res = await addPayment(invoice.id, formData);
              setFormError(res.error);
            })}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600" htmlFor="fecha">Fecha</label>
              <input id="fecha" name="fecha" type="date" required className="rounded-xl border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600" htmlFor="monto">Monto</label>
              <input id="monto" name="monto" type="number" step="any" required className="w-28 rounded-xl border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600" htmlFor="tipo">Tipo</label>
              <select id="tipo" name="tipo" defaultValue="Abono" className="rounded-xl border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100">
                <option value="Abono">Abono</option>
                <option value="Descuento">Descuento</option>
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600" htmlFor="concepto">Concepto (opcional)</label>
              <input id="concepto" name="concepto" type="text" placeholder="Ej. pronto pago, diferencia de tarifa…" className="w-full rounded-xl border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            >
              Registrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
