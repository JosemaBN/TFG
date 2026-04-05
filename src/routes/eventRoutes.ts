import { Router } from "express";
import {
  listEvents,
  createEvent,
  updateEvent,
  getEventById,
  getMovementsByEvent,
} from "../controllers/eventController";

const router = Router();

router.get("/", listEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.get("/:id/movements", getMovementsByEvent);
router.get("/:id", getEventById);

export default router;
