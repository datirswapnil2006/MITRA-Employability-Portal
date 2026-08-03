import Question from "../models/Question.js";
import Test from "../models/Test.js";
import StudentStats from "../models/StudentStats.js";
import { runAgainstTestCases } from "./codeRunner.js";

// Standard achievements list
export const ACHIEVEMENTS_DEF = [
  { key: "first_test", title: "First Steps", description: "Completed your first AI Self-Test", icon: "Flag" },
  { key: "streak_3", title: "Consistency Builder", description: "Maintained a 3-day practice streak", icon: "Zap" },
  { key: "streak_7", title: "Weekly Warrior", description: "Maintained a 7-day practice streak", icon: "Flame" },
  { key: "score_100", title: "Perfectionist", description: "Scored 100% on a self-test", icon: "Award" },
  { key: "coding_ninja", title: "Coding Ninja", description: "Passed all test cases in a coding self-test", icon: "Code" },
  { key: "practice_master", title: "Practice Titan", description: "Earned over 500 total XP", icon: "Trophy" },
];

/**
 * Ensures the Question Bank has a rich set of starter questions seeded across all categories.
 */
export const ensureQuestionBankSeeded = async () => {
  const count = await Question.countDocuments();
  if (count >= 30) return; // Already populated

  console.log("Seeding comprehensive Question Bank for Self-Test Generator...");

  const starterCategories = [
    {
      category: "Quantitative Aptitude",
      title: "Quantitative Aptitude Bank",
      questions: [
        { type: "mcq", questionText: "If a car travels at a speed of 60 km/h, how far will it travel in 2.5 hours?", options: ["120 km", "140 km", "150 km", "160 km"], correctOptionIndex: 2, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "What is 15% of 240?", options: ["30", "36", "42", "45"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/h?", options: ["30 km/h", "36 km/h", "40 km/h", "45 km/h"], correctOptionIndex: 1, difficulty: "Medium", marks: 2 },
        { type: "mcq", questionText: "A man buys an article for $80 and sells it for $100. What is his profit percentage?", options: ["20%", "25%", "30%", "15%"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "If 5 workers can build a wall in 12 days, how many days will 10 workers take?", options: ["5 days", "6 days", "8 days", "10 days"], correctOptionIndex: 1, difficulty: "Medium", marks: 2 },
        { type: "mcq", questionText: "The ratio of two numbers is 3:4 and their sum is 84. What is the larger number?", options: ["36", "48", "52", "60"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "What is the compound interest on $1000 at 10% per annum for 2 years compounded annually?", options: ["$200", "$210", "$220", "$250"], correctOptionIndex: 1, difficulty: "Medium", marks: 2 },
        { type: "mcq", questionText: "A tap can fill a tank in 6 hours. Another tap can empty it in 8 hours. If both taps are open, in how many hours will the tank be full?", options: ["14 hours", "20 hours", "24 hours", "28 hours"], correctOptionIndex: 2, difficulty: "Hard", marks: 3 },
      ],
    },
    {
      category: "Logical Reasoning",
      title: "Logical Reasoning Bank",
      questions: [
        { type: "mcq", questionText: "Find the next number in the series: 2, 6, 12, 20, 30, ?", options: ["38", "40", "42", "44"], correctOptionIndex: 2, difficulty: "Medium", marks: 2 },
        { type: "mcq", questionText: "If CAT is coded as 3120, how is DOG coded in the same pattern (A=1, B=2...)?", options: ["4157", "41515", "4147", "41518"], correctOptionIndex: 0, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?", options: ["His own", "His son's", "His father's", "His nephew's"], correctOptionIndex: 1, difficulty: "Hard", marks: 3 },
        { type: "mcq", questionText: "Which word does NOT belong with the others?", options: ["Leopard", "Cougar", "Elephant", "Cheetah"], correctOptionIndex: 2, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?", options: ["7", "10", "12", "13"], correctOptionIndex: 1, difficulty: "Medium", marks: 2 },
      ],
    },
    {
      category: "Data Structures & Algorithms",
      title: "DSA Core Bank",
      questions: [
        { type: "mcq", questionText: "What is the worst-case time complexity of QuickSort?", options: ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"], correctOptionIndex: 2, difficulty: "Medium", marks: 2 },
        { type: "mcq", questionText: "Which data structure operates on a Last In First Out (LIFO) basis?", options: ["Queue", "Stack", "Array", "Linked List"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "What is the minimum number of queues needed to implement a Priority Queue efficiently?", options: ["1", "2", "3", "None (Use Heap)"], correctOptionIndex: 3, difficulty: "Hard", marks: 3 },
        {
          type: "coding",
          questionText: "Write a program to reverse a given string. Read string from standard input and print reversed string.",
          difficulty: "Easy",
          marks: 5,
          languages: ["python", "java", "cpp"],
          sampleTestCases: [{ input: "hello", output: "olleh" }],
          hiddenTestCases: [{ input: "placement", output: "tnemecalp" }],
        },
        {
          type: "coding",
          questionText: "Given an integer N from standard input, write a program to calculate and output its factorial (N!).",
          difficulty: "Medium",
          marks: 5,
          languages: ["python", "java", "cpp"],
          sampleTestCases: [{ input: "5", output: "120" }],
          hiddenTestCases: [{ input: "4", output: "24" }],
        },
      ],
    },
    {
      category: "Verbal Ability",
      title: "Verbal Ability Bank",
      questions: [
        { type: "mcq", questionText: "Select the synonym of the word: PRAGMATIC", options: ["Theoretical", "Practical", "Arrogant", "Unrealistic"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "Select the antonym of the word: CANDID", options: ["Outspoken", "Secretive", "Honest", "Frank"], correctOptionIndex: 1, difficulty: "Medium", marks: 2 },
        { type: "mcq", questionText: "Choose the correctly spelled word:", options: ["Accomodate", "Accommodate", "Acommodate", "Accomadate"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "Complete the sentence: She has an aptitude _____ learning foreign languages.", options: ["in", "to", "for", "with"], correctOptionIndex: 2, difficulty: "Easy", marks: 1 },
      ],
    },
    {
      category: "Core Computer Science",
      title: "Core CS Fundamentals Bank",
      questions: [
        { type: "mcq", questionText: "Which of the following is NOT a property of ACID transactions in Database Systems?", options: ["Atomicity", "Consistency", "Isolation", "Concurrency"], correctOptionIndex: 3, difficulty: "Medium", marks: 2 },
        { type: "mcq", questionText: "In Operating Systems, what condition occurs when two or more processes are blocked waiting for resources held by each other?", options: ["Paging", "Deadlock", "Thrashing", "Starvation"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "Which OSI layer is responsible for routing data packets across network boundaries?", options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"], correctOptionIndex: 1, difficulty: "Medium", marks: 2 },
      ],
    },
    {
      category: "Cloud Computing",
      title: "Cloud Computing Essentials Bank",
      questions: [
        { type: "mcq", questionText: "Which Cloud deployment model provides infrastructure exclusively for a single organization?", options: ["Public Cloud", "Private Cloud", "Hybrid Cloud", "Community Cloud"], correctOptionIndex: 1, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "AWS EC2 is an example of which Cloud service model?", options: ["IaaS (Infrastructure as a Service)", "PaaS (Platform as a Service)", "SaaS (Software as a Service)", "FaaS (Function as a Service)"], correctOptionIndex: 0, difficulty: "Easy", marks: 1 },
        { type: "mcq", questionText: "What does Serverless Computing mean?", options: ["No servers exist anywhere", "Developers do not manage or provision server infrastructure", "Code runs strictly on local machines", "Servers are free of cost"], correctOptionIndex: 1, difficulty: "Medium", marks: 2 },
      ],
    },
  ];

  for (const catData of starterCategories) {
    let testDoc = await Test.findOne({ category: catData.category });
    if (!testDoc) {
      testDoc = await Test.create({
        title: catData.title,
        category: catData.category,
        description: `Practice question repository for ${catData.category}`,
        durationMinutes: 30,
        totalMarks: 50,
        isEnabled: true,
        isPractice: true,
      });
    }

    for (const qData of catData.questions) {
      const exists = await Question.findOne({ questionText: qData.questionText });
      if (!exists) {
        await Question.create({
          ...qData,
          test: testDoc._id,
        });
      }
    }
  }

  console.log("Comprehensive Question Bank successfully populated!");
};

/**
 * Samples questions dynamically from the Question collection with strict topic adherence.
 */
export const sampleQuestions = async ({
  topics = [],
  difficulty = "Mixed",
  questionCount = 10,
  questionType = "Mixed",
  language = "python",
  prioritizeWrong = false,
  wrongQuestionIds = [],
}) => {
  // Ensure DB has questions
  await ensureQuestionBankSeeded();

  const hasSelectedTopics = Array.isArray(topics) && topics.length > 0;
  let testQuery = {};

  if (hasSelectedTopics) {
    const matchingTests = await Test.find({ category: { $in: topics } }).select("_id");
    const testIds = matchingTests.map((t) => t._id);
    testQuery = { test: { $in: testIds } };
  }

  // 1. Strict Query (selected topics + difficulty + type)
  const strictQuery = { ...testQuery };
  if (questionType === "MCQ") strictQuery.type = "mcq";
  if (questionType === "Coding") strictQuery.type = "coding";
  if (difficulty !== "Mixed") strictQuery.difficulty = difficulty;

  let candidates = await Question.find(strictQuery).populate("test", "title category");

  // 2. Fallback Step 1: Relax difficulty within the SAME selected topics
  if (candidates.length < questionCount && difficulty !== "Mixed") {
    const relaxedDiffQuery = { ...testQuery };
    if (questionType === "MCQ") relaxedDiffQuery.type = "mcq";
    if (questionType === "Coding") relaxedDiffQuery.type = "coding";

    const addCandidates = await Question.find(relaxedDiffQuery).populate("test", "title category");
    const existingIds = new Set(candidates.map((c) => String(c._id)));
    addCandidates.forEach((c) => {
      if (!existingIds.has(String(c._id))) {
        candidates.push(c);
        existingIds.add(String(c._id));
      }
    });
  }

  // 3. Fallback Step 2: Relax questionType within the SAME selected topics
  if (candidates.length < questionCount && questionType !== "Mixed") {
    const addCandidates = await Question.find(testQuery).populate("test", "title category");
    const existingIds = new Set(candidates.map((c) => String(c._id)));
    addCandidates.forEach((c) => {
      if (!existingIds.has(String(c._id))) {
        candidates.push(c);
        existingIds.add(String(c._id));
      }
    });
  }

  // 4. Fallback Step 3: ONLY if NO specific topics were selected, pull from entire Question collection
  if (!hasSelectedTopics && candidates.length < questionCount) {
    const allQuestions = await Question.find({}).populate("test", "title category");
    const existingIds = new Set(candidates.map((c) => String(c._id)));
    allQuestions.forEach((c) => {
      if (!existingIds.has(String(c._id))) {
        candidates.push(c);
        existingIds.add(String(c._id));
      }
    });
  }

  // If prioritizeWrong is requested, separate wrong questions and regular questions
  let selected = [];
  if (prioritizeWrong && wrongQuestionIds.length > 0) {
    const wrongSet = new Set(wrongQuestionIds.map((id) => String(id)));
    const wrongCandidates = candidates.filter((q) => wrongSet.has(String(q._id)));
    const otherCandidates = candidates.filter((q) => !wrongSet.has(String(q._id)));

    // Shuffle both sets
    const shuffledWrong = wrongCandidates.sort(() => 0.5 - Math.random());
    const shuffledOther = otherCandidates.sort(() => 0.5 - Math.random());

    selected = [...shuffledWrong, ...shuffledOther].slice(0, questionCount);
  } else {
    // Normal random sampling
    selected = candidates.sort(() => 0.5 - Math.random()).slice(0, questionCount);
  }

  return selected;
};

/**
 * Evaluates self test answers, calculates scores, and returns detailed results.
 */
export const evaluateSelfTest = async (attempt, questions, rawAnswers) => {
  let totalScore = 0;
  let maxScore = 0;
  const processedAnswers = [];
  const wrongIds = [];

  const negativeMarking = attempt.config?.negativeMarking || false;
  const ratio = attempt.config?.negativeMarkRatio || 0.25;

  for (const q of questions) {
    const markWeight = q.marks || 1;
    maxScore += markWeight;

    const studentAns = rawAnswers.find((a) => String(a.question) === String(q._id)) || {};

    if (q.type === "mcq") {
      const selectedIndex = studentAns.selectedOptionIndex;
      let isCorrect = false;
      let marksAwarded = 0;

      if (selectedIndex !== null && selectedIndex !== undefined) {
        if (Number(selectedIndex) === Number(q.correctOptionIndex)) {
          isCorrect = true;
          marksAwarded = markWeight;
        } else {
          isCorrect = false;
          marksAwarded = negativeMarking ? -1 * markWeight * ratio : 0;
          wrongIds.push(q._id);
        }
      } else {
        // Unanswered
        isCorrect = false;
        marksAwarded = 0;
      }

      totalScore += marksAwarded;
      processedAnswers.push({
        question: q._id,
        type: "mcq",
        selectedOptionIndex: selectedIndex,
        isCorrect,
        marksAwarded,
        timeSpentSeconds: studentAns.timeSpentSeconds || 0,
      });
    } else if (q.type === "coding") {
      const code = studentAns.code || "";
      const lang = studentAns.language || attempt.config?.language || "python";
      let isCorrect = false;
      let marksAwarded = 0;
      let testCaseResults = [];

      if (code.trim() && q.sampleTestCases && q.sampleTestCases.length > 0) {
        testCaseResults = await runAgainstTestCases({
          sourceCode: code,
          language: lang,
          testCases: [...q.sampleTestCases, ...(q.hiddenTestCases || [])],
        });

        const passedCount = testCaseResults.filter((r) => r.passed).length;
        const totalCases = testCaseResults.length;

        if (totalCases > 0) {
          const passRatio = passedCount / totalCases;
          marksAwarded = Math.round(passRatio * markWeight * 100) / 100;
          isCorrect = passedCount === totalCases;
        }
      }

      if (!isCorrect) wrongIds.push(q._id);
      totalScore += marksAwarded;

      processedAnswers.push({
        question: q._id,
        type: "coding",
        code,
        language: lang,
        testCaseResults,
        isCorrect,
        marksAwarded,
        timeSpentSeconds: studentAns.timeSpentSeconds || 0,
      });
    }
  }

  // Ensure total score is non-negative
  totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Calculate XP: 10 XP per correct question + percentage bonus
  const correctCount = processedAnswers.filter((a) => a.isCorrect).length;
  const xpEarned = correctCount * 10 + Math.floor(percentage / 10);

  return {
    processedAnswers,
    totalScore,
    maxScore,
    percentage,
    xpEarned,
    wrongIds,
  };
};

/**
 * Updates student gamification stats, streak, readiness score, topic stats, and unlocks achievements.
 */
export const updateStudentGamification = async (userId, evaluation, questions) => {
  let stats = await StudentStats.findOne({ student: userId });
  if (!stats) {
    stats = new StudentStats({ student: userId });
  }

  // 1. Update XP & Level
  stats.xp += evaluation.xpEarned;
  stats.level = Math.floor(stats.xp / 100) + 1;

  // 2. Update Streaks
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const lastActiveStr = stats.streak.lastActiveDate
    ? new Date(stats.streak.lastActiveDate).toISOString().split("T")[0]
    : null;

  if (lastActiveStr !== todayStr) {
    if (lastActiveStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActiveStr === yesterdayStr) {
        stats.streak.currentStreak += 1;
      } else {
        stats.streak.currentStreak = 1;
      }
    } else {
      stats.streak.currentStreak = 1;
    }
    stats.streak.lastActiveDate = now;
    if (stats.streak.currentStreak > stats.streak.maxStreak) {
      stats.streak.maxStreak = stats.streak.currentStreak;
    }
  }

  // 3. Update Totals
  stats.totalSelfTests += 1;
  stats.totalQuestionsAttempted += questions.length;
  const correctCount = evaluation.processedAnswers.filter((a) => a.isCorrect).length;
  stats.totalQuestionsCorrect += correctCount;

  // 4. Update Topic Stats
  const topicMap = new Map();
  stats.topicStats.forEach((ts) => {
    topicMap.set(ts.topic, { totalAttempted: ts.totalAttempted, totalCorrect: ts.totalCorrect });
  });

  questions.forEach((q) => {
    const topic = q.test?.category || "General Knowledge";
    const ans = evaluation.processedAnswers.find((a) => String(a.question) === String(q._id));
    const curr = topicMap.get(topic) || { totalAttempted: 0, totalCorrect: 0 };
    curr.totalAttempted += 1;
    if (ans && ans.isCorrect) curr.totalCorrect += 1;
    topicMap.set(topic, curr);
  });

  const updatedTopicStats = [];
  topicMap.forEach((val, key) => {
    const acc = val.totalAttempted > 0 ? Math.round((val.totalCorrect / val.totalAttempted) * 100) : 0;
    updatedTopicStats.push({
      topic: key,
      totalAttempted: val.totalAttempted,
      totalCorrect: val.totalCorrect,
      accuracy: acc,
    });
  });
  stats.topicStats = updatedTopicStats;

  // 5. Update Wrong Questions list (add newly wrong, remove newly correct)
  const currentWrongSet = new Set(stats.wrongQuestionIds.map((id) => String(id)));
  evaluation.processedAnswers.forEach((ans) => {
    const qIdStr = String(ans.question);
    if (ans.isCorrect) {
      currentWrongSet.delete(qIdStr);
    } else {
      currentWrongSet.add(qIdStr);
    }
  });
  stats.wrongQuestionIds = Array.from(currentWrongSet);

  // 6. Recalculate Overall Readiness Score (0-100)
  // Formula: 70% weighted accuracy across topics + 30% XP volume factor (capped at 500 XP)
  const overallAccuracy =
    stats.totalQuestionsAttempted > 0
      ? (stats.totalQuestionsCorrect / stats.totalQuestionsAttempted) * 100
      : 0;
  const xpFactor = Math.min(100, (stats.xp / 500) * 100);
  stats.readinessScore = Math.min(100, Math.round(overallAccuracy * 0.7 + xpFactor * 0.3));

  // 7. Check for Achievements
  const unlockedKeys = new Set(stats.achievements.map((a) => a.key));
  ACHIEVEMENTS_DEF.forEach((ach) => {
    if (!unlockedKeys.has(ach.key)) {
      let unlock = false;
      if (ach.key === "first_test" && stats.totalSelfTests >= 1) unlock = true;
      if (ach.key === "streak_3" && stats.streak.currentStreak >= 3) unlock = true;
      if (ach.key === "streak_7" && stats.streak.currentStreak >= 7) unlock = true;
      if (ach.key === "score_100" && evaluation.percentage === 100) unlock = true;
      if (ach.key === "coding_ninja" && evaluation.processedAnswers.some((a) => a.type === "coding" && a.isCorrect)) unlock = true;
      if (ach.key === "practice_master" && stats.xp >= 500) unlock = true;

      if (unlock) {
        stats.achievements.push({
          key: ach.key,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          unlockedAt: new Date(),
        });
      }
    }
  });

  await stats.save();
  return stats;
};
