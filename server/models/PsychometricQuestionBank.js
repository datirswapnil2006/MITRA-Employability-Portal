import mongoose from "mongoose";

const psychOptionSchema = new mongoose.Schema(
  {
    optionText: { type: String, required: true, trim: true },
    traitKey: { type: String, trim: true, default: "" },
    score: { type: Number, default: 0 },
  },
  { _id: true }
);

const psychometricQuestionBankSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["likert", "forced_choice", "situational_judgment"],
      default: "likert",
    },
    traitKey: { type: String, required: true, trim: true },
    isReverseScored: { type: Boolean, default: false },
    situationContext: { type: String, trim: true, default: "" },
    options: { type: [psychOptionSchema], default: [] },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    language: { type: String, default: "English" },
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
      default: "Personality Traits",
    },
    source: {
      type: String,
      enum: ["ai_generated", "manual", "imported"],
      default: "ai_generated",
    },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

psychometricQuestionBankSchema.index({ traitKey: 1, category: 1, difficulty: 1 });

export default mongoose.model("PsychometricQuestionBank", psychometricQuestionBankSchema);
