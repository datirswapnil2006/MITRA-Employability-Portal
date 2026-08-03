import mongoose from "mongoose";

const bookmarkNoteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    note: { type: String, default: "" },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

bookmarkNoteSchema.index({ student: 1, question: 1 }, { unique: true });
bookmarkNoteSchema.index({ student: 1, updatedAt: -1 });

export default mongoose.model("BookmarkNote", bookmarkNoteSchema);
