export const paths = {
    home: "/",
    materials: "/materials",
    materialNew: "/materials/nuevo",
    materialDetail: (id: string) => `/materials/${id}`,
    events: "/events",
    eventNew: "/events/nuevo",
    eventDetail: (id: string) => `/event/${id}`,
    movementNew: "/movimientos/nuevo",
    plantilla: "/plantilla",
} as const;
