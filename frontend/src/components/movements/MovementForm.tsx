import { useState, type FormEvent } from "react";
type MovementFormProps = {
    onSubmit: (data: {
        eventId: string;
        productId: string;
        type: "SALIDA" | "ENTRADA";
        quantity: number;
        notes?: string;
    }) => void;
    submitting?: boolean;
};
export default function MovementForm({ onSubmit, submitting }: MovementFormProps) {
    const [eventId, setEventId] = useState("");
    const [productId, setProductId] = useState("");
    const [type, setType] = useState<"SALIDA" | "ENTRADA">("SALIDA");
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!eventId.trim() || !productId.trim())
            return;
        onSubmit({
            eventId: eventId.trim(),
            productId: productId.trim(),
            type,
            quantity: Math.floor(quantity),
            notes: notes.trim() || undefined,
        });
    }
    return (<form onSubmit={handleSubmit} className="stack">
      <label>
        ID del evento *
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} required disabled={submitting}/>
      </label>
      <label>
        ID del producto *
        <input value={productId} onChange={(e) => setProductId(e.target.value)} required disabled={submitting}/>
      </label>
      <label>
        Tipo
        <select value={type} onChange={(e) => setType(e.target.value as "SALIDA" | "ENTRADA")} disabled={submitting}>
          <option value="SALIDA">Salida (almacén → evento)</option>
          <option value="ENTRADA">Entrada (evento → almacén)</option>
        </select>
      </label>
      <label>
        Cantidad *
        <input type="number" min={1} step={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required disabled={submitting}/>
      </label>
      <label>
        Notas
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={submitting}/>
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Registrando…" : "Registrar movimiento"}
      </button>
    </form>);
}
