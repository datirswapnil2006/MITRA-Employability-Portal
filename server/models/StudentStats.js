import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "Trophy" },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const topicStatSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    totalAttempted: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
  },
  { _id: false }
);

const studentStatsSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    streak: {
      currentStreak: { type: Number, default: 0 },
      maxStreak: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
    topicStats: [topicStatSchema],
    wrongQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    achievements: [achievementSchema],
    totalSelfTests: { type: Number, default: 0 },
    totalQuestionsAttempted: { type: Number, default: 0 },
    totalQuestionsCorrect: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studentStatsSchema.index({ xp: -1 });
studentStatsSchema.index({ readinessScore: -1 });
studentStatsSchema.index({ totalSelfTests: 1 });

export default mongoose.model("StudentStats", studentStatsSchema);
