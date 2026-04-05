import type { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function listWarehouses(_req: Request, res: Response) {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { createdAt: "asc" },
      include: { stock: { include: { product: true } } },
    });
    res.json(warehouses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar almacenes" });
  }
}

export async function createWarehouse(req: Request, res: Response) {
  const { name, address } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    const existing = await prisma.warehouse.count();
    if (existing >= 1) {
      return res.status(409).json({
        error:
          "Solo puede existir un almacén; todo el inventario se gestiona ahí. No se pueden crear más.",
      });
    }
    const warehouse = await prisma.warehouse.create({
      data: { name: name.trim(), address: address?.trim() || undefined },
    });
    res.status(201).json(warehouse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear almacén" });
  }
}