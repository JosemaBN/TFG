import { useMemo, useState } from "react";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseHHMM(value: string): { hh: number; mm: number } | null {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return { hh, mm };
}

function normalizeTimeInput(value: string): string | null {
  const raw = value.trim();
  if (!raw) return "";

  // 1) Si ya es HH:MM
  const direct = parseHHMM(raw);
  if (direct) return `${pad2(direct.hh)}:${pad2(direct.mm)}`;

  // 2) Acepta separadores comunes: "10.30", "10,30", "10 30", "10-30"
  const cleaned = raw.replace(/[^\d]+/g, ":").replace(/:+/g, ":");
  const parts = cleaned.split(":").filter(Boolean);
  if (parts.length === 1) {
    // "9" -> 09:00, "930" -> 09:30, "1230" -> 12:30
    const digits = parts[0];
    if (!/^\d+$/.test(digits)) return null;
    if (digits.length <= 2) {
      const h = Number(digits);
      if (!Number.isInteger(h) || h < 0 || h > 23) return null;
      return `${pad2(h)}:00`;
    }
    if (digits.length === 3 || digits.length === 4) {
      const h = Number(digits.slice(0, digits.length - 2));
      const m = Number(digits.slice(-2));
      if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
      if (h < 0 || h > 23) return null;
      if (m < 0 || m > 59) return null;
      return `${pad2(h)}:${pad2(m)}`;
    }
    return null;
  }
  if (parts.length >= 2) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
    if (h < 0 || h > 23) return null;
    if (m < 0 || m > 59) return null;
    return `${pad2(h)}:${pad2(m)}`;
  }
  return null;
}

export type TimeInput24hProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minuteStep?: number;
};

export default function TimeInput24h({
  label,
  value,
  onChange,
  disabled,
  minuteStep = 5,
}: TimeInput24hProps) {
  const parsed = parseHHMM(value) ?? { hh: 0, mm: 0 };
  const [open, setOpen] = useState(false);
  const [hh, setHh] = useState(parsed.hh);
  const [mm, setMm] = useState(parsed.mm);

  const minuteOptions = useMemo(() => {
    const step = Math.max(1, Math.floor(minuteStep));
    const out: number[] = [];
    for (let m = 0; m <= 59; m += step) out.push(m);
    if (out[out.length - 1] !== 59) out.push(59);
    return out;
  }, [minuteStep]);

  return (
    <label>
      {label}
      <div className="time24">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const normalized = normalizeTimeInput(value);
            if (normalized == null) {
              // Evita bloquear el submit con validación nativa; si es inválido, lo dejamos vacío.
              onChange("");
              return;
            }
            if (normalized !== value) onChange(normalized);
          }}
          placeholder="HH:MM"
          inputMode="text"
          disabled={disabled}
          aria-label={label}
        />
        <button
          type="button"
          className="time24__btn"
          onClick={() => {
            const current = parseHHMM(value);
            setHh(current?.hh ?? 0);
            setMm(current?.mm ?? 0);
            setOpen(true);
          }}
          disabled={disabled}
          aria-label={`Elegir ${label}`}
          title="Elegir hora (24h)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2m0 2a8 8 0 1 1-.001 16.001A8 8 0 0 1 12 4m-1 1h2v7.2l4.2 2.52-1 1.72L11 13V5Z"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="time24__modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="time24__modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Seleccionar ${label}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="time24__modal-row">
              <select
                value={hh}
                onChange={(e) => setHh(clampInt(Number(e.target.value), 0, 23))}
                disabled={disabled}
                aria-label="Horas"
              >
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <option key={h} value={h}>
                    {pad2(h)}
                  </option>
                ))}
              </select>
              <span className="time24__sep">:</span>
              <select
                value={mm}
                onChange={(e) => setMm(clampInt(Number(e.target.value), 0, 59))}
                disabled={disabled}
                aria-label="Minutos"
              >
                {minuteOptions.map((m) => (
                  <option key={m} value={m}>
                    {pad2(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="time24__modal-actions">
              <button type="button" className="toolbar-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  onChange(`${pad2(hh)}:${pad2(mm)}`);
                  setOpen(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </label>
  );
}

