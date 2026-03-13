import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const [userRole] = useLocalStorage('user_role', 'admin');
  const location = useLocation();

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Si el rol actual no está en la lista de permitidos, redirigir a /inicio que es seguro.
    return <Navigate to="/inicio" replace state={{ from: location }} />;
  }

  // Si tiene permisos, pintar la ruta hija normal.
  return <Outlet />;
}
