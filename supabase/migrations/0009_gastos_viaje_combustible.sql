-- Combustible: origen del cargo (guía/factura) y dónde se cargó.
alter table fuel add column if not exists numero_guia_factura text;
alter table fuel add column if not exists direccion text;
alter table fuel add column if not exists region text;

-- Viajes: combustible cargado en el viaje (se vincula a un registro real de
-- Combustible, creado/actualizado automáticamente) y descripción de "otros gastos".
alter table trips add column if not exists fuel_id uuid references fuel(id) on delete set null;
alter table trips add column if not exists otros_descripcion text;

-- Facturación: distinguir abonos (pagos reales) de otras deducciones
-- (descuentos que aplica el cliente al pagar).
alter table invoice_payments add column if not exists tipo text not null default 'Abono'
  check (tipo in ('Abono', 'Descuento'));
