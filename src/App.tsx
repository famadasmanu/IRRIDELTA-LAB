import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, logout } from './lib/firebase';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Trabajos from './pages/Trabajos';
import Inventario from './pages/Inventario';
import Clientes from './pages/Clientes';
import Archivo from './pages/Archivo';
import Personal from './pages/Personal';
import Proveedor from './pages/Proveedor';
import Alertas from './pages/Alertas';
import Configuracion from './pages/Configuracion';
import Finanzas from './pages/Finanzas';
import Login from './pages/Login';
import PartnerDetalle from './pages/PartnerDetalle';
import Calculadora from './pages/Calculadora';
import Controladores from './pages/Controladores';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#CCCCCA] flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-slate-600 font-medium">Comprobando sesión...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Login onLogin={() => { }} onGuestLogin={() => setIsGuest(true)} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout onLogout={() => { setIsGuest(false); logout(); }} />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            
            {/* Todas las rutas base */}
            <Route path="inicio" element={<Inicio />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="calculadora" element={<Calculadora />} />
            <Route path="controladores" element={<Controladores />} />
            <Route path="notificaciones" element={<Alertas />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="partner/:id" element={<PartnerDetalle />} />

            {/* Rutas exclusivas para admin y tecnico */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'tecnico']} />}>
              <Route path="trabajos" element={<Trabajos />} />
              <Route path="inventario" element={<Inventario />} />
            </Route>

            {/* Rutas exclusivas para admin y vendedor */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'vendedor']} />}>
              <Route path="archivo" element={<Archivo />} />
              <Route path="finanzas" element={<Finanzas />} />
            </Route>

            {/* Rutas exclusivas para admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="personal" element={<Personal />} />
              <Route path="proveedor" element={<Proveedor />} />
            </Route>
            
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
