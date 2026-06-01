// src/router/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../context/useAuth.js";

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  const location = useLocation();

  // Mientras estamos restaurando la sesión desde localStorage,
  // no redirigimos ni mostramos nada extraño.
  if (auth.loading) {
    return null; // o un spinner si quieres
  }

  if (!auth.token) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};
