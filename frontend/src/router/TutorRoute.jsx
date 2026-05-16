// src/router/TutorRoute.jsx
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/useAuth.js";

export default function TutorRoute({ children }) {
  const { auth } = useAuth();

  return (
    <ProtectedRoute>
      {auth.role === "TUTOR" ? children : <Navigate to="/login" />}
    </ProtectedRoute>
  );
}
