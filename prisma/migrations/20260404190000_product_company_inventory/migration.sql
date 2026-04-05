-- AlterTable
ALTER TABLE "Product" ADD COLUMN "companyInventoryQty" INTEGER NOT NULL DEFAULT 0;

-- Inicializar INV con el stock actual en almacén (un solo almacén en la app)
UPDATE "Product" p
SET "companyInventoryQty" = COALESCE(
  (SELECT SUM(ps.quantity)::integer FROM "ProductStock" ps WHERE ps."productId" = p.id),
  0
);
