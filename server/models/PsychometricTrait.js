import mongoose from "mongoose";

const psychometricTraitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true }, // e.g., "openness", "conscientiousness"
    description: { type: String, trim: true, default: "" },
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
    weight: { type: Number, default: 1.0, min: 0, max: 10 },
    minScore: { type: Number, default: 1 },
    maxScore: { type: Number, default: 5 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("PsychometricTrait", psychometricTraitSchema);
