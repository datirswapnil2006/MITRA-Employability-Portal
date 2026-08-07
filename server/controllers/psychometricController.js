import PsychometricTest from "../models/PsychometricTest.js";
import PsychometricAttempt from "../models/PsychometricAttempt.js";
import PsychometricTrait from "../models/PsychometricTrait.js";
import PsychometricQuestionBank from "../models/PsychometricQuestionBank.js";
import PsychometricPromptTemplate from "../models/PsychometricPromptTemplate.js";
import { generatePsychometricDrafts, regenerateSingleQuestion } from "../services/aiPsychometricGenerator.js";
import { evaluatePsychometricAttempt } from "../services/psychometricScoringEngine.js";

export const PSYCHOMETRIC_CATEGORIES = [
  "Personality Traits",
  "Emotional Intelligence",
  "Behavioral Assessment",
  "Workplace Styles",
  "Leadership Potential",
  "Situational Judgment",
];

export const DEFAULT_PSYCHOMETRIC_TRAITS = [
  { key: "openness", name: "Openness to Experience", description: "Curiosity, creativity, and openness to novel ideas.", minScore: 1, maxScore: 5 },
  { key: "conscientiousness", name: "Conscientiousness", description: "Organization, dependability, and goal-directed behavior.", minScore: 1, maxScore: 5 },
  { key: "extraversion", name: "Extraversion", description: "Sociability, assertiveness, and positive emotionality.", minScore: 1, maxScore: 5 },
  { key: "agreeableness", name: "Agreeableness", description: "Compassion, cooperativeness, and trust in others.", minScore: 1, maxScore: 5 },
  { key: "emotional_stability", name: "Emotional Stability", description: "Resilience to stress, composure, and emotional poise.", minScore: 1, maxScore: 5 },
];

// Helper: Sanitize question objects by removing temporary frontend non-ObjectId _id strings
const sanitizeQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => {
    const copy = { ...q };
    if (copy._id && typeof copy._id === "string" && !/^[0-9a-fA-F]{24}$/.test(copy._id)) {
      delete copy._id;
    }
    return copy;
  });
};

// @route GET /api/psychometric   (admin)
export const getAllPsychometric = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: "i" };
    }

    const tests = await PsychometricTest.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch psychometric assessments", error: err.message });
  }
};

// @route GET /api/psychometric/student/available   (student)
export const getStudentAvailablePsychometric = async (req, res) => {
  try {
    const publishedTests = await PsychometricTest.find({
      isEnabled: true,
      status: "published",
    }).sort({ createdAt: -1 }).lean();

    const attempts = await PsychometricAttempt.find({ student: req.user._id }).lean();
    const attemptMap = new Map();
    attempts.forEach((a) => attemptMap.set(String(a.psychometricTest), a));

    const withAttemptStatus = publishedTests.map((t) => {
      const att = attemptMap.get(String(t._id));
      return {
        ...t,
        attemptStatus: att ? att.status : "not_started",
        attemptId: att ? att._id : null,
        completedAt: att ? att.completedAt : null,
      };
    });

    res.json(withAttemptStatus);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch available psychometric tests", error: err.message });
  }
};

// @route GET /api/psychometric/:id   (admin & student)
export const getPsychometricById = async (req, res) => {
  try {
    const test = await PsychometricTest.findById(req.params.id).populate("createdBy", "name email");
    if (!test) return res.status(404).json({ message: "Psychometric assessment not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch psychometric assessment", error: err.message });
  }
};

// @route POST /api/psychometric   (admin)
export const createPsychometric = async (req, res) => {
  try {
    const { title, description, instructions, durationMinutes, category, traits, questions, navigationPolicySettings } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    if (!PSYCHOMETRIC_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category selection" });
    }

    const finalTraits = Array.isArray(traits) && traits.length > 0 ? traits : DEFAULT_PSYCHOMETRIC_TRAITS;
    const finalQuestions = sanitizeQuestions(questions);

    const test = await PsychometricTest.create({
      title,
      description: description || "",
      instructions: instructions || "Answer all questions candidly. There are no right or wrong answers.",
      durationMinutes: Number(durationMinutes) || 15,
      category,
      status: "draft",
      isEnabled: false,
      traits: finalTraits,
      questions: finalQuestions,
      navigationPolicySettings: navigationPolicySettings || {},
      createdBy: req.user._id,
    });

    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to create psychometric assessment", error: err.message });
  }
};

// @route PUT /api/psychometric/:id   (admin)
export const updatePsychometric = async (req, res) => {
  try {
    const { title, description, instructions, durationMinutes, category, traits, questions, navigationPolicySettings } = req.body;

    const test = await PsychometricTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Psychometric assessment not found" });

    if (title) test.title = title;
    if (description !== undefined) test.description = description;
    if (instructions !== undefined) test.instructions = instructions;
    if (durationMinutes !== undefined) test.durationMinutes = Number(durationMinutes);
    if (category) test.category = category;
    if (Array.isArray(traits)) test.traits = traits;
    if (Array.isArray(questions)) test.questions = sanitizeQuestions(questions);
    if (navigationPolicySettings !== undefined) test.navigationPolicySettings = navigationPolicySettings;

    await test.save();
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to update psychometric assessment", error: err.message });
  }
};

// @route PATCH /api/psychometric/:id/toggle   (admin)
export const togglePsychometric = async (req, res) => {
  try {
    const test = await PsychometricTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Psychometric assessment not found" });

    if (!test.isEnabled || test.status === "draft") {
      if (!test.traits || test.traits.length === 0) {
        return res.status(400).json({ message: "Configure at least one personality trait scale before publishing this assessment." });
      }
      if (!test.questions || test.questions.length === 0) {
        return res.status(400).json({ message: "Add at least one psychometric question before publishing this assessment." });
      }

      test.isEnabled = true;
      test.status = "published";
    } else {
      test.isEnabled = false;
      test.status = "draft";
    }

    await test.save();
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle psychometric assessment state", error: err.message });
  }
};

// @route DELETE /api/psychometric/:id   (admin)
export const deletePsychometric = async (req, res) => {
  try {
    const test = await PsychometricTest.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ message: "Psychometric assessment not found" });
    res.json({ message: "Psychometric assessment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete psychometric assessment", error: err.message });
  }
};

// @route POST /api/psychometric/generate-ai   (admin)
export const generateAIPsychometricQuestions = async (req, res) => {
  try {
    const {
      category,
      targetTraits,
      questionType,
      count,
      seniorityLevel,
      difficulty,
      language,
      includeReverseScored,
      customPrompt,
      modelPreference,
    } = req.body;

    if (!category || !Array.isArray(targetTraits) || targetTraits.length === 0) {
      return res.status(400).json({ message: "Category and targetTraits are required for AI psychometric generation" });
    }

    const drafts = await generatePsychometricDrafts({
      category,
      targetTraits,
      questionType: questionType || "mixed",
      count: Number(count) || 5,
      seniorityLevel: seniorityLevel || "Entry-Level Campus Recruitment",
      difficulty: difficulty || "Intermediate",
      language: language || "English",
      includeReverseScored: includeReverseScored !== undefined ? includeReverseScored : true,
      customPrompt: customPrompt || "",
      modelPreference: modelPreference || "auto",
    });

    if (!drafts || drafts.length === 0) {
      return res.status(502).json({ message: "AI did not return any usable psychometric drafts. Please try again." });
    }

    res.json({ drafts });
  } catch (err) {
    const geminiMessage = err.response?.data?.error?.message;
    const status = err.response?.status;

    if (status === 429) {
      return res.status(429).json({
        message: "AI Service rate limit hit — wait a minute and try again, or generate fewer questions.",
        error: geminiMessage || err.message,
      });
    }

    res.status(500).json({
      message: "Failed to generate AI psychometric questions",
      error: geminiMessage || err.message,
    });
  }
};

// @route POST /api/psychometric/regenerate-single   (admin)
export const regenerateSinglePsychometricQuestion = async (req, res) => {
  try {
    const { category, targetTraits, existingQuestion, difficulty, language, modelPreference } = req.body;
    if (!existingQuestion) {
      return res.status(400).json({ message: "existingQuestion object is required" });
    }

    const regenerated = await regenerateSingleQuestion({
      category: category || "Personality Traits",
      targetTraits,
      existingQuestion,
      difficulty: difficulty || "Intermediate",
      language: language || "English",
      modelPreference: modelPreference || "auto",
    });

    if (!regenerated) {
      return res.status(502).json({ message: "Could not regenerate single question. Try again." });
    }

    res.json({ question: regenerated });
  } catch (err) {
    res.status(500).json({ message: "Single question regeneration failed", error: err.message });
  }
};

// ==========================================
// MODULE 1: TRAIT LIBRARY CONTROLLERS
// ==========================================

export const getAllTraits = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { slug: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const traits = await PsychometricTrait.find(filter).sort({ name: 1 });
    res.json(traits);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch traits from library", error: err.message });
  }
};

export const createTrait = async (req, res) => {
  try {
    const { name, slug, description, category, weight, minScore, maxScore } = req.body;
    if (!name) return res.status(400).json({ message: "Trait name is required" });

    const finalSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    const existing = await PsychometricTrait.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ message: `Trait slug '${finalSlug}' already exists.` });
    }

    const trait = await PsychometricTrait.create({
      name,
      slug: finalSlug,
      description: description || "",
      category: category || "Personality Traits",
      weight: Number(weight) || 1.0,
      minScore: Number(minScore) || 1,
      maxScore: Number(maxScore) || 5,
      createdBy: req.user._id,
    });

    res.status(201).json(trait);
  } catch (err) {
    res.status(500).json({ message: "Failed to create trait", error: err.message });
  }
};

export const updateTrait = async (req, res) => {
  try {
    const { name, slug, description, category, weight, minScore, maxScore } = req.body;
    const trait = await PsychometricTrait.findById(req.params.id);
    if (!trait) return res.status(404).json({ message: "Trait not found" });

    if (name) trait.name = name;
    if (slug) trait.slug = slug.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    if (description !== undefined) trait.description = description;
    if (category) trait.category = category;
    if (weight !== undefined) trait.weight = Number(weight);
    if (minScore !== undefined) trait.minScore = Number(minScore);
    if (maxScore !== undefined) trait.maxScore = Number(maxScore);

    await trait.save();
    res.json(trait);
  } catch (err) {
    res.status(500).json({ message: "Failed to update trait", error: err.message });
  }
};

export const deleteTrait = async (req, res) => {
  try {
    const trait = await PsychometricTrait.findByIdAndDelete(req.params.id);
    if (!trait) return res.status(404).json({ message: "Trait not found" });
    res.json({ message: "Trait deleted from library" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete trait", error: err.message });
  }
};

export const seedDefaultTraits = async (req, res) => {
  try {
    const count = await PsychometricTrait.countDocuments();
    if (count > 0) {
      const traits = await PsychometricTrait.find().sort({ name: 1 });
      return res.json({ message: "Trait library already populated", traits });
    }

    const defaultTraits = [
      { name: "Openness to Experience", slug: "openness", description: "Curiosity, creativity, and adaptability to novel ideas.", category: "Personality Traits", weight: 1.0 },
      { name: "Conscientiousness", slug: "conscientiousness", description: "Organization, dependability, precision, and goal-directed behavior.", category: "Personality Traits", weight: 1.0 },
      { name: "Extraversion", slug: "extraversion", description: "Sociability, assertiveness, enthusiasm, and outward communication.", category: "Personality Traits", weight: 1.0 },
      { name: "Agreeableness", slug: "agreeableness", description: "Empathy, cooperation, active listening, and team conflict resolution.", category: "Personality Traits", weight: 1.0 },
      { name: "Emotional Stability", slug: "emotional_stability", description: "Resilience, composure under pressure, and stress tolerance.", category: "Personality Traits", weight: 1.0 },
      { name: "Self-Awareness", slug: "self_awareness", description: "Recognizing one's emotions, strengths, and impact on others.", category: "Emotional Intelligence", weight: 1.0 },
      { name: "Situational Agility", slug: "situational_agility", description: "Navigating ambiguous scenarios and pivoting strategy.", category: "Situational Judgment", weight: 1.2 },
      { name: "Strategic Influence", slug: "strategic_influence", description: "Persuading stakeholders and inspiring alignment.", category: "Leadership Potential", weight: 1.2 },
    ];

    const seeded = await PsychometricTrait.insertMany(defaultTraits.map((t) => ({ ...t, createdBy: req.user._id })));
    res.status(201).json({ message: `Seeded ${seeded.length} traits`, traits: seeded });
  } catch (err) {
    res.status(500).json({ message: "Failed to seed default traits", error: err.message });
  }
};

// ==========================================
// MODULE 2: QUESTION BANK CONTROLLERS
// ==========================================

export const getAllQuestionBankItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.traitKey) filter.traitKey = req.query.traitKey;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.search) {
      filter.questionText = { $regex: req.query.search, $options: "i" };
    }

    const items = await PsychometricQuestionBank.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch questions from bank", error: err.message });
  }
};

export const createQuestionBankItem = async (req, res) => {
  try {
    const { questionText, type, traitKey, isReverseScored, situationContext, options, difficulty, language, category, source } = req.body;
    if (!questionText || !traitKey) {
      return res.status(400).json({ message: "questionText and traitKey are required" });
    }

    const item = await PsychometricQuestionBank.create({
      questionText,
      type: type || "likert",
      traitKey,
      isReverseScored: Boolean(isReverseScored),
      situationContext: situationContext || "",
      options: options || [],
      difficulty: difficulty || "Intermediate",
      language: language || "English",
      category: category || "Personality Traits",
      source: source || "manual",
      createdBy: req.user._id,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to save question to bank", error: err.message });
  }
};

export const deleteQuestionBankItem = async (req, res) => {
  try {
    const item = await PsychometricQuestionBank.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Question bank item not found" });
    res.json({ message: "Question removed from bank" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete question from bank", error: err.message });
  }
};

// ==========================================
// MODULE 3: AI PROMPT TEMPLATES CONTROLLERS
// ==========================================

export const getAllPromptTemplates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const templates = await PsychometricPromptTemplate.find(filter).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch prompt templates", error: err.message });
  }
};

export const createPromptTemplate = async (req, res) => {
  try {
    const { title, category, modelPreference, systemPrompt, customInstructions, isDefault } = req.body;
    if (!title || !category || !systemPrompt) {
      return res.status(400).json({ message: "Title, category, and systemPrompt are required" });
    }

    if (isDefault) {
      await PsychometricPromptTemplate.updateMany({ category }, { isDefault: false });
    }

    const template = await PsychometricPromptTemplate.create({
      title,
      category,
      modelPreference: modelPreference || "auto",
      systemPrompt,
      customInstructions: customInstructions || "",
      isDefault: Boolean(isDefault),
      createdBy: req.user._id,
    });

    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: "Failed to create prompt template", error: err.message });
  }
};

export const updatePromptTemplate = async (req, res) => {
  try {
    const { title, category, modelPreference, systemPrompt, customInstructions, isDefault } = req.body;
    const template = await PsychometricPromptTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Prompt template not found" });

    if (isDefault) {
      await PsychometricPromptTemplate.updateMany({ category: category || template.category }, { isDefault: false });
    }

    if (title) template.title = title;
    if (category) template.category = category;
    if (modelPreference) template.modelPreference = modelPreference;
    if (systemPrompt) template.systemPrompt = systemPrompt;
    if (customInstructions !== undefined) template.customInstructions = customInstructions;
    if (isDefault !== undefined) template.isDefault = Boolean(isDefault);

    await template.save();
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: "Failed to update prompt template", error: err.message });
  }
};

export const deletePromptTemplate = async (req, res) => {
  try {
    const template = await PsychometricPromptTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: "Prompt template not found" });
    res.json({ message: "Prompt template deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete prompt template", error: err.message });
  }
};

export const seedDefaultPromptTemplates = async (req, res) => {
  try {
    const count = await PsychometricPromptTemplate.countDocuments();
    if (count > 0) {
      const templates = await PsychometricPromptTemplate.find().sort({ createdAt: -1 });
      return res.json({ message: "Prompt templates already populated", templates });
    }

    const defaultTemplates = [
      {
        title: "Standard Big Five Personality Evaluator",
        category: "Personality Traits",
        modelPreference: "auto",
        systemPrompt: "You are an expert psychometrician. Generate balanced self-report Likert and forced choice questions measuring Openness, Conscientiousness, Extraversion, Agreeableness, and Emotional Stability.",
        customInstructions: "Target college recruits with realistic workplace scenarios.",
        isDefault: true,
      },
      {
        title: "Situational Judgment & Crisis Poise",
        category: "Situational Judgment",
        modelPreference: "auto",
        systemPrompt: "Generate situational judgment scenarios featuring high-pressure engineering incident response, client deadline tensions, and team resolution choices.",
        customInstructions: "Include 3 structured options with varying effectiveness scores (5, 3, 1).",
        isDefault: true,
      },
      {
        title: "Campus Leadership & Influence Profile",
        category: "Leadership Potential",
        modelPreference: "auto",
        systemPrompt: "Formulate behavioral questions assessing initiative, team motivation, delegating under pressure, and ethical alignment.",
        customInstructions: "Focus on entry-to-mid leadership potential.",
        isDefault: true,
      },
    ];

    const seeded = await PsychometricPromptTemplate.insertMany(defaultTemplates.map((t) => ({ ...t, createdBy: req.user._id })));
    res.status(201).json({ message: `Seeded ${seeded.length} prompt templates`, templates: seeded });
  } catch (err) {
    res.status(500).json({ message: "Failed to seed default prompt templates", error: err.message });
  }
};

// ==========================================
// STUDENT ATTEMPT ENGINE CONTROLLERS
// ==========================================

// @route POST /api/psychometric/attempt/start/:testId   (student)
export const startPsychometricAttempt = async (req, res) => {
  try {
    const test = await PsychometricTest.findById(req.params.testId);
    if (!test || !test.isEnabled || test.status !== "published") {
      return res.status(404).json({ message: "Psychometric assessment is not available" });
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + (test.durationMinutes || 15) * 60 * 1000);

    const attempt = await PsychometricAttempt.findOneAndUpdate(
      { student: req.user._id, psychometricTest: test._id },
      {
        $setOnInsert: {
          student: req.user._id,
          psychometricTest: test._id,
          startedAt,
          endsAt,
          answers: [],
        },
      },
      { upsert: true, new: true }
    );

    if (attempt.status === "submitted") {
      return res.status(409).json({ message: "You have already completed this psychometric assessment", attemptId: attempt._id });
    }

    if (new Date() > new Date(attempt.endsAt)) {
      attempt.status = "submitted";
      attempt.completedAt = new Date();
      await attempt.save();
      return res.status(409).json({ message: "Time for this assessment has expired", attemptId: attempt._id });
    }

    res.json({
      attemptId: attempt._id,
      endsAt: attempt.endsAt,
      test: {
        _id: test._id,
        title: test.title,
        category: test.category,
        instructions: test.instructions,
        durationMinutes: test.durationMinutes,
        traits: test.traits,
        navigationPolicySettings: test.navigationPolicySettings,
      },
      questions: test.questions,
      existingAnswers: attempt.answers || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to start psychometric assessment", error: err.message });
  }
};

const computeItemScore = (q, selectedOptionIndex, optionObj) => {
  if (q.type === "likert") {
    let raw = (Number(selectedOptionIndex) || 0) + 1;
    if (q.isReverseScored) {
      raw = 6 - raw;
    }
    return raw;
  }

  if (optionObj && typeof optionObj.score === "number") {
    return optionObj.score;
  }

  return 3;
};

// @route PUT /api/psychometric/attempt/:attemptId/answer   (student) - Real-time Auto Save
export const savePsychometricAnswer = async (req, res) => {
  try {
    const attempt = await PsychometricAttempt.findById(req.params.attemptId);
    if (!attempt || String(attempt.student) !== String(req.user._id)) {
      return res.status(404).json({ message: "Attempt session not found" });
    }

    if (attempt.status === "submitted") {
      return res.status(409).json({ message: "Assessment already submitted" });
    }

    const { questionId, selectedOptionIndex, timeSpentSeconds } = req.body;
    const test = await PsychometricTest.findById(attempt.psychometricTest);
    if (!test) return res.status(404).json({ message: "Assessment not found" });

    const question = test.questions.id(questionId) || test.questions.find((q) => String(q._id) === String(questionId));
    if (!question) return res.status(404).json({ message: "Question not found in assessment" });

    const selectedOptionObj = question.options?.[selectedOptionIndex];
    const optionText = selectedOptionObj?.optionText || (question.type === "likert" ? ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"][selectedOptionIndex] : "");
    const scoreAwarded = computeItemScore(question, selectedOptionIndex, selectedOptionObj);

    const existingIdx = attempt.answers.findIndex((a) => String(a.questionId) === String(questionId));

    const answerPayload = {
      questionId: String(question._id),
      type: question.type,
      traitKey: question.traitKey,
      isReverseScored: question.isReverseScored,
      selectedOptionIndex,
      selectedOptionText: optionText || "",
      scoreAwarded,
      timeSpentSeconds: timeSpentSeconds || 0,
    };

    if (existingIdx >= 0) {
      attempt.answers[existingIdx] = answerPayload;
    } else {
      attempt.answers.push(answerPayload);
    }

    await attempt.save();
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to save response", error: err.message });
  }
};

// @route POST /api/psychometric/attempt/:attemptId/submit   (student)
export const submitPsychometricAttempt = async (req, res) => {
  try {
    const attempt = await PsychometricAttempt.findById(req.params.attemptId);
    if (!attempt || String(attempt.student) !== String(req.user._id)) {
      return res.status(404).json({ message: "Attempt session not found" });
    }

    const test = await PsychometricTest.findById(attempt.psychometricTest);
    if (!test) return res.status(404).json({ message: "Assessment test not found" });

    const evaluation = await evaluatePsychometricAttempt(attempt, test);

    attempt.traitBreakdown = evaluation.traitBreakdown;
    attempt.personalityProfile = evaluation.personalityProfile;
    attempt.strengths = evaluation.strengths;
    attempt.developmentAreas = evaluation.developmentAreas;
    attempt.workplaceStyle = evaluation.workplaceStyle;
    attempt.careerRecommendations = evaluation.careerRecommendations;

    const traitScoresMap = new Map();
    evaluation.traitBreakdown.forEach((t) => traitScoresMap.set(t.key, t.percentage));
    attempt.traitScores = traitScoresMap;

    const { exitReason, violationCount, auditLogs } = req.body || {};
    if (exitReason) attempt.exitReason = exitReason;
    if (typeof violationCount === "number") attempt.violationCount = violationCount;
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      attempt.auditLogs.push(...auditLogs);
    }

    attempt.status = "submitted";
    attempt.completedAt = new Date();

    await attempt.save();

    res.json({
      attemptId: attempt._id,
      status: "submitted",
      completedAt: attempt.completedAt,
      exitReason: attempt.exitReason,
      evaluation,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit & evaluate assessment", error: err.message });
  }
};

// @route GET /api/psychometric/attempt/:attemptId   (student & admin)
export const getPsychometricAttempt = async (req, res) => {
  try {
    const attempt = await PsychometricAttempt.findById(req.params.attemptId)
      .populate("psychometricTest", "title category traits description instructions durationMinutes")
      .populate("student", "name email erpNumber branch year section");

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (req.user.role === "student" && String(attempt.student._id || attempt.student) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attempt details", error: err.message });
  }
};

// @route GET /api/psychometric/attempt/:attemptId/analysis   (student & admin)
export const getPsychometricAttemptAnalysis = async (req, res) => {
  try {
    const attempt = await PsychometricAttempt.findById(req.params.attemptId)
      .populate("psychometricTest", "title category traits description")
      .populate("student", "name email erpNumber branch year section");

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    if (req.user.role === "student" && String(attempt.student._id || attempt.student) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (attempt.status !== "submitted") {
      return res.status(400).json({ message: "Assessment attempt has not been submitted yet" });
    }

    res.json({
      attemptId: attempt._id,
      completedAt: attempt.completedAt,
      student: attempt.student,
      test: attempt.psychometricTest,
      traitBreakdown: attempt.traitBreakdown || [],
      personalityProfile: attempt.personalityProfile || {},
      strengths: attempt.strengths || [],
      developmentAreas: attempt.developmentAreas || [],
      workplaceStyle: attempt.workplaceStyle || {},
      careerRecommendations: attempt.careerRecommendations || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch psychometric analysis", error: err.message });
  }
};

// ==========================================
// ADMIN INSTITUTIONAL ANALYTICS CONTROLLER
// ==========================================

// @route GET /api/psychometric/admin/analytics   (admin)
export const getAdminPsychometricAnalytics = async (req, res) => {
  try {
    const [totalAssessments, totalPublished, submittedAttempts] = await Promise.all([
      PsychometricTest.countDocuments({}),
      PsychometricTest.countDocuments({ isEnabled: true, status: "published" }),
      PsychometricAttempt.find({ status: "submitted" })
        .populate("student", "name email erpNumber branch year section")
        .populate("psychometricTest", "title category traits")
        .sort({ completedAt: -1 })
        .lean(),
    ]);

    const studentSet = new Set();
    submittedAttempts.forEach((a) => {
      if (a.student?._id) studentSet.add(String(a.student._id));
    });
    const uniqueStudentsCount = studentSet.size;

    let filteredAttempts = submittedAttempts;
    if (req.query.testId) {
      filteredAttempts = filteredAttempts.filter(
        (a) => String(a.psychometricTest?._id) === req.query.testId
      );
    }
    if (req.query.branch) {
      filteredAttempts = filteredAttempts.filter(
        (a) => a.student?.branch === req.query.branch
      );
    }

    const archetypeMap = new Map();
    filteredAttempts.forEach((a) => {
      const arch = a.personalityProfile?.archetype || "Adaptive Professional";
      archetypeMap.set(arch, (archetypeMap.get(arch) || 0) + 1);
    });

    const archetypeDistribution = Array.from(archetypeMap.entries()).map(
      ([archetype, count]) => ({
        archetype,
        count,
        percentage:
          filteredAttempts.length > 0
            ? Math.round((count / filteredAttempts.length) * 100)
            : 0,
      })
    );

    const deptTraitMap = new Map();

    filteredAttempts.forEach((a) => {
      const branch = a.student?.branch || "General / Unassigned";
      if (!deptTraitMap.has(branch)) {
        deptTraitMap.set(branch, new Map());
      }
      const traitScores = deptTraitMap.get(branch);

      (a.traitBreakdown || []).forEach((t) => {
        const curr = traitScores.get(t.key) || { name: t.name, sum: 0, count: 0 };
        curr.sum += t.percentage || 0;
        curr.count += 1;
        traitScores.set(t.key, curr);
      });
    });

    const departmentTraitAnalytics = Array.from(deptTraitMap.entries()).map(
      ([branch, traitMap]) => {
        const traitAverages = Array.from(traitMap.entries()).map(([key, data]) => ({
          key,
          name: data.name,
          averagePercentage: data.count > 0 ? Math.round(data.sum / data.count) : 0,
        }));
        return {
          branch,
          candidateCount: filteredAttempts.filter((a) => (a.student?.branch || "General / Unassigned") === branch).length,
          traitAverages,
        };
      }
    );

    const attemptLogs = filteredAttempts.map((a) => ({
      attemptId: a._id,
      studentName: a.student?.name || "Candidate",
      erpNumber: a.student?.erpNumber || "—",
      branch: a.student?.branch || "Unassigned",
      year: a.student?.year || "—",
      testTitle: a.psychometricTest?.title || "Assessment",
      category: a.psychometricTest?.category || "General",
      archetype: a.personalityProfile?.archetype || "Adaptive Professional",
      completedAt: a.completedAt,
      traitBreakdown: a.traitBreakdown || [],
    }));

    res.json({
      summary: {
        totalAssessments,
        totalPublished,
        totalCompletedAttempts: submittedAttempts.length,
        uniqueStudentsCount,
      },
      archetypeDistribution,
      departmentTraitAnalytics,
      attemptLogs,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch admin psychometric analytics",
      error: err.message,
    });
  }
};
