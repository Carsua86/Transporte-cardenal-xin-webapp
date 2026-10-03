import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtMoney, fmtNum } from "@/lib/format";
import { toCsv } from "@/lib/csv";
import { tripGastosTotales } from "@/lib/modules";
import type { Cliente, Trip, TripCliente } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get("cliente_id") || "";
  const desde = searchParams.get("desde") || "";
  const hasta = searchParams.get("hasta") || "";

  let query = supabase
    .from("trips")
    .select("*, fuel:fuel_id(litros, costo_total)")
    .order("fecha", { ascending: false });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const [{ data: trips }, { data: trucks }, { data: drivers }, { data: clientes }, { data: tripClientes }] = await Promise.all([
    query,
    supabase.from("trucks").select("id, patente"),
    supabase.from("drivers").select("id, nombre"),
    supabase.from("clientes").select("*") as unknown as Promise<{ data: Cliente[] | null }>,
    supabase.from("trip_clientes").select("*") as unknown as Promise<{ data: TripCliente[] | null }>,
  ]);

  const truckById = new Map((trucks ?? []).map((t) => [t.id, t.patente]));
  const driverById = new Map((drivers ?? []).map((d) => [d.id, d.nombre]));
  const clienteById = new Map((clientes ?? []).map((c) => [c.id, c]));
  const extrasByTrip = new Map<string, TripCliente[]>();
  for (const tc of tripClientes ?? []) {
    const list = extrasByTrip.get(tc.trip_id) ?? [];
    list.push(tc);
    extrasByTrip.set(tc.trip_id, list);
  }

  const headers = [
    "Vendedor", "Fecha", "Camión", "Conductor", "Cliente principal", "RUT cliente",
    "N° Guía/Factura", "Origen", "Destino", "Comuna", "Región",
    "M2", "M3", "Flete neto", "IVA", "Total c/IVA", "Gastos", "Utilidad",
    "Peajes", "Viáticos", "Colación", "Otros gastos", "Combustible",
    "Clientes extra (referencial)",
  ];

  function tripRow(t: Trip): string[] {
    const cliente = clienteById.get(t.cliente_id);
    const flete = Number(t.monto_flete || 0);
    const gastos = tripGastosTotales(t);
    const extras = (extrasByTrip.get(t.id) ?? [])
      .map((e) => {
        const c = clienteById.get(e.cliente_id);
        const parts = [c ? `${c.rut} - ${c.razon_social}` : "—"];
        if (e.numero_guia_factura) parts.push(`Guía/Fact: ${e.numero_guia_factura}`);
        if (e.mt2 != null) parts.push(`M2: ${fmtNum(e.mt2)}`);
        if (e.mt3 != null) parts.push(`M3: ${fmtNum(e.mt3)}`);
        return parts.join(" / ");
      })
      .join("  |  ");

    return [
      t.vendedor || "Sin vendedor",
      fmtDate(t.fecha),
      truckById.get(t.truck_id) ?? "—",
      t.driver_id ? (driverById.get(t.driver_id) ?? "—") : "—",
      cliente?.razon_social ?? "—",
      cliente?.rut ?? "—",
      t.numero_guia_factura ?? "",
      t.origen ?? "",
      t.destino ?? "",
      t.comuna_destino ?? "",
      t.region_destino ?? "",
      t.mt2 != null ? fmtNum(t.mt2) : "",
      t.mt3 != null ? fmtNum(t.mt3) : "",
      fmtMoney(flete),
      fmtMoney(flete * 0.19),
      fmtMoney(flete * 1.19),
      fmtMoney(gastos),
      fmtMoney(flete - gastos),
      fmtMoney(t.peajes),
      fmtMoney(t.viaticos),
      fmtMoney(t.colacion),
      fmtMoney(t.otros),
      fmtMoney(t.fuel?.costo_total ?? 0),
      extras,
    ];
  }

  function subtotalRow(label: string, trips: Trip[]): string[] {
    const flete = trips.reduce((s, t) => s + Number(t.monto_flete || 0), 0);
    const gastos = trips.reduce((s, t) => s + tripGastosTotales(t), 0);
    const row = new Array(headers.length).fill("");
    row[0] = label;
    row[13] = fmtMoney(flete);
    row[14] = fmtMoney(flete * 0.19);
    row[15] = fmtMoney(flete * 1.19);
    row[16] = fmtMoney(gastos);
    row[17] = fmtMoney(flete - gastos);
    return row;
  }

  const allTrips = (trips as Trip[] | null) ?? [];
  const vendorGroups = new Map<string, Trip[]>();
  for (const t of allTrips) {
    const key = t.vendedor || "Sin vendedor";
    const list = vendorGroups.get(key) ?? [];
    list.push(t);
    vendorGroups.set(key, list);
  }
  const orderedVendors = [...vendorGroups.keys()].sort(
    (a, b) =>
      vendorGroups.get(b)!.reduce((s, t) => s + Number(t.monto_flete || 0), 0) -
      vendorGroups.get(a)!.reduce((s, t) => s + Number(t.monto_flete || 0), 0),
  );

  const rows: string[][] = [];
  for (const vendedor of orderedVendors) {
    const vendorTrips = [...vendorGroups.get(vendedor)!].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
    for (const t of vendorTrips) rows.push(tripRow(t));
    rows.push(subtotalRow(`TOTAL ${vendedor} (${vendorTrips.length} viaje${vendorTrips.length === 1 ? "" : "s"})`, vendorTrips));
  }
  if (allTrips.length > 0) {
    rows.push(subtotalRow(`TOTAL GENERAL (${allTrips.length} viaje${allTrips.length === 1 ? "" : "s"})`, allTrips));
  }

  const csv = toCsv(headers, rows);
  const fileName = `viajes_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
