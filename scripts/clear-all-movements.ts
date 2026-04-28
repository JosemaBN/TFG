/**
 * `scripts/`
 *
 * Scripts de utilidad para mantenimiento/limpieza de datos durante el desarrollo.
 * Ejemplo: borrado masivo de movimientos para volver a un estado “limpio” de pruebas.
 *
 * Borra todos los registros de Movement (todos los eventos y materiales).
 * Uso: npx ts-node --transpile-only scripts/clear-all-movements.ts
 */
import { prisma } from "../src/prismaClient";

async function main() {
  const result = await prisma.movement.deleteMany({});
  console.log(`Eliminados ${result.count} movimientos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
