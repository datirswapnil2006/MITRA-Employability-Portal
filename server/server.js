import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import proctorRoutes from "./routes/proctorRoutes.js";
import psychometricRoutes from "./routes/psychometricRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import selfTestRoutes from "./routes/selfTestRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();
connectDB();

// Ensure upload directories exist
["uploads/temp", "uploads/materials"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const app = express();

// Support multiple origins (comma-separated CLIENT_URL) for dev + production
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, "")); // strip trailing slashes

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/proctor", proctorRoutes);
app.use("/api/psychometric", psychometricRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/self-test", selfTestRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
