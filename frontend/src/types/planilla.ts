/** Tipos de fila de la plantilla (parámetros, cabeceras de columnas, área, tipo, material). */
export type PlanillaRowKind =
  | "param"
  | "columnLabels"
  | "areaSection"
  | "tipoSection"
  | "subarea"
  | "material";

export interface PlanillaRow {
  rowKind: PlanillaRowKind;
  /** Id estable para getRowId en filas que no son material (área/tipo/cabecera). */
  rowUid?: string;
  /** Columna Material: parámetro, cabecera, área, tipo o «marca modelo». */
  descripcion: string;
  inv: number | string | null;
  nave: number | string | null;
  rep: number | string | null;
  /**
   * Solo material: OUT = max(0, Σ SALIDA − Σ ENTRADA). Botones OUT/IN de la plantilla.
   * NAVE = INV − OUT − REP.
   */
  outNet?: number | string | null;
  productId?: string;
  /** Campos dinámicos e_<eventId>_ud (texto en filas parámetro; número planificado en materiales) */
  [key: string]: unknown;
}
