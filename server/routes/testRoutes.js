import express from "express";
import {
  createTest, getAllTests, getEnabledTests, getTestById,
  updateTest, toggleTest, deleteTest,
} from "../controllers/testController.js";
import {
  addQuestion, getQuestionsForTest, generateQuestions,
} from "../controllers/questionController.js";
import { getLeaderboard } from "../controllers/attemptController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student-facing (must come before /:id to avoid "enabled" being parsed as an id)
router.get("/enabled", protect, authorize("student"), getEnabledTests);

// Admin: test CRUD + enable/disable
router.post("/", protect, authorize("admin"), createTest);
router.get("/", protect, authorize("admin"), getAllTests);
router.get("/:id", protect, getTestById);
router.put("/:id", protect, authorize("admin"), updateTest);
router.patch("/:id/toggle", protect, authorize("admin"), toggleTest);
router.delete("/:id", protect, authorize("admin"), deleteTest);

// Admin: questions nested under a test
router.post("/:testId/questions/generate", protect, authorize("admin"), generateQuestions);
router.post("/:testId/questions", protect, authorize("admin"), addQuestion);
router.get("/:testId/questions", protect, authorize("admin"), getQuestionsForTest);
router.get("/:testId/leaderboard", protect, authorize("admin"), getLeaderboard);

export default router;
