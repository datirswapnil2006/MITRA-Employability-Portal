import express from "express";
import multer from "multer";
import path from "path";
import {
  registerStudent, login, getMe, forgotPassword,
  resetPassword, updateProfile, uploadAdminProfilePhoto, deleteAdminProfilePhoto,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Avatar upload config for Admin
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files (JPG, PNG, WebP) are allowed"), false);
  },
});

router.post("/register", registerStudent);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/profile-photo", protect, uploadAvatar.single("photo"), uploadAdminProfilePhoto);
router.delete("/profile-photo", protect, deleteAdminProfilePhoto);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
