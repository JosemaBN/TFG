import type { PrismaClient } from "../generated/prisma";

type MovementType = "SALIDA" | "ENTRADA";

export class InsufficientStockError extends Error {
  constructor(
    public productId: string,
    public requested: number,
    public available: number
  ) {
    super(
      `Stock insuficiente: se solicitaron ${requested} unidades pero solo hay ${available} en almacén.`
    );
    this.name = "InsufficientStockError";
  }
}

/**
 * Actualiza el stock del único almacén según un movimiento (SALIDA o ENTRADA).
 * - SALIDA: resta quantity del stock (exige stock suficiente).
 * - ENTRADA: suma quantity al stock.
 * Crea la fila de ProductStock si no existe (p. ej. primera entrada).
 */
export async function applyMovementToStock(
  tx: PrismaClient,
  productId: string,
  type: MovementType,
  quantity: number
): Promise<void> {
  const warehouse = await tx.warehouse.findFirst();
  if (!warehouse) {
    throw new Error("No existe ningún almacén. Crea uno antes de registrar movimientos.");
  }

  const warehouseId = warehouse.id;
  const current = await tx.productStock.findUnique({
    where: {
      productId_warehouseId: { productId, warehouseId },
    },
  });

  const currentQty = current?.quantity ?? 0;

  if (type === "SALIDA") {
    if (currentQty < quantity) {
      throw new InsufficientStockError(productId, quantity, currentQty);
    }
    const newQty = currentQty - quantity;
    await tx.productStock.upsert({
      where: {
        productId_warehouseId: { productId, warehouseId },
      },
      create: { productId, warehouseId, quantity: newQty },
      update: { quantity: newQty },
    });
  } else {
    const newQty = currentQty + quantity;
    await tx.productStock.upsert({
      where: {
        productId_warehouseId: { productId, warehouseId },
      },
      create: { productId, warehouseId, quantity: newQty },
      update: { quantity: newQty },
    });
  }
}
