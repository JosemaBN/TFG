import { useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import MovementForm from "../../components/movements/MovementForm";
import ErrorMessage from "../../components/common/ErrorMessage";
import { createMovement } from "../../services/movementsService";
import { ApiError } from "../../services/apiClient";

type MovementPayload = {
  eventId: string;
  productId: string;
  type: "SALIDA" | "ENTRADA";
  quantity: number;
  notes?: string;
};

export default function MovementFormPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okId, setOkId] = useState<string | null>(null);

  async function handleSubmit(data: MovementPayload) {
    setSubmitting(true);
    setError(null);
    setOkId(null);
    try {
      const created = await createMovement(data);
      setOkId(created.id);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "No se pudo registrar el movimiento");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <PageHeader
        title="Nuevo movimiento"
        description="Salida: material del almacén al evento. Entrada: devolución del evento al almacén."
      />
      {error && <ErrorMessage message={error} />}
      {okId && (
        <p className="success" role="status">
          Movimiento registrado (id: {okId}).
        </p>
      )}
      <MovementForm onSubmit={handleSubmit} submitting={submitting} />
    </section>
  );
}
