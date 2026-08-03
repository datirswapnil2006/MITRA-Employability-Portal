import express from "express";
import {
  startAttempt, saveAnswer, runSample, submitAttempt, getAttempt, getMyAttempts,
} from "../controllers/attemptController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-attempts", protect, authorize("student"), getMyAttempts);
router.post("/start/:testId", protect, authorize("student"), startAttempt);
router.put("/:attemptId/answers/:questionId", protect, authorize("student"), saveAnswer);
router.post("/:attemptId/run-sample/:questionId", protect, authorize("student"), runSample);
router.post("/:attemptId/submit", protect, authorize("student"), submitAttempt);
router.get("/:attemptId", protect, getAttempt);

export default router;
