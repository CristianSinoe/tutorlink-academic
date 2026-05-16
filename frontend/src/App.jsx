import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AdminLayout from "./layout/AdminLayout.jsx";
import StudentLayout from "./layout/StudentLayout.jsx";
import TutorLayout from "./layout/TutorLayout.jsx";
import AdminRoute from "./router/AdminRoute.jsx";
import ProtectedRoute from "./router/ProtectedRoute.jsx";
import StudentRoute from "./router/StudentRoute.jsx";
import TutorRoute from "./router/TutorRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import FirstLoginPage from "./pages/auth/FirstLoginPage.jsx";
import OtpPage from "./pages/auth/OtpPage.jsx";
import AdminAdminsPage from "./pages/admin/AdminAdminsPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProfilePage from "./pages/admin/AdminProfilePage.jsx";
import AssignmentsPage from "./pages/admin/AssignmentsPage.jsx";
import StudentsPage from "./pages/admin/StudentsPage.jsx";
import TutorsPage from "./pages/admin/TutorsPage.jsx";
import UsersPage from "./pages/admin/UsersPage.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentInfoPage from "./pages/student/StudentInfoPage.jsx";
import StudentNewQuestion from "./pages/student/StudentNewQuestion.jsx";
import StudentQuestions from "./pages/student/StudentQuestions.jsx";
import TutorDashboard from "./pages/tutor/TutorDashboard.jsx";
import TutorHistoryPage from "./pages/tutor/TutorHistoryPage.jsx";
import TutorPendingPage from "./pages/tutor/TutorPendingPage.jsx";
import TutorProfilePage from "./pages/tutor/TutorProfilePage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/first-login" element={<FirstLoginPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="tutors" element={<TutorsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="admins" element={<AdminAdminsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      <Route
        path="/student/*"
        element={
          <ProtectedRoute>
            <StudentRoute>
              <StudentLayout />
            </StudentRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="ask" element={<StudentNewQuestion />} />
        <Route path="questions" element={<StudentQuestions />} />
        <Route path="info" element={<StudentInfoPage />} />
      </Route>

      <Route
        path="/tutor/*"
        element={
          <ProtectedRoute>
            <TutorRoute>
              <TutorLayout />
            </TutorRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<TutorDashboard />} />
        <Route path="pending" element={<TutorPendingPage />} />
        <Route path="history" element={<TutorHistoryPage />} />
        <Route path="profile" element={<TutorProfilePage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
