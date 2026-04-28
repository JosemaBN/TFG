import { useMemo, useState } from "react";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${pad2(m)}-${pad2(day)}`;
}

function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return null;
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  // Evita overflow (p.ej. 2026-02-31)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/**
 * Índice de día con semana empezando en lunes:
 * - Lunes => 0 ... Domingo => 6
 */
function weekdayMon0(d: Date): number {
  const js = d.getDay(); // 0=domingo..6=sábado
  return (js + 6) % 7;
}

export type DatePickerEsMondayProps = {
  label: string;
  value: string; // ISO yyyy-mm-dd o ""
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function DatePickerEsMonday({ label, value, onChange, disabled }: DatePickerEsMondayProps) {
  const selected = parseISODate(value);
  const initialMonth = selected ? startOfMonth(selected) : startOfMonth(new Date());
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(initialMonth);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(month);
  }, [month]);

  const weeks = useMemo(() => {
    const first = startOfMonth(month);
    const startOffset = weekdayMon0(first);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startOffset);

    const out: Array<
      Array<{
        date: Date;
        inMonth: boolean;
        iso: string;
      }>
    > = [];
    for (let w = 0; w < 6; w++) {
      const row: Array<{ date: Date; inMonth: boolean; iso: string }> = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + w * 7 + i);
        row.push({
          date: d,
          inMonth: d.getMonth() === month.getMonth(),
          iso: isoFromDate(d),
        });
      }
      out.push(row);
    }
    return out;
  }, [month]);

  const selectedIso = selected ? isoFromDate(selected) : "";

  return (
    <label>
      {label}
      <div className="date-es">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="AAAA-MM-DD"
          inputMode="text"
          disabled={disabled}
          aria-label={label}
          onBlur={() => {
            const raw = value.trim();
            if (!raw) return;
            const parsed = parseISODate(raw);
            if (!parsed) onChange("");
            else {
              const normalized = isoFromDate(parsed);
              if (normalized !== value) onChange(normalized);
            }
          }}
        />
        <button
          type="button"
          className="date-es__btn"
          onClick={() => {
            const base = parseISODate(value) ?? new Date();
            setMonth(startOfMonth(base));
            setOpen(true);
          }}
          disabled={disabled}
          aria-label={`Elegir ${label}`}
          title="Elegir fecha"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm15 8H2v11h20V10ZM2 8h20V6H2v2Z"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="date-es__modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="date-es__modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Seleccionar ${label}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="date-es__header">
              <button
                type="button"
                className="toolbar-button"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Mes anterior"
              >
                ←
              </button>
              <div className="date-es__title">{monthLabel}</div>
              <button
                type="button"
                className="toolbar-button"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Mes siguiente"
              >
                →
              </button>
            </div>

            <div className="date-es__grid">
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="date-es__dow">
                  {d}
                </div>
              ))}
              {weeks.flat().map((cell) => {
                const isSelected = selectedIso && cell.iso === selectedIso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    className={[
                      "date-es__day",
                      cell.inMonth ? "" : "date-es__day--out",
                      isSelected ? "date-es__day--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      onChange(cell.iso);
                      setOpen(false);
                    }}
                  >
                    {cell.date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="date-es__actions">
              <button type="button" className="toolbar-button" onClick={() => setOpen(false)}>
                Cerrar
              </button>
              <button
                type="button"
                className="toolbar-button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Quitar fecha
              </button>
              <button
                type="button"
                className="action-button"
                onClick={() => {
                  const today = new Date();
                  onChange(isoFromDate(today));
                  setOpen(false);
                }}
              >
                Hoy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </label>
  );
}

