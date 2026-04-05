import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** Blocks access to a route unless the user has one of the allowed roles */
export default function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/orders" replace />;
  }
  return <>{children}</>;
}
