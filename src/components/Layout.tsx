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
  Activity
  } from 'lucide-react';
import { MagicLogo } from './MagicLogo';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useCompanyConfig } from '../hooks/useCompanyConfig';

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
  const { data: alertasData } = useFirestoreCollection<any>('notificaciones_data');

  // Compute Badges
  const activeAccountsCount = clientesData.filter(c => c.status === 'EN PROCESO').length;
  const activeProjectsCount = portfolioData.filter(p => p.estado === 'En Proceso').length;
  const totalCuentasYProyectos = activeAccountsCount + activeProjectsCount;
  const unreadAlerts = alertasData.length > 0 ? alertasData.filter(a => !a.leida).length : 3;

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
    { path: '/notificaciones', icon: Bell, label: 'Notificaciones', badge: unreadAlerts > 0 ? unreadAlerts : undefined },
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
        "fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#1E2A28] dark:bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-[#E3E8E6] dark:border-white/5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="py-8 flex items-center justify-center relative border-b border-white/10 px-4 min-h-[140px]">
          <button
            onClick={closeMobileMenu}
            className="md:hidden absolute left-2 top-2 p-1 hover:bg-white/10 rounded text-white/60"
          >
            <X size={16} />
          </button>
          <div className="w-full h-full flex flex-col items-center justify-center pt-2 pb-4">
            <MagicLogo />
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
                  "flex items-center justify-between px-3 py-3 rounded-lg transition-colors min-h-[44px]",
                  isActive
                    ? "bg-[#2F7D6B] dark:bg-white text-white dark:text-[#3A5F4B] shadow-sm font-medium"
                    : "text-white/80 hover:bg-[#1E2A28] hover:text-white dark:text-white dark:hover:bg-[#2d4a3a]"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={24} strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive ? "bg-[#2F7D6B] dark:bg-[#3A5F4B] text-white" : "bg-red-500 text-white"
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
            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] w-full text-white/80 hover:bg-[#1E2A28] hover:text-white dark:text-white dark:hover:bg-[#2d4a3a]"
          >
            {isDarkMode ? <Sun size={24} strokeWidth={1.5} /> : <Moon size={24} strokeWidth={1.5} />}
            <span className="font-medium">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] w-full text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={24} strokeWidth={1.5} />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-20 md:pb-0">
        <div className={location.pathname.includes('/herramientas') ? 'w-full h-full p-2 md:p-4' : 'p-4 md:p-8 max-w-7xl mx-auto w-full'}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 flex justify-around items-center px-2 py-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {filteredMenuItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-colors min-w-[64px]",
                isActive ? "text-[#2F7D6B] dark:text-[#3A5F4B]" : "text-[#6B7280] dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className="relative flex items-center justify-center">
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-white dark:border-slate-900">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] mt-1 font-medium truncate max-w-full", isActive && "font-bold")}>
                {item.label === 'Trabajos' ? 'Obras' : item.label.split(' ')[0]}
              </span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl transition-colors min-w-[64px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Menu size={22} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium">Más</span>
        </button>
      </nav>
    </div>
  );
}
