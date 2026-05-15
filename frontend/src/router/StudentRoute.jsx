// src/router/StudentRoute.jsx
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/useAuth.js";

export default function StudentRoute({ children }) {
  const { auth } = useAuth();

  return (
    <ProtectedRoute>
      {auth.role === "ESTUDIANTE" ? children : <Navigate to="/login" />}
    </ProtectedRoute>
  );
}
