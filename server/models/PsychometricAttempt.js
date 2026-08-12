import mongoose from "mongoose";

const psychAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    type: {
      type: String,
      enum: ["likert", "forced_choice", "situational_judgment"],
      required: true,
    },
    traitKey: { type: String, required: true },
    isReverseScored: { type: Boolean, default: false },
    selectedOptionIndex: { type: Number, default: null },
    selectedOptionText: { type: String, default: "" },
    scoreAwarded: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const traitBreakdownSchema = new mongoose.Schema(
  {
    key: String,
    name: String,
    description: String,
    rawScore: Number,
    maxScore: Number,
    percentage: Number,
    level: String,
  },
  { _id: false }
);

const psychometricAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    psychometricTest: { type: mongoose.Schema.Types.ObjectId, ref: "PsychometricTest", required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endsAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["in-progress", "submitted"],
      default: "in-progress",
    },
    answers: [psychAnswerSchema],
    traitScores: { type: Map, of: Number, default: {} },

    // Computed Psychometric Evaluation & Personality Scoring Engine Results
    traitBreakdown: [traitBreakdownSchema],
    personalityProfile: {
      archetype: { type: String, default: "Adaptive Professional" },
      tagline: { type: String, default: "" },
      description: { type: String, default: "" },
      primaryTraitKeys: [String],
    },
    strengths: [String],
    developmentAreas: [String],
    workplaceStyle: {
      communication: { type: String, default: "" },
      stressResponse: { type: String, default: "" },
      decisionMaking: { type: String, default: "" },
      teamRole: { type: String, default: "" },
    },
    careerRecommendations: [String],

    // Proctoring / auto-submit & Exit Navigation Policy Audit Logs
    autoSubmitted: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "" },

    exitReason: { type: String, default: "Manual Submission" },
    violationCount: { type: Number, default: 0 },
    auditLogs: [
      {
        action: { type: String, required: true },
        details: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

psychometricAttemptSchema.index({ student: 1, psychometricTest: 1 });
psychometricAttemptSchema.index({ student: 1, status: 1, createdAt: -1 });

export default mongoose.model("PsychometricAttempt", psychometricAttemptSchema);
