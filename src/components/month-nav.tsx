import Link from "next/link";
import { fmtMonth, shiftMonth } from "@/lib/format";

export function MonthNav({
  mes,
  currentMonth,
  basePath,
  extraParams = {},
}: {
  mes: string;
  currentMonth: string;
  basePath: string;
  extraParams?: Record<string, string>;
}) {
  const prevMes = shiftMonth(mes, -1);
  const nextMes = shiftMonth(mes, 1);

  function hrefFor(targetMes: string) {
    const p = new URLSearchParams(extraParams);
    p.set("mes", targetMes);
    return `${basePath}?${p.toString()}`;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <Link
        href={hrefFor(prevMes)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100"
        title="Mes anterior"
      >
        ◀
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-neutral-900">{fmtMonth(mes)}</span>
        {mes !== currentMonth && (
          <Link href={hrefFor(currentMonth)} className="text-xs font-medium text-brand-600 underline hover:text-brand-700">
            Volver a hoy
          </Link>
        )}
      </div>
      <Link
        href={hrefFor(nextMes)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100"
        title="Mes siguiente"
      >
        ▶
      </Link>
    </div>
  );
}
