import Link from "next/link";
import { MODULES, resolveFields } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/crud/data-table";
import { RecordFormModal } from "@/components/crud/record-form-modal";
import { PaymentsModal } from "@/components/invoices/payments-modal";
import { Badge } from "@/components/badge";
import { fmtMoney } from "@/lib/format";
import { invoiceAgingStatus, invoiceTotals } from "@/lib/invoices";
import type { Invoice, InvoicePayment } from "@/lib/supabase/types";
import type { Row } from "@/lib/modules";
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

  const columns = [
    ...mod.columns,
    {
      label: "Total c/IVA",
      render: (r: Row) => <span className="font-mono">{fmtMoney(invoiceTotals(r as Invoice, paymentsByInvoice.get(r.id) ?? []).total)}</span>,
    },
    {
      label: "Saldo",
      render: (r: Row) => {
        const payments = paymentsByInvoice.get(r.id) ?? [];
        const t = invoiceTotals(r as Invoice, payments);
        const st = invoiceAgingStatus(r as Invoice, payments);
        return (
          <div className="flex items-center gap-2">
            <Badge level={st.level} text={st.bucket} />
            <span className="font-mono">{fmtMoney(Math.max(t.saldo, 0))}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{mod.title}</h1>
          <p className="text-sm text-neutral-500">{rows.length} registro(s)</p>
        </div>
        <Link href={`${basePath}?form=new`} className={btnPrimary}>
          + {mod.addLabel}
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Error cargando datos: {error.message}</p>}

      <DataTable
        moduleKey="invoices"
        singularLabel={mod.singularLabel}
        columns={columns}
        rows={rows}
        ctx={ctx}
        basePath={basePath}
        extraActions={(row) => (
          <Link href={`${basePath}?abono=${row.id}`} title="Registrar abono" className="text-neutral-400 hover:text-neutral-900">
            💰
          </Link>
        )}
      />

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
