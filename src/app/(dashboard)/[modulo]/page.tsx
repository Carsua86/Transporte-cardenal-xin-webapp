import { notFound } from "next/navigation";
import Link from "next/link";
import { MODULES, resolveFields, buildFileColumns, getRowFileUrls } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/crud/data-table";
import { RecordFormModal } from "@/components/crud/record-form-modal";
import { normalizeRut } from "@/lib/rut";
import { btnPrimary, inputClass } from "@/lib/ui";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<{ form?: string; q?: string }>;
}) {
  const { modulo } = await params;
  const { form, q = "" } = await searchParams;

  const mod = MODULES[modulo];
  if (!mod) notFound();

  const supabase = await createClient();
  const [ctx, { data: rows, error }] = await Promise.all([
    getModuleContext(),
    supabase.from(mod.table).select("*").order(mod.orderBy.column, { ascending: mod.orderBy.ascending }),
  ]);

  const allRowsData = rows ?? [];
  const basePath = `/${modulo}`;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{mod.title}</h1>
          <p className="text-sm text-neutral-500">{rowsData.length} registro(s)</p>
        </div>
        <Link href={`${basePath}?form=new`} className={btnPrimary}>
          + {mod.addLabel}
        </Link>
      </div>

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

      <DataTable
        moduleKey={modulo}
        singularLabel={mod.singularLabel}
        columns={[...mod.columns, ...fileColumns]}
        rows={rowsData}
        ctx={ctx}
        basePath={basePath}
      />

      {showModal && (
        <RecordFormModal
          moduleKey={modulo}
          title={editing ? `Editar ${mod.singularLabel}` : mod.addLabel}
          closeHref={basePath}
          fields={resolveFields(mod.fields, ctx)}
          initial={editing}
          fileUrls={fileUrls}
          rutCheck={rutCheck}
        />
      )}
    </div>
  );
}
