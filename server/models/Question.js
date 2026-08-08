import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    output: { type: String, required: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: false },
    type: { type: String, enum: ["mcq", "coding"], required: true },
    questionText: { type: String, required: true },
    marks: { type: Number, required: true, min: 1 },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    topic: { type: String, default: "General", trim: true },
    subtopic: { type: String, default: "", trim: true },
    source: { type: String, enum: ["manual", "pdf", "ai"], default: "manual" },
    status: { type: String, enum: ["draft", "pending_review", "approved", "rejected"], default: "approved" },
    sourcePdf: { type: String, default: "" },
    explanation: { type: String, default: "" },

    // ---- MCQ fields ----
    options: {
      type: [String],
      validate: {
        validator: function (v) {
          return this.type !== "mcq" || (Array.isArray(v) && v.length >= 2);
        },
        message: "MCQ questions need at least 2 options",
      },
    },
    correctOptionIndex: { type: Number },

    // ---- Coding fields ----
    languages: {
      type: [String],
      enum: ["java", "python", "cpp"],
    },
    inputFormat: { type: String, default: "" },
    outputFormat: { type: String, default: "" },
    constraints: { type: String, default: "" },
    sampleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

questionSchema.index({ test: 1 });
questionSchema.index({ topic: 1, subtopic: 1, difficulty: 1 });
questionSchema.index({ source: 1, status: 1 });
questionSchema.index({ type: 1, difficulty: 1 });

export default mongoose.model("Question", questionSchema);
