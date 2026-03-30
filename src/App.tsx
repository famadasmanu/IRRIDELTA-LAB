import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, logout, db } from './lib/firebase';
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
import Herramientas from './pages/Herramientas';
import Ecosistema from './pages/Ecosistema';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import GarantiaActivar from './pages/GarantiaActivar';

import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync role securely from database
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
             window.localStorage.setItem('user_role', JSON.stringify(userSnap.data().role));
          } else {
             const isGod = ['famadasmanuela@gmail.com', 'famadasmanu@gmail.com', 'leandrofamadas15@gmail.com'].includes(currentUser.email?.toLowerCase() || '');
             const defaultRole = isGod ? 'admin' : 'operario';
             await setDoc(userRef, { email: currentUser.email, role: defaultRole, createdAt: new Date().toISOString() });
             window.localStorage.setItem('user_role', JSON.stringify(defaultRole));
          }
        } catch (e) {
          console.error('Error auto-syncing role:', e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-tx-secondary font-medium">Comprobando sesión...</p>
      </div>
    );
  }

  if (!user && !isGuest && window.location.pathname !== '/activar-garantia') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/activar-garantia" element={<GarantiaActivar />} />
          <Route path="*" element={<Login onLogin={() => { }} onGuestLogin={() => setIsGuest(true)} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/activar-garantia" element={<GarantiaActivar />} />
          <Route path="/" element={<Layout onLogout={() => { setIsGuest(false); logout(); }} />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            
            {/* Todas las rutas base */}
            <Route path="inicio" element={<Inicio />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="herramientas" element={<Herramientas />} />
            <Route path="notificaciones" element={<Alertas />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="ecosistema" element={<Ecosistema />} />
            <Route path="partner/:id" element={<PartnerDetalle />} />

            {/* Rutas exclusivas para operaciones, instalación y arquitectura */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'tecnico', 'instalador', 'operario', 'profesional']} />}>
              <Route path="trabajos" element={<Trabajos />} />
              <Route path="inventario" element={<Inventario />} />
            </Route>

            {/* Rutas exclusivas para ventas y arquitectura */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'vendedor', 'profesional']} />}>
              <Route path="archivo" element={<Archivo />} />
              <Route path="finanzas" element={<Finanzas />} />
            </Route>

            {/* Rutas exclusivas para RRHH y Proveedores (management) */}
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
