/** Productos (materiales): fetch nativo vía apiFetch. */
import type { Product } from "../types/product";
import { apiFetch } from "./apiClient";

export function getProducts(options?: {
  withStock?: boolean;
  /** Para planilla: _count.movements = nº SALIDAS (distingue “sin stock en BD” vs “almacén vacío por salidas”). */
  movementCounts?: boolean;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (options?.withStock) params.set("stock", "true");
  if (options?.movementCounts) params.set("movementCounts", "true");
  const q = params.toString();
  return apiFetch<Product[]>(q ? `/products?${q}` : "/products");
}

export function getProductById(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export function createProduct(body: {
  marca?: string;
  name: string;
  description?: string;
  area?: string;
  tipo?: string;
}): Promise<Product> {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ProductUpdateBody = {
  name: string;
  marca?: string | null;
  description?: string | null;
  area?: string | null;
  tipo?: string | null;
};

export function updateProduct(id: string, body: ProductUpdateBody): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/** Solo columna REP en plantilla. */
export function patchProductRepQty(id: string, quantity: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}/rep-qty`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

/** Columna INV: inventario total empresa. */
export function patchProductCompanyInventoryQty(id: string, quantity: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}/company-inventory-qty`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: "DELETE" });
}

/** Borra movimientos OUT/IN del material (todos los eventos, o uno con eventId). */
export function deleteProductMovements(
  productId: string,
  options?: { eventId?: string }
): Promise<{ deleted: number }> {
  const q = options?.eventId
    ? `?eventId=${encodeURIComponent(options.eventId)}`
    : "";
  return apiFetch<{ deleted: number }>(
    `/products/${encodeURIComponent(productId)}/movements${q}`,
    { method: "DELETE" }
  );
}

export function reorderProduct(id: string, direction: "up" | "down"): Promise<void> {
  return apiFetch<void>(`/products/${id}/reorder`, {
    method: "POST",
    body: JSON.stringify({ direction }),
  });
}
