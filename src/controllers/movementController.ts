import type { Request, Response } from "express";
import { prisma } from "../prismaClient";
import {
  applyMovementToStock,
  InsufficientStockError,
} from "../services/stockService";

type MovementType = "SALIDA" | "ENTRADA";

export async function listMovements(req: Request, res: Response) {
  const { eventId, productId, type } = req.query;

  try {
    const movements = await prisma.movement.findMany({
      where: {
        ...(eventId && { eventId: String(eventId) }),
        ...(productId && { productId: String(productId) }),
        ...(type && { type: type as MovementType }),
      },
      include: { event: true, product: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar movimientos" });
  }
}

export async function createMovement(req: Request, res: Response) {
  const { eventId, productId, type, quantity, notes } = req.body;

  if (!eventId || !productId || !type || quantity == null) {
    return res.status(400).json({
      error:
        "eventId, productId, type y quantity son obligatorios. type: SALIDA | ENTRADA",
    });
  }
  if (type !== "SALIDA" && type !== "ENTRADA") {
    return res.status(400).json({ error: "type debe ser SALIDA o ENTRADA" });
  }
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: "quantity debe ser un entero positivo" });
  }

  try {
    const movement = await prisma.$transaction(async (tx) => {
      await applyMovementToStock(tx, productId, type, qty);
      return tx.movement.create({
        data: {
          eventId,
          productId,
          type,
          quantity: qty,
          notes: notes?.trim() || undefined,
        },
      });
    });

    const withRelations = await prisma.movement.findUnique({
      where: { id: movement.id },
      include: { event: true, product: true },
    });

    res.status(201).json(withRelations);
  } catch (error: any) {
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({
        error: error.message,
        productId: error.productId,
        requested: error.requested,
        available: error.available,
      });
    }
    if (error.code === "P2003") {
      return res.status(404).json({ error: "Evento o producto no encontrado" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al crear movimiento" });
  }
}

export async function getMovementsByProduct(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: "id de producto obligatorio" });

  try {
    const movements = await prisma.movement.findMany({
      where: { productId: id },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar movimientos del producto" });
  }
}