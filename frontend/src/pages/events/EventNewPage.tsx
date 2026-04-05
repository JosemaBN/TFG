import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import ErrorMessage from "../../components/common/ErrorMessage";
import EventForm from "../../components/events/EventForm";
import { createEvent } from "../../services/eventsService";
import { ApiError } from "../../services/apiClient";
import { paths } from "../../routes/paths";

export default function EventNewPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section>
      <p>
        <Link to={paths.events}>← Volver a eventos</Link>
      </p>
      <PageHeader title="Añadir evento" description="Crea un proyecto u obra para asignar material." />
      {error ? <ErrorMessage message={error} /> : null}
      <EventForm
        submitting={submitting}
        onSubmit={async (data) => {
          setSubmitting(true);
          setError(null);
          try {
            const created = await createEvent(data);
            navigate(paths.eventDetail(created.id));
          } catch (e: unknown) {
            setError(e instanceof ApiError ? e.message : "No se pudo crear el evento");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </section>
  );
}
