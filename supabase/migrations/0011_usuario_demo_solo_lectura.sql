-- Usuario demo de solo lectura: puede ver todo, pero no puede crear,
-- editar ni borrar nada, ni siquiera saltándose la app (queda bloqueado
-- a nivel de base de datos, no solo en la interfaz).
--
-- Antes de correr esto, crea el usuario en Supabase:
-- Authentication > Users > Add user > demo@cardenalxin.com (con una
-- contraseña que le vas a compartir a quien quieras que vea la demo).
-- Si usas un correo distinto a demo@cardenalxin.com, cámbialo abajo
-- también en la función is_demo_user().

create or replace function is_demo_user()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'demo@cardenalxin.com';
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'trucks','drivers','trips','maintenance','fuel','documents','gastos',
    'invoices','invoice_payments','clientes','notas','ajustes_ipc','prestamos'
  ]
  loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabla % no existe, se omite', t;
      continue;
    end if;

    execute format('drop policy if exists "authenticated_full_access" on %I', t);

    execute format(
      'create policy "read_authenticated" on %I for select using (auth.role() = ''authenticated'')',
      t
    );
    execute format(
      'create policy "write_insert_not_demo" on %I for insert with check (auth.role() = ''authenticated'' and not is_demo_user())',
      t
    );
    execute format(
      'create policy "write_update_not_demo" on %I for update using (auth.role() = ''authenticated'' and not is_demo_user()) with check (auth.role() = ''authenticated'' and not is_demo_user())',
      t
    );
    execute format(
      'create policy "write_delete_not_demo" on %I for delete using (auth.role() = ''authenticated'' and not is_demo_user())',
      t
    );
  end loop;
end $$;

-- Storage (fotos/documentos adjuntos): el demo puede ver los archivos,
-- pero no subir, reemplazar ni borrar ninguno.
drop policy if exists "attachments_authenticated_insert" on storage.objects;
drop policy if exists "attachments_authenticated_update" on storage.objects;
drop policy if exists "attachments_authenticated_delete" on storage.objects;

create policy "attachments_authenticated_insert" on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated' and not is_demo_user());
create policy "attachments_authenticated_update" on storage.objects for update
  using (bucket_id = 'attachments' and auth.role() = 'authenticated' and not is_demo_user());
create policy "attachments_authenticated_delete" on storage.objects for delete
  using (bucket_id = 'attachments' and auth.role() = 'authenticated' and not is_demo_user());
