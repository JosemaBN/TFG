/** Línea de stock en almacén (viene en GET /products/:id con include stock). */
export type ProductStockLine = {
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt: string;
};

/** Alineado con el modelo Product del backend (Prisma). */
export type Product = {
  id: string;
  sku: number;
  marca: string | null;
  /** Modelo del material (en API sigue siendo `name`). */
  name: string;
  description: string | null;
  area: string | null;
  tipo: string | null;
  /** Orden manual en listado (área → tipo → sortOrder → modelo). */
  sortOrder?: number;
  /** Columna REP en plantilla. */
  repQty?: number;
  /** Columna INV: inventario total de la empresa para este material. */
  companyInventoryQty?: number;
  createdAt: string;
  updatedAt: string;
  stock?: ProductStockLine[];
  movements?: unknown[];
  /** En listados, suma de unidades en almacén (GET /stock). */
  inventoryQuantity?: number;
  /** Opcional: GET /products?movementCounts=true — movements = nº de SALIDAS. */
  _count?: { movements: number };
};
