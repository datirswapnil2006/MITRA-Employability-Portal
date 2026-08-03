import mongoose from "mongoose";

const selfTestAnswerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    type: { type: String, enum: ["mcq", "coding"], required: true },
    selectedOptionIndex: { type: Number, default: null },
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
    isCorrect: { type: Boolean, default: null },
    marksAwarded: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const selfTestAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["practice", "exam"], default: "practice" },
    config: {
      topics: [{ type: String }],
      difficulty: { type: String, default: "Mixed" },
      questionCount: { type: Number, default: 10 },
      durationMinutes: { type: Number, default: 15 },
      questionType: { type: String, default: "Mixed" },
      language: { type: String, default: "python" },
      negativeMarking: { type: Boolean, default: false },
      negativeMarkRatio: { type: Number, default: 0.25 },
      shuffleOptions: { type: Boolean, default: true },
      prioritizeWrong: { type: Boolean, default: false },
    },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    answers: [selfTestAnswerSchema],
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

selfTestAttemptSchema.index({ student: 1, status: 1, completedAt: -1 });
selfTestAttemptSchema.index({ status: 1, completedAt: -1 });

export default mongoose.model("SelfTestAttempt", selfTestAttemptSchema);
