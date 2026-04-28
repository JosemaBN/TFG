const useDevProxy = import.meta.env.DEV && !import.meta.env.VITE_API_URL;
export const API_BASE_URL = (useDevProxy ? "" : (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000")).replace(/\/$/, "");
const DEV_API_PREFIX = useDevProxy ? "/__api" : "";
export class ApiError extends Error {
    readonly status: number;
    readonly body?: unknown;
    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}
function buildUrl(path: string): string {
    if (path.startsWith("http"))
        return path;
    return `${API_BASE_URL}${DEV_API_PREFIX}${path}`;
}
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const url = buildUrl(path);
    const headers = new Headers(init?.headers);
    const hasBody = init?.body != null && String(init.body).length > 0;
    if (hasBody && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    let res: Response;
    try {
        res = await fetch(url, {
            ...init,
            headers,
            cache: init?.cache ?? "no-store",
        });
    }
    catch (e) {
        const hint = useDevProxy
            ? " ¿Está el backend en marcha? (en la raíz del proyecto: npm run dev, puerto 3000 por defecto)."
            : ` Comprueba VITE_API_URL y que el servidor API responda en ${API_BASE_URL}.`;
        const base = e instanceof Error && e.message === "Failed to fetch"
            ? `No hay conexión con la API (${url}).`
            : e instanceof Error
                ? e.message
                : "Error de red";
        throw new Error(`${base}${hint}`);
    }
    const text = await res.text();
    let data: unknown = null;
    if (text.trim()) {
        try {
            data = JSON.parse(text) as unknown;
        }
        catch {
            if (!res.ok) {
                throw new ApiError(text.slice(0, 200) || res.statusText, res.status, text);
            }
            throw new ApiError("La respuesta no es JSON válido", res.status, text);
        }
    }
    if (!res.ok) {
        const msg = typeof data === "object" && data !== null && "error" in data
            ? String((data as {
                error: unknown;
            }).error)
            : res.statusText;
        throw new ApiError(msg || "Error de API", res.status, data);
    }
    return data as T;
}
