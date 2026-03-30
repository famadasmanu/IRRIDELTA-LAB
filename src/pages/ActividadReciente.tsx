import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, LogOut, Loader2, Users, FileText, Package, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

export default function ActividadReciente() {
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isCalendarAuthenticated, setIsCalendarAuthenticated] = useState(false);

  const { data: clientesRaw } = useFirestoreCollection<any>('clientes');
  const { data: trabajosRaw } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: garantiasRaw } = useFirestoreCollection<any>('garantias_y_maquinas');

  const getRealActivities = () => {
    const activities: any[] = [];
    
    (clientesRaw || []).forEach((c: any) => {
      activities.push({
        icon: Users,
        text: `Nuevo cliente registrado: ${c.nombre || c.name || 'Desconocido'}`,
        rawDate: c.createdAt || c.fecha || c.id, 
        time: c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-AR') : 'Recientemente'
      });
    });

    (trabajosRaw || []).forEach((t: any) => {
      activities.push({
        icon: Briefcase,
        text: `Obra ${t.estado || 'Activa'}: ${t.titulo || t.cliente || 'Sin título'}`,
        rawDate: t.createdAt || t.fechaInicio || t.fecha || t.id,
        time: t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-AR') : t.fecha || 'Recientemente'
      });
    });

    (garantiasRaw || []).forEach((g: any) => {
      activities.push({
        icon: FileText,
        text: `Garantía Activada: ${g.nombre || 'Cliente'}`,
        rawDate: g.fechaActivacion || g.id,
        time: g.fechaActivacion ? new Date(g.fechaActivacion).toLocaleDateString('es-AR') : 'Recientemente'
      });
    });

    // Sort descending by rawDate string (timestamps are lexicographically sortable if ISO, or we fallback to IDs which contain timestamps often)
    activities.sort((a, b) => String(b.rawDate).localeCompare(String(a.rawDate)));

    return activities.slice(0, 4);
  };

  const recentActivitiesList = getRealActivities();

 useEffect(() => {
 checkAuthStatus();

 const handleMessage = (event: MessageEvent) => {
 const origin = event.origin;
 if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
 return;
 }
 if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
 setIsCalendarAuthenticated(true);
 fetchCalendarEvents();
 }
 };
 window.addEventListener('message', handleMessage);
 return () => window.removeEventListener('message', handleMessage);
 }, []);

 const checkAuthStatus = async () => {
 try {
 const res = await fetch('/api/auth/status');
 if (!res.ok) {
 throw new Error(`HTTP error! status: ${res.status}`);
 }
 const text = await res.text();
 try {
 const data = JSON.parse(text);
 setIsCalendarAuthenticated(data.isAuthenticated);
 if (data.isAuthenticated) {
 fetchCalendarEvents();
 }
 } catch (e) {
 console.error("Invalid JSON response:", text);
 }
 } catch (error) {
 console.error("Error checking auth status", error);
 }
 };

 const fetchCalendarEvents = async () => {
 setIsCalendarLoading(true);
 try {
 const res = await fetch('/api/calendar/events');
 if (res.ok) {
 const text = await res.text();
 try {
 const data = JSON.parse(text);
 setCalendarEvents(data.events || []);
 } catch (e) {
 console.error("Invalid JSON response:", text);
 }
 } else if (res.status === 401) {
 setIsCalendarAuthenticated(false);
 }
 } catch (error) {
 console.error("Error fetching events", error);
 } finally {
 setIsCalendarLoading(false);
 }
 };

 const handleConnectCalendar = async () => {
 try {
 const redirectUri = `${window.location.origin}/auth/callback`;
 const response = await fetch(`/api/auth/url?redirectUri=${encodeURIComponent(redirectUri)}`);
 
 if (!response.ok) {
 throw new Error('Failed to get auth URL');
 }
 
 const { url } = await response.json();
 
 const authWindow = window.open(
 url,
 'oauth_popup',
 'width=600,height=700'
 );

 if (!authWindow) {
 alert('Por favor, permite las ventanas emergentes (popups) para conectar tu cuenta.');
 }
 } catch (error) {
 console.error('OAuth error:', error);
 alert('Error al iniciar la conexión con Google Calendar.');
 }
 };

 const handleDisconnectCalendar = async () => {
 try {
 await fetch('/api/auth/logout', { method: 'POST' });
 setIsCalendarAuthenticated(false);
 setCalendarEvents([]);
 } catch (error) {
 console.error("Error disconnecting", error);
 }
 };

 const formatEventTime = (event: any) => {
 if (event.start?.dateTime) {
 return format(parseISO(event.start.dateTime), "d MMM, HH:mm 'hs'", { locale: es });
 } else if (event.start?.date) {
 return format(parseISO(event.start.date), "d MMM (Todo el día)", { locale: es });
 }
 return "Fecha desconocida";
 };

 return (
 <div className="space-y-6 md:space-y-8 pb-24">
 <div className="bg-card rounded-xl shadow-sm border border-bd-lines overflow-hidden">
 <div className="p-6 border-b border-bd-lines flex justify-between items-center">
 <h2 className="text-lg font-semibold text-tx-primary flex items-center gap-2">
 <Calendar className="text-accent" size={20} />
 Calendario y Tareas
 </h2>
 <div className="flex items-center gap-2">
 {isCalendarAuthenticated ? (
 <>
 <button 
 onClick={fetchCalendarEvents}
 disabled={isCalendarLoading}
 className="p-2 text-tx-secondary hover:bg-main rounded-full transition-colors disabled:opacity-50"
 title="Actualizar eventos"
 >
 <RefreshCw size={18} className={cn(isCalendarLoading && "animate-spin")} />
 </button>
 <button 
 onClick={handleDisconnectCalendar}
 className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
 title="Desconectar Google Calendar"
 >
 <LogOut size={18} />
 </button>
 </>
 ) : (
 <button 
 onClick={handleConnectCalendar}
 className="flex items-center gap-2 text-sm font-medium text-white bg-[#4285F4] px-4 py-2 rounded-lg shadow-sm hover:bg-[#3367D6] transition-colors"
 >
 <svg className="w-4 h-4 fill-current bg-card rounded-full p-0.5" viewBox="0 0 24 24">
 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
 </svg>
 <span className="hidden sm:inline">Sincronizar Calendar</span>
 <span className="sm:hidden">Sincronizar</span>
 </button>
 )}
 </div>
 </div>
 <div className="p-6 relative">
 <div className="absolute left-10 top-6 bottom-6 w-px bg-gray-200 hidden md:block" />
 <div className="space-y-6">
 {isCalendarLoading ? (
 <div className="flex items-center justify-center py-8 text-tx-secondary">
 <Loader2 className="animate-spin mr-2" size={24} />
 Cargando eventos...
 </div>
 ) : isCalendarAuthenticated && calendarEvents.length > 0 ? (
 calendarEvents.map((evento, i) => (
 <div key={evento.id || i} className="flex items-start gap-4 relative z-10">
 <div className="w-8 h-8 rounded-full bg-[#4285F4] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
 <Calendar size={14} />
 </div>
 <div className="pt-1">
 <p className="font-medium text-tx-primary text-sm md:text-base">{evento.summary || 'Evento sin título'}</p>
 <p className="text-xs text-tx-secondary mt-0.5 capitalize">{formatEventTime(evento)}</p>
 </div>
 </div>
 ))
 ) : isCalendarAuthenticated && calendarEvents.length === 0 ? (
 <div className="text-center py-8 text-tx-secondary">
 No hay eventos próximos en tu calendario.
 </div>
 ) : recentActivitiesList.length > 0 ? (
 // Mostrar actividad real de colecciones Firebase
 recentActivitiesList.map((act, i) => (
 <div key={i} className="flex items-start gap-4 relative z-10">
 <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-500/30">
 <act.icon size={14} />
 </div>
 <div className="pt-1">
 <p className="font-medium text-tx-primary text-sm md:text-base leading-tight">{act.text}</p>
 <p className="text-xs text-tx-secondary mt-1">{act.time}</p>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-8 text-tx-secondary text-sm">
 <Package size={24} className="mx-auto mb-2 opacity-30" />
 No hay eventos recientes en el sistema.
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
