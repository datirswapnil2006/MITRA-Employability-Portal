import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";

import StudentDashboard from "./pages/StudentDashboard";
import AttemptPage from "./pages/AttemptPage";
import ResultPage from "./pages/ResultPage";

// Student pages
import StudentAvailableTests from "./pages/student/StudentAvailableTests";
import StudentTopicPractice from "./pages/student/StudentTopicPractice";
import StudentStudyMaterials from "./pages/student/StudentStudyMaterials";
import StudentPsychometric from "./pages/student/StudentPsychometric";
import StudentResults from "./pages/student/StudentResults";
import StudentAnalytics from "./pages/student/StudentAnalytics";
import StudentProfile from "./pages/student/StudentProfile";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminTests from "./pages/admin/AdminTests";
import AdminTestQuestions from "./pages/admin/AdminTestQuestions";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminStudentDetail from "./pages/admin/AdminStudentDetail";
import AdminResults from "./pages/admin/AdminResults";
import AdminProctoring from "./pages/admin/AdminProctoring";
import AdminQuestionManual from "./pages/admin/AdminQuestionManual";
import AdminQuestionPDF from "./pages/admin/AdminQuestionPDF";
import AdminQuestionAI from "./pages/admin/AdminQuestionAI";
import { lazy, Suspense } from "react";
import AdminQuestionBank from "./pages/admin/AdminQuestionBank";
import AdminPracticeTests from "./pages/admin/AdminPracticeTests";
import AdminPsychometric from "./pages/admin/AdminPsychometric";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminSettings from "./pages/admin/AdminSettings";

// Lazy-loaded Admin Analytics & Student AI Self-Test pages
const AdminSelfTestAnalytics = lazy(() => import("./pages/admin/AdminSelfTestAnalytics"));
const StudentSelfTestGenerator = lazy(() => import("./pages/student/StudentSelfTestGenerator"));
const StudentSelfTestAttempt = lazy(() => import("./pages/student/StudentSelfTestAttempt"));
const StudentSelfTestDashboard = lazy(() => import("./pages/student/StudentSelfTestDashboard"));

import ProtectedRoute from "./components/ProtectedRoute";

const PageLoader = () => (
  <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-mono text-xs">
    <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
    Loading page chunk…
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/register" element={<Register />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests"
        element={
          <ProtectedRoute role="admin">
            <AdminTests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminTestQuestions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/registrations"
        element={
          <ProtectedRoute role="admin">
            <AdminRegistrations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute role="admin">
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminStudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/results"
        element={
          <ProtectedRoute role="admin">
            <AdminResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/proctoring"
        element={
          <ProtectedRoute role="admin">
            <AdminProctoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/manual"
        element={
          <ProtectedRoute role="admin">
            <AdminQuestionManual />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/pdf"
        element={
          <ProtectedRoute role="admin">
            <AdminQuestionPDF />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/ai"
        element={
          <ProtectedRoute role="admin">
            <AdminQuestionAI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/bank"
        element={
          <ProtectedRoute role="admin">
            <AdminQuestionBank />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/practice"
        element={
          <ProtectedRoute role="admin">
            <AdminPracticeTests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/psychometric"
        element={
          <ProtectedRoute role="admin">
            <AdminPsychometric />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/materials"
        element={
          <ProtectedRoute role="admin">
            <AdminMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/self-test-analytics"
        element={
          <ProtectedRoute role="admin">
            <AdminSelfTestAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/self-test"
        element={
          <ProtectedRoute role="student">
            <StudentSelfTestGenerator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/self-test/hub"
        element={
          <ProtectedRoute role="student">
            <StudentSelfTestDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/self-test/attempt/:id"
        element={
          <ProtectedRoute role="student">
            <StudentSelfTestAttempt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice"
        element={
          <ProtectedRoute role="student">
            <StudentTopicPractice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/materials"
        element={
          <ProtectedRoute role="student">
            <StudentStudyMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/psychometric"
        element={
          <ProtectedRoute role="student">
            <StudentPsychometric />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/results"
        element={
          <ProtectedRoute role="student">
            <StudentResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/analytics"
        element={
          <ProtectedRoute role="student">
            <StudentAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/attempt/:testId"
        element={
          <ProtectedRoute role="student">
            <AttemptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/result/:attemptId"
        element={
          <ProtectedRoute role="student">
            <ResultPage />
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}
