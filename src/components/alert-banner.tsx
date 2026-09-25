import { Badge } from "@/components/badge";

type AlertItem = {
  label: string;
  meta?: string;
  status: { level: "ok" | "warn" | "danger"; text: string };
};

export function AlertBanner({ title, items }: { title: string; items: AlertItem[] }) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => (a.status.level === "danger" ? 0 : 1) - (b.status.level === "danger" ? 0 : 1));
  const hasDanger = items.some((i) => i.status.level === "danger");

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${hasDanger ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
        🔔 {title} <span className="font-normal text-neutral-500">({items.length})</span>
      </p>
      <ul className="flex flex-col gap-1.5">
        {sorted.map((it, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {it.label}
              {it.meta ? ` — ${it.meta}` : ""}
            </span>
            <Badge level={it.status.level} text={it.status.text} />
          </li>
        ))}
      </ul>
    </div>
  );
}
