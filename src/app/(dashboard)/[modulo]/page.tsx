import { notFound } from "next/navigation";
import Link from "next/link";
import { MODULES, resolveFields, buildFileColumns, getRowFileUrls } from "@/lib/modules";
import { getModuleContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/crud/data-table";
import { RecordFormModal } from "@/components/crud/record-form-modal";
import { btnPrimary } from "@/lib/ui";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<{ form?: string }>;
}) {
  const { modulo } = await params;
  const { form } = await searchParams;

  const mod = MODULES[modulo];
  if (!mod) notFound();

  const supabase = await createClient();
  const [ctx, { data: rows, error }] = await Promise.all([
    getModuleContext(),
    supabase.from(mod.table).select("*").order(mod.orderBy.column, { ascending: mod.orderBy.ascending }),
  ]);

  const rowsData = rows ?? [];
  const basePath = `/${modulo}`;
  const editing = form && form !== "new" ? rowsData.find((r) => r.id === form) ?? null : null;
  const showModal = form === "new" || Boolean(editing);

  const [fileColumns, fileUrls] = await Promise.all([
    buildFileColumns(supabase, mod.fields, rowsData),
    getRowFileUrls(supabase, mod.fields, editing),
  ]);

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
        />
      )}
    </div>
  );
}
