-- Documentos: ahora también se pueden asociar a un conductor (no solo a un
-- camión), y se puede marcar un documento como "Regularizado" para sacarlo
-- de las alertas aunque su fecha ya haya vencido.

alter table documents alter column truck_id drop not null;
alter table documents add column if not exists driver_id uuid references drivers(id) on delete cascade;
alter table documents add column if not exists estado text not null default 'Vigente'
  check (estado in ('Vigente', 'Regularizado'));

alter table documents drop constraint if exists documents_truck_or_driver_check;
alter table documents add constraint documents_truck_or_driver_check
  check (truck_id is not null or driver_id is not null);

alter table documents drop constraint if exists documents_tipo_check;
alter table documents add constraint documents_tipo_check check (tipo in (
  'Permiso de Circulación','Seguro Obligatorio (SOAP)','Revisión Técnica','Seguro Adicional',
  'Cédula de Identidad','Certificado de Antecedentes','Examen Psicotécnico','Otro'
));
