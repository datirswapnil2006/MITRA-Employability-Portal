import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "student"],
      required: true,
      default: "student",
    },
    erpNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // admins won't have one
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    branch: { type: String, trim: true },
    year: { type: String, trim: true },
    section: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6 },
    // Students start "pending" and need admin approval before they can log in.
    // Admins are always created pre-approved (via the seed script).
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    academicDetails: {
      tenthPercentage: { type: Number },
      tenthBoard: { type: String, trim: true },
      tenthPassingYear: { type: String, trim: true },
      qualificationType: { type: String, enum: ["12th", "Diploma"], default: "12th" },
      twelfthPercentage: { type: Number },
      twelfthBoard: { type: String, trim: true },
      twelfthPassingYear: { type: String, trim: true },
      diplomaPercentage: { type: Number },
      diplomaBranch: { type: String, trim: true },
      diplomaPassingYear: { type: String, trim: true },
      currentCgpa: { type: Number },
      currentSemester: { type: String, trim: true },
    },
    // Admin profile photo path (e.g. /uploads/avatars/...)
    profileImage: { type: String, default: null },
    // Forgot-password flow: we store a HASH of the reset token (never the
    // raw token) plus an expiry, mirroring how passwords themselves are
    // never stored in plain text. The raw token only ever exists in the
    // email link and briefly in the request body when it's used.
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generates a one-time reset token: returns the RAW token (to email to the
// user) while storing only its SHA-256 hash + a 1-hour expiry on the document.
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken;
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    role: this.role,
    status: this.status,
    erpNumber: this.erpNumber,
    name: this.name,
    email: this.email,
    gender: this.gender,
    branch: this.branch,
    year: this.year,
    section: this.section,
    profileImage: this.profileImage,
    academicDetails: this.academicDetails,
  };
};

userSchema.index({ role: 1, status: 1, branch: 1 });
userSchema.index({ branch: 1, year: 1, section: 1 });

export default mongoose.model("User", userSchema);
