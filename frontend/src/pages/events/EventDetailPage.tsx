import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import Spinner from "../../components/common/Spinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import { getEventById, updateEvent } from "../../services/eventsService";
import { ApiError } from "../../services/apiClient";
import type { Event } from "../../types/event";
import { paths } from "../../routes/paths";
import {
  dateInputToIso,
  toDateInputValue,
  toTimeInputValue,
} from "../../utils/eventFormValues";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [poblacion, setPoblacion] = useState("");
  const [lugar, setLugar] = useState("");
  const [horaMontaje, setHoraMontaje] = useState("");
  const [horaPrueba, setHoraPrueba] = useState("");
  const [horaComienzo, setHoraComienzo] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [horaDesmontaje, setHoraDesmontaje] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEventById(id)
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Evento no encontrado");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!event) return;
    setName(event.name);
    setStartDate(toDateInputValue(event.startDate));
    setEndDate(toDateInputValue(event.endDate));
    setPoblacion(event.poblacion ?? "");
    setLugar(event.lugar ?? "");
    setHoraMontaje(toTimeInputValue(event.horaMontaje));
    setHoraPrueba(toTimeInputValue(event.horaPrueba));
    setHoraComienzo(toTimeInputValue(event.horaComienzo));
    setHoraFin(toTimeInputValue(event.horaFin));
    setHoraDesmontaje(toTimeInputValue(event.horaDesmontaje));
  }, [event]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateEvent(id, {
        name: name.trim(),
        startDate: startDate ? dateInputToIso(startDate) : "",
        endDate: endDate ? dateInputToIso(endDate) : "",
        poblacion: poblacion.trim(),
        lugar: lugar.trim(),
        horaMontaje: horaMontaje.trim(),
        horaPrueba: horaPrueba.trim(),
        horaComienzo: horaComienzo.trim(),
        horaFin: horaFin.trim(),
        horaDesmontaje: horaDesmontaje.trim(),
      });
      setEvent(updated);
    } catch (err: unknown) {
      setSaveError(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return <ErrorMessage message="Falta el id del evento en la URL." />;
  }

  return (
    <section>
      <p>
        <Link to={paths.events}>← Volver a eventos</Link>
      </p>
      <PageHeader
        title={event?.name ?? "Detalle del evento"}
        description="Datos del evento: fechas, ubicación y horario del día."
      />
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && event && (
        <form onSubmit={handleSubmit} className="stack">
          <label>
            Nombre del evento *
            <input value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
          </label>
          <label>
            Fecha de inicio
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={saving}
            />
          </label>
          <label>
            Fecha de finalización
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={saving}
            />
          </label>
          <label>
            Población
            <input value={poblacion} onChange={(e) => setPoblacion(e.target.value)} disabled={saving} />
          </label>
          <label>
            Lugar
            <input value={lugar} onChange={(e) => setLugar(e.target.value)} disabled={saving} />
          </label>
          <label>
            Hora montaje
            <input
              type="time"
              value={horaMontaje}
              onChange={(e) => setHoraMontaje(e.target.value)}
              disabled={saving}
            />
          </label>
          <label>
            Hora prueba
            <input
              type="time"
              value={horaPrueba}
              onChange={(e) => setHoraPrueba(e.target.value)}
              disabled={saving}
            />
          </label>
          <label>
            Hora comienzo
            <input
              type="time"
              value={horaComienzo}
              onChange={(e) => setHoraComienzo(e.target.value)}
              disabled={saving}
            />
          </label>
          <label>
            Hora fin
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              disabled={saving}
            />
          </label>
          <label>
            Hora desmontaje
            <input
              type="time"
              value={horaDesmontaje}
              onChange={(e) => setHoraDesmontaje(e.target.value)}
              disabled={saving}
            />
          </label>
          {saveError ? <ErrorMessage message={saveError} /> : null}
          <button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <p className="muted">Actualizado: {new Date(event.updatedAt).toLocaleString()}</p>
        </form>
      )}
    </section>
  );
}
