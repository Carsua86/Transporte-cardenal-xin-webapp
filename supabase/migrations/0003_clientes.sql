-- Reemplaza Rutas y Tarifario por un modelo de Clientes con precio fijo por viaje,
-- y hace que el formulario de Viajes se autocomplete al elegir el cliente (por RUT).
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

drop table if exists rutas;
drop table if exists tarifas;

create table clientes (
  id uuid primary key default gen_random_uuid(),
  rut text not null unique,
  razon_social text not null,
  direccion_destino text,
  comuna_destino text,
  mt2 numeric,
  mt3 numeric,
  precio_viaje numeric not null,
  vendedor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clientes_set_updated_at before update on clientes
  for each row execute function set_updated_at();

alter table clientes enable row level security;
create policy "authenticated_full_access" on clientes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- trips: reemplaza el campo de cliente en texto libre por la relación a clientes,
-- y agrega los datos que se copian automáticamente desde la ficha del cliente
-- (quedan editables y con historial aunque el cliente cambie sus datos después).
alter table trips add column cliente_id uuid references clientes(id) on delete restrict;
alter table trips add column numero_guia_factura text;
alter table trips add column comuna_destino text;
alter table trips add column mt2 numeric;
alter table trips add column mt3 numeric;
alter table trips add column vendedor text;
alter table trips drop column cliente;
