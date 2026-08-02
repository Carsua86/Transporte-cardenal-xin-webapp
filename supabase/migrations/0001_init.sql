-- Cardenal Xin SpA — esquema inicial de flota
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

create extension if not exists "pgcrypto";

-- ---------- función utilitaria: updated_at automático ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- trucks ----------
create table trucks (
  id uuid primary key default gen_random_uuid(),
  patente text not null unique,
  marca text,
  modelo text,
  anio int,
  capacidad_kg numeric,
  km_actual numeric,
  estado text not null default 'Operativo'
    check (estado in ('Operativo','En mantención','Fuera de servicio')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trucks_set_updated_at before update on trucks
  for each row execute function set_updated_at();

-- ---------- drivers ----------
create table drivers (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rut text,
  telefono text,
  categoria_licencia text
    check (categoria_licencia in ('A1','A2','A3','A4','A5','B','C','D')),
  licencia_numero text,
  vencimiento_licencia date,
  truck_id uuid references trucks(id) on delete set null,
  estado text not null default 'Activo' check (estado in ('Activo','Inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger drivers_set_updated_at before update on drivers
  for each row execute function set_updated_at();

-- ---------- rutas ----------
create table rutas (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  destino text not null,
  region_origen text,
  region_destino text,
  tipo_carga text,
  km_est numeric,
  peajes_est numeric,
  estado text not null default 'Activa' check (estado in ('Activa','Inactiva')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger rutas_set_updated_at before update on rutas
  for each row execute function set_updated_at();

-- ---------- tarifas ----------
create table tarifas (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  origen text not null,
  destino text not null,
  region_origen text,
  region_destino text,
  tipo_carga text,
  camion_recom text,
  tarifa_neta numeric not null,
  condicion_pago_dias int,
  estado text not null default 'Activa' check (estado in ('Activa','Inactiva')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tarifas_set_updated_at before update on tarifas
  for each row execute function set_updated_at();

-- ---------- trips (viajes) ----------
create table trips (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  truck_id uuid not null references trucks(id) on delete restrict,
  driver_id uuid references drivers(id) on delete set null,
  cliente text not null,
  origen text,
  destino text,
  monto_flete numeric not null,
  peajes numeric not null default 0,
  viaticos numeric not null default 0,
  colacion numeric not null default 0,
  otros numeric not null default 0,
  km_inicio numeric,
  km_fin numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trips_truck_id_idx on trips(truck_id);
create index trips_fecha_idx on trips(fecha);
create trigger trips_set_updated_at before update on trips
  for each row execute function set_updated_at();

-- ---------- maintenance (mantenciones) ----------
create table maintenance (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references trucks(id) on delete cascade,
  fecha date not null,
  tipo text not null check (tipo in
    ('Preventiva','Cambio de aceite','Neumáticos','Frenos','Correctiva','Revisión general','Otro')),
  km_al_momento numeric,
  costo numeric not null,
  taller text,
  proximo_km numeric,
  proxima_fecha date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index maintenance_truck_id_idx on maintenance(truck_id);
create trigger maintenance_set_updated_at before update on maintenance
  for each row execute function set_updated_at();

-- ---------- fuel (combustible) ----------
create table fuel (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references trucks(id) on delete cascade,
  fecha date not null,
  driver_id uuid references drivers(id) on delete set null,
  litros numeric,
  costo_total numeric not null,
  km_al_momento numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fuel_truck_id_idx on fuel(truck_id);
create trigger fuel_set_updated_at before update on fuel
  for each row execute function set_updated_at();

-- ---------- documents (documentos) ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references trucks(id) on delete cascade,
  tipo text not null check (tipo in
    ('Permiso de Circulación','Seguro Obligatorio (SOAP)','Revisión Técnica','Seguro Adicional','Otro')),
  fecha_vencimiento date not null,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_truck_id_idx on documents(truck_id);
create trigger documents_set_updated_at before update on documents
  for each row execute function set_updated_at();

-- ---------- gastos (gastos administrativos) ----------
create table gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  categoria text not null check (categoria in
    ('Previred','IVA','Sueldo / Pago Chofer','Colación (oficina)','Seguro','Permiso','Combustible (otro)','Otro')),
  descripcion text,
  monto numeric not null,
  truck_id uuid references trucks(id) on delete set null, -- null = gasto compartido
  centro_costo text check (centro_costo in ('Administración','Flota','Operación')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gastos_truck_id_idx on gastos(truck_id);
create trigger gastos_set_updated_at before update on gastos
  for each row execute function set_updated_at();

-- ---------- invoices (facturación) ----------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  numero text not null,
  cliente text not null,
  neto numeric not null,
  fecha_vencimiento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger invoices_set_updated_at before update on invoices
  for each row execute function set_updated_at();

-- ---------- invoice_payments (abonos) ----------
create table invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  fecha date not null,
  monto numeric not null,
  created_at timestamptz not null default now()
);
create index invoice_payments_invoice_id_idx on invoice_payments(invoice_id);

-- =====================================================================
-- RLS: la app es de uso interno (usuarios se crean a mano en Supabase,
-- sin registro público), así que cualquier usuario autenticado tiene
-- acceso completo a todos los datos de la flota.
-- =====================================================================
alter table trucks enable row level security;
alter table drivers enable row level security;
alter table rutas enable row level security;
alter table tarifas enable row level security;
alter table trips enable row level security;
alter table maintenance enable row level security;
alter table fuel enable row level security;
alter table documents enable row level security;
alter table gastos enable row level security;
alter table invoices enable row level security;
alter table invoice_payments enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'trucks','drivers','rutas','tarifas','trips','maintenance',
    'fuel','documents','gastos','invoices','invoice_payments'
  ]
  loop
    execute format(
      'create policy "authenticated_full_access" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t
    );
  end loop;
end $$;
