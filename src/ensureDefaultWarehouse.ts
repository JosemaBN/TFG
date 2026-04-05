import type { PrismaClient } from "./generated/prisma";

const DEFAULT_NAME = "Almacén principal";

/**
 * Garantiza un único almacén para todo el inventario: si la BD está vacía, crea "Almacén principal".
 */
export async function ensureDefaultWarehouse(prisma: PrismaClient): Promise<void> {
  const count = await prisma.warehouse.count();
  if (count > 0) return;
  await prisma.warehouse.create({
    data: { name: DEFAULT_NAME, address: null },
  });
  console.log(`[Inventario] Creado almacén único "${DEFAULT_NAME}".`);
}
