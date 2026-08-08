"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Option, Row } from "@/lib/modules";
import type { Cliente } from "@/lib/supabase/types";
import { upsertTrip } from "@/lib/actions/trips";
import { fmtMoney } from "@/lib/format";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

export function TripFormModal({
  closeHref,
  initial,
  trucks,
  drivers,
  clientes,
}: {
  closeHref: string;
  initial: Row | null;
  trucks: Option[];
  drivers: Option[];
  clientes: Cliente[];
}) {
  const action = upsertTrip.bind(null, initial?.id ?? null);
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => action(formData),
    { error: null },
  );

  const [clienteId, setClienteId] = useState(initial?.cliente_id ?? "");
  const [destino, setDestino] = useState(initial?.destino ?? "");
  const [comunaDestino, setComunaDestino] = useState(initial?.comuna_destino ?? "");
  const [regionDestino, setRegionDestino] = useState(initial?.region_destino ?? "");
  const [vendedor, setVendedor] = useState(initial?.vendedor ?? "");
  const [montoFlete, setMontoFlete] = useState(initial?.monto_flete ?? "");
  const [peajes, setPeajes] = useState(initial?.peajes ?? "");
  const [viaticos, setViaticos] = useState(initial?.viaticos ?? "");
  const [colacion, setColacion] = useState(initial?.colacion ?? "");
  const [otros, setOtros] = useState(initial?.otros ?? "");
  const [combustibleMonto, setCombustibleMonto] = useState(initial?.fuel?.costo_total ?? "");
  const [clienteQuery, setClienteQuery] = useState(() => {
    const c = clientes.find((c) => c.id === initial?.cliente_id);
    return c ? `${c.rut} — ${c.razon_social}` : "";
  });
  const [showClienteList, setShowClienteList] = useState(false);
  const [clienteError, setClienteError] = useState(false);

  function handleClienteChange(id: string) {
    setClienteId(id);
    const cliente = clientes.find((c) => c.id === id);
    if (cliente) {
      setDestino(cliente.direccion_destino ?? "");
      setComunaDestino(cliente.comuna_destino ?? "");
      setRegionDestino(cliente.region_destino ?? "");
      setVendedor(cliente.vendedor ?? "");
      setMontoFlete(cliente.precio_neto ?? "");
    }
  }

  function selectCliente(id: string) {
    const cliente = clientes.find((c) => c.id === id);
    handleClienteChange(id);
    setClienteQuery(cliente ? `${cliente.rut} — ${cliente.razon_social}` : "");
    setShowClienteList(false);
    setClienteError(false);
  }

  const q = clienteQuery.trim().toLowerCase();
  const filteredClientes = q
    ? clientes.filter((c) => c.rut.toLowerCase().includes(q) || c.razon_social.toLowerCase().includes(q))
    : clientes;

  const montoFleteNum = Number(montoFlete || 0);
  const gastosTotales =
    Number(peajes || 0) + Number(viaticos || 0) + Number(colacion || 0) + Number(otros || 0) + Number(combustibleMonto || 0);
  const utilidad = montoFleteNum - gastosTotales;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{initial ? "Editar viaje" : "Nuevo viaje"}</h2>
          <Link href={closeHref} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </Link>
        </div>
        <form
          action={formAction}
          onSubmit={(e) => {
            if (!clienteId) {
              e.preventDefault();
              setClienteError(true);
              setShowClienteList(true);
            }
          }}
          className="max-h-[75vh] overflow-y-auto px-5 py-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_fecha">Fecha <span className="text-brand-600">*</span></label>
              <input id="f_fecha" name="fecha" type="date" required defaultValue={initial?.fecha ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_truck_id">Camión <span className="text-brand-600">*</span></label>
              <select id="f_truck_id" name="truck_id" required defaultValue={initial?.truck_id ?? ""} className={inputClass}>
                <option value="" disabled>— Selecciona —</option>
                {trucks.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_driver_id">Conductor</label>
              <select id="f_driver_id" name="driver_id" defaultValue={initial?.driver_id ?? ""} className={inputClass}>
                <option value="">— Sin asignar —</option>
                {drivers.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="relative flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_cliente_search">Cliente (RUT) <span className="text-brand-600">*</span></label>
              <input
                id="f_cliente_search"
                type="text"
                autoComplete="off"
                placeholder="Escribe el RUT o el nombre del cliente…"
                value={clienteQuery}
                onChange={(e) => {
                  setClienteQuery(e.target.value);
                  setShowClienteList(true);
                  if (!e.target.value.trim()) { setClienteId(""); }
                }}
                onFocus={() => setShowClienteList(true)}
                onBlur={() => setTimeout(() => setShowClienteList(false), 150)}
                className={inputClass}
              />
              <input type="hidden" name="cliente_id" value={clienteId} />
              {showClienteList && filteredClientes.length > 0 && (
                <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
                  {filteredClientes.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCliente(c.id)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                      >
                        <span className="font-mono">{c.rut}</span> — {c.razon_social}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {clientes.length === 0 && (
                <p className="text-xs text-amber-600">No hay clientes creados todavía — ve a Clientes y crea uno primero.</p>
              )}
              {clienteError && <p className="text-xs text-red-600">Selecciona un cliente de la lista.</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_numero_guia_factura">N° Guía / Factura</label>
              <input id="f_numero_guia_factura" name="numero_guia_factura" type="text" defaultValue={initial?.numero_guia_factura ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_origen">Origen</label>
              <input id="f_origen" name="origen" type="text" defaultValue={initial?.origen ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_destino">Destino <span className="text-xs font-normal text-neutral-400">(autocompletado)</span></label>
              <input id="f_destino" name="destino" type="text" value={destino} onChange={(e) => setDestino(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_comuna_destino">Comuna destino <span className="text-xs font-normal text-neutral-400">(autocompletado)</span></label>
              <input id="f_comuna_destino" name="comuna_destino" type="text" value={comunaDestino} onChange={(e) => setComunaDestino(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_region_destino">Región destino <span className="text-xs font-normal text-neutral-400">(autocompletado)</span></label>
              <input id="f_region_destino" name="region_destino" type="text" value={regionDestino} onChange={(e) => setRegionDestino(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_mt2">M2 de este viaje</label>
              <input id="f_mt2" name="mt2" type="number" step="any" defaultValue={initial?.mt2 ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_mt3">M3 de este viaje</label>
              <input id="f_mt3" name="mt3" type="number" step="any" defaultValue={initial?.mt3 ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_vendedor">Vendedor <span className="text-xs font-normal text-neutral-400">(autocompletado)</span></label>
              <input id="f_vendedor" name="vendedor" type="text" value={vendedor} onChange={(e) => setVendedor(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_monto_flete">
                Monto flete neto <span className="text-brand-600">*</span> <span className="text-xs font-normal text-neutral-400">(autocompletado)</span>
              </label>
              <input
                id="f_monto_flete"
                name="monto_flete"
                type="number"
                step="any"
                required
                value={montoFlete}
                onChange={(e) => setMontoFlete(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_peajes">Peajes</label>
              <input id="f_peajes" name="peajes" type="number" step="any" value={peajes} onChange={(e) => setPeajes(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_viaticos">Viáticos</label>
              <input id="f_viaticos" name="viaticos" type="number" step="any" value={viaticos} onChange={(e) => setViaticos(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_colacion">Colación</label>
              <input id="f_colacion" name="colacion" type="number" step="any" value={colacion} onChange={(e) => setColacion(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_otros">Otros gastos</label>
              <input id="f_otros" name="otros" type="number" step="any" value={otros} onChange={(e) => setOtros(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={labelClass} htmlFor="f_otros_descripcion">¿A qué corresponden los otros gastos?</label>
              <input id="f_otros_descripcion" name="otros_descripcion" type="text" placeholder="Ej. estacionamiento, lavado, multa…" defaultValue={initial?.otros_descripcion ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_combustible_litros">Combustible cargado (litros)</label>
              <input id="f_combustible_litros" name="combustible_litros" type="number" step="any" defaultValue={initial?.fuel?.litros ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_combustible_monto">Monto pagado por combustible</label>
              <input
                id="f_combustible_monto"
                name="combustible_monto"
                type="number"
                step="any"
                value={combustibleMonto}
                onChange={(e) => setCombustibleMonto(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-neutral-400">Se suma solo al registro de Combustible del camión.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_km_inicio">Km inicio</label>
              <input id="f_km_inicio" name="km_inicio" type="number" step="any" defaultValue={initial?.km_inicio ?? ""} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="f_km_fin">Km fin</label>
              <input id="f_km_fin" name="km_fin" type="number" step="any" defaultValue={initial?.km_fin ?? ""} className={inputClass} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-y-1 rounded-xl bg-brand-50/60 p-3 text-sm sm:grid-cols-4">
            <span className="text-neutral-500">Flete neto</span>
            <span className="text-right font-mono">{fmtMoney(montoFleteNum)}</span>
            <span className="text-neutral-500">IVA</span>
            <span className="text-right font-mono">{fmtMoney(montoFleteNum * 0.19)}</span>
            <span className="text-neutral-500">Total c/IVA</span>
            <span className="text-right font-mono">{fmtMoney(montoFleteNum * 1.19)}</span>
            <span className="text-neutral-500">Gastos del viaje</span>
            <span className="text-right font-mono">-{fmtMoney(gastosTotales)}</span>
            <span className="col-span-2 font-medium text-neutral-700 sm:col-span-1">Utilidad estimada</span>
            <span className={`text-right font-mono text-base font-semibold sm:col-span-1 ${utilidad >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {fmtMoney(utilidad)}
            </span>
          </div>

          {state.error && <p className="mt-4 text-sm text-red-600">{state.error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Link href={closeHref} className={btnSecondary}>
              Cancelar
            </Link>
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
