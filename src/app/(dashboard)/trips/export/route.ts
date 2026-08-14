import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtMoney, fmtNum } from "@/lib/format";
import { toCsv } from "@/lib/csv";
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
    "Fecha", "Camión", "Conductor", "Cliente principal", "RUT cliente",
    "N° Guía/Factura", "Origen", "Destino", "Comuna", "Región", "Vendedor",
    "M2", "M3", "Flete neto", "IVA", "Total c/IVA",
    "Peajes", "Viáticos", "Colación", "Otros gastos", "Combustible",
    "Clientes extra (referencial)",
  ];

  const rows = ((trips as Trip[] | null) ?? []).map((t) => {
    const cliente = clienteById.get(t.cliente_id);
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
      t.vendedor ?? "",
      t.mt2 != null ? fmtNum(t.mt2) : "",
      t.mt3 != null ? fmtNum(t.mt3) : "",
      fmtMoney(t.monto_flete),
      fmtMoney(Number(t.monto_flete || 0) * 0.19),
      fmtMoney(Number(t.monto_flete || 0) * 1.19),
      fmtMoney(t.peajes),
      fmtMoney(t.viaticos),
      fmtMoney(t.colacion),
      fmtMoney(t.otros),
      fmtMoney(t.fuel?.costo_total ?? 0),
      extras,
    ];
  });

  const csv = toCsv(headers, rows);
  const fileName = `viajes_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
