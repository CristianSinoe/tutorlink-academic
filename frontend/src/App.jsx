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

function PlaceholderPage({ title, description }) {
  return (
    <section className="placeholder-card">
      <p className="placeholder-eyebrow">TutorLink</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

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
        <Route
          index
          element={
            <PlaceholderPage
              title="Dashboard administrativo"
              description="Aqui se integraran los modulos de estudiantes, tutores, asignaciones y administradores."
            />
          }
        />
        <Route
          path="students"
          element={
            <PlaceholderPage
              title="Estudiantes"
              description="Vista reservada para la gestion de estudiantes en una sesion posterior."
            />
          }
        />
        <Route
          path="tutors"
          element={
            <PlaceholderPage
              title="Tutores"
              description="Vista reservada para la gestion de tutores en una sesion posterior."
            />
          }
        />
        <Route
          path="assignments"
          element={
            <PlaceholderPage
              title="Asignaciones"
              description="Vista reservada para las asignaciones tutor-estudiante."
            />
          }
        />
        <Route
          path="users"
          element={
            <PlaceholderPage
              title="Usuarios"
              description="Vista reservada para la administracion general de usuarios."
            />
          }
        />
        <Route
          path="admins"
          element={
            <PlaceholderPage
              title="Administradores"
              description="Vista reservada para la gestion de administradores."
            />
          }
        />
        <Route
          path="profile"
          element={
            <PlaceholderPage
              title="Perfil admin"
              description="Vista reservada para el perfil del administrador."
            />
          }
        />
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
        <Route
          index
          element={
            <PlaceholderPage
              title="Dashboard estudiante"
              description="Aqui se integraran las preguntas, informacion academica y seguimiento personal."
            />
          }
        />
        <Route
          path="ask"
          element={
            <PlaceholderPage
              title="Nueva pregunta"
              description="Vista reservada para el formulario de nuevas preguntas."
            />
          }
        />
        <Route
          path="questions"
          element={
            <PlaceholderPage
              title="Mis preguntas"
              description="Vista reservada para el historial y estado de preguntas del estudiante."
            />
          }
        />
        <Route
          path="info"
          element={
            <PlaceholderPage
              title="Mi informacion"
              description="Vista reservada para el perfil e informacion del estudiante."
            />
          }
        />
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
        <Route
          index
          element={
            <PlaceholderPage
              title="Dashboard tutor"
              description="Aqui se integraran las bandejas de preguntas pendientes, historial y perfil del tutor."
            />
          }
        />
        <Route
          path="pending"
          element={
            <PlaceholderPage
              title="Pendientes"
              description="Vista reservada para la bandeja de preguntas pendientes del tutor."
            />
          }
        />
        <Route
          path="history"
          element={
            <PlaceholderPage
              title="Historial"
              description="Vista reservada para el historial de respuestas del tutor."
            />
          }
        />
        <Route
          path="profile"
          element={
            <PlaceholderPage
              title="Perfil tutor"
              description="Vista reservada para el perfil del tutor."
            />
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
