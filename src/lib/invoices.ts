import { addDays, daysUntil } from "@/lib/format";
import type { Invoice, InvoicePayment } from "@/lib/supabase/types";

export function invoiceTotals(inv: Invoice, payments: InvoicePayment[]) {
  const neto = Number(inv.neto || 0);
  const iva = neto * 0.19;
  const total = neto + iva;
  const abonado = payments.filter((a) => a.tipo !== "Descuento").reduce((s, a) => s + Number(a.monto || 0), 0);
  const descuentos = payments.filter((a) => a.tipo === "Descuento").reduce((s, a) => s + Number(a.monto || 0), 0);
  const saldo = total - abonado - descuentos;
  return { neto, iva, total, abonado, descuentos, saldo };
}

export type AgingBucket = "Pagada" | "Vigente" | "1-30 días" | "31-45 días" | "46-60 días" | "61-90 días" | "+90 días";

export function invoiceAgingStatus(inv: Invoice, payments: InvoicePayment[]) {
  const t = invoiceTotals(inv, payments);
  if (t.saldo <= 0.5) return { level: "ok" as const, text: "Pagada", bucket: "Pagada" as AgingBucket };

  const dueDate = inv.fecha_vencimiento || addDays(inv.fecha, 30);
  const d = daysUntil(dueDate);
  if (d === null) return { level: "warn" as const, text: "Sin fecha de vencimiento", bucket: "Vigente" as AgingBucket };
  if (d >= 0) return { level: "ok" as const, text: `Vigente (vence en ${d}d)`, bucket: "Vigente" as AgingBucket };

  const venc = -d;
  let bucket: AgingBucket;
  let level: "warn" | "danger";
  if (venc <= 30) { bucket = "1-30 días"; level = "warn"; }
  else if (venc <= 45) { bucket = "31-45 días"; level = "warn"; }
  else if (venc <= 60) { bucket = "46-60 días"; level = "danger"; }
  else if (venc <= 90) { bucket = "61-90 días"; level = "danger"; }
  else { bucket = "+90 días"; level = "danger"; }
  return { level, text: `Vencida hace ${venc}d`, bucket };
}
