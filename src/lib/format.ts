export function fmtMoney(value: number | string | null | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export function fmtNum(value: number | string | null | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("es-CL");
}

export function fmtPct(value: number | null | undefined) {
  const n = Number(value || 0);
  return `${(n * 100).toFixed(1)}%`;
}

export function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function monthOf(dateStr: string | null | undefined) {
  return dateStr ? dateStr.slice(0, 7) : "";
}

export function addDays(dateStr: string | null | undefined, days: number) {
  const base = dateStr ? new Date(dateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function daysUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const today = new Date(todayStr());
  const target = new Date(dateStr);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
