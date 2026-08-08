import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    type: { type: String, enum: ["mcq", "coding"], required: true },

    // mcq
    selectedOptionIndex: { type: Number, default: null },

    // coding
    code: { type: String, default: "" },
    language: { type: String, enum: ["java", "python", "cpp", null], default: null },
    testCaseResults: [
      {
        passed: Boolean,
        stdout: String,
        expected: String,
        stderr: String,
        hidden: Boolean,
      },
    ],

    isCorrect: { type: Boolean, default: null }, // mcq only
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const sectionResultSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true },
    sectionName: { type: String, required: true },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ["in-progress", "submitted"], default: "in-progress" },
    answers: [answerSchema],
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
    sectionResults: [sectionResultSchema],
    summary: {
      totalQuestions: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 },
      incorrectCount: { type: Number, default: 0 },
      unattemptedCount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      codingScore: { type: Number, default: 0 },
      codingMaxScore: { type: Number, default: 0 },
      timeTakenSeconds: { type: Number, default: 0 },
    },

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

// One active/completed attempt per student per test
attemptSchema.index({ student: 1, test: 1 }, { unique: true });
attemptSchema.index({ student: 1, status: 1, createdAt: -1 });
attemptSchema.index({ test: 1, status: 1, totalScore: -1 });
attemptSchema.index({ flagged: 1, status: 1 });

export default mongoose.model("Attempt", attemptSchema);
