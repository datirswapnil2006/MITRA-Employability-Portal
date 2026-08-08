import {
  LayoutDashboard, Users, Target, Brain, BookOpen, ShieldAlert, BarChart3, Settings, PieChart,
} from "lucide-react";

export const ADMIN_LINKS = [
  { key: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
  { key: "students", label: "Student Management", icon: Users },
  {
    key: "assessments",
    label: "Assessments",
    icon: Target,
    children: [
      { key: "official-placement-test", label: "Official Placement Test", icon: Target },
      { key: "psychometric", label: "Psychometric Assessment", icon: Brain },
      { key: "self-test-analytics", label: "Practice Tests", icon: PieChart },
    ],
  },
  { key: "materials", label: "Study Materials", icon: BookOpen },
  { key: "proctoring", label: "AI Proctoring Reports", icon: ShieldAlert },
  { key: "results", label: "Results & Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

