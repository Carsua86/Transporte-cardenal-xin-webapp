-- Fecha de descuento por préstamo, para avisar en el panel de Alertas
-- cuándo corresponde descontarlo del sueldo del conductor.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

alter table prestamos add column if not exists fecha_descuento date;
alter table prestamos add column if not exists estado text not null default 'Pendiente'
  check (estado in ('Pendiente', 'Descontado'));
