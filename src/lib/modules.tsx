import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge } from "@/components/badge";
import { fmtDate, fmtMoney, fmtNum, daysUntil } from "@/lib/format";
import { getSignedUrl } from "@/lib/storage";

export const REGIONES_CL = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "RM",
  "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
];
export const LICENSE_CATS = ["A1", "A2", "A3", "A4", "A5", "B", "C", "D"];
export const DOCUMENT_TYPES = ["Permiso de Circulación", "Seguro Obligatorio (SOAP)", "Revisión Técnica", "Seguro Adicional", "Otro"];
export const MAINTENANCE_TYPES = ["Preventiva", "Cambio de aceite", "Neumáticos", "Frenos", "Correctiva", "Revisión general", "Otro"];
export const GASTO_CATEGORIAS = ["Previred", "IVA", "Sueldo / Pago Chofer", "Colación (oficina)", "Seguro", "Permiso", "Combustible (otro)", "Otro"];
export const CENTRO_COSTO = ["Administración", "Flota", "Operación"];

export type Option = { value: string; label: string };

export type ModuleContext = {
  trucks: Option[];
  drivers: Option[];
  clientes: Option[];
};

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "file";
  required?: boolean;
  allowEmpty?: boolean;
  options?: string[] | ((ctx: ModuleContext) => Option[]);
  accept?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export type ColumnDef = {
  label: string;
  render: (row: Row, ctx: ModuleContext) => React.ReactNode;
};

export type ResolvedFieldDef = Omit<FieldDef, "options"> & { options: Option[] };

export async function getRowFileUrls(supabase: SupabaseClient, fields: FieldDef[], row: Row | null) {
  const fileFields = fields.filter((f) => f.type === "file");
  if (!row || fileFields.length === 0) return {} as Record<string, string | null>;
  const entries = await Promise.all(
    fileFields.map(async (f) => [f.key, await getSignedUrl(supabase, row[f.key])] as const),
  );
  return Object.fromEntries(entries) as Record<string, string | null>;
}

export async function buildFileColumns(supabase: SupabaseClient, fields: FieldDef[], rows: Row[]): Promise<ColumnDef[]> {
  const fileFields = fields.filter((f) => f.type === "file");
  if (fileFields.length === 0) return [];

  const urlsByRow = new Map<string, Record<string, string | null>>();
  await Promise.all(
    rows.map(async (row) => {
      urlsByRow.set(row.id, await getRowFileUrls(supabase, fields, row));
    }),
  );

  return fileFields.map((f) => ({
    label: f.label,
    render: (row: Row) => {
      const url = urlsByRow.get(row.id)?.[f.key];
      return url ? (
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
          Ver
        </a>
      ) : (
        <span className="text-neutral-300">—</span>
      );
    },
  }));
}

export function resolveFields(fields: FieldDef[], ctx: ModuleContext): ResolvedFieldDef[] {
  return fields.map((field) => {
    let options = typeof field.options === "function"
      ? field.options(ctx)
      : (field.options ?? []).map((o) => ({ value: o, label: o }));
    if (field.allowEmpty) options = [{ value: "", label: "— Sin asignar —" }, ...options];
    return { ...field, options };
  });
}

export type ModuleDef = {
  key: string;
  table: string;
  title: string;
  addLabel: string;
  singularLabel: string;
  orderBy: { column: string; ascending: boolean };
  fields: FieldDef[];
  columns: ColumnDef[];
};

function truckLabel(ctx: ModuleContext, id: string | null) {
  if (!id) return "—";
  return ctx.trucks.find((t) => t.value === id)?.label ?? "—";
}

function driverName(ctx: ModuleContext, id: string | null) {
  if (!id) return "—";
  return ctx.drivers.find((d) => d.value === id)?.label ?? "—";
}

function clientLabel(ctx: ModuleContext, id: string | null) {
  if (!id) return "—";
  return ctx.clientes.find((c) => c.value === id)?.label ?? "—";
}

export const MODULES: Record<string, ModuleDef> = {
  trucks: {
    key: "trucks",
    table: "trucks",
    title: "Camiones",
    addLabel: "Nuevo camión",
    singularLabel: "camión",
    orderBy: { column: "patente", ascending: true },
    fields: [
      { key: "patente", label: "Patente", type: "text", required: true },
      { key: "marca", label: "Marca", type: "text" },
      { key: "modelo", label: "Modelo", type: "text" },
      { key: "anio", label: "Año", type: "number" },
      { key: "capacidad_kg", label: "Capacidad (kg)", type: "number" },
      { key: "km_actual", label: "Kilometraje actual", type: "number" },
      { key: "estado", label: "Estado", type: "select", options: ["Operativo", "En mantención", "Fuera de servicio"] },
    ],
    columns: [
      { label: "Patente", render: (r) => <span className="font-mono font-semibold">{r.patente || "—"}</span> },
      { label: "Marca / Modelo", render: (r) => [r.marca, r.modelo].filter(Boolean).join(" ") || "—" },
      { label: "Año", render: (r) => r.anio || "—" },
      { label: "Km actual", render: (r) => <span className="font-mono">{fmtNum(r.km_actual)}</span> },
      {
        label: "Estado",
        render: (r) => {
          const lvl = r.estado === "Operativo" ? "ok" : r.estado === "En mantención" ? "warn" : "danger";
          return <Badge level={lvl} text={r.estado || "—"} />;
        },
      },
    ],
  },

  drivers: {
    key: "drivers",
    table: "drivers",
    title: "Conductores",
    addLabel: "Nuevo conductor",
    singularLabel: "conductor",
    orderBy: { column: "nombre", ascending: true },
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "rut", label: "RUT", type: "text" },
      { key: "telefono", label: "Teléfono", type: "text" },
      { key: "categoria_licencia", label: "Categoría licencia", type: "select", options: LICENSE_CATS },
      { key: "licencia_numero", label: "N° licencia", type: "text" },
      { key: "vencimiento_licencia", label: "Vencimiento licencia", type: "date" },
      { key: "truck_id", label: "Camión asignado", type: "select", allowEmpty: true, options: (ctx) => ctx.trucks },
      { key: "estado", label: "Estado", type: "select", options: ["Activo", "Inactivo"] },
      { key: "sueldo_base", label: "Sueldo base", type: "number" },
      { key: "foto_path", label: "Foto del conductor", type: "file", accept: "image/*" },
      { key: "carnet_foto_path", label: "Foto del carnet de identidad", type: "file", accept: "image/*,.pdf" },
      { key: "licencia_foto_path", label: "Foto de la licencia", type: "file", accept: "image/*,.pdf" },
    ],
    columns: [
      { label: "Nombre", render: (r) => <span className="font-semibold">{r.nombre || "—"}</span> },
      { label: "RUT", render: (r) => <span className="font-mono">{r.rut || "—"}</span> },
      { label: "Sueldo base", render: (r) => <span className="font-mono">{fmtMoney(r.sueldo_base)}</span> },
      {
        label: "Licencia",
        render: (r) => {
          const d = daysUntil(r.vencimiento_licencia);
          let lvl: "ok" | "warn" | "danger" = "ok";
          let txt = r.categoria_licencia || "—";
          if (d !== null) {
            if (d < 0) { lvl = "danger"; txt += " · vencida"; }
            else if (d <= 30) { lvl = "warn"; txt += ` · vence en ${d}d`; }
          }
          return <Badge level={lvl} text={txt} />;
        },
      },
      { label: "Camión asignado", render: (r, ctx) => truckLabel(ctx, r.truck_id) },
      { label: "Estado", render: (r) => <Badge level={r.estado === "Activo" ? "ok" : "danger"} text={r.estado || "—"} /> },
    ],
  },

  prestamos: {
    key: "prestamos",
    table: "prestamos",
    title: "Préstamos a conductores",
    addLabel: "Nuevo préstamo",
    singularLabel: "préstamo",
    orderBy: { column: "fecha", ascending: false },
    fields: [
      { key: "driver_id", label: "Conductor", type: "select", required: true, options: (ctx) => ctx.drivers },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "monto", label: "Monto", type: "number", required: true },
      { key: "descripcion", label: "Descripción", type: "text" },
    ],
    columns: [
      { label: "Conductor", render: (r, ctx) => driverName(ctx, r.driver_id) },
      { label: "Fecha", render: (r) => fmtDate(r.fecha) },
      { label: "Descripción", render: (r) => r.descripcion || "—" },
      { label: "Monto", render: (r) => <span className="font-mono font-semibold">{fmtMoney(r.monto)}</span> },
    ],
  },

  clientes: {
    key: "clientes",
    table: "clientes",
    title: "Clientes",
    addLabel: "Nuevo cliente",
    singularLabel: "cliente",
    orderBy: { column: "razon_social", ascending: true },
    fields: [
      { key: "rut", label: "RUT", type: "text", required: true },
      { key: "razon_social", label: "Razón social", type: "text", required: true },
      { key: "direccion_destino", label: "Dirección de destino", type: "text" },
      { key: "comuna_destino", label: "Comuna de destino", type: "text" },
      { key: "region_destino", label: "Región de destino", type: "select", options: REGIONES_CL },
      { key: "precio_neto", label: "Precio neto del viaje", type: "number", required: true },
      { key: "vendedor", label: "Vendedor", type: "text" },
    ],
    columns: [
      { label: "RUT", render: (r) => <span className="font-mono">{r.rut || "—"}</span> },
      { label: "Razón social", render: (r) => <span className="font-semibold">{r.razon_social || "—"}</span> },
      { label: "Destino", render: (r) => [r.direccion_destino, r.comuna_destino, r.region_destino].filter(Boolean).join(", ") || "—" },
      { label: "Precio neto", render: (r) => <span className="font-mono">{fmtMoney(r.precio_neto)}</span> },
      { label: "IVA", render: (r) => <span className="font-mono">{fmtMoney(Number(r.precio_neto || 0) * 0.19)}</span> },
      { label: "Total", render: (r) => <span className="font-mono font-semibold">{fmtMoney(Number(r.precio_neto || 0) * 1.19)}</span> },
      { label: "Vendedor", render: (r) => r.vendedor || "—" },
    ],
  },

  trips: {
    key: "trips",
    table: "trips",
    title: "Viajes",
    addLabel: "Nuevo viaje",
    singularLabel: "viaje",
    orderBy: { column: "fecha", ascending: false },
    fields: [
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "truck_id", label: "Camión", type: "select", required: true, options: (ctx) => ctx.trucks },
      { key: "driver_id", label: "Conductor", type: "select", allowEmpty: true, options: (ctx) => ctx.drivers },
      { key: "cliente_id", label: "Cliente (RUT)", type: "select", required: true, options: (ctx) => ctx.clientes },
      { key: "numero_guia_factura", label: "N° Guía / Factura", type: "text" },
      { key: "origen", label: "Origen", type: "text" },
      { key: "destino", label: "Destino", type: "text" },
      { key: "comuna_destino", label: "Comuna destino", type: "text" },
      { key: "region_destino", label: "Región destino", type: "text" },
      { key: "mt2", label: "M2 (de este viaje)", type: "number" },
      { key: "mt3", label: "M3 (de este viaje)", type: "number" },
      { key: "vendedor", label: "Vendedor", type: "text" },
      { key: "monto_flete", label: "Monto flete (neto)", type: "number", required: true },
      { key: "peajes", label: "Peajes", type: "number" },
      { key: "viaticos", label: "Viáticos", type: "number" },
      { key: "colacion", label: "Colación", type: "number" },
      { key: "otros", label: "Otros gastos", type: "number" },
      { key: "km_inicio", label: "Km inicio", type: "number" },
      { key: "km_fin", label: "Km fin", type: "number" },
    ],
    columns: [
      { label: "Fecha", render: (r) => fmtDate(r.fecha) },
      { label: "Camión", render: (r, ctx) => truckLabel(ctx, r.truck_id) },
      { label: "Conductor", render: (r, ctx) => driverName(ctx, r.driver_id) },
      { label: "Cliente", render: (r, ctx) => clientLabel(ctx, r.cliente_id) },
      { label: "N° Guía/Factura", render: (r) => r.numero_guia_factura || "—" },
      { label: "Destino", render: (r) => [r.destino, r.comuna_destino, r.region_destino].filter(Boolean).join(", ") || "—" },
      { label: "M2 / M3", render: (r) => `${r.mt2 ?? "—"} / ${r.mt3 ?? "—"}` },
      { label: "Flete neto", render: (r) => <span className="font-mono">{fmtMoney(r.monto_flete)}</span> },
      {
        label: "Costo directo",
        render: (r) => {
          const costo = Number(r.peajes || 0) + Number(r.viaticos || 0) + Number(r.colacion || 0) + Number(r.otros || 0);
          return <span className="font-mono">{fmtMoney(costo)}</span>;
        },
      },
      {
        label: "Ganancia",
        render: (r) => {
          const costo = Number(r.peajes || 0) + Number(r.viaticos || 0) + Number(r.colacion || 0) + Number(r.otros || 0);
          const g = Number(r.monto_flete || 0) - costo;
          return <span className={`font-mono ${g >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmtMoney(g)}</span>;
        },
      },
    ],
  },

  maintenance: {
    key: "maintenance",
    table: "maintenance",
    title: "Mantenciones",
    addLabel: "Nueva mantención",
    singularLabel: "mantención",
    orderBy: { column: "fecha", ascending: false },
    fields: [
      { key: "truck_id", label: "Camión", type: "select", required: true, options: (ctx) => ctx.trucks },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "tipo", label: "Tipo", type: "select", required: true, options: MAINTENANCE_TYPES },
      { key: "km_al_momento", label: "Km al momento", type: "number" },
      { key: "costo", label: "Costo", type: "number", required: true },
      { key: "taller", label: "Taller", type: "text" },
      { key: "proximo_km", label: "Próximo control (km)", type: "number" },
      { key: "proxima_fecha", label: "Próximo control (fecha)", type: "date" },
      { key: "notas", label: "Notas", type: "textarea" },
    ],
    columns: [
      { label: "Camión", render: (r, ctx) => truckLabel(ctx, r.truck_id) },
      { label: "Fecha", render: (r) => fmtDate(r.fecha) },
      { label: "Tipo", render: (r) => r.tipo || "—" },
      { label: "Costo", render: (r) => <span className="font-mono">{fmtMoney(r.costo)}</span> },
      { label: "Taller", render: (r) => r.taller || "—" },
      {
        label: "Próximo control",
        render: (r) => {
          const d = r.proxima_fecha ? daysUntil(r.proxima_fecha) : null;
          if (d === null) return "—";
          const lvl = d < 0 ? "danger" : d <= 15 ? "warn" : "ok";
          return <Badge level={lvl} text={d < 0 ? "vencida" : `en ${d}d`} />;
        },
      },
    ],
  },

  fuel: {
    key: "fuel",
    table: "fuel",
    title: "Combustible",
    addLabel: "Nueva carga",
    singularLabel: "carga de combustible",
    orderBy: { column: "fecha", ascending: false },
    fields: [
      { key: "truck_id", label: "Camión", type: "select", required: true, options: (ctx) => ctx.trucks },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "driver_id", label: "Conductor", type: "select", allowEmpty: true, options: (ctx) => ctx.drivers },
      { key: "litros", label: "Litros", type: "number" },
      { key: "costo_total", label: "Costo total", type: "number", required: true },
      { key: "km_al_momento", label: "Km al momento", type: "number" },
    ],
    columns: [
      { label: "Camión", render: (r, ctx) => truckLabel(ctx, r.truck_id) },
      { label: "Fecha", render: (r) => fmtDate(r.fecha) },
      { label: "Litros", render: (r) => <span className="font-mono">{fmtNum(r.litros)}</span> },
      { label: "Costo total", render: (r) => <span className="font-mono">{fmtMoney(r.costo_total)}</span> },
      {
        label: "$/Litro",
        render: (r) => {
          const v = r.litros ? Number(r.costo_total || 0) / Number(r.litros) : 0;
          return <span className="font-mono">{fmtMoney(v)}</span>;
        },
      },
    ],
  },

  documents: {
    key: "documents",
    table: "documents",
    title: "Documentos",
    addLabel: "Nuevo documento",
    singularLabel: "documento",
    orderBy: { column: "fecha_vencimiento", ascending: true },
    fields: [
      { key: "truck_id", label: "Camión", type: "select", required: true, options: (ctx) => ctx.trucks },
      { key: "tipo", label: "Tipo de documento", type: "select", required: true, options: DOCUMENT_TYPES },
      { key: "fecha_vencimiento", label: "Vencimiento", type: "date", required: true },
      { key: "notas", label: "Notas", type: "textarea" },
      { key: "archivo_path", label: "Foto o archivo del documento", type: "file", accept: "image/*,.pdf" },
    ],
    columns: [
      { label: "Camión", render: (r, ctx) => truckLabel(ctx, r.truck_id) },
      { label: "Documento", render: (r) => r.tipo || "—" },
      { label: "Vencimiento", render: (r) => fmtDate(r.fecha_vencimiento) },
      {
        label: "Estado",
        render: (r) => {
          const d = daysUntil(r.fecha_vencimiento);
          if (d === null) return "—";
          const lvl = d < 0 ? "danger" : d <= 30 ? "warn" : "ok";
          const txt = d < 0 ? "vencido" : d <= 30 ? `vence en ${d}d` : "vigente";
          return <Badge level={lvl} text={txt} />;
        },
      },
    ],
  },

  gastos: {
    key: "gastos",
    table: "gastos",
    title: "Gastos Administrativos",
    addLabel: "Nuevo gasto",
    singularLabel: "gasto",
    orderBy: { column: "fecha", ascending: false },
    fields: [
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "categoria", label: "Categoría", type: "select", required: true, options: GASTO_CATEGORIAS },
      { key: "descripcion", label: "Descripción", type: "text" },
      { key: "monto", label: "Monto", type: "number", required: true },
      { key: "truck_id", label: "Camión (vacío = gasto compartido)", type: "select", allowEmpty: true, options: (ctx) => ctx.trucks },
      { key: "centro_costo", label: "Centro de costo", type: "select", options: CENTRO_COSTO },
    ],
    columns: [
      { label: "Fecha", render: (r) => fmtDate(r.fecha) },
      { label: "Categoría", render: (r) => r.categoria || "—" },
      { label: "Descripción", render: (r) => r.descripcion || "—" },
      { label: "Camión", render: (r, ctx) => (r.truck_id ? truckLabel(ctx, r.truck_id) : <span className="text-neutral-400">Compartido</span>) },
      { label: "Centro costo", render: (r) => r.centro_costo || "—" },
      { label: "Monto", render: (r) => <span className="font-mono font-semibold">{fmtMoney(r.monto)}</span> },
    ],
  },

  invoices: {
    key: "invoices",
    table: "invoices",
    title: "Facturación y Cobranza",
    addLabel: "Nueva factura",
    singularLabel: "factura",
    orderBy: { column: "fecha", ascending: false },
    fields: [
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "numero", label: "N° Factura", type: "text", required: true },
      { key: "cliente", label: "Cliente", type: "text", required: true },
      { key: "neto", label: "Monto neto", type: "number", required: true },
      { key: "fecha_vencimiento", label: "Vencimiento (opcional, 30 días si se deja vacío)", type: "date" },
    ],
    columns: [
      { label: "Fecha", render: (r) => fmtDate(r.fecha) },
      { label: "N°", render: (r) => <span className="font-mono">{r.numero || "—"}</span> },
      { label: "Cliente", render: (r) => r.cliente || "—" },
      { label: "Neto", render: (r) => <span className="font-mono">{fmtMoney(r.neto)}</span> },
    ],
  },

  notas: {
    key: "notas",
    table: "notas",
    title: "Notas y Recordatorios",
    addLabel: "Nueva nota",
    singularLabel: "nota",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "texto", label: "Nota", type: "textarea", required: true },
      { key: "fecha_recordatorio", label: "Fecha de recordatorio (opcional)", type: "date" },
      { key: "estado", label: "Estado", type: "select", options: ["Pendiente", "Resuelta"] },
    ],
    columns: [
      { label: "Nota", render: (r) => <span className="whitespace-pre-wrap">{r.texto}</span> },
      { label: "Recordatorio", render: (r) => (r.fecha_recordatorio ? fmtDate(r.fecha_recordatorio) : "—") },
      { label: "Estado", render: (r) => <Badge level={r.estado === "Resuelta" ? "ok" : "warn"} text={r.estado || "Pendiente"} /> },
    ],
  },

  ajustes_ipc: {
    key: "ajustes_ipc",
    table: "ajustes_ipc",
    title: "Reajuste de sueldos (IPC)",
    addLabel: "Nuevo reajuste",
    singularLabel: "reajuste",
    orderBy: { column: "anio", ascending: false },
    fields: [
      { key: "anio", label: "Año", type: "number", required: true },
      { key: "porcentaje", label: "Porcentaje IPC (%)", type: "number", required: true },
      { key: "estado", label: "Estado", type: "select", options: ["Pendiente", "Aplicado"] },
    ],
    columns: [
      { label: "Año", render: (r) => r.anio },
      { label: "IPC", render: (r) => `${r.porcentaje}%` },
      { label: "Estado", render: (r) => <Badge level={r.estado === "Aplicado" ? "ok" : "warn"} text={r.estado || "Pendiente"} /> },
    ],
  },
};

export const NAV = [
  { section: "General", items: [["", "📊", "Panel"], ["reportes", "🧮", "Reportes"], ["notas", "📝", "Notas"]] },
  { section: "Comercial", items: [["clientes", "🧑‍💼", "Clientes"]] },
  { section: "Flota", items: [["trucks", "🚛", "Camiones"], ["maintenance", "🔧", "Mantenciones"], ["fuel", "⛽", "Combustible"], ["documents", "📄", "Documentos"]] },
  { section: "Personal", items: [["drivers", "🧑‍✈️", "Conductores"], ["prestamos", "💳", "Préstamos"], ["nomina", "🧮", "Nómina"], ["ajustes_ipc", "📈", "Reajuste IPC"]] },
  { section: "Operación", items: [["trips", "🧭", "Viajes"]] },
  { section: "Finanzas", items: [["gastos", "🏢", "Gastos"], ["invoices", "🧾", "Facturación"]] },
] as const;
