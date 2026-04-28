import { Router } from "express";
import { listMovements, createMovement, } from "../controllers/movementController";
const router = Router();
router.get("/", listMovements);
router.post("/", createMovement);
export default router;
