import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/useAuth';
import { combinedAcademic } from '../context/sessionStore';
import ProtectedRoute from './ProtectedRoute';
export default function RoleRoute({ role, children }) {
  const { auth, selectRole } = useAuth();
  const allowed = auth.roles?.includes(role) || (role === 'ADMIN' && auth.roles?.includes('SUPER_ADMIN'));
  const sharedAcademic = combinedAcademic(auth) && ['DOCENTE', 'TUTOR'].includes(role);
  const active = sharedAcademic && ['DOCENTE', 'TUTOR'].includes(auth.selectedRole) ? auth.selectedRole : auth.roles?.includes(role) ? role : 'SUPER_ADMIN';
  useEffect(() => { if (allowed && !auth.loading && !auth.switching && !auth.error && !auth.redirectTo && auth.selectedRole !== active) selectRole?.(active, { redirect: false }); }, [allowed, active, auth.loading, auth.switching, auth.error, auth.redirectTo, auth.selectedRole, selectRole]);
  return <ProtectedRoute>{allowed ? children : <Navigate to="/access-denied" replace />}</ProtectedRoute>;
}
RoleRoute.propTypes = { role: PropTypes.string.isRequired, children: PropTypes.node };
