export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Truck = Timestamps & {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  capacidad_kg: number | null;
  km_actual: number | null;
  estado: "Operativo" | "En mantención" | "Fuera de servicio";
};

export type Driver = Timestamps & {
  id: string;
  nombre: string;
  rut: string | null;
  telefono: string | null;
  categoria_licencia: string | null;
  licencia_numero: string | null;
  vencimiento_licencia: string | null;
  truck_id: string | null;
  estado: "Activo" | "Inactivo";
  foto_path: string | null;
  licencia_foto_path: string | null;
  sueldo_base: number | null;
  carnet_foto_path: string | null;
};

export type Prestamo = {
  id: string;
  driver_id: string;
  fecha: string;
  monto: number;
  descripcion: string | null;
  fecha_descuento: string | null;
  estado: "Pendiente" | "Descontado";
  created_at: string;
  updated_at: string;
};

export type Cliente = Timestamps & {
  id: string;
  rut: string;
  razon_social: string;
  direccion_destino: string | null;
  comuna_destino: string | null;
  region_destino: string | null;
  precio_neto: number;
  vendedor: string | null;
};

export type Trip = Timestamps & {
  id: string;
  fecha: string;
  truck_id: string;
  driver_id: string | null;
  cliente_id: string;
  numero_guia_factura: string | null;
  origen: string | null;
  destino: string | null;
  comuna_destino: string | null;
  region_destino: string | null;
  mt2: number | null;
  mt3: number | null;
  vendedor: string | null;
  monto_flete: number;
  peajes: number;
  viaticos: number;
  colacion: number;
  otros: number;
  otros_descripcion: string | null;
  km_inicio: number | null;
  km_fin: number | null;
  fuel_id: string | null;
  fuel?: { litros: number | null; costo_total: number } | null;
};

export type Maintenance = Timestamps & {
  id: string;
  truck_id: string;
  fecha: string;
  tipo: string;
  km_al_momento: number | null;
  costo: number;
  taller: string | null;
  proximo_km: number | null;
  proxima_fecha: string | null;
  notas: string | null;
};

export type Fuel = Timestamps & {
  id: string;
  truck_id: string;
  fecha: string;
  driver_id: string | null;
  litros: number | null;
  costo_total: number;
  km_al_momento: number | null;
  numero_guia_factura: string | null;
  direccion: string | null;
  region: string | null;
};

export type FleetDocument = Timestamps & {
  id: string;
  truck_id: string;
  tipo: string;
  fecha_vencimiento: string;
  notas: string | null;
  archivo_path: string | null;
};

export type Gasto = Timestamps & {
  id: string;
  fecha: string;
  categoria: string;
  descripcion: string | null;
  monto: number;
  truck_id: string | null;
  centro_costo: string | null;
};

export type Invoice = Timestamps & {
  id: string;
  fecha: string;
  numero: string;
  cliente: string;
  neto: number;
  fecha_vencimiento: string | null;
};

export type InvoicePayment = {
  id: string;
  invoice_id: string;
  fecha: string;
  monto: number;
  tipo: "Abono" | "Descuento";
  created_at: string;
};

export type Nota = Timestamps & {
  id: string;
  texto: string;
  fecha_recordatorio: string | null;
  estado: "Pendiente" | "Resuelta";
};

export type AjusteIpc = Timestamps & {
  id: string;
  anio: number;
  porcentaje: number;
  estado: "Pendiente" | "Aplicado";
};
