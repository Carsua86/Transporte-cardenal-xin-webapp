import Link from "next/link";
import { MODULES, resolveFields } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { RecordFormModal } from "@/components/crud/record-form-modal";
import { PaymentsModal } from "@/components/invoices/payments-modal";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import type { InvoicePayment } from "@/lib/supabase/types";
import { btnPrimary } from "@/lib/ui";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; abono?: string }>;
}) {
  const { form, abono } = await searchParams;
  const mod = MODULES.invoices;

  const supabase = await createClient();
  const [ctx, { data: invoices, error }, { data: allPayments }] = await Promise.all([
    getModuleContext(),
    supabase.from("invoices").select("*").order("fecha", { ascending: false }),
    supabase.from("invoice_payments").select("*"),
  ]);

  const paymentsByInvoice = new Map<string, InvoicePayment[]>();
  for (const p of allPayments ?? []) {
    const list = paymentsByInvoice.get(p.invoice_id) ?? [];
    list.push(p);
    paymentsByInvoice.set(p.invoice_id, list);
  }

  const rows = invoices ?? [];
  const basePath = "/invoices";
  const editing = form && form !== "new" ? rows.find((r) => r.id === form) ?? null : null;
  const showFormModal = form === "new" || Boolean(editing);
  const abonoInvoice = abono ? rows.find((r) => r.id === abono) ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{mod.title}</h1>
          <p className="text-sm text-neutral-500">{rows.length} registro(s) — haz clic en una fila para ver sus abonos y descuentos</p>
        </div>
        <Link href={`${basePath}?form=new`} className={btnPrimary}>
          + {mod.addLabel}
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Error cargando datos: {error.message}</p>}

      <InvoicesTable rows={rows} paymentsByInvoice={paymentsByInvoice} basePath={basePath} />

      {showFormModal && (
        <RecordFormModal
          moduleKey="invoices"
          title={editing ? "Editar factura" : mod.addLabel}
          closeHref={basePath}
          fields={resolveFields(mod.fields, ctx)}
          initial={editing}
        />
      )}

      {abonoInvoice && (
        <PaymentsModal invoice={abonoInvoice} payments={paymentsByInvoice.get(abonoInvoice.id) ?? []} closeHref={basePath} />
      )}
    </div>
  );
}
