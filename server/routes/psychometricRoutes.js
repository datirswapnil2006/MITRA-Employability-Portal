import express from "express";
import {
  getAllPsychometric,
  getPsychometricById,
  createPsychometric,
  updatePsychometric,
  togglePsychometric,
  deletePsychometric,
  generateAIPsychometricQuestions,
  regenerateSinglePsychometricQuestion,
  getStudentAvailablePsychometric,
  startPsychometricAttempt,
  savePsychometricAnswer,
  submitPsychometricAttempt,
  getPsychometricAttempt,
  getPsychometricAttemptAnalysis,
  getAdminPsychometricAnalytics,
  getAllTraits,
  createTrait,
  updateTrait,
  deleteTrait,
  seedDefaultTraits,
  getAllQuestionBankItems,
  createQuestionBankItem,
  deleteQuestionBankItem,
  getAllPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  seedDefaultPromptTemplates,
} from "../controllers/psychometricController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin Institutional Analytics (Must be defined before /:id)
router.get("/admin/analytics", protect, authorize("admin"), getAdminPsychometricAnalytics);

// Trait Library Routes
router.get("/traits", protect, authorize("admin"), getAllTraits);
router.post("/traits", protect, authorize("admin"), createTrait);
router.post("/traits/seed", protect, authorize("admin"), seedDefaultTraits);
router.put("/traits/:id", protect, authorize("admin"), updateTrait);
router.delete("/traits/:id", protect, authorize("admin"), deleteTrait);

// Question Bank Routes
router.get("/question-bank", protect, authorize("admin"), getAllQuestionBankItems);
router.post("/question-bank", protect, authorize("admin"), createQuestionBankItem);
router.delete("/question-bank/:id", protect, authorize("admin"), deleteQuestionBankItem);

// AI Prompt Template Routes
router.get("/prompt-templates", protect, authorize("admin"), getAllPromptTemplates);
router.post("/prompt-templates", protect, authorize("admin"), createPromptTemplate);
router.post("/prompt-templates/seed", protect, authorize("admin"), seedDefaultPromptTemplates);
router.put("/prompt-templates/:id", protect, authorize("admin"), updatePromptTemplate);
router.delete("/prompt-templates/:id", protect, authorize("admin"), deletePromptTemplate);

// Student facing endpoints & attempt analysis
router.get("/student/available", protect, authorize("student"), getStudentAvailablePsychometric);
router.post("/attempt/start/:testId", protect, authorize("student"), startPsychometricAttempt);
router.put("/attempt/:attemptId/answer", protect, authorize("student"), savePsychometricAnswer);
router.post("/attempt/:attemptId/submit", protect, authorize("student"), submitPsychometricAttempt);
router.get("/attempt/:attemptId/analysis", protect, getPsychometricAttemptAnalysis);
router.get("/attempt/:attemptId", protect, getPsychometricAttempt);

// Admin Assessment CRUD & AI Generation
router.get("/", protect, authorize("admin"), getAllPsychometric);
router.post("/generate-ai", protect, authorize("admin"), generateAIPsychometricQuestions);
router.post("/regenerate-single", protect, authorize("admin"), regenerateSinglePsychometricQuestion);
router.get("/:id", protect, getPsychometricById);
router.post("/", protect, authorize("admin"), createPsychometric);
router.put("/:id", protect, authorize("admin"), updatePsychometric);
router.patch("/:id/toggle", protect, authorize("admin"), togglePsychometric);
router.delete("/:id", protect, authorize("admin"), deletePsychometric);

export default router;
