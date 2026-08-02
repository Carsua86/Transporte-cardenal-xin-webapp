"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ResolvedFieldDef, Row } from "@/lib/modules";
import { upsertRecord } from "@/lib/actions/records";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

export function RecordFormModal({
  moduleKey,
  title,
  closeHref,
  fields,
  initial,
  fileUrls,
}: {
  moduleKey: string;
  title: string;
  closeHref: string;
  fields: ResolvedFieldDef[];
  initial: Row | null;
  fileUrls?: Record<string, string | null>;
}) {
  const action = upsertRecord.bind(null, moduleKey, initial?.id ?? null);
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => action(formData),
    { error: null },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <Link href={closeHref} className="text-neutral-400 hover:text-neutral-700">
            ✕
          </Link>
        </div>
        <form action={formAction} className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2 flex flex-col gap-1" : "flex flex-col gap-1"}>
                <label htmlFor={`f_${field.key}`} className={labelClass}>
                  {field.label}
                  {field.required && <span className="text-brand-600"> *</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    id={`f_${field.key}`}
                    name={field.key}
                    required={field.required}
                    defaultValue={initial?.[field.key] ?? ""}
                    className={inputClass}
                  >
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={`f_${field.key}`}
                    name={field.key}
                    rows={2}
                    defaultValue={initial?.[field.key] ?? ""}
                    className={inputClass}
                  />
                ) : field.type === "file" ? (
                  <div className="flex flex-col gap-1.5">
                    {fileUrls?.[field.key] && (
                      <a
                        href={fileUrls[field.key]!}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-brand-600 underline"
                      >
                        Ver archivo actual
                      </a>
                    )}
                    <input
                      id={`f_${field.key}`}
                      name={field.key}
                      type="file"
                      accept={field.accept}
                      className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
                    />
                    {fileUrls?.[field.key] && (
                      <p className="text-xs text-neutral-400">Sube uno nuevo para reemplazarlo.</p>
                    )}
                  </div>
                ) : (
                  <input
                    id={`f_${field.key}`}
                    name={field.key}
                    type={field.type}
                    required={field.required}
                    step={field.type === "number" ? "any" : undefined}
                    defaultValue={initial?.[field.key] ?? ""}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
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
