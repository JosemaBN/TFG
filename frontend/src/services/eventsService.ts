import type { Event } from "../types/event";
import { apiFetch } from "./apiClient";
export function getEvents(): Promise<Event[]> {
    return apiFetch<Event[]>("/events");
}
export function getEventById(id: string): Promise<Event> {
    return apiFetch<Event>(`/events/${id}`);
}
export function createEvent(body: {
    name: string;
    code?: string;
    poblacion?: string;
    lugar?: string;
    reference?: string;
    notes?: string;
    startDate?: string;
    endDate?: string;
    horaMontaje?: string;
    horaPrueba?: string;
    horaComienzo?: string;
    horaFin?: string;
    horaDesmontaje?: string;
}): Promise<Event> {
    return apiFetch<Event>("/events", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
export type EventUpdateBody = {
    name: string;
    code?: string | null;
    poblacion?: string | null;
    lugar?: string | null;
    reference?: string | null;
    notes?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    horaMontaje?: string | null;
    horaPrueba?: string | null;
    horaComienzo?: string | null;
    horaFin?: string | null;
    horaDesmontaje?: string | null;
};
export function updateEvent(id: string, body: EventUpdateBody): Promise<Event> {
    return apiFetch<Event>(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}
export function deleteEvent(id: string): Promise<void> {
    return apiFetch<void>(`/events/${id}`, { method: "DELETE" });
}
