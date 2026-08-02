-- Adjuntos: foto de conductor, foto de licencia, archivo/foto de documentos.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

alter table drivers add column foto_path text;
alter table drivers add column licencia_foto_path text;
alter table documents add column archivo_path text;

-- Bucket privado para todos los adjuntos de la app.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "attachments_authenticated_select" on storage.objects for select
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "attachments_authenticated_insert" on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "attachments_authenticated_update" on storage.objects for update
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "attachments_authenticated_delete" on storage.objects for delete
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');
