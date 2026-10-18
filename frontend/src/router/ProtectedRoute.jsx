// src/router/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../context/useAuth.js";

export default function ProtectedRoute({ children }) {
  const { auth, retryRestore, logout } = useAuth();
  const location = useLocation();

  // Mientras estamos restaurando la sesión desde localStorage,
  // no redirigimos ni mostramos nada extraño.
  if (auth.loading) {
    return <p className="p-6" role="status">Verificando tu contexto…</p>;
  }

  if (!auth.token) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={auth.logoutDestination || `/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (auth.error) return <section className="p-6"><p role="alert">{auth.error}</p><button className="tl-button-primary" onClick={retryRestore}>Reintentar</button><button className="tl-button-secondary" onClick={logout}>Iniciar sesión de nuevo</button></section>;
  if (auth.redirectTo && location.pathname !== auth.redirectTo) return <Navigate to={auth.redirectTo} replace />;
  return <div key={auth.generation} id="workspace-content" tabIndex={-1} data-context-background aria-busy={auth.switching || undefined}>
    <fieldset disabled={auth.switching} className="min-w-0 border-0 p-0 m-0">{children}</fieldset>
  </div>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};
