import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtMoney, todayStr } from "@/lib/format";
import { aggregateNomina, BONUS_AMOUNT, BONUS_TRIPS_THRESHOLD } from "@/lib/reports";
import { getSignedUrl } from "@/lib/storage";
import { Badge } from "@/components/badge";

export default async function NominaPage() {
  const supabase = await createClient();
  const month = todayStr().slice(0, 7);

  const [{ data: drivers }, { data: trips }, { data: prestamos }] = await Promise.all([
    supabase.from("drivers").select("*").order("nombre"),
    supabase.from("trips").select("*"),
    supabase.from("prestamos").select("*"),
  ]);

  const rows = aggregateNomina(drivers ?? [], trips ?? [], prestamos ?? [], month);

  const photoUrls = new Map<string, { foto: string | null; carnet: string | null }>();
  await Promise.all(
    rows.map(async (r) => {
      const [foto, carnet] = await Promise.all([
        getSignedUrl(supabase, r.driver.foto_path),
        getSignedUrl(supabase, r.driver.carnet_foto_path),
      ]);
      photoUrls.set(r.driver.id, { foto, carnet });
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">🧮 Nómina — {month}</h1>
          <p className="text-sm text-neutral-500">
            Sueldo base + bono de {fmtMoney(BONUS_AMOUNT)} al cumplir {BONUS_TRIPS_THRESHOLD} viajes en el mes, menos préstamos del mes.
          </p>
        </div>
        <Link href="/prestamos?form=new" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
          + Registrar préstamo
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-400 shadow-sm">
          Agrega conductores para ver la nómina.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const urls = photoUrls.get(r.driver.id);
            return (
              <div key={r.driver.id} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {urls?.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls.foto} alt={r.driver.nombre} className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-100" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-xl">🧑‍✈️</span>
                  )}
                  <div>
                    <p className="font-semibold text-neutral-900">{r.driver.nombre}</p>
                    <p className="text-xs text-neutral-500">{r.driver.rut || "—"}</p>
                    {urls?.carnet && (
                      <a href={urls.carnet} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">
                        Ver carnet
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-neutral-500">Sueldo base</span>
                  <span className="text-right font-mono">{fmtMoney(r.sueldoBase)}</span>
                  <span className="text-neutral-500">Viajes del mes</span>
                  <span className="text-right">{r.viajesMes}</span>
                  <span className="text-neutral-500">Bono ({BONUS_TRIPS_THRESHOLD}+ viajes)</span>
                  <span className="text-right">
                    {r.bonoGanado ? <Badge level="ok" text={fmtMoney(r.bono)} /> : <Badge level="warn" text="No cumplido" />}
                  </span>
                  <span className="text-neutral-500">Préstamos del mes</span>
                  <span className="text-right font-mono text-red-700">
                    {r.totalPrestamos > 0 ? `-${fmtMoney(r.totalPrestamos)}` : fmtMoney(0)}
                  </span>
                </div>

                {r.prestamosMes.length > 0 && (
                  <ul className="rounded-xl bg-neutral-50 p-2 text-xs text-neutral-600">
                    {r.prestamosMes.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>{fmtDate(p.fecha)} {p.descripcion ? `· ${p.descripcion}` : ""}</span>
                        <span className="font-mono">{fmtMoney(p.monto)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-between rounded-xl bg-brand-50/60 px-3 py-2">
                  <span className="text-sm font-medium text-neutral-700">Total a pagar</span>
                  <span className="font-mono text-lg font-semibold text-brand-700">{fmtMoney(r.totalPagar)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
