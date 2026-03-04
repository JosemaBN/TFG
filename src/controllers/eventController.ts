import type { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function listEvents(req: Request, res: Response) {
  try {
    const includeMovements = req.query.movements === "true";
    const events = await prisma.event.findMany({
      include: includeMovements
        ? { movements: { include: { product: true } } }
        : undefined,
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar eventos" });
  }
}

export async function createEvent(req: Request, res: Response) {
  const { name, code, reference, notes, startDate, endDate } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        code: code?.trim() || undefined,
        reference: reference?.trim() || undefined,
        notes: notes?.trim() || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });
    res.status(201).json(event);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "El código de evento ya existe" });
    }
    res.status(500).json({ error: "Error al crear evento" });
  }
}

export async function getEventById(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "id de evento obligatorio" });

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { movements: { include: { product: true } } },
    });
    if (!event) return res.status(404).json({ error: "Evento no encontrado" });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener evento" });
  }
}

export async function getMovementsByEvent(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "id de evento obligatorio" });

  try {
    const movements = await prisma.movement.findMany({
      where: { eventId: id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar movimientos del evento" });
  }
}