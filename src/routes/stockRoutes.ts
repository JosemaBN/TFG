import { Router } from "express";
import { listStock, upsertStock } from "../controllers/stockController";
const router = Router();
router.get("/", listStock);
router.post("/", upsertStock);
export default router;
