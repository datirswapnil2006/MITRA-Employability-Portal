import {
  ClipboardList, Dumbbell, BookOpen, Brain, Award, BarChart2, User, Sparkles, Trophy
} from "lucide-react";

export const STUDENT_LINKS = [
  { key: "tests", label: "Available Tests", icon: ClipboardList },
  { key: "self-test", label: "AI Self-Test Generator", icon: Sparkles },
  { key: "self-test/hub", label: "Practice Hub & XP", icon: Trophy },
  { key: "practice", label: "Topic-wise Practice", icon: Dumbbell },
  { key: "materials", label: "Study Materials", icon: BookOpen },
  { key: "psychometric", label: "Psychometric Assessment", icon: Brain },
  { key: "results", label: "My Results", icon: Award },
  { key: "analytics", label: "Performance Analytics", icon: BarChart2 },
  { key: "profile", label: "Profile", icon: User },
];
