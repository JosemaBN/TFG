/** Criterio de listado en Materiales: área → tipo → marca → modelo (nombre). */
export const PRODUCT_LIST_ORDER_BY = [
  { area: "asc" as const },
  { tipo: "asc" as const },
  { marca: "asc" as const },
  { name: "asc" as const },
];
