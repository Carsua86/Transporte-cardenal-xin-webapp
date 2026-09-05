export function normalizeRut(value: string): string {
  return value.replace(/[.\-\s]/g, "").toUpperCase();
}
