/** Fecha desde el cliente: `YYYY-MM-DD` o ISO; vacío → null (actualización explícita). */
export function parseEventDateFromBody(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00.000Z`);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Crear evento: omite si no hay valor válido. */
export function parseOptionalEventDate(v: unknown): Date | undefined {
  if (v == null || v === "") return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00.000Z`);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function normalizeHora(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.slice(0, 8);
}
