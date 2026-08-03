import mongoose from "mongoose";

export const EVENT_TYPES = [
  "tab_switch",
  "fullscreen_exit",
  "copy_attempt",
  "paste_attempt",
  "right_click",
  "no_face",
  "multiple_faces",
  "camera_unavailable",
];

export const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];

// Cumulative-score policy: each event adds its weight to the attempt's running
// total. Crossing AUTO_SUBMIT_THRESHOLD force-submits the test immediately.
// A single Critical event (e.g. multiple faces) is enough on its own; smaller
// violations (tab switches, right-clicks) only trigger it if they stack up.
export const SEVERITY_WEIGHT = { Low: 1, Medium: 3, High: 6, Critical: 15 };
export const AUTO_SUBMIT_THRESHOLD = 15;

// Default severity per event type — used as a fallback if the client
// doesn't specify one, and kept here so grading policy lives in one place.
export const DEFAULT_SEVERITY = {
  tab_switch: "Medium",
  fullscreen_exit: "High",
  copy_attempt: "High",
  paste_attempt: "Medium",
  right_click: "Low",
  no_face: "Medium",
  multiple_faces: "Critical",
  camera_unavailable: "Low",
};

export const EVENT_LABEL = {
  tab_switch: "Tab switched",
  fullscreen_exit: "Full-screen exited",
  copy_attempt: "Copy attempt",
  paste_attempt: "Paste attempt",
  right_click: "Right-click attempt",
  no_face: "No face detected",
  multiple_faces: "Multiple faces detected",
  camera_unavailable: "Camera unavailable",
};

const proctorEventSchema = new mongoose.Schema(
  {
    attempt: { type: mongoose.Schema.Types.ObjectId, ref: "Attempt", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    type: { type: String, enum: EVENT_TYPES, required: true },
    severity: { type: String, enum: SEVERITY_LEVELS, required: true },
    detail: { type: String, default: "" }, // optional extra context, e.g. "3 faces"
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

proctorEventSchema.index({ test: 1, occurredAt: -1 });
proctorEventSchema.index({ student: 1, occurredAt: -1 });

export default mongoose.model("ProctorEvent", proctorEventSchema);
