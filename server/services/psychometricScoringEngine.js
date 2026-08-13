/**
 * Psychometric Scoring Engine
 * Computes trait score normalizations (0-100%), derives behavioral archetypes,
 * identifies strengths & growth areas, analyzes workplace styles, and recommends career paths.
 */

const ARCHETYPES = [
  {
    key: "strategic_innovator",
    archetype: "Strategic Innovator",
    tagline: "Visionary thinker with systematic execution discipline.",
    description: "Combines high creative curiosity with strong structural organization. Excellent at identifying novel technical solutions and breaking them down into structured project roadmaps.",
    minOpenness: 70,
    minConscientiousness: 70,
  },
  {
    key: "resilient_solver",
    archetype: "Resilient Problem Solver",
    tagline: "Composed under high pressure with strong operational focus.",
    description: "Demonstrates exceptional emotional poise under critical deadlines. Thrives in fast-paced troubleshooting, live incident response, and complex technical debugging.",
    minStability: 75,
    minConscientiousness: 65,
  },
  {
    key: "empathetic_leader",
    archetype: "Empathetic Team Leader",
    tagline: "Collaborative, inspiring, and people-oriented coordinator.",
    description: "Excels in cross-functional team alignment, mentorship, and building trust. Drives group productivity through open dialogue and empathetic conflict resolution.",
    minAgreeableness: 70,
    minExtraversion: 60,
  },
  {
    key: "analytical_specialist",
    archetype: "Analytical Operations Specialist",
    tagline: "Detail-oriented, methodical, and reliable quality guardian.",
    description: "Highly disciplined with extreme attention to detail and standards. Ensures rigorous testing, compliance, and procedural accuracy across complex codebases.",
    minConscientiousness: 75,
  },
  {
    key: "adaptive_executor",
    archetype: "Adaptive Professional",
    tagline: "Versatile, flexible team member with balanced behavioral competencies.",
    description: "Demonstrates broad adaptability across engineering tasks. Quickly adjusts to shifting team requirements, new tech stacks, and evolving project goals.",
  },
];

export const evaluatePsychometricAttempt = async (attempt, test) => {
  const answers = attempt.answers || [];
  const definedTraits = test?.traits || [];

  // 1. Group answers by traitKey
  const traitMap = new Map();

  // Initialize with defined test traits
  definedTraits.forEach((t) => {
    traitMap.set(t.key, {
      key: t.key,
      name: t.name,
      description: t.description || "",
      rawScore: 0,
      maxScore: 0,
      count: 0,
    });
  });

  // Process answers
  answers.forEach((ans) => {
    const key = ans?.traitKey || "general";
    let entry = traitMap.get(key);

    if (!entry) {
      const safeKey = String(key || "general");
      entry = {
        key: safeKey,
        name: safeKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: "",
        rawScore: 0,
        maxScore: 0,
        count: 0,
      };
      traitMap.set(safeKey, entry);
    }

    entry.rawScore += ans.scoreAwarded || 0;
    entry.maxScore += 5; // Max score per item is 5
    entry.count += 1;
  });

  // Compute normalized percentages and qualitative levels
  const traitBreakdown = Array.from(traitMap.values()).map((t) => {
    const percentage = t.maxScore > 0 ? Math.round((t.rawScore / t.maxScore) * 100) : 0;
    let level = "Balanced / Moderate";
    if (percentage >= 80) level = "High";
    else if (percentage >= 60) level = "Moderate High";
    else if (percentage < 40) level = "Developing / Low";

    return {
      key: t.key,
      name: t.name,
      description: t.description,
      rawScore: t.rawScore,
      maxScore: t.maxScore,
      percentage,
      level,
    };
  });

  // Create quick lookup object: traitKey -> percentage
  const scoreLookup = {};
  traitBreakdown.forEach((t) => {
    scoreLookup[t.key] = t.percentage;
  });

  // 2. Classify Personality Archetype
  const openness = scoreLookup.openness || 50;
  const conscientiousness = scoreLookup.conscientiousness || 50;
  const extraversion = scoreLookup.extraversion || 50;
  const agreeableness = scoreLookup.agreeableness || 50;
  const stability = scoreLookup.emotional_stability || 50;

  let selectedArchetype = ARCHETYPES[ARCHETYPES.length - 1]; // Default adaptive

  if (openness >= 70 && conscientiousness >= 70) {
    selectedArchetype = ARCHETYPES[0];
  } else if (stability >= 75 && conscientiousness >= 65) {
    selectedArchetype = ARCHETYPES[1];
  } else if (agreeableness >= 70 && extraversion >= 60) {
    selectedArchetype = ARCHETYPES[2];
  } else if (conscientiousness >= 75) {
    selectedArchetype = ARCHETYPES[3];
  }

  const personalityProfile = {
    archetype: selectedArchetype.archetype,
    tagline: selectedArchetype.tagline,
    description: selectedArchetype.description,
    primaryTraitKeys: traitBreakdown
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .map((t) => t.key),
  };

  // 3. Derive Strengths (Top Traits)
  const sortedTraits = [...traitBreakdown].sort((a, b) => b.percentage - a.percentage);
  const strengths = [];
  const developmentAreas = [];

  sortedTraits.forEach((t) => {
    if (t.percentage >= 65) {
      if (t.key === "openness") strengths.push("High creative curiosity and rapid adaptability to new technologies.");
      else if (t.key === "conscientiousness") strengths.push("Strong structural organization, task dependability, and high precision.");
      else if (t.key === "extraversion") strengths.push("Confident communication and active engagement in group discussions.");
      else if (t.key === "agreeableness") strengths.push("Exceptional team empathy, active listening, and conflict resolution.");
      else if (t.key === "emotional_stability") strengths.push("High composure, resilience, and emotional poise under tight deadlines.");
      else strengths.push(`Strong proficiency in ${t.name}.`);
    } else if (t.percentage < 50) {
      if (t.key === "openness") developmentAreas.push("May prefer established routines; work on embracing unfamiliar technologies.");
      else if (t.key === "conscientiousness") developmentAreas.push("Practice chunking long tasks into micro-deadlines to boost consistency.");
      else if (t.key === "extraversion") developmentAreas.push("Proactively share project ideas earlier in team brainstorming sessions.");
      else if (t.key === "agreeableness") developmentAreas.push("Balance critical analytical feedback with constructive diplomacy.");
      else if (t.key === "emotional_stability") developmentAreas.push("Incorporate structured stress-relief habits during crunch periods.");
      else developmentAreas.push(`Focus on developing consistency in ${t.name}.`);
    }
  });

  if (strengths.length === 0) {
    strengths.push("Balanced behavioral profile across technical and interpersonal dimensions.");
  }
  if (developmentAreas.length === 0) {
    developmentAreas.push("Continue refining cross-functional collaboration and leadership agility.");
  }

  // 4. Workplace & Team Dynamics Style
  const workplaceStyle = {
    communication: extraversion >= 60 || agreeableness >= 65
      ? "Open, expressive, and highly collaborative communicator."
      : "Structured, concise, and reflective communicator.",
    stressResponse: stability >= 65
      ? "Calm, resilient, and composed during high-pressure crunches."
      : "Methodical; benefits from clear task priorities during intense sprints.",
    decisionMaking: conscientiousness >= 65
      ? "Data-driven, risk-aware, and methodical decision maker."
      : "Agile, intuitive, and adaptable decision maker.",
    teamRole: leadershipOrCoordinationRole(extraversion, conscientiousness, agreeableness),
  };

  // 5. Career & Role Recommendations
  const careerRecommendations = deriveCareerRecommendations(openness, conscientiousness, extraversion, agreeableness, stability);

  return {
    traitBreakdown,
    personalityProfile,
    strengths: strengths.slice(0, 4),
    developmentAreas: developmentAreas.slice(0, 3),
    workplaceStyle,
    careerRecommendations,
  };
};

function leadershipOrCoordinationRole(ex, co, ag) {
  if (ex >= 65 && co >= 65) return "Technical Team Lead / Scrum Master";
  if (co >= 75) return "Systems Architect / Quality Assurance Lead";
  if (ag >= 70) return "Team Mentor / Developer Relations";
  return "Core Software Engineer / Technical Contributor";
}

function deriveCareerRecommendations(op, co, ex, ag, st) {
  const roles = [];
  if (op >= 70 && co >= 65) roles.push("Software Architect", "R&D Solutions Engineer");
  if (co >= 70 && st >= 65) roles.push("DevOps & Site Reliability Engineer", "QA Engineering Lead");
  if (ex >= 60 && ag >= 65) roles.push("Technical Product Manager", "Scrum Master / Agile Coach");
  if (op >= 70) roles.push("AI / Data Science Engineer", "UX Engineer");

  if (roles.length === 0) {
    roles.push("Full-Stack Software Developer", "Systems Analyst", "Technical Operations Specialist");
  }

  return Array.from(new Set(roles)).slice(0, 4);
}
