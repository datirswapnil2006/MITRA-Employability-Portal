import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllMaterials, getMaterialCategories,
  createMaterial, updateMaterial,
  toggleMaterial, deleteMaterial,
} from "../controllers/materialController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer config for material PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/materials/");
  },
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

const handleFileUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
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

router.get("/", protect, authorize("admin"), getAllMaterials);
router.get("/categories", protect, authorize("admin"), getMaterialCategories);
router.post("/", protect, authorize("admin"), handleFileUpload, createMaterial);
router.put("/:id", protect, authorize("admin"), updateMaterial);
router.patch("/:id/toggle", protect, authorize("admin"), toggleMaterial);
router.delete("/:id", protect, authorize("admin"), deleteMaterial);

export default router;
