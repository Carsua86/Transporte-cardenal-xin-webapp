-- Nómina de conductores: sueldo base, carnet de identidad, préstamos del mes
-- y bono automático por cumplir 24 viajes en el mes.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

alter table drivers add column sueldo_base numeric;
alter table drivers add column carnet_foto_path text;

create table prestamos (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  fecha date not null,
  monto numeric not null,
  descripcion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prestamos_driver_id_idx on prestamos(driver_id);
create trigger prestamos_set_updated_at before update on prestamos
  for each row execute function set_updated_at();

alter table prestamos enable row level security;
create policy "authenticated_full_access" on prestamos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
