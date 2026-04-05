import type { ICellRendererParams } from "ag-grid-community";
import type { PlanillaRow } from "../../types/planilla";

export type PlanillaDescripcionContext = {
  collapsedAreaUids: Set<string>;
  collapsedTipoUids: Set<string>;
  toggleAreaCollapse: (rowUid: string) => void;
  toggleTipoCollapse: (rowUid: string) => void;
};

type Props = ICellRendererParams<PlanillaRow, string, PlanillaDescripcionContext>;

/** Render de la columna Material; botones ▼/▶ en filas área y tipo. */
export function PlantillaDescripcionCell(p: Props) {
  const v = p.value ?? "";
  const ctx = p.context;
  const kind = p.data?.rowKind;
  const uid = p.data?.rowUid;

  if (kind === "areaSection" && uid) {
    if (!ctx?.collapsedAreaUids || !ctx.toggleAreaCollapse) {
      return <span className="planilla-desc-text">{v}</span>;
    }
    const collapsed = ctx.collapsedAreaUids.has(uid);
    return (
      <span className="planilla-desc-with-toggle">
        <button
          type="button"
          className="planilla-section-toggle"
          onClick={() => ctx.toggleAreaCollapse(uid)}
          title={collapsed ? "Mostrar filas del área" : "Ocultar filas del área"}
        >
          {collapsed ? "▶" : "▼"}
        </button>
        <span className="planilla-desc-text">{v}</span>
      </span>
    );
  }

  if (kind === "tipoSection" && uid) {
    if (!ctx?.collapsedTipoUids || !ctx.toggleTipoCollapse) {
      return <span className="planilla-desc-text">{v}</span>;
    }
    const collapsed = ctx.collapsedTipoUids.has(uid);
    return (
      <span className="planilla-desc-with-toggle">
        <button
          type="button"
          className="planilla-section-toggle"
          onClick={() => ctx.toggleTipoCollapse(uid)}
          title={collapsed ? "Mostrar materiales del tipo" : "Ocultar materiales del tipo"}
        >
          {collapsed ? "▶" : "▼"}
        </button>
        <span className="planilla-desc-text">{v}</span>
      </span>
    );
  }

  return <span className="planilla-desc-text">{v}</span>;
}

export default PlantillaDescripcionCell;
