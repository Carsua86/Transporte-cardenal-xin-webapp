-- Notas y recordatorios de cualquier tema, con fecha opcional que alimenta el panel de Alertas.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

create table notas (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  fecha_recordatorio date,
  estado text not null default 'Pendiente' check (estado in ('Pendiente','Resuelta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger notas_set_updated_at before update on notas
  for each row execute function set_updated_at();

alter table notas enable row level security;
create policy "authenticated_full_access" on notas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
