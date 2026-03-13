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
  Wifi
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocalStorage } from '../hooks/useLocalStorage';

const menuItems = [
  { path: '/inicio', icon: LayoutDashboard, label: 'Inicio' },
  { path: '/trabajos', icon: Wrench, label: 'Trabajos' },
  { path: '/inventario', icon: Package, label: 'Inventario' },
  { path: '/clientes', icon: Users, label: 'Clientes', badge: 8 },
  { path: '/archivo', icon: FolderOpen, label: 'Archivo' },
  { path: '/personal', icon: UserCheck, label: 'Equipo' },
  { path: '/calculadora', icon: Calculator, label: 'Calc. Hidráulica' },
  { path: '/controladores', icon: Wifi, label: 'Controladores' },
  { path: '/proveedor', icon: Truck, label: 'Proveedor' },
  { path: '/finanzas', icon: DollarSign, label: 'Finanzas' },
  { path: '/notificaciones', icon: Bell, label: 'Notificaciones', badge: 3 },
  { path: '/configuracion', icon: Settings, label: 'Configuración' },
];

export default function Layout({ onLogout }: { onLogout: () => void }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const [companyData] = useLocalStorage('config_company', {
    nombre: 'GreenFields Landscapes',
    cuit: '30-12345678-9',
    direccion: 'Av. Libertador 1234, CABA',
    terminos: 'El presupuesto tiene una validez de 15 días. Pago del 50% por adelantado.',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASkzUC9DNQrHglh2e6G7kg1CWectkzqVhy57Hmk5Y_xJ8h8Bx7GvT1k4Ly9_iy6dcXfpdIZQESlcPmdQKYj5YVSpvkKqmr_Vcuhdt0fKCfuqVjWxo_u4lnNkOhd2GWjVo9vAFHN1Kd03Kh0orAXNaQdZKMtek2kD1DzV1TChRTd3FyAjK1cTCGRn0-aX9LEmkINiHbPuecU-qOFxiU54SNvsbVAuLBX5H32OR8MoubDtTpE2E4NdLS3ZN6bCr4ZlxdCNOiztCVBLM'
  });

  const [isDarkMode, setIsDarkMode] = useLocalStorage('theme_dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [userRole] = useLocalStorage('user_role', 'admin'); // Possible roles: admin, tecnico, vendedor

  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'admin') return true;
    if (userRole === 'tecnico') {
      return ['/inicio', '/trabajos', '/inventario', '/clientes', '/calculadora', '/controladores', '/notificaciones'].includes(item.path);
    }
    if (userRole === 'vendedor') {
      return ['/inicio', '/clientes', '/archivo', '/calculadora', '/controladores', '/finanzas', '/notificaciones'].includes(item.path);
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
    <div className="min-h-screen bg-background-light dark:bg-slate-900 flex transition-colors duration-200">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#3A5F4B] text-white flex flex-col transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="py-8 flex items-center justify-center relative border-b border-white/10 px-4 min-h-[140px]">
          <button
            onClick={closeMobileMenu}
            className="md:hidden absolute left-2 top-2 p-1 hover:bg-white/10 rounded text-white/60"
          >
            <X size={16} />
          </button>
          {companyData.logo ? (
            <img src={companyData.logo} alt={companyData.nombre} className="max-h-32 md:max-h-28 max-w-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex flex-col items-center gap-2 w-full justify-center">
              <span className="font-extrabold text-2xl md:text-3xl tracking-widest uppercase text-center leading-tight">
                {companyData.nombre || 'IRRIDELTA'}
              </span>
            </div>
          )}
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
                    ? "bg-white text-[#3A5F4B]"
                    : "text-white hover:bg-[#2d4a3a]"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={24} strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive ? "bg-[#3A5F4B] text-white" : "bg-red-500 text-white"
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
            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] w-full text-white hover:bg-[#2d4a3a]"
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
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
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
                isActive ? "text-[#3A5F4B] dark:text-emerald-400" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
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
