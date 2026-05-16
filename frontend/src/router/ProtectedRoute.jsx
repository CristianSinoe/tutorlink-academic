// src/router/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();

  // Mientras estamos restaurando la sesión desde localStorage,
  // no redirigimos ni mostramos nada extraño.
  if (auth.loading) {
    return null; // o un spinner si quieres
  }

  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
