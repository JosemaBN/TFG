/** Criterio de listado en Materiales: área → tipo → orden manual → nombre. */
export const PRODUCT_LIST_ORDER_BY = [
  { area: "asc" as const },
  { tipo: "asc" as const },
  { sortOrder: "asc" as const },
  { name: "asc" as const },
];
