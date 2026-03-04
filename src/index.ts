import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyMovementToStock, InsufficientStockError } from "./services/stockService";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const app = express();
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ----- Health -----
app.get("/", (_req, res) => {
  res.json({ message: "API inventario por eventos ✅" });
});

// ----- Almacén (único) -----
app.get("/warehouses", async (_req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
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
    const warehouse = await prisma.warehouse.create({
      data: { name, address: address ?? undefined },
    });
    res.status(201).json(warehouse);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error al crear almacén" });
  }
});

// ----- Material (productos) -----
app.get("/products", async (req, res) => {
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
});

app.post("/products", async (req, res) => {
  const { sku, name, description } = req.body;
  if (!sku || !name) {
    return res.status(400).json({ error: "sku y name son obligatorios" });
  }
  try {
    const product = await prisma.product.create({
      data: { sku, name, description: description ?? undefined },
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

app.get("/products/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { stock: true, movements: { include: { event: true } } },
    });
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener producto" });
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
  const { name, code, reference, notes, startDate, endDate } = req.body;
  if (!name) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  try {
    const event = await prisma.event.create({
      data: {
        name,
        code: code ?? undefined,
        reference: reference ?? undefined,
        notes: notes ?? undefined,
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
      const created = await tx.movement.create({
        data: {
          eventId,
          productId,
          type,
          quantity: qty,
          notes: notes ?? undefined,
        },
      });
      await applyMovementToStock(tx, productId, type, qty);
      return created;
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

app.get("/products/:id/movements", async (req, res) => {
  try {
    const movements = await prisma.movement.findMany({
      where: { productId: req.params.id },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar movimientos del producto" });
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
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
