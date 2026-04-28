import { Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import EmptyState from "../../components/common/EmptyState";
import EventCard from "../../components/events/EventCard";
import { useEvents } from "../../hooks/useEvents";
import { paths } from "../../routes/paths";
import { groupEventsByMonthAndWeek } from "../../utils/eventListGrouping";

export default function EventListPage() {
  const { events, loading, error, refetch } = useEvents();
  const { sections, undated } = groupEventsByMonthAndWeek(events);

  return (
    <section>
      <div className="page-toolbar">
        {!loading && !error ? (
          <Link to={paths.eventNew} className="action-button">
            Añadir evento
          </Link>
        ) : null}
      </div>
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && events.length === 0 && (
        <EmptyState title="No hay eventos" hint="Usa «Añadir evento» para crear el primero." />
      )}
      {!loading && !error && (sections.length > 0 || undated.length > 0) && (
        <div className="events-list events-list--grouped">
          {sections.map((section) => (
            <div key={section.monthKey} className="events-month-block">
              <article className="card event-month-heading" aria-label={`Mes ${section.monthLabel}`}>
                <h2 className="event-month-heading__title">{section.monthLabel}</h2>
              </article>
              {section.weeks.map((week) => (
                <div key={week.weekKey} className="events-week-block">
                  <p className="events-week-label">{week.weekLabel}</p>
                  <div className="events-week-cards">
                    {week.events.map((ev) => (
                      <EventCard key={ev.id} event={ev} onDeleted={refetch} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {undated.length > 0 ? (
            <div className="events-month-block">
              <article className="card event-month-heading event-month-heading--muted">
                <h2 className="event-month-heading__title">Sin fecha de inicio</h2>
              </article>
              <div className="events-week-cards events-week-cards--flat">
                {undated.map((ev) => (
                  <EventCard key={ev.id} event={ev} onDeleted={refetch} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
