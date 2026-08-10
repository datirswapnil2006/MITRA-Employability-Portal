import mongoose from "mongoose";

const traitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true }, // e.g. "openness", "conscientiousness"
    description: { type: String, trim: true, default: "" },
    minScore: { type: Number, default: 1 },
    maxScore: { type: Number, default: 5 },
  },
  { _id: false }
);

const psychOptionSchema = new mongoose.Schema(
  {
    optionText: { type: String, required: true, trim: true },
    traitKey: { type: String, trim: true, default: "" },
    score: { type: Number, default: 0 },
  },
  { _id: true }
);

const psychQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["likert", "forced_choice", "situational_judgment"],
      default: "likert",
    },
    traitKey: { type: String, required: true, trim: true }, // Mapped primary trait key
    isReverseScored: { type: Boolean, default: false },
    situationContext: { type: String, trim: true, default: "" }, // For situational judgment scenarios
    options: { type: [psychOptionSchema], default: [] },
  },
  { _id: true }
);

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

const psychometricTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    instructions: { type: String, trim: true, default: "" },
    durationMinutes: { type: Number, default: 15, min: 1 },
    category: {
      type: String,
      enum: [
        "Personality Traits",
        "Emotional Intelligence",
        "Behavioral Assessment",
        "Workplace Styles",
        "Leadership Potential",
        "Situational Judgment",
      ],
      required: true,
    },
    targetAudience: { type: String, trim: true, default: "Entry-Level Campus Recruitment" },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    scoringMethod: {
      type: String,
      enum: [
        "Normative Trait Aggregate",
        "Ipsative Forced Choice",
        "Behavioral Competency Index",
        "Likert Weighted Score",
      ],
      default: "Normative Trait Aggregate",
    },
    language: { type: String, default: "English" },
    targetQuestionCount: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isEnabled: { type: Boolean, default: false },
    traits: { type: [traitSchema], default: [] },
    questions: { type: [psychQuestionSchema], default: [] },
    navigationPolicySettings: { type: navigationPolicySettingsSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

psychometricTestSchema.pre("validate", function (next) {
  if (Array.isArray(this.questions)) {
    this.questions.forEach((q) => {
      if (Array.isArray(q.options)) {
        q.options = q.options.map((opt, idx) => {
          if (typeof opt === "string") {
            return {
              optionText: opt.trim(),
              traitKey: q.traitKey || "",
              score: idx + 1,
            };
          }
          if (opt && typeof opt === "object") {
            return {
              optionText: (opt.optionText || opt.text || String(opt)).trim(),
              traitKey: opt.traitKey || q.traitKey || "",
              score: typeof opt.score === "number" ? opt.score : idx + 1,
            };
          }
          return opt;
        });
      }
    });
  }
  next();
});

psychometricTestSchema.index({ category: 1, isEnabled: 1 });
psychometricTestSchema.index({ status: 1 });

export default mongoose.model("PsychometricTest", psychometricTestSchema);
