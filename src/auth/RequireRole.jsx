import { Navigate } from 'react-router-dom';
import { getUser } from '../api/client.js';
import { defaultRouteFor } from '../utils/routes.js';

export default function RequireRole({ roles = [], children }) {
  const user = getUser();
  const userRoles = user?.roles || [];
  const allowed = roles.some((role) => userRoles.includes(role));

  if (allowed) return children;

  return <Navigate to={defaultRouteFor(user)} replace />;
}
