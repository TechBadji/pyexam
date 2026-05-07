import { Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import AdminAuditPage from "./pages/AdminAuditPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminExamReport from "./pages/AdminExamReport";
import AdminUsersPage from "./pages/AdminUsersPage";
import QuestionBankPage from "./pages/QuestionBankPage";
import ExamPage from "./pages/ExamPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ResultsPage from "./pages/ResultsPage";
import StudentDashboard from "./pages/StudentDashboard";

function RequireAuth({ role }: { role?: "student" | "admin" }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return <Outlet />;
}

function RedirectIfAuth() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Outlet />;
  return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// BASE_URL is set by Vite from the `base` config (/pyexam/ in production, / in dev)
// React Router wants no trailing slash: /pyexam/ → /pyexam
const basename = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<RedirectIfAuth />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth role="student" />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/exam/:examId" element={<ExamPage />} />
            <Route path="/results/:submissionId" element={<ResultsPage />} />
          </Route>

          <Route element={<RequireAuth role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/bank" element={<QuestionBankPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/exams/:examId/report" element={<AdminExamReport />} />
            <Route path="/admin/exams/:examId/stats" element={<AdminExamReport />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route
            path="/"
            element={
              <Navigate
                to={useAuthStore.getState().user?.role === "admin" ? "/admin" : "/dashboard"}
                replace
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
