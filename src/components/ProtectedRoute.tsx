import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface ProtectedRouteProps {
 allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
 const [userRole] = useState(() => {
 try {
 const item = window.localStorage.getItem('user_role');
 // Manejo seguro si el string no está guardado como JSON (ej: 'invitado' en vez de '"invitado"')
 if (item && !item.startsWith('"') && !item.startsWith('{')) {
   return item;
 }
 return item ? JSON.parse(item) : 'admin';
 } catch {
 return 'admin';
 }
 });
 const location = useLocation();

 // Puerta trasera segura: Al ser dueño/desarrollador/empresa o ingresar como invitado para la demo, podés ver todo sin rebotar.
 if (userRole === 'admin' || userRole === 'invitado' || userRole === 'desarrollador' || userRole === 'irridelta') {
   return <Outlet />;
 }

 if (allowedRoles && !allowedRoles.includes(userRole)) {
 return <Navigate to="/inicio" replace state={{ from: location }} />;
 }

 return <Outlet />;
}
