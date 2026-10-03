export function friendlyActionError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security")) {
    return "Estás usando el usuario demo (solo lectura) — no se pueden guardar cambios.";
  }
  if (lower.includes("duplicate key value") && lower.includes("rut")) {
    return "Ya existe un registro con ese mismo RUT.";
  }
  return message;
}
