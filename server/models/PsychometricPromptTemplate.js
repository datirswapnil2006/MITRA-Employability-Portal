import mongoose from "mongoose";

const psychometricPromptTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
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
    modelPreference: {
      type: String,
      enum: ["auto", "gemini", "groq", "huggingface"],
      default: "auto",
    },
    systemPrompt: { type: String, required: true, trim: true },
    customInstructions: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("PsychometricPromptTemplate", psychometricPromptTemplateSchema);
