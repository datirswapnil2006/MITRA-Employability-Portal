import mongoose from "mongoose";

export const CATEGORIES = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Structures & Algorithms",
  "Core Computer Science",
  "Cloud Computing",
];

const navigationPolicySettingsSchema = new mongoose.Schema(
  {
    navigationPolicy: {
      type: String,
      enum: ["allow_resume", "warn_before_exit", "auto_submit_on_exit"],
      default: "allow_resume",
    },
    browserEventRules: {
      browserBack: { type: Boolean, default: true },
      browserRefresh: { type: Boolean, default: true },
      browserTabClose: { type: Boolean, default: true },
      browserWindowClose: { type: Boolean, default: true },
      routeChange: { type: Boolean, default: true },
    },
    violationSettings: {
      maxViolations: { type: Number, default: 3, min: 1 },
      showWarning: { type: Boolean, default: true },
      autoSubmitOnMaxViolations: { type: Boolean, default: true },
    },
    warningMessage: {
      type: String,
      default:
        "You are attempting to leave the assessment. This action may result in your assessment being submitted automatically.",
    },
    autoSaveBeforeExit: { type: Boolean, default: true },
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, default: 0 },
    isEnabled: { type: Boolean, default: false }, // every new test starts disabled
    isPractice: { type: Boolean, default: false },
    allowRetake: { type: Boolean, default: false },
    navigationPolicySettings: { type: navigationPolicySettingsSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

testSchema.index({ category: 1, isEnabled: 1 });
testSchema.index({ isEnabled: 1, isPractice: 1 });

export default mongoose.model("Test", testSchema);
