import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma";
import { prisma } from "../prismaClient";
import { PRODUCT_LIST_ORDER_BY } from "../productSort";
export async function listProducts(req: Request, res: Response) {
    try {
        const includeStock = req.query.stock === "true";
        const movementCounts = req.query.movementCounts === "true";
        const include: Prisma.ProductInclude = {};
        if (includeStock) {
            include.stock = { orderBy: { warehouseId: "asc" }, include: { warehouse: true } };
        }
        if (movementCounts) {
            include._count = {
                select: { movements: { where: { type: "SALIDA" } } },
            };
        }
        const products = await prisma.product.findMany({
            orderBy: PRODUCT_LIST_ORDER_BY,
            include: Object.keys(include).length > 0 ? include : undefined,
        });
        res.json(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al listar productos" });
    }
}
export async function createProduct(req: Request, res: Response) {
    const { marca, name, description, area, tipo } = req.body;
    if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "El modelo es obligatorio" });
    }
    try {
        const agg = await prisma.product.aggregate({ _max: { sortOrder: true } });
        const nextSort = (agg._max.sortOrder ?? 0) + 1;
        const product = await prisma.product.create({
            data: {
                marca: typeof marca === "string" ? marca.trim() || undefined : undefined,
                name: name.trim(),
                description: description?.trim() || undefined,
                area: typeof area === "string" ? area.trim() || undefined : undefined,
                tipo: typeof tipo === "string" ? tipo.trim() || undefined : undefined,
                sortOrder: nextSort,
            },
        });
        res.status(201).json(product);
    }
    catch (error: any) {
        console.error(error);
        if (error.code === "P2002") {
            return res.status(409).json({ error: "El SKU ya existe" });
        }
        res.status(500).json({ error: "Error al crear producto" });
    }
}
export async function updateProduct(req: Request, res: Response) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const body = req.body as Record<string, unknown>;
    if (!id)
        return res.status(400).json({ error: "id obligatorio" });
    if (typeof body.name !== "string" || !body.name.trim()) {
        return res.status(400).json({ error: "El modelo es obligatorio" });
    }
    const optStr = (key: string) => {
        if (!(key in body))
            return undefined;
        const v = body[key];
        if (v == null || v === "")
            return null;
        return String(v).trim() || null;
    };
    try {
        const data: {
            name: string;
            marca?: string | null;
            description?: string | null;
            area?: string | null;
            tipo?: string | null;
        } = { name: body.name.trim() };
        if (optStr("marca") !== undefined)
            data.marca = optStr("marca");
        if (optStr("description") !== undefined)
            data.description = optStr("description");
        if (optStr("area") !== undefined)
            data.area = optStr("area");
        if (optStr("tipo") !== undefined)
            data.tipo = optStr("tipo");
        const product = await prisma.product.update({
            where: { id },
            data,
        });
        res.json(product);
    }
    catch (error: any) {
        console.error(error);
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        if (error.code === "P2002") {
            return res.status(409).json({ error: "El SKU ya existe" });
        }
        res.status(500).json({ error: "Error al actualizar producto" });
    }
}
export async function deleteProduct(req: Request, res: Response) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id)
        return res.status(400).json({ error: "id obligatorio" });
    try {
        await prisma.product.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error: any) {
        console.error(error);
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.status(500).json({ error: "Error al eliminar producto" });
    }
}
export async function getProductById(req: Request, res: Response) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
        return res.status(400).json({ error: "id de producto obligatorio" });
    }
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                stock: { orderBy: { warehouseId: "asc" } },
                movements: { include: { event: true } },
            },
        });
        if (!product)
            return res.status(404).json({ error: "Producto no encontrado" });
        res.json(product);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener producto" });
    }
}
