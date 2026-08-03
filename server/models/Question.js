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
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    type: { type: String, enum: ["mcq", "coding"], required: true },
    questionText: { type: String, required: true },
    marks: { type: Number, required: true, min: 1 },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },

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
    sampleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [testCaseSchema], default: [] },
  },
  { timestamps: true }
);

questionSchema.index({ test: 1 });
questionSchema.index({ test: 1, type: 1, difficulty: 1 });
questionSchema.index({ type: 1, difficulty: 1 });

export default mongoose.model("Question", questionSchema);
