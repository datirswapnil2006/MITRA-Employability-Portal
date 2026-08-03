import PsychometricTest from "../models/PsychometricTest.js";

// @route GET /api/psychometric   (admin)
export const getAllPsychometric = async (req, res) => {
  try {
    const tests = await PsychometricTest.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch psychometric tests", error: err.message });
  }
};

// @route GET /api/psychometric/:id   (admin)
export const getPsychometricById = async (req, res) => {
  try {
    const test = await PsychometricTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Psychometric test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch psychometric test", error: err.message });
  }
};

// @route POST /api/psychometric   (admin)
export const createPsychometric = async (req, res) => {
  try {
    const { title, description, category, scales, questions } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: "title and category are required" });
    }
    const test = await PsychometricTest.create({
      title,
      description,
      category,
      scales: scales || [],
      questions: questions || [],
      createdBy: req.user._id,
    });
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to create psychometric test", error: err.message });
  }
};

// @route PUT /api/psychometric/:id   (admin)
export const updatePsychometric = async (req, res) => {
  try {
    const test = await PsychometricTest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!test) return res.status(404).json({ message: "Psychometric test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to update psychometric test", error: err.message });
  }
};

// @route PATCH /api/psychometric/:id/toggle   (admin)
export const togglePsychometric = async (req, res) => {
  try {
    const test = await PsychometricTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Psychometric test not found" });
    test.isEnabled = !test.isEnabled;
    await test.save();
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle psychometric test", error: err.message });
  }
};

// @route DELETE /api/psychometric/:id   (admin)
export const deletePsychometric = async (req, res) => {
  try {
    const test = await PsychometricTest.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ message: "Psychometric test not found" });
    res.json({ message: "Psychometric test deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete psychometric test", error: err.message });
  }
};
