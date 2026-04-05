import { Link } from "react-router-dom";
import type { Event } from "../../types/event";
import { paths } from "../../routes/paths";

type EventCardProps = {
  event: Event;
};

function formatEventDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function EventCard({ event }: EventCardProps) {
  const fecha = formatEventDate(event.startDate);
  return (
    <article className="card">
      <Link to={paths.eventDetail(event.id)} className="card__link">
        <h3>{event.name}</h3>
      </Link>
      {fecha ? <p className="muted">{fecha}</p> : null}
      {event.code ? <p className="muted">Código: {event.code}</p> : null}
    </article>
  );
}
