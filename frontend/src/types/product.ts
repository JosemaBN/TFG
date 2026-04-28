export type ProductStockLine = {
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt: string;
};

export type Product = {
  id: string;
  sku: number;
  marca: string | null;
  name: string;
  description: string | null;
  area: string | null;
  tipo: string | null;
  sortOrder?: number;
  repQty?: number;
  companyInventoryQty?: number;
  createdAt: string;
  updatedAt: string;
  stock?: ProductStockLine[];
  movements?: unknown[];
  inventoryQuantity?: number;
  _count?: { movements: number };
};
