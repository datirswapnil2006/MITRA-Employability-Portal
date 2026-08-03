import {
  LayoutDashboard, Users, FileQuestion, PenLine, FileUp, Sparkles, Library,
  ClipboardList, Dumbbell, Brain, BookOpen, ShieldAlert, BarChart3, Settings, PieChart,
} from "lucide-react";

export const ADMIN_LINKS = [
  { key: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
  { key: "students", label: "Student Management", icon: Users },
  {
    key: "questions",
    label: "Question Management",
    icon: FileQuestion,
    children: [
      { key: "questions/manual", label: "Manual Entry", icon: PenLine },
      { key: "questions/pdf", label: "Upload PDF", icon: FileUp },
      { key: "questions/ai", label: "AI Question Generator", icon: Sparkles },
      { key: "questions/bank", label: "Question Bank", icon: Library },
    ],
  },
  { key: "tests", label: "Test Management", icon: ClipboardList },
  { key: "practice", label: "Practice Tests", icon: Dumbbell },
  { key: "psychometric", label: "Psychometric Mgmt", icon: Brain },
  { key: "materials", label: "Study Materials", icon: BookOpen },
  { key: "proctoring", label: "AI Proctoring Reports", icon: ShieldAlert },
  { key: "results", label: "Results & Analytics", icon: BarChart3 },
  { key: "self-test-analytics", label: "Self-Test Analytics", icon: PieChart },
  { key: "settings", label: "Settings", icon: Settings },
];
