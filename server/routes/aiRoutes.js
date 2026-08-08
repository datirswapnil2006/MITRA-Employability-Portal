import express from "express";
import {
  generateBlueprint,
  generateAptitude,
  generateLogical,
  generateVerbal,
  generateCoding,
  generateExplanation,
} from "../controllers/aiController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/blueprint", protect, authorize("admin"), generateBlueprint);
router.post("/aptitude", protect, generateAptitude);
router.post("/logical", protect, generateLogical);
router.post("/verbal", protect, generateVerbal);
router.post("/coding", protect, generateCoding);
router.post("/explain", protect, generateExplanation);

export default router;

