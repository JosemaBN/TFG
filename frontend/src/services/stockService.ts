/** Stock: fetch nativo vía apiFetch. */
import { apiFetch } from "./apiClient";

export type ProductStockRow = {
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt: string;
  product: { id: string; sku: number; name: string };
  warehouse: { id: string; name: string };
};

export function getStock(): Promise<ProductStockRow[]> {
  return apiFetch<ProductStockRow[]>("/stock");
}

export function upsertStock(body: {
  productId: string;
  warehouseId: string;
  quantity: number;
}): Promise<ProductStockRow> {
  return apiFetch<ProductStockRow>("/stock", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
