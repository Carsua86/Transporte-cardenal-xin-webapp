import { daysUntil, fmtNum, monthOf, todayStr } from "@/lib/format";
import { invoiceTotals } from "@/lib/invoices";
import type {
  AjusteIpc, Driver, Fuel, FleetDocument, Gasto, Invoice, InvoicePayment, Maintenance, Nota, Prestamo, Trip, Truck,
} from "@/lib/supabase/types";

export function tripCostoDirecto(t: Trip) {
  return Number(t.peajes || 0) + Number(t.viaticos || 0) + Number(t.colacion || 0) + Number(t.otros || 0);
}

export const BONUS_TRIPS_THRESHOLD = 24;
export const BONUS_AMOUNT = 100000;

export function aggregateNomina(drivers: Driver[], trips: Trip[], prestamos: Prestamo[], month: string) {
  return drivers.map((driver) => {
    const viajesMes = trips.filter((t) => t.driver_id === driver.id && monthOf(t.fecha) === month).length;
    const bonoGanado = viajesMes >= BONUS_TRIPS_THRESHOLD;
    const bono = bonoGanado ? BONUS_AMOUNT : 0;
    const prestamosMes = prestamos.filter((p) => p.driver_id === driver.id && monthOf(p.fecha) === month);
    const totalPrestamos = prestamosMes.reduce((s, p) => s + Number(p.monto || 0), 0);
    const sueldoBase = Number(driver.sueldo_base || 0);
    const totalPagar = sueldoBase + bono - totalPrestamos;
    return { driver, viajesMes, bonoGanado, bono, prestamosMes, totalPrestamos, sueldoBase, totalPagar };
  });
}

export function monthlyAggregate(
  month: string,
  trips: Trip[],
  fuel: Fuel[],
  maintenance: Maintenance[],
  gastos: Gasto[],
) {
  const tripsM = trips.filter((t) => monthOf(t.fecha) === month);
  const ingresos = tripsM.reduce((s, t) => s + Number(t.monto_flete || 0), 0);
  const costoDirecto = tripsM.reduce((s, t) => s + tripCostoDirecto(t), 0);
  const mt2Total = tripsM.reduce((s, t) => s + Number(t.mt2 || 0), 0);
  const mt3Total = tripsM.reduce((s, t) => s + Number(t.mt3 || 0), 0);
  const combustible = fuel.filter((f) => monthOf(f.fecha) === month).reduce((s, f) => s + Number(f.costo_total || 0), 0);
  const mantenciones = maintenance.filter((m) => monthOf(m.fecha) === month).reduce((s, m) => s + Number(m.costo || 0), 0);
  const admin = gastos.filter((g) => monthOf(g.fecha) === month).reduce((s, g) => s + Number(g.monto || 0), 0);
  const gastoTotal = costoDirecto + combustible + mantenciones + admin;
  const gananciaNeta = ingresos - gastoTotal;
  const rentabilidad = ingresos ? gananciaNeta / ingresos : 0;
  return { month, ingresos, costoDirecto, mt2Total, mt3Total, combustible, mantenciones, admin, gastoTotal, gananciaNeta, rentabilidad };
}

export function uniqueMonths(trips: Trip[], fuel: Fuel[], maintenance: Maintenance[], gastos: Gasto[]) {
  const set = new Set<string>();
  trips.forEach((t) => t.fecha && set.add(monthOf(t.fecha)));
  fuel.forEach((f) => f.fecha && set.add(monthOf(f.fecha)));
  maintenance.forEach((m) => m.fecha && set.add(monthOf(m.fecha)));
  gastos.forEach((g) => g.fecha && set.add(monthOf(g.fecha)));
  return Array.from(set).sort();
}

export function aggregatePorCamionCompleto(
  trucks: Truck[],
  trips: Trip[],
  fuel: Fuel[],
  maintenance: Maintenance[],
  gastos: Gasto[],
) {
  const rows = trucks
    .map((t) => {
      const tripsT = trips.filter((tr) => tr.truck_id === t.id);
      const ingresos = tripsT.reduce((s, tr) => s + Number(tr.monto_flete || 0), 0);
      const costoViajes = tripsT.reduce((s, tr) => s + tripCostoDirecto(tr), 0);
      const combustible = fuel.filter((f) => f.truck_id === t.id).reduce((s, f) => s + Number(f.costo_total || 0), 0);
      const mantenciones = maintenance.filter((m) => m.truck_id === t.id).reduce((s, m) => s + Number(m.costo || 0), 0);
      const gastosAsignados = gastos.filter((g) => g.truck_id === t.id).reduce((s, g) => s + Number(g.monto || 0), 0);
      const gastoTotal = costoViajes + combustible + mantenciones + gastosAsignados;
      const margen = ingresos - gastoTotal;
      return {
        truck: t, viajes: tripsT.length, ingresos, costoViajes, combustible, mantenciones,
        gastosAsignados, gastoTotal, margen, rentabilidad: ingresos ? margen / ingresos : 0,
      };
    })
    .sort((a, b) => b.margen - a.margen);

  const gastosCompartidos = gastos.filter((g) => !g.truck_id).reduce((s, g) => s + Number(g.monto || 0), 0);
  const totalIngresos = rows.reduce((s, r) => s + r.ingresos, 0);
  const totalGastoCamiones = rows.reduce((s, r) => s + r.gastoTotal, 0);
  const totalMargenCamiones = rows.reduce((s, r) => s + r.margen, 0);
  const margenFinalEmpresa = totalMargenCamiones - gastosCompartidos;
  return { rows, gastosCompartidos, totalIngresos, totalGastoCamiones, totalMargenCamiones, margenFinalEmpresa };
}

function withIvaTotal<T extends { neto: number }>(x: T) {
  return { ...x, iva: x.neto * 0.19, total: x.neto * 1.19 };
}

export function aggregateByVendedor(trips: Trip[], month: string) {
  const tripsM = trips.filter((t) => monthOf(t.fecha) === month);

  const porVendedor = new Map<string, { vendedor: string; viajes: number; neto: number }>();
  const porVendedorRegion = new Map<string, { vendedor: string; region: string; viajes: number; neto: number }>();

  for (const t of tripsM) {
    const vendedor = t.vendedor || "Sin vendedor";
    const region = t.region_destino || "Sin región";
    const neto = Number(t.monto_flete || 0);

    const v = porVendedor.get(vendedor) ?? { vendedor, viajes: 0, neto: 0 };
    v.viajes += 1;
    v.neto += neto;
    porVendedor.set(vendedor, v);

    const key = `${vendedor}||${region}`;
    const r = porVendedorRegion.get(key) ?? { vendedor, region, viajes: 0, neto: 0 };
    r.viajes += 1;
    r.neto += neto;
    porVendedorRegion.set(key, r);
  }

  return {
    porVendedor: Array.from(porVendedor.values()).map(withIvaTotal).sort((a, b) => b.neto - a.neto),
    porVendedorRegion: Array.from(porVendedorRegion.values())
      .map(withIvaTotal)
      .sort((a, b) => a.vendedor.localeCompare(b.vendedor) || b.neto - a.neto),
  };
}

export const AGING_ORDER = ["Vigente", "1-30 días", "31-45 días", "46-60 días", "61-90 días", "+90 días"] as const;

export function aggregateAging(invoices: Invoice[], paymentsByInvoice: Map<string, InvoicePayment[]>) {
  const buckets: Record<string, number> = {};
  const counts: Record<string, number> = {};
  AGING_ORDER.forEach((b) => { buckets[b] = 0; counts[b] = 0; });

  invoices.forEach((inv) => {
    const payments = paymentsByInvoice.get(inv.id) ?? [];
    const t = invoiceTotals(inv, payments);
    if (t.saldo <= 0.5) return;
    const dueDate = inv.fecha_vencimiento || inv.fecha;
    const d = daysUntil(dueDate);
    let bucket = "Vigente";
    if (d !== null && d < 0) {
      const venc = -d;
      if (venc <= 30) bucket = "1-30 días";
      else if (venc <= 45) bucket = "31-45 días";
      else if (venc <= 60) bucket = "46-60 días";
      else if (venc <= 90) bucket = "61-90 días";
      else bucket = "+90 días";
    }
    buckets[bucket] += t.saldo;
    counts[bucket] += 1;
  });

  return { buckets, counts, order: AGING_ORDER };
}

export function expiryStatus(dateStr: string | null | undefined, warnDays: number) {
  const d = daysUntil(dateStr);
  if (d === null) return { level: "ok" as const, text: "—" };
  if (d < 0) return { level: "danger" as const, text: `Vencido hace ${-d} día(s)` };
  if (d <= warnDays) return { level: "warn" as const, text: `Vence en ${d} día(s)` };
  return { level: "ok" as const, text: `Vigente (${d} días)` };
}

export function documentStatus(rec: FleetDocument) {
  return expiryStatus(rec.fecha_vencimiento, 30);
}

export function licenseStatus(driver: Driver) {
  return expiryStatus(driver.vencimiento_licencia, 30);
}

export function noteStatus(nota: Nota) {
  if (!nota.fecha_recordatorio) return null;
  return expiryStatus(nota.fecha_recordatorio, 7);
}

export const IVA_DUE_DAY = 20;
export const PREVIRED_DUE_DAY = 10;

export function nextMonthlyDeadline(dueDay: number) {
  const today = new Date(todayStr());
  let year = today.getFullYear();
  let month = today.getMonth();
  if (today.getDate() > dueDay) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(dueDay).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function taxDeadlineStatus(dueDay: number, warnDays = 5) {
  const date = nextMonthlyDeadline(dueDay);
  return { ...expiryStatus(date, warnDays), date };
}

export const IPC_ADJUSTMENT_MONTH = 1;
export const IPC_ADJUSTMENT_DAY = 1;

export function nextAnnualDeadline(month: number, day: number) {
  const today = new Date(todayStr());
  const currentMonth = today.getMonth() + 1;
  let year = today.getFullYear();
  if (currentMonth > month || (currentMonth === month && today.getDate() > day)) {
    year += 1;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function ipcAdjustmentStatus(ajustes: AjusteIpc[], warnDays = 30) {
  const date = nextAnnualDeadline(IPC_ADJUSTMENT_MONTH, IPC_ADJUSTMENT_DAY);
  const targetYear = Number(date.slice(0, 4));
  const registro = ajustes.find((a) => a.anio === targetYear) ?? null;

  if (registro?.estado === "Aplicado") {
    return { level: "ok" as const, text: "—", targetYear, registro };
  }

  const base = expiryStatus(date, warnDays);
  if (base.level === "ok") return { ...base, targetYear, registro };

  const text = registro
    ? `Reajuste ${targetYear} pendiente de aplicar: ${registro.porcentaje}% IPC`
    : `Se acerca el reajuste anual ${targetYear} — registra el % IPC (INE)`;
  return { ...base, text, targetYear, registro };
}

export function maintenanceStatus(rec: Maintenance, truck: Truck | undefined) {
  let level: "ok" | "warn" | "danger" = "ok";
  let text = "Al día";

  if (rec.proximo_km && truck?.km_actual !== null && truck?.km_actual !== undefined) {
    const diff = Number(rec.proximo_km) - Number(truck.km_actual);
    if (diff <= 0) { level = "danger"; text = `Vencido hace ${fmtNum(-diff)} km`; }
    else if (diff <= 1000) { level = "warn"; text = `Faltan ${fmtNum(diff)} km`; }
    else { text = `Faltan ${fmtNum(diff)} km`; }
  }

  if (rec.proxima_fecha) {
    const d = daysUntil(rec.proxima_fecha);
    if (d !== null) {
      if (d < 0 && level !== "danger") { level = "danger"; text = `Vencido hace ${-d} día(s)`; }
      else if (d <= 15 && level === "ok") { level = "warn"; text = `Vence en ${d} día(s)`; }
    }
  }

  return { level, text };
}
