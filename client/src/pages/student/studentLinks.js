import {
  Home,
  Target,
  FileCheck,
  Brain,
  Code2,
  Dumbbell,
  BookOpen,
  Award,
  User,
} from "lucide-react";

export const STUDENT_LINKS = [
  { key: "dashboard", path: "/student", label: "Dashboard", icon: Home },
  {
    key: "available-tests",
    path: "/student/available-tests",
    label: "Available Tests",
    icon: Target,
    children: [
      { key: "available-tests/official", path: "/student/available-tests/official", label: "Official Placement Test", icon: FileCheck },
      { key: "available-tests/psychometric", path: "/student/available-tests/psychometric", label: "Psychometric Assessment", icon: Brain },
    ],
  },
  {
    key: "practice",
    path: "/student/practice",
    label: "Practice",
    icon: Code2,
    children: [
      { key: "practice/tests", path: "/student/practice/tests", label: "Practice Tests", icon: Dumbbell },
      { key: "practice/coding", path: "/student/practice/coding", label: "Coding Practice", icon: Code2 },
      { key: "practice/materials", path: "/student/practice/materials", label: "Study Materials", icon: BookOpen },
    ],
  },
  { key: "results", path: "/student/results", label: "My Results", icon: Award },
  { key: "profile", path: "/student/profile", label: "Profile", icon: User },
];

