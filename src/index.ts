import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  applyMovementToStock,
  capOutNetToInventory,
  InsufficientStockError,
} from "./services/stockService";
import {
  normalizeHora,
  parseEventDateFromBody,
  parseOptionalEventDate,
} from "./utils/eventPayload";
import { ensureDefaultWarehouse } from "./ensureDefaultWarehouse";
import { PRODUCT_LIST_ORDER_BY } from "./productSort";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const app = express();
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  next();
});

// ----- Health -----
app.get("/", (_req, res) => {
  res.json({ message: "API inventario por eventos ✅" });
});

// ----- Almacén (único) -----
app.get("/warehouses", async (_req, res) => {
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
});

app.post("/warehouses", async (req, res) => {
  const { name, address } = req.body;
  if (!name) {
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
      data: { name, address: address ?? undefined },
    });
    res.status(201).json(warehouse);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error al crear almacén" });
  }
});

// ----- Catálogo de áreas / tipos (vocabulario para materiales) -----
app.get("/catalog/areas", async (_req, res) => {
  try {
    const rows = await prisma.catalogArea.findMany({ orderBy: { name: "asc" } });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar áreas del catálogo" });
  }
});

app.post("/catalog/areas", async (req, res) => {
  const name = req.body?.name;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name es obligatorio" });
  }
  try {
    const row = await prisma.catalogArea.create({ data: { name: name.trim() } });
    res.status(201).json(row);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Esa área ya existe en el catálogo" });
    }
    res.status(500).json({ error: "Error al crear área" });
  }
});

app.get("/catalog/tipos", async (_req, res) => {
  try {
    const rows = await prisma.catalogTipo.findMany({ orderBy: { name: "asc" } });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar tipos del catálogo" });
  }
});

app.post("/catalog/tipos", async (req, res) => {
  const name = req.body?.name;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name es obligatorio" });
  }
  try {
    const row = await prisma.catalogTipo.create({ data: { name: name.trim() } });
    res.status(201).json(row);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Ese tipo ya existe en el catálogo" });
    }
    res.status(500).json({ error: "Error al crear tipo" });
  }
});

// ----- Material (productos) -----
app.get("/products", async (req, res) => {
  try {
    const includeStock = req.query.stock === "true";
    const products = await prisma.product.findMany({
      orderBy: PRODUCT_LIST_ORDER_BY,
      include: includeStock
        ? { stock: { orderBy: { warehouseId: "asc" }, include: { warehouse: true } } }
        : undefined,
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar productos" });
  }
});

app.post("/products", async (req, res) => {
  const { marca, name, description, area, tipo } = req.body;
  if (!name) {
    return res.status(400).json({ error: "El modelo es obligatorio" });
  }
  try {
    const agg = await prisma.product.aggregate({ _max: { sortOrder: true } });
    const nextSort = (agg._max.sortOrder ?? 0) + 1;
    const product = await prisma.product.create({
      data: {
        marca: typeof marca === "string" && marca.trim() ? marca.trim() : undefined,
        name: String(name).trim(),
        description: description != null && String(description).trim() ? String(description).trim() : undefined,
        area: typeof area === "string" && area.trim() ? area.trim() : undefined,
        tipo: typeof tipo === "string" && tipo.trim() ? tipo.trim() : undefined,
        sortOrder: nextSort,
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
});

app.post("/products/:id/reorder", async (req, res) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const direction = req.body?.direction;
  if (!id) return res.status(400).json({ error: "id obligatorio" });
  if (direction !== "up" && direction !== "down") {
    return res.status(400).json({ error: "direction debe ser up o down" });
  }
  try {
    const all = await prisma.product.findMany({ orderBy: PRODUCT_LIST_ORDER_BY });
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Producto no encontrado" });
    const j = direction === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= all.length) {
      return res.status(400).json({ error: "No se puede mover en esa dirección" });
    }
    const a = all[idx];
    const b = all[j];
    await prisma.$transaction([
      prisma.product.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      prisma.product.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al reordenar producto" });
  }
});

app.put("/products/:id", async (req, res) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const body = req.body as Record<string, unknown>;
  if (!id) return res.status(400).json({ error: "id obligatorio" });
  if (typeof body.name !== "string" || !body.name.trim()) {
    return res.status(400).json({ error: "El modelo es obligatorio" });
  }
  const optStr = (key: string) => {
    if (!(key in body)) return undefined;
    const v = body[key];
    if (v == null || v === "") return null;
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
    if (optStr("marca") !== undefined) data.marca = optStr("marca");
    if (optStr("description") !== undefined) data.description = optStr("description");
    if (optStr("area") !== undefined) data.area = optStr("area");
    if (optStr("tipo") !== undefined) data.tipo = optStr("tipo");

    const product = await prisma.product.update({
      where: { id },
      data,
    });
    res.json(product);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "El SKU ya existe" });
    }
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

/** Actualizar solo REP (plantilla); evita enviar el resto de campos del producto. */
app.patch("/products/:id/rep-qty", async (req, res) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: "id obligatorio" });
  const q = Number(req.body?.quantity);
  if (!Number.isInteger(q) || q < 0) {
    return res.status(400).json({ error: "quantity debe ser un entero >= 0" });
  }
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Producto no encontrado" });
    const movAgg = await prisma.movement.groupBy({
      by: ["type"],
      where: { productId: id },
      _sum: { quantity: true },
    });
    let netSigned = 0;
    for (const r of movAgg) {
      const qq = r._sum.quantity ?? 0;
      netSigned += r.type === "SALIDA" ? qq : -qq;
    }
    const outNet = capOutNetToInventory(netSigned, existing.companyInventoryQty);
    const repMax = Math.max(0, existing.companyInventoryQty - outNet);
    if (q > repMax) {
      return res.status(400).json({
        error: `REP no puede superar INV − OUT (máx. ${repMax}; OUT = ${outNet})`,
      });
    }
    const product = await prisma.product.update({
      where: { id },
      data: { repQty: q },
    });
    res.json(product);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(500).json({ error: "Error al actualizar REP" });
  }
});

/** Inventario total empresa (columna INV en plantilla). */
app.patch("/products/:id/company-inventory-qty", async (req, res) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: "id obligatorio" });
  const q = Number(req.body?.quantity);
  if (!Number.isInteger(q) || q < 0) {
    return res.status(400).json({ error: "quantity debe ser un entero >= 0" });
  }
  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Producto no encontrado" });
    const movAgg = await prisma.movement.groupBy({
      by: ["type"],
      where: { productId: id },
      _sum: { quantity: true },
    });
    let netSigned = 0;
    for (const r of movAgg) {
      const qq = r._sum.quantity ?? 0;
      netSigned += r.type === "SALIDA" ? qq : -qq;
    }
    const rawOut = Math.max(0, netSigned);
    const rep = Math.max(0, existing.repQty ?? 0);
    const minInv = rawOut + rep;
    if (q < minInv) {
      return res.status(400).json({
        error: `INV no puede ser menor que el neto de salidas (${rawOut}) + REP (${rep}). Mínimo permitido: ${minInv}. Revisa movimientos o REP.`,
      });
    }
    const product = await prisma.product.update({
      where: { id },
      data: { companyInventoryQty: q },
    });
    res.json(product);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(500).json({ error: "Error al actualizar inventario empresa (INV)" });
  }
});

app.delete("/products/:id", async (req, res) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: "id obligatorio" });
  try {
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

app.get("/products/:id/movements", async (req, res) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return res.status(400).json({ error: "id obligatorio" });
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
});

/** Borrar movimientos del material. Sin query: todos los eventos. ?eventId= solo ese evento (misma semántica que Ud=0 en plantilla). */
app.delete("/products/:id/movements", async (req, res) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ error: "id obligatorio" });
  const evRaw = req.query.eventId;
  const eventId =
    typeof evRaw === "string" ? evRaw : Array.isArray(evRaw) ? evRaw[0] : undefined;
  try {
    const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: "Producto no encontrado" });
    const where = eventId
      ? { productId: id, eventId: String(eventId) }
      : { productId: id };
    const result = await prisma.movement.deleteMany({ where });
    res.json({ deleted: result.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar movimientos" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        stock: { orderBy: { warehouseId: "asc" } },
        movements: { include: { event: true } },
      },
    });
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// ----- Plantilla: Ud planificada (evento × producto) -----
app.get("/event-product-plans", async (_req, res) => {
  try {
    const rows = await prisma.eventProductPlan.findMany({
      include: { event: true, product: true },
    });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar planes de plantilla" });
  }
});

app.put("/event-product-plans", async (req, res) => {
  const { eventId, productId, plannedQty } = req.body;
  if (!eventId || !productId) {
    return res.status(400).json({ error: "eventId y productId son obligatorios" });
  }
  const qty = Number(plannedQty);
  if (!Number.isInteger(qty) || qty < 0) {
    return res.status(400).json({ error: "plannedQty debe ser un entero >= 0" });
  }
  const eid = String(eventId);
  const pid = String(productId);
  try {
    const row = await prisma.$transaction(async (tx) => {
      if (qty === 0) {
        await tx.movement.deleteMany({
          where: { eventId: eid, productId: pid },
        });
      }
      return tx.eventProductPlan.upsert({
        where: {
          eventId_productId: { eventId: eid, productId: pid },
        },
        create: {
          eventId: eid,
          productId: pid,
          plannedQty: qty,
        },
        update: { plannedQty: qty },
        include: { event: true, product: true },
      });
    });
    res.json(row);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2003") {
      return res.status(404).json({ error: "Evento o producto no encontrado" });
    }
    res.status(500).json({ error: "Error al guardar Ud planificada" });
  }
});

// ----- Eventos -----
app.get("/events", async (req, res) => {
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
});

app.post("/events", async (req, res) => {
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
  if (!name) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  try {
    const event = await prisma.event.create({
      data: {
        name,
        code: code ?? undefined,
        poblacion: typeof poblacion === "string" ? poblacion.trim() || undefined : undefined,
        lugar: typeof lugar === "string" ? lugar.trim() || undefined : undefined,
        reference: reference ?? undefined,
        notes: notes ?? undefined,
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
});

app.put("/events/:id", async (req, res) => {
  const { id } = req.params;
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
});

app.get("/events/:id/movements", async (req, res) => {
  try {
    const movements = await prisma.movement.findMany({
      where: { eventId: req.params.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar movimientos del evento" });
  }
});

app.get("/events/:id", async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { movements: { include: { product: true } } },
    });
    if (!event) return res.status(404).json({ error: "Evento no encontrado" });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener evento" });
  }
});

// ----- Relacionar material y eventos (movimientos: salida/entrada) -----
/** Para planilla: por producto, OUT = min(Σ(SALIDA) − Σ(ENTRADA), INV); no puede superar el inventario empresa. */
app.get("/movements/product-net-out", async (_req, res) => {
  try {
    const rows = await prisma.movement.groupBy({
      by: ["productId", "type"],
      _sum: { quantity: true },
    });
    const signedByProduct = new Map<string, number>();
    for (const r of rows) {
      const q = r._sum.quantity ?? 0;
      const prev = signedByProduct.get(r.productId) ?? 0;
      signedByProduct.set(r.productId, prev + (r.type === "SALIDA" ? q : -q));
    }
    const productIds = [...signedByProduct.keys()];
    if (productIds.length === 0) {
      res.json({});
      return;
    }
    const invRows = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, companyInventoryQty: true },
    });
    const invMap = new Map(invRows.map((p) => [p.id, Math.max(0, p.companyInventoryQty)]));
    const out: Record<string, number> = {};
    for (const [pid, signed] of signedByProduct) {
      const inv = invMap.get(pid) ?? 0;
      out[pid] = capOutNetToInventory(signed, inv);
    }
    res.json(out);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al calcular salidas netas por producto" });
  }
});

app.get("/movements", async (req, res) => {
  const { eventId, productId, type } = req.query;
  try {
    const movements = await prisma.movement.findMany({
      where: {
        ...(eventId && { eventId: String(eventId) }),
        ...(productId && { productId: String(productId) }),
        ...(type && { type: type as "SALIDA" | "ENTRADA" }),
      },
      include: { event: true, product: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar movimientos" });
  }
});

app.post("/movements", async (req, res) => {
  const { eventId, productId, type, quantity, notes } = req.body;
  if (!eventId || !productId || !type || quantity == null) {
    return res.status(400).json({
      error: "eventId, productId, type y quantity son obligatorios. type: SALIDA | ENTRADA",
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
          notes: notes ?? undefined,
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
});

// ----- Stock en almacén (opcional: alta/consulta por producto-almacén) -----
app.get("/stock", async (_req, res) => {
  try {
    const stock = await prisma.productStock.findMany({
      include: { product: true, warehouse: true },
    });
    res.json(stock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar stock" });
  }
});

app.post("/stock", async (req, res) => {
  const { productId, warehouseId, quantity } = req.body;
  if (!productId || !warehouseId || quantity == null) {
    return res.status(400).json({ error: "productId, warehouseId y quantity son obligatorios" });
  }
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 0) {
    return res.status(400).json({ error: "quantity debe ser un entero >= 0" });
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
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2003") {
      return res.status(404).json({ error: "Producto o almacén no encontrado" });
    }
    res.status(500).json({ error: "Error al actualizar stock" });
  }
});

// ----- Servidor -----
void ensureDefaultWarehouse(prisma)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("No se pudo asegurar el almacén por defecto:", err);
    process.exit(1);
  });
