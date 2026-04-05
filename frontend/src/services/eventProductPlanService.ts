import type { EventProductPlan } from "../types/eventProductPlan";
import { apiFetch } from "./apiClient";

export function getEventProductPlans(): Promise<EventProductPlan[]> {
  return apiFetch<EventProductPlan[]>("/event-product-plans");
}

export function upsertEventProductPlan(body: {
  eventId: string;
  productId: string;
  plannedQty: number;
}): Promise<EventProductPlan> {
  return apiFetch<EventProductPlan>("/event-product-plans", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
