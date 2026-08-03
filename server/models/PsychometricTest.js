import mongoose from "mongoose";

const scaleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    minScore: { type: Number, default: 1 },
    maxScore: { type: Number, default: 5 },
  },
  { _id: false }
);

const psychQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    type: {
      type: String,
      enum: ["likert", "forced_choice", "open_ended"],
      default: "likert",
    },
    options: [String],
    scaleName: { type: String }, // which scale this question maps to
  },
  { _id: true }
);

const psychometricTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: [
        "Personality Traits",
        "Cognitive Ability",
        "Emotional Intelligence",
        "Aptitude Profiling",
        "Behavioral Assessment",
      ],
      required: true,
    },
    scales: { type: [scaleSchema], default: [] },
    questions: { type: [psychQuestionSchema], default: [] },
    isEnabled: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("PsychometricTest", psychometricTestSchema);
