import type { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function listProducts(req: Request, res: Response) {
  try {
    const includeStock = req.query.stock === "true";
    const products = await prisma.product.findMany({
      include: includeStock ? { stock: { include: { warehouse: true } } } : undefined,
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar productos" });
  }
}

export async function createProduct(req: Request, res: Response) {
  const { sku, name, description } = req.body;

  if (typeof sku !== "string" || !sku.trim()) {
    return res.status(400).json({ error: "sku es obligatorio" });
  }
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name es obligatorio" });
  }

  try {
    const product = await prisma.product.create({
      data: {
        sku: sku.trim(),
        name: name.trim(),
        description: description?.trim() || undefined,
      },
    });
    res.status(201).json(product);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "El SKU ya existe" });
    }
    res.status(500).json({ error: "Error al crear producto" });
  }
}

export async function getProductById(req: Request, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "id de producto obligatorio" });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { stock: true, movements: { include: { event: true } } },
    });
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
}