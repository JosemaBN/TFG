/**
 * `src/controllers/`
 *
 * Controladores del backend: implementan la lógica de cada endpoint.
 * - Validan entrada (`req`), transforman datos si hace falta y llaman a Prisma/servicios.
 * - Devuelven respuestas HTTP consistentes (códigos, mensajes de error, etc.).
 */
import type { Request, Response } from "express";
import { prisma } from "../prismaClient";
import {
  normalizeHora,
  parseEventDateFromBody,
  parseOptionalEventDate,
} from "../utils/eventPayload";

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
  const {
    name,
    code,
    poblacion,
    lugar,
    reference,
    notes,
    startDate,
    endDate,
    horaMontaje,
    horaPrueba,
    horaComienzo,
    horaFin,
    horaDesmontaje,
  } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        code: code?.trim() || undefined,
        poblacion: typeof poblacion === "string" ? poblacion.trim() || undefined : undefined,
        lugar: typeof lugar === "string" ? lugar.trim() || undefined : undefined,
        reference: reference?.trim() || undefined,
        notes: notes?.trim() || undefined,
        startDate: parseOptionalEventDate(startDate),
        endDate: parseOptionalEventDate(endDate),
        horaMontaje: normalizeHora(horaMontaje),
        horaPrueba: normalizeHora(horaPrueba),
        horaComienzo: normalizeHora(horaComienzo),
        horaFin: normalizeHora(horaFin),
        horaDesmontaje: normalizeHora(horaDesmontaje),
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

export async function updateEvent(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const body = req.body as Record<string, unknown>;
  if (!id) return res.status(400).json({ error: "id obligatorio" });
  if (typeof body.name !== "string" || !body.name.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  const optStr = (key: string) => {
    if (!(key in body)) return undefined;
    const v = body[key];
    if (v == null || v === "") return null;
    return String(v).trim() || null;
  };
  const optDate = (key: string) => {
    if (!(key in body)) return undefined;
    return parseEventDateFromBody(body[key]);
  };
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: body.name.trim(),
        ...(optStr("code") !== undefined && { code: optStr("code") }),
        ...(optStr("poblacion") !== undefined && { poblacion: optStr("poblacion") }),
        ...(optStr("lugar") !== undefined && { lugar: optStr("lugar") }),
        ...(optStr("reference") !== undefined && { reference: optStr("reference") }),
        ...(optStr("notes") !== undefined && { notes: optStr("notes") }),
        ...(optDate("startDate") !== undefined && { startDate: optDate("startDate") }),
        ...(optDate("endDate") !== undefined && { endDate: optDate("endDate") }),
        ...(optStr("horaMontaje") !== undefined && { horaMontaje: optStr("horaMontaje") }),
        ...(optStr("horaPrueba") !== undefined && { horaPrueba: optStr("horaPrueba") }),
        ...(optStr("horaComienzo") !== undefined && { horaComienzo: optStr("horaComienzo") }),
        ...(optStr("horaFin") !== undefined && { horaFin: optStr("horaFin") }),
        ...(optStr("horaDesmontaje") !== undefined && { horaDesmontaje: optStr("horaDesmontaje") }),
      },
    });
    res.json(event);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Evento no encontrado" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "El código de evento ya existe" });
    }
    res.status(500).json({ error: "Error al actualizar evento" });
  }
}

export async function getEventById(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
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
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
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

export async function deleteEvent(req: Request, res: Response) {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: "id de evento obligatorio" });

  try {
    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Evento no encontrado" });
    }
    res.status(500).json({ error: "Error al eliminar evento" });
  }
}