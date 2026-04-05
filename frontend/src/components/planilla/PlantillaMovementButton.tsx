import { memo, useState } from "react";
import type { GridApi, ICellRendererParams } from "ag-grid-community";
import type { PlanillaRow } from "../../types/planilla";
import { createMovement } from "../../services/movementsService";

export type PlantillaGridContext = {
  refreshGrid: () => Promise<void>;
  markOutHighlight?: (productId: string, eventId: string, api: GridApi) => void;
  markInHighlight?: (productId: string, eventId: string, api: GridApi) => void;
  /** Tras OUT exitoso: permite un solo IN hasta que se pulse IN. */
  markOutAllowsIn?: (productId: string, eventId: string, api: GridApi) => void;
  clearInGate?: (productId: string, eventId: string, api: GridApi) => void;
  canPressIn?: (productId: string, eventId: string) => boolean;
  /** Usado en cellClass (Ud); evita cerrar sobre refs que AG Grid puede invocar en contexto raro. */
  getUdMovement?: (productId: string, eventId: string) => "SALIDA" | "ENTRADA" | undefined;
};

type BtnProps = ICellRendererParams<PlanillaRow, unknown, PlantillaGridContext> & {
  eventId: string;
  movementType: "SALIDA" | "ENTRADA";
};

function readUdQty(data: PlanillaRow, eventId: string): number {
  const raw = data[`e_${eventId}_ud`];
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.floor(raw);
  const n = parseInt(String(raw ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

export const PlantillaMovementButton = memo(function PlantillaMovementButton(p: BtnProps) {
  const [busy, setBusy] = useState(false);
  const data = p.data;
  const ctx = p.context;
  if (data?.rowKind !== "material" || !data.productId || !p.eventId) {
    return null;
  }

  const qty = readUdQty(data, p.eventId);
  const ok = qty >= 1;
  const inAllowed = ctx?.canPressIn?.(data.productId!, p.eventId) ?? false;
  const label = p.movementType === "SALIDA" ? "OUT" : "IN";

  const inDisabled = p.movementType === "ENTRADA" && (!ok || !inAllowed);
  const outDisabled = p.movementType === "SALIDA" && !ok;

  const title =
    p.movementType === "SALIDA"
      ? !ok
        ? "Indica una Ud ≥ 1"
        : "Registrar salida del almacén"
      : !ok
        ? "Indica una Ud ≥ 1"
        : !inAllowed
          ? "Primero pulsa OUT; solo un IN por cada salida (evita duplicar entrada a almacén)"
          : "Registrar vuelta al almacén (una vez por OUT)";

  return (
    <button
      type="button"
      className="planilla-ctl-btn"
      disabled={busy || (p.movementType === "ENTRADA" ? inDisabled : outDisabled)}
      title={title}
      onClick={async () => {
        if (p.movementType === "ENTRADA") {
          if (!ok || !inAllowed) return;
        } else if (!ok) return;
        setBusy(true);
        try {
          await createMovement({
            eventId: p.eventId,
            productId: data.productId!,
            type: p.movementType,
            quantity: qty,
          });
          if (p.movementType === "SALIDA") {
            ctx?.markOutHighlight?.(data.productId!, p.eventId, p.api);
            ctx?.markOutAllowsIn?.(data.productId!, p.eventId, p.api);
          } else {
            ctx?.clearInGate?.(data.productId!, p.eventId, p.api);
            ctx?.markInHighlight?.(data.productId!, p.eventId, p.api);
          }
          await ctx?.refreshGrid?.();
          p.api.refreshCells({ force: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al registrar movimiento";
          window.alert(msg);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "…" : label}
    </button>
  );
});
