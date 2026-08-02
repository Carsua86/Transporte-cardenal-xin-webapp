const LEVEL_CLASSES: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  warn: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  danger: "bg-red-100 text-red-800 ring-1 ring-red-200",
};

const LEVEL_DOTS: Record<string, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-red-500",
};

export function Badge({ level, text }: { level: "ok" | "warn" | "danger"; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_CLASSES[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOTS[level]}`} />
      {text}
    </span>
  );
}
