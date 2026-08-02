"use client";

import { useTransition } from "react";
import { deleteRecord } from "@/lib/actions/records";

export function DeleteButton({ moduleKey, id, label }: { moduleKey: string; id: string; label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title="Eliminar"
      disabled={pending}
      className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
      onClick={() => {
        if (!confirm(`¿Eliminar este ${label}? Esta acción no se puede deshacer.`)) return;
        startTransition(async () => {
          const res = await deleteRecord(moduleKey, id);
          if (res.error) alert(`No se pudo eliminar: ${res.error}`);
        });
      }}
    >
      🗑
    </button>
  );
}
