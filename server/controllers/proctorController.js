import Attempt from "../models/Attempt.js";
import ProctorEvent, { getProctoringStatus } from "../models/ProctorEvent.js";
import { DEFAULT_SEVERITY, EVENT_TYPES, SEVERITY_WEIGHT, AUTO_SUBMIT_THRESHOLD, EVENT_LABEL } from "../models/ProctorEvent.js";
import { gradeAttempt } from "./attemptController.js";

// @route POST /api/proctor/:attemptId/event   (student)
// Fire-and-forget logging from the attempt page. Never blocks the test —
// if this fails, the student's test experience is unaffected. If the
// cumulative severity of an attempt's events crosses AUTO_SUBMIT_THRESHOLD,
// the attempt is force-submitted and flagged for admin review right here.
export const logEvent = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId);
    if (!attempt || String(attempt.student) !== String(req.user._id)) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const { type, detail } = req.body;
    if (!EVENT_TYPES.includes(type)) {
      return res.status(400).json({ message: "Unknown event type" });
    }

    const severity = DEFAULT_SEVERITY[type];

    await ProctorEvent.create({
      attempt: attempt._id,
      student: attempt.student,
      test: attempt.test,
      type,
      severity,
      detail: detail || "",
    });

    // Already submitted (e.g. a late event after normal submission) — nothing more to do.
    if (attempt.status !== "in-progress") {
      return res.status(201).json({ logged: true, autoSubmitted: false });
    }

    const events = await ProctorEvent.find({ attempt: attempt._id });
    const cumulativeScore = events.reduce((sum, e) => sum + (SEVERITY_WEIGHT[e.severity] || 0), 0);

    if (cumulativeScore >= AUTO_SUBMIT_THRESHOLD) {
      const reason = `Auto-submitted after "${EVENT_LABEL[type] || type}" (severity: ${severity}); cumulative violation score ${cumulativeScore}/${AUTO_SUBMIT_THRESHOLD}.`;

      attempt.flagged = true;
      attempt.autoSubmitted = true;
      attempt.flagReason = reason;
      await gradeAttempt(attempt); // grades, sets status "submitted", saves

      return res.status(201).json({
        logged: true,
        autoSubmitted: true,
        reason,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
      });
    }

    res.status(201).json({ logged: true, autoSubmitted: false });
  } catch (err) {
    // Never let a logging failure surface as a disruptive error to the student.
    res.status(200).json({ logged: false, autoSubmitted: false });
  }
};

// @route GET /api/proctor?testId=&branch=&severity=&studentId=   (admin)
export const getEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.testId) filter.test = req.query.testId;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.studentId) filter.student = req.query.studentId;

    let events = await ProctorEvent.find(filter)
      .populate("student", "name erpNumber branch email")
      .populate("test", "title category")
      .populate("attempt", "status totalScore maxScore startedAt submittedAt autoSubmitted flagReason")
      .sort({ occurredAt: -1 })
      .limit(500);

    if (req.query.branch) {
      events = events.filter((e) => e.student?.branch === req.query.branch);
    }

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch proctoring events", error: err.message });
  }
};

// @route GET /api/proctor/summary   (admin)
// Quick counts for a dashboard badge — how many High/Critical events are unreviewed-worthy today.
export const getSummary = async (req, res) => {
  try {
    const [critical, high, total] = await Promise.all([
      ProctorEvent.countDocuments({ severity: "Critical" }),
      ProctorEvent.countDocuments({ severity: "High" }),
      ProctorEvent.countDocuments({}),
    ]);
    res.json({ critical, high, total });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch summary", error: err.message });
  }
};
