import { Routes, Route, Navigate } from "react-router-dom";
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
import StudentAvailableTestsContainer from "./pages/student/StudentAvailableTestsContainer";
import StudentPracticeContainer from "./pages/student/StudentPracticeContainer";
import StudentPsychometricAttempt from "./pages/student/StudentPsychometricAttempt";
import StudentPsychometricReport from "./pages/student/StudentPsychometricReport";
import StudentResults from "./pages/student/StudentResults";
import StudentProfile from "./pages/student/StudentProfile";

import AdminOfficialPlacementTestWizard from "./pages/admin/AdminOfficialPlacementTestWizard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminTests from "./pages/admin/AdminTests";
import AdminPlacementTestBuilder from "./pages/admin/AdminPlacementTestBuilder";
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
import AdminPsychometric from "./pages/admin/AdminPsychometric";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminSettings from "./pages/admin/AdminSettings";

// Lazy-loaded Admin Analytics & Student AI Self-Test pages
const AdminSelfTestAnalytics = lazy(() => import("./pages/admin/AdminSelfTestAnalytics"));
const StudentSelfTestAttempt = lazy(() => import("./pages/student/StudentSelfTestAttempt"));

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
        path="/admin/official-placement-test"
        element={
          <ProtectedRoute role="admin">
            <AdminOfficialPlacementTestWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/official-placement-test/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminOfficialPlacementTestWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests"
        element={
          <ProtectedRoute role="admin">
            <AdminOfficialPlacementTestWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests/builder"
        element={
          <ProtectedRoute role="admin">
            <AdminOfficialPlacementTestWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tests/builder/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminOfficialPlacementTestWizard />
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
        path="/student/available-tests"
        element={
          <ProtectedRoute role="student">
            <StudentAvailableTestsContainer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/available-tests/official"
        element={
          <ProtectedRoute role="student">
            <StudentAvailableTestsContainer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/available-tests/psychometric"
        element={
          <ProtectedRoute role="student">
            <StudentAvailableTestsContainer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/practice"
        element={
          <ProtectedRoute role="student">
            <StudentPracticeContainer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice/tests"
        element={
          <ProtectedRoute role="student">
            <StudentPracticeContainer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice/coding"
        element={
          <ProtectedRoute role="student">
            <StudentPracticeContainer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice/materials"
        element={
          <ProtectedRoute role="student">
            <StudentPracticeContainer />
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
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      {/* Legacy Student Route Fallback Redirects */}
      <Route path="/student/tests" element={<Navigate to="/student/available-tests/official" replace />} />
      <Route path="/student/psychometric" element={<Navigate to="/student/available-tests/psychometric" replace />} />
      <Route path="/student/materials" element={<Navigate to="/student/practice/materials" replace />} />
      <Route path="/student/self-test" element={<Navigate to="/student/practice/tests" replace />} />
      <Route path="/student/self-test/hub" element={<Navigate to="/student/practice/tests" replace />} />
      <Route path="/student/analytics" element={<Navigate to="/student/results" replace />} />

      {/* Student Attempt Engine & Reports */}
      <Route
        path="/student/self-test/attempt/:id"
        element={
          <ProtectedRoute role="student">
            <StudentSelfTestAttempt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/practice/attempt/:id"
        element={
          <ProtectedRoute role="student">
            <StudentSelfTestAttempt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/psychometric/attempt/:id"
        element={
          <ProtectedRoute role="student">
            <StudentPsychometricAttempt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/psychometric/report/:id"
        element={
          <ProtectedRoute role="student">
            <StudentPsychometricReport />
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
