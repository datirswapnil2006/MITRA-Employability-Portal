import express from "express";
import {
  getAllPsychometric, getPsychometricById,
  createPsychometric, updatePsychometric,
  togglePsychometric, deletePsychometric,
} from "../controllers/psychometricController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin"), getAllPsychometric);
router.get("/:id", protect, authorize("admin"), getPsychometricById);
router.post("/", protect, authorize("admin"), createPsychometric);
router.put("/:id", protect, authorize("admin"), updatePsychometric);
router.patch("/:id/toggle", protect, authorize("admin"), togglePsychometric);
router.delete("/:id", protect, authorize("admin"), deletePsychometric);

export default router;
