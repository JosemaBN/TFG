import { useState, type FormEvent } from "react";
import { dateInputToIso } from "../../utils/eventFormValues";

type EventFormProps = {
  onSubmit: (data: {
    name: string;
    startDate?: string;
    endDate?: string;
    poblacion?: string;
    lugar?: string;
    horaMontaje?: string;
    horaPrueba?: string;
    horaComienzo?: string;
    horaFin?: string;
    horaDesmontaje?: string;
  }) => void;
  submitting?: boolean;
};

export default function EventForm({ onSubmit, submitting }: EventFormProps) {
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      startDate: startDate.trim() ? dateInputToIso(startDate.trim()) : undefined,
      endDate: endDate.trim() ? dateInputToIso(endDate.trim()) : undefined,
      poblacion: poblacion.trim() || undefined,
      lugar: lugar.trim() || undefined,
      horaMontaje: horaMontaje.trim() || undefined,
      horaPrueba: horaPrueba.trim() || undefined,
      horaComienzo: horaComienzo.trim() || undefined,
      horaFin: horaFin.trim() || undefined,
      horaDesmontaje: horaDesmontaje.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <label>
        Nombre del evento *
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
        />
      </label>
      <label>
        Fecha de inicio
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        Fecha de finalización
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        Población
        <input value={poblacion} onChange={(e) => setPoblacion(e.target.value)} disabled={submitting} />
      </label>
      <label>
        Lugar
        <input value={lugar} onChange={(e) => setLugar(e.target.value)} disabled={submitting} />
      </label>
      <label>
        Hora montaje
        <input
          type="time"
          value={horaMontaje}
          onChange={(e) => setHoraMontaje(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        Hora prueba
        <input
          type="time"
          value={horaPrueba}
          onChange={(e) => setHoraPrueba(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        Hora comienzo
        <input
          type="time"
          value={horaComienzo}
          onChange={(e) => setHoraComienzo(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        Hora fin
        <input
          type="time"
          value={horaFin}
          onChange={(e) => setHoraFin(e.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        Hora desmontaje
        <input
          type="time"
          value={horaDesmontaje}
          onChange={(e) => setHoraDesmontaje(e.target.value)}
          disabled={submitting}
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : "Crear evento"}
      </button>
    </form>
  );
}
