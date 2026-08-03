import mongoose from "mongoose";

// Pre-loaded by the admin (bulk import) so registration can verify
// that only authorized students are able to create an account.
const allowedErpSchema = new mongoose.Schema(
  {
    erpNumber: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    branch: { type: String, trim: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("AllowedErp", allowedErpSchema);
