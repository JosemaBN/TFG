import { useCallback, useEffect, useState } from "react";
import { getEvents } from "../services/eventsService";
import { ApiError } from "../services/apiClient";
import type { Event } from "../types/event";

/**
 * Carga GET /events con fetch (internamente en apiFetch), con loading y error.
 * Patrón: useEffect → getEvents() → setState.
 */
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setError(null);
    return getEvents()
      .then((data) => {
        setEvents(data);
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : "Error al cargar eventos");
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Error al cargar eventos");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error, refetch };
}
