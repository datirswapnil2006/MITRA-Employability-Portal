import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getSelfTestTopics,
  generateSelfTest,
  getSelfTestAttempt,
  saveSelfTestAnswer,
  submitSelfTest,
  getStudentDashboard,
  toggleBookmark,
  saveNote,
  getBookmarks,
  getAdminSelfTestAnalytics,
} from "../controllers/selfTestController.js";

const router = express.Router();

// Student Endpoints
router.use(protect);

router.get("/topics", authorize("student"), getSelfTestTopics);
router.post("/generate", authorize("student"), generateSelfTest);
router.get("/attempt/:id", authorize("student"), getSelfTestAttempt);
router.post("/attempt/:id/answer", authorize("student"), saveSelfTestAnswer);
router.post("/attempt/:id/submit", authorize("student"), submitSelfTest);
router.get("/dashboard", authorize("student"), getStudentDashboard);
router.post("/bookmark", authorize("student"), toggleBookmark);
router.post("/note", authorize("student"), saveNote);
router.get("/bookmarks", authorize("student"), getBookmarks);

// Admin Endpoints
router.get("/admin-analytics", authorize("admin"), getAdminSelfTestAnalytics);

export default router;
