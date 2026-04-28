import type { Request, Response } from "express";
import { prisma } from "../prismaClient";
export async function listStock(_req: Request, res: Response) {
    try {
        const stock = await prisma.productStock.findMany({
            include: { product: true, warehouse: true },
        });
        res.json(stock);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al listar stock" });
    }
}
export async function upsertStock(req: Request, res: Response) {
    const { productId, warehouseId, quantity } = req.body;
    if (!productId || !warehouseId || quantity == null) {
        return res
            .status(400)
            .json({ error: "productId, warehouseId y quantity son obligatorios" });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
        return res
            .status(400)
            .json({ error: "quantity debe ser un entero >= 0" });
    }
    try {
        const stock = await prisma.productStock.upsert({
            where: {
                productId_warehouseId: { productId, warehouseId },
            },
            create: { productId, warehouseId, quantity: qty },
            update: { quantity: qty },
            include: { product: true, warehouse: true },
        });
        res.status(201).json(stock);
    }
    catch (error: any) {
        console.error(error);
        if (error.code === "P2003") {
            return res
                .status(404)
                .json({ error: "Producto o almacén no encontrado" });
        }
        res.status(500).json({ error: "Error al actualizar stock" });
    }
}
