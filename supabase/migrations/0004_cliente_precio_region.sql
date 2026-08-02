-- Ajustes al modelo de Clientes/Viajes:
-- - Clientes: quita m2/m3 (ahora van por viaje, ya que cada viaje mide distinto),
--   reemplaza "precio del viaje" por "precio neto" (IVA y total se calculan solos),
--   y agrega la región de destino (para el reporte por vendedor/región).
-- - Viajes: agrega la región de destino (se autocompleta desde el cliente).
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr.

alter table clientes drop column mt2;
alter table clientes drop column mt3;
alter table clientes rename column precio_viaje to precio_neto;
alter table clientes add column region_destino text
  check (region_destino in (
    'Arica y Parinacota','Tarapacá','Antofagasta','Atacama','Coquimbo','Valparaíso','RM',
    'O''Higgins','Maule','Ñuble','Biobío','La Araucanía','Los Ríos','Los Lagos','Aysén','Magallanes'
  ));

alter table trips add column region_destino text;
