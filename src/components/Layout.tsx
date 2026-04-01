import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {  
  LayoutDashboard,
  Wrench,
  Package,
  Users,
  FolderOpen,
  HardHat,
  Truck,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  Building2,
  Calendar,
  Calculator,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Activity
  } from 'lucide-react';
import { Logo } from './Logo';
import { AIAssistant } from './AIAssistant';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useCompanyConfig } from '../hooks/useCompanyConfig';
import { useAlerts } from '../hooks/useAlerts';

export default function Layout({ onLogout }: { onLogout: () => void }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const [companyData] = useCompanyConfig();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const item = window.localStorage.getItem('theme_dark');
      return item ? JSON.parse(item) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('theme_dark', JSON.stringify(isDarkMode));
    } catch {}
  }, [isDarkMode]);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [userRole] = useState(() => {
    try {
      const item = window.localStorage.getItem('user_role');
      return item ? JSON.parse(item) : 'admin';
    } catch {
      return 'admin';
    }
  });

  const { data: clientesData } = useFirestoreCollection<any>('clientes_data');
  const { data: portfolioData } = useFirestoreCollection<any>('trabajos_portfolio');
  const { unreadCount } = useAlerts();

  // Compute Badges
  const activeAccountsCount = clientesData.filter(c => c.status === 'EN PROCESO').length;
  const activeProjectsCount = portfolioData.filter(p => p.estado === 'En Proceso').length;
  const totalCuentasYProyectos = activeAccountsCount + activeProjectsCount;

  const menuItems = [
    { path: '/inicio', icon: LayoutDashboard, label: 'Inicio' },
    { path: '/inventario', icon: Package, label: 'Inventario' },
    { path: '/clientes', icon: Users, label: 'Cuentas & Proyectos', badge: totalCuentasYProyectos > 0 ? totalCuentasYProyectos : undefined },
    { path: '/herramientas', icon: Calculator, label: 'Herramientas' },
    { path: '/ecosistema', icon: Activity, label: 'Ecosistema' },
    { path: '/archivo', icon: FolderOpen, label: 'Archivo' },
    { path: '/personal', icon: UserCheck, label: 'Equipo' },
    { path: '/proveedor', icon: Truck, label: 'Proveedor' },
    { path: '/finanzas', icon: DollarSign, label: 'Finanzas' },
    { path: '/notificaciones', icon: Bell, label: 'Notificaciones', badge: unreadCount > 0 ? unreadCount : undefined },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'admin') return true;
    if (userRole === 'tecnico') {
      return ['/inicio', '/inventario', '/clientes', '/herramientas', '/ecosistema', '/notificaciones'].includes(item.path);
    }
    if (userRole === 'vendedor') {
      return ['/inicio', '/clientes', '/archivo', '/herramientas', '/ecosistema', '/finanzas', '/notificaciones'].includes(item.path);
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const closeMobileMenu = () => setIsMobileOpen(false);

  return (
    <div className="min-h-screen bg-main dark:bg-slate-900 text-tx-primary dark:text-slate-100 flex transition-colors duration-200">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-screen w-[340px] bg-[#1E2A28] dark:bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-[#E3E8E6] dark:border-white/5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="py-8 md:py-10 flex items-center justify-center relative border-b border-white/10 px-4">
          <button
            onClick={closeMobileMenu}
            className="md:hidden absolute left-2 top-2 p-1 hover:bg-white/10 rounded text-white/60"
          >
            <X size={16} />
          </button>
          <div className="w-full flex items-center justify-center mt-3 mb-3 md:mt-5 md:mb-5 px-1">
            <Logo className="h-auto w-[96%] max-w-[290px] md:max-w-[320px] object-contain drop-shadow-md hover:scale-[1.02] transition-transform" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center justify-between px-4 py-[14px] rounded-xl transition-all min-h-[52px]",
                  isActive
                    ? "bg-gradient-to-br from-[#10b981] to-[#059669] shadow-[0_0_15px_rgba(16,185,129,0.4)] text-white font-medium border border-[#10b981]/50"
                    : "text-white/80 hover:bg-[#1E2A28] hover:text-white dark:text-white dark:hover:bg-[#2d4a3a]"
                )}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={28} strokeWidth={1.5} />
                  <span className="font-semibold text-[17px] tracking-wide">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors min-h-[52px] w-full text-white/80 hover:bg-[#1E2A28] hover:text-white dark:text-white dark:hover:bg-[#2d4a3a]"
          >
            {isDarkMode ? <Sun size={28} strokeWidth={1.5} /> : <Moon size={28} strokeWidth={1.5} />}
            <span className="font-semibold text-[17px] tracking-wide">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors min-h-[52px] w-full text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={28} strokeWidth={1.5} />
            <span className="font-semibold text-[17px] tracking-wide">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Container wrapping Header and Content */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 left-0 right-0 bg-[#1E2A28] dark:bg-slate-900 border-b border-white/10 z-30 flex items-center justify-between px-4 py-3 shadow-md w-full shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileOpen(true)} className="p-1 -ml-1 text-white/80 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-white truncate">
              Argent Software
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={location.pathname.includes('/herramientas') ? 'w-full h-full p-2 md:p-4' : 'p-4 md:p-8 max-w-7xl mx-auto w-full'}>
            <Outlet />
          </div>
        </main>
      </div>


    <AIAssistant />
    </div>
  );
}
