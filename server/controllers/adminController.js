import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import Test from "../models/Test.js";

// @route GET /api/admin/registrations?status=approved&branch=CSE   (admin)
// Defaults to approved; pass ?status=pending or ?status=rejected to filter.
// Optional ?branch=CSE further narrows results to that department.
export const getRegistrations = async (req, res) => {
  try {
    const status = req.query.status || "approved";
    const filter = { role: "student" };
    if (status !== "all") filter.status = status;
    if (req.query.branch) filter.branch = req.query.branch;

    const students = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch registrations", error: err.message });
  }
};

// @route PATCH /api/admin/registrations/:id/approve   (admin)
export const approveRegistration = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });
    student.status = "approved";
    await student.save();
    res.json({ message: "Student approved", student: student.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve student", error: err.message });
  }
};

// @route PATCH /api/admin/registrations/:id/reject   (admin)
export const rejectRegistration = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });
    student.status = "rejected";
    await student.save();
    res.json({ message: "Student rejected", student: student.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject student", error: err.message });
  }
};

// @route GET /api/admin/students   (admin)
// Lists every registered student with a quick summary of their attempts.
// Optional ?branch=CSE & ?year=4th Year & ?search=Rahul
export const getAllStudents = async (req, res) => {
  try {
    const filter = { role: "student" };
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.year) filter.year = req.query.year;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { name: searchRegex },
        { erpNumber: searchRegex },
        { email: searchRegex },
      ];
    }

    const students = await User.find(filter).select("-password").sort({ createdAt: -1 });

    const summaries = await Promise.all(
      students.map(async (s) => {
        const attempts = await Attempt.find({ student: s._id, status: "submitted" });
        const testsTaken = attempts.length;
        const totalScore = attempts.reduce((sum, a) => sum + a.totalScore, 0);
        const totalMax = attempts.reduce((sum, a) => sum + a.maxScore, 0);
        return {
          ...s.toObject(),
          testsTaken,
          averagePercent: totalMax ? Math.round((totalScore / totalMax) * 100) : null,
        };
      })
    );

    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students", error: err.message });
  }
};

// @route GET /api/admin/overview   (admin)
export const getOverview = async (req, res) => {
  try {
    const [
      totalStudents,
      pendingRegistrations,
      totalTests,
      activeTests,
      attempts,
      recentStudents,
      recentAttempts,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", status: "pending" }),
      Test.countDocuments(),
      Test.countDocuments({ isEnabled: true }),
      Attempt.find({ status: "submitted" }),
      User.find({ role: "student" })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5),
      Attempt.find({ status: "submitted" })
        .populate("student", "name erpNumber")
        .populate("test", "title")
        .sort({ submittedAt: -1 })
        .limit(5),
    ]);

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, a) => sum + a.totalScore, 0);
    const totalMax = attempts.reduce((sum, a) => sum + a.maxScore, 0);

    res.json({
      totalStudents,
      pendingRegistrations,
      totalTests,
      activeTests,
      totalAttempts,
      averagePercent: totalMax ? Math.round((totalScore / totalMax) * 100) : null,
      recentStudents,
      recentAttempts,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch overview", error: err.message });
  }
};
// @route GET /api/admin/flagged-attempts   (admin)
// The direct answer to "which students tried to cheat" — every attempt that
// was auto-submitted by the proctoring system, most recent first.
export const getFlaggedAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ flagged: true })
      .populate("student", "name erpNumber branch year section")
      .populate("test", "title category")
      .sort({ submittedAt: -1 });
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch flagged attempts", error: err.message });
  }
};

// @route DELETE /api/admin/flagged-attempts   (admin)
export const clearFlaggedAttempts = async (req, res) => {
  try {
    await Attempt.deleteMany({ flagged: true });
    res.json({ message: "All flagged attempts cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear flagged attempts", error: err.message });
  }
};

// @route DELETE /api/admin/flagged-attempts/:id   (admin)
export const deleteFlaggedAttemptById = async (req, res) => {
  try {
    await Attempt.findByIdAndDelete(req.params.id);
    res.json({ message: "Flagged attempt deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete attempt", error: err.message });
  }
};


// @route GET /api/admin/students/:id   (admin)
// Full drill-down: student profile + every submitted attempt with per-question detail.
export const getStudentDetail = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const attempts = await Attempt.find({ student: student._id })
      .populate("test", "title category totalMarks durationMinutes")
      .sort({ createdAt: -1 });

    res.json({ student, attempts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student", error: err.message });
  }
};
