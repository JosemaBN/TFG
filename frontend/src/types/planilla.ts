export type PlanillaRowKind =
  | "param"
  | "columnLabels"
  | "areaSection"
  | "tipoSection"
  | "subarea"
  | "material";

export interface PlanillaRow {
  rowKind: PlanillaRowKind;
  rowUid?: string;
  descripcion: string;
  inv: number | string | null;
  nave: number | string | null;
  rep: number | string | null;
  outNet?: number | string | null;
  productId?: string;
  [key: string]: unknown;
}
