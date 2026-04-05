/** Rutas de la SPA (evita strings mágicos en navegación y links). */
export const paths = {
  home: "/",
  /** Listado de materiales (productos). */
  materials: "/materials",
  materialNew: "/materials/nuevo",
  materialDetail: (id: string) => `/materials/${id}`,
  /** Listado de eventos. */
  events: "/events",
  eventNew: "/events/nuevo",
  /** Detalle de un evento (segmento `event` en singular, como pediste). */
  eventDetail: (id: string) => `/event/${id}`,
  movementNew: "/movimientos/nuevo",
  /** Vista tipo hoja de cálculo: material × eventos */
  plantilla: "/plantilla",
} as const;
