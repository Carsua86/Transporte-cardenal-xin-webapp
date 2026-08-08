export function friendlyActionError(message: string) {
  if (message.toLowerCase().includes("row-level security")) {
    return "Estás usando el usuario demo (solo lectura) — no se pueden guardar cambios.";
  }
  return message;
}
