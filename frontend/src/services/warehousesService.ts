import { apiFetch } from "./apiClient";

export type Warehouse = {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export function getWarehouses(): Promise<Warehouse[]> {
  return apiFetch<Warehouse[]>("/warehouses");
}
