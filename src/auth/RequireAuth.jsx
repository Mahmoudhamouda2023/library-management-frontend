import { Navigate } from 'react-router-dom';
import { getToken } from '../api/client.js';

export default function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}
