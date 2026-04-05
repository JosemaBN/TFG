import type { PlanillaRow } from "../../types/planilla";

/** Oculta tipos+materiales bajo áreas colapsadas, y materiales bajo tipos colapsados. */
export function filterVisiblePlanillaRows(
  rows: PlanillaRow[],
  collapsedAreas: Set<string>,
  collapsedTipos: Set<string>
): PlanillaRow[] {
  const out: PlanillaRow[] = [];
  let areaHidden = false;
  let tipoHidden = false;

  for (const row of rows) {
    if (row.rowKind === "areaSection") {
      areaHidden = row.rowUid != null && collapsedAreas.has(row.rowUid);
      tipoHidden = false;
      out.push(row);
      continue;
    }
    if (row.rowKind === "tipoSection") {
      if (areaHidden) continue;
      tipoHidden = row.rowUid != null && collapsedTipos.has(row.rowUid);
      out.push(row);
      continue;
    }
    if (row.rowKind === "material") {
      if (areaHidden || tipoHidden) continue;
      out.push(row);
      continue;
    }
    out.push(row);
  }
  return out;
}
