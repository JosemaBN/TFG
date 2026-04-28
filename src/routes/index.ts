/**
 * `src/routes/`
 *
 * Definición de rutas del backend usando `express.Router()`.
 * Separa el “qué URL existe” (rutas) del “qué hace” (controladores).
 */
import { Router } from "express";
import healthRoutes from "./healthRoutes";
import warehouseRoutes from "./warehouseRoutes";
import productRoutes from "./productRoutes";
import eventRoutes from "./eventRoutes";
import movementRoutes from "./movementRoutes";
import stockRoutes from "./stockRoutes";

const router = Router();

router.use("/", healthRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/products", productRoutes);
router.use("/events", eventRoutes);
router.use("/movements", movementRoutes);
router.use("/stock", stockRoutes);

export default router;