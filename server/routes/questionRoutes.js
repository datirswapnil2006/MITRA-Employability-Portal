import express from "express";
import multer from "multer";
import path from "path";
import { updateQuestion, deleteQuestion } from "../controllers/questionController.js";
import { getQuestionBank, bulkDeleteQuestions, moveQuestions } from "../controllers/questionBankController.js";
import { extractQuestionsFromPDF } from "../controllers/pdfQuestionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer config for PDF question extraction
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/temp/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

const handlePdfUpload = (req, res, next) => {
  upload.single("pdf")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File is too large. Maximum size allowed is 50MB." });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Question bank endpoints
router.get("/bank", protect, authorize("admin"), getQuestionBank);
router.post("/bulk-delete", protect, authorize("admin"), bulkDeleteQuestions);
router.patch("/move", protect, authorize("admin"), moveQuestions);

// PDF extraction
router.post("/extract-pdf", protect, authorize("admin"), handlePdfUpload, extractQuestionsFromPDF);

// Single question CRUD (existing)
router.put("/:id", protect, authorize("admin"), updateQuestion);
router.delete("/:id", protect, authorize("admin"), deleteQuestion);

export default router;
