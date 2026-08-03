import mongoose from "mongoose";

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["pdf", "link", "note"],
      required: true,
    },
    // For PDFs: server-local file path; for links: the URL; for notes: unused
    fileUrl: { type: String, trim: true },
    // Rich-text or markdown content (used for "note" type)
    content: { type: String },
    isVisible: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

studyMaterialSchema.index({ category: 1, isVisible: 1 });

export default mongoose.model("StudyMaterial", studyMaterialSchema);
