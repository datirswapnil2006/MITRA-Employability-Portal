import express from "express";
import { logEvent, getEvents, getSummary } from "../controllers/proctorController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:attemptId/event", protect, authorize("student"), logEvent);
router.get("/", protect, authorize("admin"), getEvents);
router.get("/summary", protect, authorize("admin"), getSummary);

export default router;
