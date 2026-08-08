-- Concepto/motivo para cada abono o descuento registrado en una factura.
alter table invoice_payments add column if not exists concepto text;
