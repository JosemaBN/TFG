-- CreateTable
CREATE TABLE "EventProductPlan" (
    "eventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "plannedQty" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventProductPlan_pkey" PRIMARY KEY ("eventId","productId")
);

-- AddForeignKey
ALTER TABLE "EventProductPlan" ADD CONSTRAINT "EventProductPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProductPlan" ADD CONSTRAINT "EventProductPlan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
