-- sku pasa de TEXT a entero SERIAL (autoincremental). Los valores de sku anteriores se pierden.
DROP INDEX IF EXISTS "Product_sku_key";

ALTER TABLE "Product" DROP COLUMN "sku";

ALTER TABLE "Product" ADD COLUMN "sku" SERIAL NOT NULL;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
