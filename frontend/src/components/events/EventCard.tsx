import { Link } from "react-router-dom";
import type { Event } from "../../types/event";
import { paths } from "../../routes/paths";
import { deleteEvent } from "../../services/eventsService";
import { ApiError } from "../../services/apiClient";
import { useState } from "react";
type EventCardProps = {
    event: Event;
    onDeleted?: () => void;
};
function formatFullDateEs(iso: string | null): string | null {
    if (!iso)
        return null;
    try {
        const d = new Date(iso);
        const parts = new Intl.DateTimeFormat("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).formatToParts(d);
        const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value?.trim() ?? "";
        const weekday = get("weekday");
        const day = get("day");
        const month = get("month");
        const year = get("year");
        if (!weekday || !day || !month || !year)
            return null;
        const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        return `${weekdayCap} ${day} de ${month} ${year}`;
    }
    catch {
        return null;
    }
}
function isSameLocalDay(aIso: string, bIso: string): boolean {
    const a = new Date(aIso);
    const b = new Date(bIso);
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
function formatEventDateRange(startIso: string | null, endIso: string | null): string | null {
    const start = formatFullDateEs(startIso);
    if (!start)
        return null;
    if (!endIso || !startIso)
        return start;
    if (isSameLocalDay(startIso, endIso))
        return start;
    const end = formatFullDateEs(endIso);
    if (!end)
        return start;
    return `${start} — ${end}`;
}
export default function EventCard({ event, onDeleted }: EventCardProps) {
    const fecha = formatEventDateRange(event.startDate, event.endDate);
    const [deleting, setDeleting] = useState(false);
    async function handleDelete() {
        if (!window.confirm(`¿Eliminar el evento «${event.name}»? Se borrarán también sus movimientos asociados.`)) {
            return;
        }
        setDeleting(true);
        try {
            await deleteEvent(event.id);
            onDeleted?.();
        }
        catch (e: unknown) {
            window.alert(e instanceof ApiError ? e.message : "Error al eliminar el evento");
        }
        finally {
            setDeleting(false);
        }
    }
    return (<article className="card">
      <Link to={paths.eventDetail(event.id)} className="card__link">
        <h3>{event.name}</h3>
      </Link>
      {fecha ? <p className="muted">{fecha}</p> : null}
      {event.code ? <p className="muted">Código: {event.code}</p> : null}
      <div className="card-actions">
        <Link to={paths.eventDetail(event.id)} className="table-action-link">
          Editar
        </Link>
        <button type="button" className="table-action-danger" disabled={deleting} onClick={() => void handleDelete()}>
          {deleting ? "…" : "Eliminar"}
        </button>
      </div>
    </article>);
}
