import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/crud/data-table";
import { RecordFormModal } from "@/components/crud/record-form-modal";
import { resolveFields } from "@/lib/modules";
import { fmtMoney } from "@/lib/format";
import { btnPrimary } from "@/lib/ui";
import type { Driver } from "@/lib/supabase/types";

export default async function AjustesIpcPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string }>;
}) {
  const { form } = await searchParams;
  const mod = MODULES.ajustes_ipc;

  const supabase = await createClient();
  const [ctx, { data: ajustes, error }, { data: drivers }] = await Promise.all([
    getModuleContext(),
    supabase.from("ajustes_ipc").select("*").order("anio", { ascending: false }),
    supabase.from("drivers").select("*").eq("estado", "Activo").order("nombre") as unknown as Promise<{ data: Driver[] | null }>,
  ]);

  const rows = ajustes ?? [];
  const basePath = "/ajustes_ipc";
  const editing = form && form !== "new" ? rows.find((r) => r.id === form) ?? null : null;
  const showModal = form === "new" || Boolean(editing);
  const ultimo = rows[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">📈 {mod.title}</h1>
          <p className="text-sm text-neutral-500">Registra cada año el % de IPC (INE) para el reajuste de sueldos y revisa la vista previa antes de aplicarlo.</p>
        </div>
        <Link href={`${basePath}?form=new`} className={btnPrimary}>
          + {mod.addLabel}
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">Error cargando datos: {error.message}</p>}

      <DataTable moduleKey="ajustes_ipc" singularLabel={mod.singularLabel} columns={mod.columns} rows={rows} ctx={ctx} basePath={basePath} />

      {ultimo && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              👀 Vista previa — reajuste {ultimo.anio} ({ultimo.porcentaje}%)
            </h2>
            <p className="text-sm text-neutral-500">
              Así quedaría el sueldo base de cada conductor si aplicas este reajuste. Los sueldos no se cambian solos — edítalos en Conductores cuando decidas aplicarlo.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-brand-50/60">
                <tr>
                  {["Conductor", "Sueldo actual", "Sueldo con reajuste", "Diferencia"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-neutral-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(drivers ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Sin conductores activos.</td></tr>
                ) : (drivers ?? []).map((d) => {
                  const actual = Number(d.sueldo_base || 0);
                  const nuevo = actual * (1 + Number(ultimo.porcentaje) / 100);
                  return (
                    <tr key={d.id}>
                      <td className="px-4 py-2.5 font-semibold">{d.nombre}</td>
                      <td className="px-4 py-2.5 font-mono">{fmtMoney(actual)}</td>
                      <td className="px-4 py-2.5 font-mono text-brand-700">{fmtMoney(nuevo)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-700">+{fmtMoney(nuevo - actual)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showModal && (
        <RecordFormModal
          moduleKey="ajustes_ipc"
          title={editing ? "Editar reajuste" : mod.addLabel}
          closeHref={basePath}
          fields={resolveFields(mod.fields, ctx)}
          initial={editing}
        />
      )}
    </div>
  );
}
