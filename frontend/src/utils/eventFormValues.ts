/** Convierte DateTime del API a valor para `<input type="date">` (zona local). */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Fecha `YYYY-MM-DD` → ISO al mediodía UTC (evita cambiar el día por husos). */
export function dateInputToIso(dateStr: string): string {
  const s = dateStr.trim();
  if (!s) return "";
  return new Date(`${s}T12:00:00.000Z`).toISOString();
}

/** Hora guardada (HH:mm o HH:mm:ss) → valor para `<input type="time">`. */
export function toTimeInputValue(s: string | null): string {
  if (!s) return "";
  const t = s.trim();
  if (/^\d{2}:\d{2}/.test(t)) return t.slice(0, 5);
  return "";
}
