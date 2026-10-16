import { notFound } from "next/navigation";
import Link from "next/link";
import { MODULES, resolveFields, buildFileColumns, getRowFileUrls, truckLabel, driverName } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/crud/data-table";
import { RecordFormModal } from "@/components/crud/record-form-modal";
import { AlertBanner } from "@/components/alert-banner";
import { FuelTable } from "@/components/fuel/fuel-table";
import { MonthNav } from "@/components/month-nav";
import { documentStatus, licenseStatus } from "@/lib/reports";
import { normalizeRut } from "@/lib/rut";
import { btnPrimary, inputClass } from "@/lib/ui";
import { monthRange, todayStr } from "@/lib/format";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<{ form?: string; q?: string; mes?: string }>;
}) {
  const { modulo } = await params;
  const currentMonth = todayStr().slice(0, 7);
  const { form, q = "", mes: mesParam } = await searchParams;

  const mod = MODULES[modulo];
  if (!mod) notFound();

  const mes = mod.monthly && /^\d{4}-\d{2}$/.test(mesParam ?? "") ? mesParam! : currentMonth;

  const supabase = await createClient();
  let rowsQuery = supabase.from(mod.table).select("*").order(mod.orderBy.column, { ascending: mod.orderBy.ascending });
  if (mod.monthly) {
    const { desde, hasta } = monthRange(mes);
    rowsQuery = rowsQuery.gte("fecha", desde).lte("fecha", hasta);
  }
  const [ctx, { data: rows, error }] = await Promise.all([getModuleContext(), rowsQuery]);

  const allRowsData = rows ?? [];
  const basePath = `/${modulo}`;
  const monthQuery = mod.monthly ? `mes=${mes}&` : "";
  const listHref = mod.monthly ? `${basePath}?mes=${mes}` : basePath;
  const hasRutField = mod.fields.some((f) => f.key === "rut");

  const query = q.trim().toLowerCase();
  const normalizedQuery = normalizeRut(q);
  const rowsData =
    hasRutField && query
      ? allRowsData.filter((r) => {
          const label = String(r.razon_social ?? r.nombre ?? "").toLowerCase();
          const rut = String(r.rut ?? "");
          return label.includes(query) || (normalizedQuery !== "" && normalizeRut(rut).includes(normalizedQuery));
        })
      : allRowsData;
  const editing = form && form !== "new" ? allRowsData.find((r) => r.id === form) ?? null : null;
  const showModal = form === "new" || Boolean(editing);

  const [fileColumns, fileUrls] = await Promise.all([
    buildFileColumns(supabase, mod.fields, rowsData),
    getRowFileUrls(supabase, mod.fields, editing),
  ]);

  const rutCheck = hasRutField
    ? {
        key: "rut",
        existing: allRowsData
          .filter((r) => r.rut)
          .map((r) => ({ id: r.id, rut: String(r.rut), label: String(r.razon_social ?? r.nombre ?? r.rut) })),
      }
    : undefined;

  const alertItems =
    modulo === "documents"
      ? allRowsData
          .map((d) => ({
            label: d.tipo,
            meta: d.truck_id ? truckLabel(ctx, d.truck_id) : driverName(ctx, d.driver_id),
            status: documentStatus(d),
          }))
          .filter((x) => x.status.level !== "ok")
      : modulo === "drivers"
        ? allRowsData
            .map((d) => ({ label: d.nombre, meta: d.categoria_licencia ?? undefined, status: licenseStatus(d) }))
            .filter((x) => x.status.level !== "ok")
        : [];
  const alertTitle = modulo === "documents" ? "Documentos por vencer" : "Licencias por vencer";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{mod.title}</h1>
          <p className="text-sm text-neutral-500">{rowsData.length} registro(s)</p>
        </div>
        <Link href={`${basePath}?${monthQuery}form=new`} className={btnPrimary}>
          + {mod.addLabel}
        </Link>
      </div>

      {mod.monthly && <MonthNav mes={mes} currentMonth={currentMonth} basePath={basePath} />}

      {mod.summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mod.summary(rowsData).map((item) => (
            <div key={item.label} className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-medium text-neutral-500">{item.label}</p>
              <p className="mt-1 font-mono text-lg font-semibold text-neutral-900">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <AlertBanner title={alertTitle} items={alertItems} />

      {hasRutField && (
        <form method="get" className="relative max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por RUT o nombre…"
            className={`${inputClass} w-full pl-9`}
          />
        </form>
      )}

      {error && <p className="text-sm text-red-600">Error cargando datos: {error.message}</p>}

      {modulo === "fuel" ? (
        <FuelTable
          columns={[...mod.columns, ...fileColumns]}
          rows={rowsData}
          ctx={ctx}
          basePath={basePath}
          editQuery={monthQuery}
        />
      ) : (
        <DataTable
          moduleKey={modulo}
          singularLabel={mod.singularLabel}
          columns={[...mod.columns, ...fileColumns]}
          rows={rowsData}
          ctx={ctx}
          basePath={basePath}
          editQuery={monthQuery}
        />
      )}

      {showModal && (
        <RecordFormModal
          moduleKey={modulo}
          title={editing ? `Editar ${mod.singularLabel}` : mod.addLabel}
          closeHref={listHref}
          fields={resolveFields(mod.fields, ctx)}
          initial={editing}
          fileUrls={fileUrls}
          rutCheck={rutCheck}
        />
      )}
    </div>
  );
}
