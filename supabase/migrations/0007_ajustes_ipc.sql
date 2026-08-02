-- Registro anual del reajuste de sueldos por IPC, para alertar cada fin de año
-- y calcular la vista previa de sueldos con el aumento.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

create table ajustes_ipc (
  id uuid primary key default gen_random_uuid(),
  anio int not null unique,
  porcentaje numeric not null,
  estado text not null default 'Pendiente' check (estado in ('Pendiente','Aplicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ajustes_ipc_set_updated_at before update on ajustes_ipc
  for each row execute function set_updated_at();

alter table ajustes_ipc enable row level security;
create policy "authenticated_full_access" on ajustes_ipc for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
