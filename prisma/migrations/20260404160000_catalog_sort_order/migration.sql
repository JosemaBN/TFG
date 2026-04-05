-- CreateTable
CREATE TABLE "CatalogArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogArea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogArea_name_key" ON "CatalogArea"("name");

-- CreateTable
CREATE TABLE "CatalogTipo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogTipo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogTipo_name_key" ON "CatalogTipo"("name");

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Orden inicial estable (fecha de creación) para que las flechas tengan base coherente
UPDATE "Product" AS p
SET "sortOrder" = s.rn
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) AS rn
    FROM "Product"
) AS s
WHERE p.id = s.id;
