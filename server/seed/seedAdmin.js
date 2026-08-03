// Run with: npm run seed:admin
// Creates the first admin account directly in the database.
// Admins are intentionally never created through the public API.
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@college.edu";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await User.create({
    role: "admin",
    status: "approved",
    name: "Placement Cell Admin",
    email,
    password,
  });

  console.log(`Admin created -> email: ${email}  password: ${password}`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
