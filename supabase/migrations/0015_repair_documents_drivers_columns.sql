-- Reparación: vuelve a crear columnas que ya se habían agregado antes
-- (documents.archivo_path y otras de conductores) por si se perdieron.
-- Es seguro correr esto aunque las columnas ya existan.

alter table drivers add column if not exists foto_path text;
alter table drivers add column if not exists licencia_foto_path text;
alter table drivers add column if not exists carnet_foto_path text;
alter table drivers add column if not exists sueldo_base numeric;

alter table documents add column if not exists archivo_path text;
alter table documents add column if not exists driver_id uuid references drivers(id) on delete cascade;
alter table documents add column if not exists estado text not null default 'Vigente'
  check (estado in ('Vigente', 'Regularizado'));
