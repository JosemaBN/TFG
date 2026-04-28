import { apiFetch } from "./apiClient";
export type CatalogNameRow = {
    id: string;
    name: string;
    createdAt: string;
};
export function getCatalogAreas(): Promise<CatalogNameRow[]> {
    return apiFetch<CatalogNameRow[]>("/catalog/areas");
}
export function getCatalogTipos(): Promise<CatalogNameRow[]> {
    return apiFetch<CatalogNameRow[]>("/catalog/tipos");
}
export function createCatalogArea(name: string): Promise<CatalogNameRow> {
    return apiFetch<CatalogNameRow>("/catalog/areas", {
        method: "POST",
        body: JSON.stringify({ name }),
    });
}
export function createCatalogTipo(name: string): Promise<CatalogNameRow> {
    return apiFetch<CatalogNameRow>("/catalog/tipos", {
        method: "POST",
        body: JSON.stringify({ name }),
    });
}
