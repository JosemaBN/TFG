import type { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function listWarehouses(_req: Request, res: Response) {
  try {
    const warehouses = await prisma.warehouse.findMany({
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
    const warehouse = await prisma.warehouse.create({
      data: { name: name.trim(), address: address?.trim() || undefined },
    });
    res.status(201).json(warehouse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear almacén" });
  }
}