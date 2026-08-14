import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtMoney, todayStr } from "@/lib/format";
import {
  IVA_DUE_DAY, PREVIRED_DUE_DAY, documentStatus, ipcAdjustmentStatus, licenseStatus, loanDeductionStatus,
  maintenanceStatus, monthlyAggregate, noteStatus, taxDeadlineStatus,
} from "@/lib/reports";
import { Badge } from "@/components/badge";
import type { Cliente, Driver, Truck } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: trucks },
    { data: drivers },
    { data: trips },
    { data: fuel },
    { data: maintenance },
    { data: gastos },
    { data: documents },
    { data: invoices },
    { data: payments },
    { data: clientes },
    { data: notas },
    { data: ajustesIpc },
    { data: prestamos },
  ] = await Promise.all([
    supabase.from("trucks").select("*"),
    supabase.from("drivers").select("*"),
    supabase.from("trips").select("*"),
    supabase.from("fuel").select("*"),
    supabase.from("maintenance").select("*"),
    supabase.from("gastos").select("*"),
    supabase.from("documents").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("invoice_payments").select("*"),
    supabase.from("clientes").select("*"),
    supabase.from("notas").select("*").eq("estado", "Pendiente"),
    supabase.from("ajustes_ipc").select("*"),
    supabase.from("prestamos").select("*").eq("estado", "Pendiente"),
  ]);

  const trucksData = trucks ?? [];
  const truckById = new Map<string, Truck>(trucksData.map((t) => [t.id, t]));
  const driverById = new Map<string, Driver>((drivers ?? []).map((d) => [d.id, d]));
  const clienteById = new Map<string, Cliente>((clientes ?? []).map((c) => [c.id, c]));
  const activeTrucks = trucksData.filter((t) => t.estado === "Operativo").length;
  const activeDrivers = (drivers ?? []).filter((d) => d.estado !== "Inactivo").length;

  const month = todayStr().slice(0, 7);
  const agg = monthlyAggregate(month, trips ?? [], fuel ?? [], maintenance ?? [], gastos ?? []);

  const paidByInvoice = new Map<string, number>();
  (payments ?? []).forEach((p) => paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + Number(p.monto || 0)));
  const deudaTotal = (invoices ?? []).reduce((s, inv) => {
    const total = Number(inv.neto || 0) * 1.19;
    const saldo = total - (paidByInvoice.get(inv.id) ?? 0);
    return s + Math.max(saldo, 0);
  }, 0);
  const pendCount = (invoices ?? []).filter((inv) => {
    const total = Number(inv.neto || 0) * 1.19;
    const saldo = total - (paidByInvoice.get(inv.id) ?? 0);
    return saldo > 0.5;
  }).length;

  const docAlerts = (documents ?? [])
    .map((d) => ({
      kind: "Documento",
      label: d.tipo,
      meta: d.truck_id ? (truckById.get(d.truck_id)?.patente ?? "—") : (driverById.get(d.driver_id ?? "")?.nombre ?? "—"),
      status: documentStatus(d),
    }))
    .filter((x) => x.status.level !== "ok");
  const maintAlerts = (maintenance ?? [])
    .map((m) => ({ kind: "Mantención", label: m.tipo, meta: truckById.get(m.truck_id)?.patente ?? "—", status: maintenanceStatus(m, truckById.get(m.truck_id)) }))
    .filter((x) => x.status.level !== "ok");
  const licenseAlerts = (drivers ?? [])
    .map((d) => ({ kind: "Licencia", label: d.nombre, meta: d.categoria_licencia ?? "", status: licenseStatus(d) }))
    .filter((x) => x.status.level !== "ok");
  const noteAlerts = (notas ?? [])
    .map((n) => ({ kind: "Nota", label: n.texto.length > 40 ? `${n.texto.slice(0, 40)}…` : n.texto, meta: "", status: noteStatus(n) }))
    .filter((x): x is typeof x & { status: NonNullable<typeof x.status> } => x.status !== null && x.status.level !== "ok");
  const ivaAlert = { kind: "Impuestos", label: "Pago de IVA (F29)", meta: "", status: taxDeadlineStatus(IVA_DUE_DAY, "IVA", gastos ?? []) };
  const previredAlert = { kind: "Impuestos", label: "Pago de Previred", meta: "", status: taxDeadlineStatus(PREVIRED_DUE_DAY, "Previred", gastos ?? []) };
  const taxAlerts = [ivaAlert, previredAlert].filter((x) => x.status.level !== "ok");
  const ipcStatus = ipcAdjustmentStatus(ajustesIpc ?? []);
  const ipcAlerts = ipcStatus.level !== "ok" ? [{ kind: "Sueldos", label: "Reajuste anual IPC", meta: "", status: ipcStatus }] : [];
  const loanAlerts = (prestamos ?? [])
    .map((p) => ({
      kind: "Préstamo",
      label: `Descontar a ${driverById.get(p.driver_id)?.nombre ?? "—"}`,
      meta: fmtMoney(p.monto),
      status: loanDeductionStatus(p),
    }))
    .filter((x): x is typeof x & { status: NonNullable<typeof x.status> } => x.status !== null && x.status.level !== "ok");

  const allAlerts = [...docAlerts, ...maintAlerts, ...licenseAlerts, ...noteAlerts, ...taxAlerts, ...ipcAlerts, ...loanAlerts].sort(
    (a, b) => (a.status.level === "danger" ? 0 : 1) - (b.status.level === "danger" ? 0 : 1),
  );

  const recentTrips = [...(trips ?? [])].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 5);

  const kpis = [
    { label: "Camiones operativos", value: `${activeTrucks} / ${trucksData.length}`, icon: "🚛" },
    { label: "Conductores activos", value: activeDrivers, icon: "🧑‍✈️" },
    { label: "Ingresos del mes", value: fmtMoney(agg.ingresos), icon: "📈" },
    { label: "Ganancia neta del mes", value: fmtMoney(agg.gananciaNeta), tone: agg.gananciaNeta >= 0 ? "good" : "bad", icon: "💵" },
    { label: "Cuentas por cobrar", value: fmtMoney(deudaTotal), sub: `${pendCount} factura(s) pendiente(s)`, icon: "🧾" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">¡Hola! 👋</h1>
        <p className="text-sm text-neutral-500">Así va tu flota este mes.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-lg">{k.icon}</span>
            <p className="mt-2 text-xs text-neutral-500">{k.label}</p>
            <p className={`text-lg font-semibold ${k.tone === "bad" ? "text-red-700" : "text-neutral-900"}`}>{k.value}</p>
            {k.sub && <p className="text-xs text-neutral-400">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">🔔 Alertas</h2>
            <Link href="/notas" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              + Nota
            </Link>
          </div>
          {allAlerts.length === 0 ? (
            <p className="text-sm text-neutral-400">Todo al día — sin alertas pendientes. ✅</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {allAlerts.slice(0, 8).map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span>{a.kind} · {a.label}{a.meta ? ` — ${a.meta}` : ""}</span>
                  <Badge level={a.status.level} text={a.status.text} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-neutral-900">🧭 Últimos viajes</h2>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin viajes registrados todavía.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentTrips.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>{fmtDate(t.fecha)} · {truckById.get(t.truck_id)?.patente ?? "—"} · {clienteById.get(t.cliente_id)?.razon_social ?? "—"}</span>
                  <span className="font-mono">{fmtMoney(t.monto_flete)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/trips" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
            Ver todos los viajes →
          </Link>
        </div>
      </div>
    </div>
  );
}
