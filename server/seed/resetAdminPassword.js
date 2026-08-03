// One-off utility: resets an existing admin's password.
// Usage: SEED_ADMIN_EMAIL=admin@college.edu SEED_ADMIN_PASSWORD=NewPass123 npm run reset:admin-password
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@college.edu";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) {
    console.log(`No admin found with email ${email}`);
    process.exit(1);
  }

  admin.password = password; // pre-save hook re-hashes this automatically
  await admin.save();

  console.log(`Password reset for ${email} -> ${password}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
