export type MovementType = "SALIDA" | "ENTRADA";
export type Movement = {
    id: string;
    eventId: string;
    productId: string;
    type: MovementType;
    quantity: number;
    notes: string | null;
    createdAt: string;
};
