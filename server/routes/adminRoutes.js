import express from "express";
import {
  getAllStudents, getStudentDetail, getOverview,
  getRegistrations, approveRegistration, rejectRegistration,
  getFlaggedAttempts, clearFlaggedAttempts, deleteFlaggedAttemptById,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, authorize("admin"), getOverview);
router.get("/registrations", protect, authorize("admin"), getRegistrations);
router.patch("/registrations/:id/approve", protect, authorize("admin"), approveRegistration);
router.patch("/registrations/:id/reject", protect, authorize("admin"), rejectRegistration);
router.get("/flagged-attempts", protect, authorize("admin"), getFlaggedAttempts);
router.delete("/flagged-attempts", protect, authorize("admin"), clearFlaggedAttempts);
router.delete("/flagged-attempts/:id", protect, authorize("admin"), deleteFlaggedAttemptById);
router.get("/students", protect, authorize("admin"), getAllStudents);
router.get("/students/:id", protect, authorize("admin"), getStudentDetail);

export default router;
