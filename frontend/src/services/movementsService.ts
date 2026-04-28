import type { Movement } from "../types/movement";
import { apiFetch } from "./apiClient";
export function getMovementNetByProduct(): Promise<Record<string, number>> {
    return apiFetch<Record<string, number>>("/movements/product-net-out");
}
export function getMovements(params?: {
    eventId?: string;
    productId?: string;
    type?: "SALIDA" | "ENTRADA";
}): Promise<Movement[]> {
    const search = new URLSearchParams();
    if (params?.eventId)
        search.set("eventId", params.eventId);
    if (params?.productId)
        search.set("productId", params.productId);
    if (params?.type)
        search.set("type", params.type);
    const q = search.toString();
    return apiFetch<Movement[]>(`/movements${q ? `?${q}` : ""}`);
}
export function createMovement(body: {
    eventId: string;
    productId: string;
    type: "SALIDA" | "ENTRADA";
    quantity: number;
    notes?: string;
}): Promise<Movement> {
    return apiFetch<Movement>("/movements", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
