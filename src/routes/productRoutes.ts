import { Router } from "express";
import {
  listProducts,
  createProduct,
  getProductById,
} from "../controllers/productController";
import { getMovementsByProduct } from "../controllers/movementController";

const router = Router();

router.get("/", listProducts);
router.post("/", createProduct);
router.get("/:id", getProductById);
router.get("/:id/movements", getMovementsByProduct);

export default router;