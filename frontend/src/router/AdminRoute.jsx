// src/router/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/useAuth.js";

export default function AdminRoute({ children }) {
  const { auth } = useAuth();

  return (
    <ProtectedRoute>
      {auth.role === "ADMIN" ? children : <Navigate to="/login" />}
    </ProtectedRoute>
  );
}
