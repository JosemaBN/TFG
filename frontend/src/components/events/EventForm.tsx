import { useState, type FormEvent } from "react";
import { dateInputToIso } from "../../utils/eventFormValues";
import DatePickerEsMonday from "../common/DatePickerEsMonday";
import TimeInput24h from "../common/TimeInput24h";
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
        if (!name.trim())
            return;
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
    return (<form onSubmit={handleSubmit} className="stack">
      <label>
        Nombre del evento *
        <input value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting}/>
      </label>
      <DatePickerEsMonday label="Fecha de inicio" value={startDate} onChange={setStartDate} disabled={submitting}/>
      <DatePickerEsMonday label="Fecha de finalización" value={endDate} onChange={setEndDate} disabled={submitting}/>
      <label>
        Población
        <input value={poblacion} onChange={(e) => setPoblacion(e.target.value)} disabled={submitting}/>
      </label>
      <label>
        Lugar
        <input value={lugar} onChange={(e) => setLugar(e.target.value)} disabled={submitting}/>
      </label>
      <TimeInput24h label="Hora montaje" value={horaMontaje} onChange={setHoraMontaje} disabled={submitting}/>
      <TimeInput24h label="Hora prueba" value={horaPrueba} onChange={setHoraPrueba} disabled={submitting}/>
      <TimeInput24h label="Hora comienzo" value={horaComienzo} onChange={setHoraComienzo} disabled={submitting}/>
      <TimeInput24h label="Hora fin" value={horaFin} onChange={setHoraFin} disabled={submitting}/>
      <TimeInput24h label="Hora desmontaje" value={horaDesmontaje} onChange={setHoraDesmontaje} disabled={submitting}/>
      <button type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : "Crear evento"}
      </button>
    </form>);
}
