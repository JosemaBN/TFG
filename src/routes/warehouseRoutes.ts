import { Router } from "express";
import {
  listWarehouses,
  createWarehouse,
} from "../controllers/warehouseController";

const router = Router();

router.get("/", listWarehouses);
router.post("/", createWarehouse);

export default router;