import express from "express";
import {
  generateAptitude,
  generateLogical,
  generateVerbal,
  generateCoding,
  generateExplanation,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/aptitude", protect, generateAptitude);
router.post("/logical", protect, generateLogical);
router.post("/verbal", protect, generateVerbal);
router.post("/coding", protect, generateCoding);
router.post("/explain", protect, generateExplanation);

export default router;
