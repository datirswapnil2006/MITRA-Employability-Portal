import mongoose from "mongoose";

export const CATEGORIES = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Structures & Algorithms",
  "Core Computer Science",
  "Cloud Computing",
];

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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

testSchema.index({ category: 1, isEnabled: 1 });
testSchema.index({ isEnabled: 1, isPractice: 1 });

export default mongoose.model("Test", testSchema);
