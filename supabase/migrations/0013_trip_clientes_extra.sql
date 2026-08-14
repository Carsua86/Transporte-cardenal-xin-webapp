-- Clientes adicionales (referenciales) dentro de un mismo viaje: cuando un
-- camión reparte a varios clientes en la misma ruta, el viaje sigue
-- guardando solo el valor del cliente principal (el más lejos / mayor
-- precio), pero aquí se anotan los demás con su guía/factura y sus mt2/mt3.

create table trip_clientes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete restrict,
  numero_guia_factura text,
  mt2 numeric,
  mt3 numeric,
  created_at timestamptz not null default now()
);
create index trip_clientes_trip_id_idx on trip_clientes(trip_id);

alter table trip_clientes enable row level security;

create policy "read_authenticated" on trip_clientes for select
  using (auth.role() = 'authenticated');
create policy "write_insert_not_demo" on trip_clientes for insert
  with check (auth.role() = 'authenticated' and not is_demo_user());
create policy "write_update_not_demo" on trip_clientes for update
  using (auth.role() = 'authenticated' and not is_demo_user())
  with check (auth.role() = 'authenticated' and not is_demo_user());
create policy "write_delete_not_demo" on trip_clientes for delete
  using (auth.role() = 'authenticated' and not is_demo_user());
