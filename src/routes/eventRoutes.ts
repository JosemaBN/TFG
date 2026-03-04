import { Router } from "express";
import {
  listEvents,
  createEvent,
  getEventById,
  getMovementsByEvent,
} from "../controllers/eventController";

const router = Router();

router.get("/", listEvents);
router.post("/", createEvent);
router.get("/:id", getEventById);
router.get("/:id/movements", getMovementsByEvent);

export default router;
