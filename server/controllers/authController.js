import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/emailService.js";

// @route POST /api/auth/register
// @desc Student self-registration. Account is created as approved and student can log in directly.
export const registerStudent = async (req, res) => {
  try {
    const { erpNumber, name, email, gender, branch, year, section, password } = req.body;

    if (!erpNumber || !name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({
      $or: [{ erpNumber }, { email: email.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({ message: "An account with this ERP number or email already exists" });
    }

    const user = await User.create({
      role: "student",
      erpNumber,
      name,
      email,
      gender: gender || undefined,
      branch,
      year,
      section,
      password,
      status: "approved",
    });

    // Send welcome email notification asynchronously (non-blocking)
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      erpNumber: user.erpNumber,
      branch: user.branch,
      year: user.year,
    }).catch((emailErr) => {
      console.warn("Failed to deliver welcome email:", emailErr.message);
    });

    const token = generateToken(user);
    res.status(201).json({
      message: "Registration successful! You can now log in immediately.",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// @route POST /api/auth/login
// @desc Shared login for admin + student. Role must be selected on the client
// and must match the account's actual role.
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and role are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials or role" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "student" && user.status === "rejected") {
      return res.status(403).json({ message: "Your registration was rejected. Contact the placement cell." });
    }

    const token = generateToken(user);
    res.status(200).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};

// @route POST /api/auth/forgot-password
// @desc  Always responds with the same generic message whether or not the
//        email exists — this prevents someone from using this endpoint to
//        discover which emails are registered.
export const forgotPassword = async (req, res) => {
  const genericResponse = {
    message: "If an account exists with that email, a reset link has been sent.",
  };

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Deliberately identical response to the success case.
      return res.status(200).json(genericResponse);
    }

    const rawToken = user.createPasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (emailErr) {
      // Roll back the token if we couldn't actually email it, so it's not
      // left dangling as a valid-but-undeliverable reset credential.
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({
        message: "Could not send the reset email. Check the server's SMTP configuration.",
        error: emailErr.message,
      });
    }

    res.status(200).json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: "Failed to process request", error: err.message });
  }
};

// @route POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

    user.password = password; // pre-save hook re-hashes this
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
};

// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, gender, section, academicDetails, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (section) user.section = section;
    if (academicDetails) {
      user.academicDetails = {
        ...user.academicDetails,
        ...academicDetails,
      };
    }
    if (password && password.length >= 6) {
      user.password = password;
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};
