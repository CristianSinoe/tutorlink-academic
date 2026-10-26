import AcademicDashboard from './pages/academic/AcademicDashboard';
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProfilePage from "./pages/admin/AdminProfilePage.jsx";
import AssignmentsPage from "./pages/admin/AssignmentsPage.jsx";
import StudentsPage from "./pages/admin/StudentsPage.jsx";
import TutorsPage from "./pages/admin/TutorsPage.jsx";
import UsersPage from "./pages/admin/UsersPage.jsx";
import TeachersPage from "./pages/admin/TeachersPage.jsx";
import InstitutionInvitationsPage from "./pages/admin/InstitutionInvitationsPage.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentInfoPage from "./pages/student/StudentInfoPage.jsx";
import StudentNewQuestion from "./pages/student/StudentNewQuestion.jsx";
import StudentQuestions from "./pages/student/StudentQuestions.jsx";
import TutorHistoryPage from "./pages/tutor/TutorHistoryPage.jsx";
import TutorPendingPage from "./pages/tutor/TutorPendingPage.jsx";
import TutorProfilePage from "./pages/tutor/TutorProfilePage.jsx";

import { useAuth } from "./context/useAuth";
import { updateSession } from "./context/sessionStore";
import ContextLayout from "./layout/ContextLayout";
import ContextProfilePage from "./pages/context/ContextProfilePage";
import ContextPage from "./pages/context/ContextPage";
import PlatformAccessPage from "./pages/context/PlatformAccessPage";
import NotFoundPage from "./pages/context/NotFoundPage";
import AccessDeniedPage from "./pages/context/AccessDeniedPage";
import InvitationAcceptPage from "./pages/auth/InvitationAcceptPage";
import RoleRoute from "./router/RoleRoute";
import PeriodsPage from "./pages/admin/PeriodsPage";
import CoursesPage from "./pages/admin/CoursesPage";
import GroupsPage from "./pages/admin/GroupsPage";
import MyCoursesPage from "./pages/academic/MyCoursesPage";
import LandingPage from "./pages/LandingPage.jsx";

function App() {
  const { auth } = useAuth();
  const location = useLocation();
  useEffect(() => {
    if (auth.redirectTo && location.pathname === auth.redirectTo) {
      updateSession({ redirectTo: null });
      const heading = document.querySelector('#workspace-content h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus();
    }
  }, [auth.redirectTo, location.pathname]);
  return (
    <>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/:institutionCode/login" element={<LoginPage />} />
      <Route path="/:institutionCode/otp" element={<OtpPage />} />
      <Route path="/first-login" element={<FirstLoginPage />} />
      <Route path="/accept-institution-invitation" element={<InvitationAcceptPage />} />
      <Route path="/context" element={<ProtectedRoute><ContextLayout /></ProtectedRoute>}>
        <Route index element={<ContextPage />} />
        <Route path="profile" element={<ContextProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/teacher" element={<RoleRoute role="DOCENTE"><ContextLayout /></RoleRoute>}>
        <Route index element={<AcademicDashboard />} />
        <Route path="courses" element={<MyCoursesPage role="DOCENTE" />} />
        <Route path="profile" element={<ContextProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/platform" element={<RoleRoute role="PLATFORM_SUPER_ADMIN"><ContextLayout /></RoleRoute>}>
        <Route index element={<PlatformAccessPage />} />
        <Route path="profile" element={<ContextProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/access-denied" element={<ProtectedRoute><AccessDeniedPage /></ProtectedRoute>} />

      <Route
        path="/admin/*"
        element={
          <AdminRoute>
              <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="tutors" element={<TutorsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="invitations" element={<InstitutionInvitationsPage />} />
        <Route path="periods" element={<PeriodsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="admins" element={<Navigate to="/admin/users?legacy=admins" replace />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/student/*"
        element={
          <StudentRoute>
              <StudentLayout />
          </StudentRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<MyCoursesPage role="ESTUDIANTE" />} />
        <Route path="ask" element={<StudentNewQuestion />} />
        <Route path="questions" element={<StudentQuestions />} />
        <Route path="info" element={<StudentInfoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/tutor/*"
        element={
          <TutorRoute>
              <TutorLayout />
          </TutorRoute>
        }
      >
        <Route index element={<AcademicDashboard tutorOnly />} />
        <Route path="pending" element={<TutorPendingPage />} />
        <Route path="history" element={<TutorHistoryPage />} />
        <Route path="profile" element={<TutorProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}

export default App;
