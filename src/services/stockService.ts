import type { Prisma } from "../generated/prisma";
type MovementType = "SALIDA" | "ENTRADA";
export function capOutNetToInventory(signedNet: number, inv: number): number {
    const i = Math.max(0, inv);
    const raw = Math.max(0, Math.floor(signedNet));
    return Math.min(raw, i);
}
export async function movementNetSigned(tx: Prisma.TransactionClient, productId: string): Promise<number> {
    const rows = await tx.movement.groupBy({
        by: ["type"],
        where: { productId },
        _sum: { quantity: true },
    });
    let net = 0;
    for (const r of rows) {
        const q = r._sum.quantity ?? 0;
        net += r.type === "SALIDA" ? q : -q;
    }
    return net;
}
export class InsufficientStockError extends Error {
    constructor(public productId: string, public requested: number, public available: number) {
        super(`Stock insuficiente: se solicitaron ${requested} unidades pero solo hay ${available} en almacén.`);
        this.name = "InsufficientStockError";
    }
}
export async function applyMovementToStock(tx: Prisma.TransactionClient, productId: string, type: MovementType, quantity: number): Promise<void> {
    if (type === "ENTRADA") {
        return;
    }
    const product = await tx.product.findUnique({
        where: { id: productId },
        select: { companyInventoryQty: true, repQty: true },
    });
    if (!product) {
        throw new Error("Producto no encontrado");
    }
    const inv = Math.max(0, product.companyInventoryQty);
    const rep = Math.max(0, product.repQty ?? 0);
    const signedNet = await movementNetSigned(tx, productId);
    const outNet = capOutNetToInventory(signedNet, inv);
    const impliedWh = Math.max(0, inv - outNet - rep);
    if (quantity > impliedWh) {
        throw new InsufficientStockError(productId, quantity, impliedWh);
    }
}
