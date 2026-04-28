const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
async function request(path, options = {}) {
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    const hasBody = options.body != null && String(options.body).length > 0;
    const headers = new Headers(options.headers);
    if (hasBody && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data = null;
    if (text.trim()) {
        try {
            data = JSON.parse(text);
        }
        catch {
            if (!res.ok) {
                throw new Error(text.slice(0, 200) || res.statusText);
            }
            throw new Error("La respuesta no es JSON válido");
        }
    }
    if (!res.ok) {
        const msg = typeof data === "object" && data !== null && "error" in data
            ? String(data.error)
            : res.statusText;
        throw new Error(msg || `Error ${res.status}`);
    }
    return data;
}
export function getEvents() {
    return request("/events");
}
export function createEvent(body) {
    return request("/events", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
export function updateEvent(id, body) {
    return request(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}
export function getMaterials() {
    return request("/products");
}
export function createMaterial(body) {
    return request("/products", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
export function updateMaterial(id, body) {
    return request(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}
export { BASE_URL as API_BASE_URL };
