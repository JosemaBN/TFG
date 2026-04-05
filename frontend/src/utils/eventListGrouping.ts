import type { Event } from "../types/event";

function sortEventsByStartDate(events: Event[]): Event[] {
  const key = (iso: string | null) => {
    if (!iso) return Number.POSITIVE_INFINITY;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  };
  return [...events].sort((a, b) => {
    const d = key(a.startDate) - key(b.startDate);
    if (d !== 0) return d;
    return a.name.localeCompare(b.name, "es");
  });
}

/** Fecha local a mediodía para evitar desfases con strings solo-fecha (YYYY-MM-DD). */
function parseEventLocalDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function capitalizeEs(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Lunes como primer día de la semana. */
function mondayOfWeek(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  const dow = c.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  c.setDate(c.getDate() + offset);
  return c;
}

function sundayAfterMonday(monday: Date): Date {
  const s = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 12, 0, 0, 0);
  return s;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  const [y, mo] = key.split("-").map(Number);
  const d = new Date(y, mo - 1, 1);
  const raw = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return capitalizeEs(raw);
}

function mondayKey(mon: Date): string {
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}

function parseMondayKey(key: string): Date {
  const [y, mo, day] = key.split("-").map(Number);
  return new Date(y, mo - 1, day, 12, 0, 0, 0);
}

export type EventWeekGroup = {
  weekKey: string;
  weekLabel: string;
  events: Event[];
};

export type EventMonthSection = {
  monthKey: string;
  monthLabel: string;
  weeks: EventWeekGroup[];
};

export function groupEventsByMonthAndWeek(events: Event[]): {
  sections: EventMonthSection[];
  undated: Event[];
} {
  const sorted = sortEventsByStartDate(events);
  const dated: Event[] = [];
  const undated: Event[] = [];
  for (const ev of sorted) {
    if (!ev.startDate || !String(ev.startDate).trim()) {
      undated.push(ev);
      continue;
    }
    const test = parseEventLocalDate(ev.startDate);
    if (Number.isNaN(test.getTime())) {
      undated.push(ev);
      continue;
    }
    dated.push(ev);
  }

  const byMonth = new Map<string, Event[]>();
  for (const ev of dated) {
    const d = parseEventLocalDate(ev.startDate!);
    const mk = monthKey(d);
    if (!byMonth.has(mk)) byMonth.set(mk, []);
    byMonth.get(mk)!.push(ev);
  }

  const monthKeys = [...byMonth.keys()].sort();

  const sections: EventMonthSection[] = monthKeys.map((mk) => {
    const monthEvents = byMonth.get(mk)!;
    const byWeek = new Map<string, Event[]>();
    for (const ev of monthEvents) {
      const d = parseEventLocalDate(ev.startDate!);
      const mon = mondayOfWeek(d);
      const wk = mondayKey(mon);
      if (!byWeek.has(wk)) byWeek.set(wk, []);
      byWeek.get(wk)!.push(ev);
    }
    const weekKeys = [...byWeek.keys()].sort();
    const weeks: EventWeekGroup[] = weekKeys.map((wk) => {
      const mon = parseMondayKey(wk);
      const sun = sundayAfterMonday(mon);
      const weekLabel = `Semana Lunes ${mon.getDate()} a domingo ${sun.getDate()}`;
      const list = sortEventsByStartDate(byWeek.get(wk)!);
      return { weekKey: wk, weekLabel, events: list };
    });
    return {
      monthKey: mk,
      monthLabel: monthLabelFromKey(mk),
      weeks,
    };
  });

  return { sections, undated: sortEventsByStartDate(undated) };
}
