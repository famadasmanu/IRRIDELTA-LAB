import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
 CloudRain,
 Wind,
 Sun,
 Droplets,
 Thermometer,
 DollarSign,
 Eye,
 EyeOff,
 Calendar,
 AlertTriangle,
 Users,
 CheckCircle,
 FileText,
 Package,
 Settings2,
 RefreshCw,
 LogOut,
 Loader2,
 ArrowUpRight,
 ArrowDownRight,
 ArrowRight,
 Handshake,
 Bell,
 MapPin,
 User,
 ChevronLeft,
 ChevronRight,
 ExternalLink,
 Briefcase,
 Activity,
 Truck,
 TrendingUp,
 Plus,
 ImagePlus,
 Trash2,
 Instagram,
 Newspaper
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNovedadesAutomaticas } from '../hooks/useNovedadesAutomaticas';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useLocalConfig } from '../hooks/useLocalConfig';
import { useCompanyConfig } from '../hooks/useCompanyConfig';
import { useAlerts } from '../hooks/useAlerts';
import { format, parseISO } from 'date-fns';
import { auth, storage } from '../lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { es } from 'date-fns/locale';
import { Modal } from '../components/Modal';
import { irrideltaNews } from '../lib/newsData';



export default function Inicio() {
 const navigate = useNavigate();
 const [showWidgets, setShowWidgets] = useState(true);

  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [showAllNews, setShowAllNews] = useState(false);
  const [readNews, setReadNews] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('read_irridelta_news') || '[]'); } catch { return []; }
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');



  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleOpenNews = (news: any) => {
    setSelectedNews(news);
    if (!readNews.includes(news.id)) {
      const updated = [...readNews, news.id];
      setReadNews(updated);
      localStorage.setItem('read_irridelta_news', JSON.stringify(updated));
    }
  };

  const unreadCount = irrideltaNews.filter(n => !readNews.includes(n.id)).length;

  const [companyData] = useCompanyConfig();
  const [profileData] = useLocalConfig('config_profile', {
    nombre: 'Admin',
    avatar: ''
  });

  const [userRole] = useState(() => {
    try {
      const item = window.localStorage.getItem('user_role');
      return item ? JSON.parse(item) : 'admin';
    } catch {
      return 'admin';
    }
  });
  const isAdmin = userRole === 'admin' || userRole === 'invitado' || userRole === 'desarrollador';

  // Automated Partner News
  const { novedades, addUrl, fuentes, remove, fetchNovedades } = useNovedadesAutomaticas();
  const [isAddPartnerNewsOpen, setIsAddPartnerNewsOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isUploadingNews, setIsUploadingNews] = useState(false);

  const handleAddPartnerNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsUploadingNews(true);
    await addUrl(newUrl);
    setNewUrl('');
    setIsUploadingNews(false);
    // Remove auto-close so they can see the list update and manage other sources
  };

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isCalendarAuthenticated, setIsCalendarAuthenticated] = useState(false);

  // Weather States
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);

  // Dolar States
  const [dolarData, setDolarData] = useState<any>(null);
  const [isDolarLoading, setIsDolarLoading] = useState(true);
  const [dolarSource, setDolarSource] = useState<'dolarhoy' | 'banconacion'>('dolarhoy');

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Alertas integradas para el contador del dashboard
  const { unreadCount: unreadAlertsCounter } = useAlerts();
  const { data: portfolioRaw } = useFirestoreCollection<any>('trabajos_portfolio');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayJobs = portfolioRaw.filter((job: any) => job.fechaInicio === todayStr);

 // WMO Weather Code Mapping to Icons and Text
 const getWeatherInfo = (code: number) => {
 switch (true) {
 case (code === 0): return { text: 'Cielo Despejado', icon: <Sun size={32} className="text-yellow-300 drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&q=80&w=800' };
 case (code === 1 || code === 2 || code === 3): return { text: 'Parcialmente Nublado', icon: <CloudRain size={32} className="text-gray-300 drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=800' };
 case (code >= 45 && code <= 48): return { text: 'Niebla', icon: <Wind size={32} className="text-gray-300 drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&q=80&w=800' };
 case (code >= 51 && code <= 67): return { text: 'Llovizna / Lluvia', icon: <CloudRain size={32} className="text-blue-300 drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800' };
 case (code >= 71 && code <= 77): return { text: 'Nieve', icon: <CloudRain size={32} className="text-white drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1542601098-3adb3baeb1ec?auto=format&fit=crop&q=80&w=800' };
 case (code >= 80 && code <= 82): return { text: 'Chubascos', icon: <CloudRain size={32} className="text-blue-400 drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800' };
 case (code >= 95 && code <= 99): return { text: 'Tormenta Eléctrica', icon: <CloudRain size={32} className="text-purple-300 drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce49?auto=format&fit=crop&q=80&w=800' };
 default: return { text: 'Desconocido', icon: <Sun size={32} className="text-yellow-300 drop-shadow-md" strokeWidth={2} />, bg: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&q=80&w=800' };
 }
 };

  useEffect(() => {
  // Auto-scroll carousel every 10 seconds (User requested slower movement)
  const interval = setInterval(() => {
  if (carouselRef.current) {
  const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
  const isEnd = scrollLeft + clientWidth >= scrollWidth - 10;

  if (isEnd) {
  carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
  } else {
  carouselRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
  }
  }
  }, 10000);

  return () => clearInterval(interval);
  }, []);
 useEffect(() => {
 checkAuthStatus();

 const handleMessage = (event: MessageEvent) => {
 // Validate origin is from AI Studio preview or localhost
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

 // Fetch Weather Data (Default BA coords: -34.6037, -58.3816)
 const fetchWeather = async () => {
 try {
 const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo');
 const data = await res.json();
 if (data.current) {
   setWeatherData(data.current);
 } else {
   throw new Error("Invalid Format");
 }
 } catch (err) {
 console.error("Failed to fetch weather", err);
 setWeatherData({
   temperature_2m: 22,
   relative_humidity_2m: 60,
   apparent_temperature: 24,
   precipitation: 0,
   weather_code: 0,
   wind_speed_10m: 10
 });
 } finally {
 setIsWeatherLoading(false);
 }
 };

 // Fetch Dolar Data
 const fetchDolar = async () => {
 try {
 const res = await fetch('https://dolarapi.com/v1/dolares');
 const data = await res.json();

 const oficial = data.find((d: any) => d.casa === 'oficial');
 const blue = data.find((d: any) => d.casa === 'blue');
 const mep = data.find((d: any) => d.casa === 'bolsa');
 const mayorista = data.find((d: any) => d.casa === 'mayorista');
 const tarjeta = data.find((d: any) => d.casa === 'tarjeta');

 setDolarData({ oficial, blue, mep, mayorista, tarjeta });
 } catch (err) {
 console.error("Failed to fetch dolar", err);
 setDolarData({
   oficial: { venta: 1000, compra: 950 },
   blue: { venta: 1200, compra: 1150 },
   mep: { venta: 1100, compra: 1100 },
   mayorista: { venta: 1000, compra: 1000 },
   tarjeta: { venta: 1300, compra: 1300 }
 });
 } finally {
 setIsDolarLoading(false);
 }
 };

 fetchWeather();
 fetchDolar();

 return () => window.removeEventListener('message', handleMessage);
 }, []);

 const checkAuthStatus = async () => {
 try {
 const uid = auth.currentUser?.uid || 'default';
      const res = await fetch('/api/auth/status', {
        headers: { 'Authorization': `Bearer ${uid}` }
      });
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
 const uid = auth.currentUser?.uid || 'default';
      const res = await fetch('/api/calendar/events', {
        headers: { 'Authorization': `Bearer ${uid}` }
      });
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
 return (
 <div className="space-y-6 md:space-y-8 pb-24">
 {/* Header */}
 <header className="flex items-center justify-between bg-card rounded-2xl p-4 shadow-sm border border-bd-lines">
 <div className="flex items-center gap-4">
 <div className="size-12 shrink-0 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden border border-bd-lines">
 {profileData.avatar ? (
 <img src={profileData.avatar} alt={profileData.nombre} className="w-full h-full object-cover" />
 ) : (
 <User className="size-6 text-accent" />
 )}
 </div>
 <div className="flex flex-col">
 <span className="text-sm text-tx-secondary font-medium">Hola,</span>
 <h1 className="text-tx-primary text-xl font-bold leading-tight tracking-tight">{profileData.nombre}</h1>
 </div>
 </div>
 <div className="flex gap-4 items-center">
  <button
  onClick={() => navigate('/notificaciones')}
 className="flex size-12 items-center justify-center rounded-full hover:bg-main transition-colors relative"
 >
 <Bell className="size-6 text-tx-secondary dark:text-tx-secondary" />
 {unreadAlertsCounter > 0 && (
 <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
 {unreadAlertsCounter > 9 ? '9+' : unreadAlertsCounter}
 </span>
 )}
 </button>
 </div>
 </header>

 <div className="flex justify-end items-center">
 <button
 onClick={() => setShowWidgets(!showWidgets)}
 className="flex items-center gap-2 text-sm font-medium text-accent bg-card px-4 py-2 rounded-lg shadow-sm hover:bg-main transition-colors"
 >
 <Settings2 size={18} />
 <span className="hidden sm:inline">Mostrar/Ocultar widgets</span>
 </button>
 </div>



  {/* Widgets Row */}
  {showWidgets && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
 {/* Clima Widget Rediseñado */}
 <div className="relative overflow-hidden rounded-2xl shadow-md border border-bd-lines animate-in fade-in duration-500 min-h-[280px] flex flex-col justify-between">
 {isWeatherLoading || !weatherData ? (
 <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
 <Loader2 className="animate-spin text-white size-8" />
 </div>
 ) : null}

 {/* Imagen de fondo dinámica basada en clima */}
 <div
 className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
 style={{ backgroundImage: `url('${weatherData ? getWeatherInfo(weatherData.weather_code).bg : 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&q=80&w=800'}')` }}
 />
 {/* Overlay oscuro para legibilidad */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/90" />

 {/* Contenido Superior */}
 <div className="relative z-10 p-6 flex justify-between items-start text-white">
 <div>
 <h3 className="font-medium text-white/90 text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
 <MapPin size={14} />
 Buenos Aires
 </h3>
 <p className="text-white font-medium text-lg drop-shadow-md">
 {weatherData ? getWeatherInfo(weatherData.weather_code).text : 'Cielo Despejado'}
 </p>
 <div className="mt-1 flex items-center gap-1 opacity-70">
 <span className="text-[10px] font-bold uppercase tracking-wider bg-card/20 px-2 py-0.5 rounded-full inline-block backdrop-blur-sm border border-white/20 shadow-sm">
 Powered by The Weather Channel
 </span>
 </div>
 </div>
 <div className="bg-black/20 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/10">
 {weatherData ? getWeatherInfo(weatherData.weather_code).icon : <Sun size={32} className="text-yellow-300 drop-shadow-md" strokeWidth={2} />}
 </div>
 </div>

 {/* Contenido Inferior */}
 <div className="relative z-10 p-6 pt-0 mt-auto">
 <div className="flex items-end gap-3 mb-6">
 <span className="text-7xl font-light text-white tracking-tighter drop-shadow-lg leading-none">
 {weatherData ? Math.round(weatherData.temperature_2m) : '--'}°
 </span>
 <span className="text-xl font-medium text-white/80 mb-2">C</span>
 </div>

 {/* Datos Secundarios con Degradado Inferior */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
 <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md rounded-xl py-2 px-1 border border-white/10">
 <Droplets size={16} className="text-blue-300 mb-1" />
 <span className="text-[10px] text-white/80 uppercase font-semibold tracking-wider">Humedad</span>
 <span className="font-bold text-sm text-white">{weatherData ? weatherData.relative_humidity_2m : '--'}%</span>
 </div>
 <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md rounded-xl py-2 px-1 border border-white/10">
 <Wind size={16} className="text-gray-300 mb-1" />
 <span className="text-[10px] text-white/80 uppercase font-semibold tracking-wider">Viento</span>
 <span className="font-bold text-sm text-white">{weatherData ? Math.round(weatherData.wind_speed_10m) : '--'} km/h</span>
 </div>
 <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md rounded-xl py-2 px-1 border border-white/10">
 <Thermometer size={16} className="text-orange-300 mb-1" />
 <span className="text-[10px] text-white/80 uppercase font-semibold tracking-wider">Sensación</span>
 <span className="font-bold text-sm text-white">{weatherData ? Math.round(weatherData.apparent_temperature) : '--'}°</span>
 </div>
 <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md rounded-xl py-2 px-1 border border-white/10">
 <CloudRain size={16} className="text-blue-200 mb-1" />
 <span className="text-[10px] text-white/80 uppercase font-semibold tracking-wider">Lluvia</span>
 <span className="font-bold text-sm text-white">{weatherData ? weatherData.precipitation : '--'} mm</span>
 </div>
 </div>
 </div>
 </div>

 {/* Dólar Widget Rediseñado */}
 <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg border border-slate-700/50 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
 {isDolarLoading || !dolarData ? (
 <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
 <Loader2 className="animate-spin text-white size-8" />
 </div>
 ) : null}

 {/* Textura sutil de puntos para profundidad */}
 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
 {/* Resplandor sutil gris-azulado */}
 <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

 <div className="flex justify-between items-start mb-6 relative z-10">
 <div className="flex items-center gap-3">
 <div className="bg-slate-700/50 p-2.5 rounded-xl border border-slate-600/50 shadow-inner">
 <DollarSign size={24} className="text-emerald-400" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-slate-300 font-bold text-xs uppercase tracking-widest">Cotización Dólar</h3>
 <ArrowUpRight size={16} className="text-emerald-400/80" />
 </div>
 <div className="flex items-center gap-2 mt-2">
 <select
 value={dolarSource}
 onChange={(e) => setDolarSource(e.target.value as any)}
 className="bg-slate-800 text-xs text-white border border-slate-600 rounded px-2 py-1 outline-none font-medium h-7 focus:border-emerald-400 cursor-pointer"
 >
 <option value="dolarhoy">Dólar Libre / Bolsa</option>
 <option value="banconacion">Banco Nación</option>
 </select>
 <span className="relative flex h-2 w-2 ml-1">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
 </span>
 </div>
 </div>
 </div>
 <div className="text-right bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50 mt-1">
 <span className="text-[10px] text-tx-secondary font-bold uppercase tracking-wider block mb-0.5">Actualizado</span>
 <p className="text-xs text-slate-200 font-bold">
 {dolarData?.oficial?.fechaActualizacion ? format(parseISO(dolarData.oficial.fechaActualizacion), "HH:mm 'hs'", { locale: es }) : '--:-- hs'}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10 mt-auto">
 {dolarSource === 'dolarhoy' ? (
 <>
 {/* Oficial */}
 <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 flex flex-col hover:bg-slate-700/50 transition-all group">
 <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">Oficial</span>
 <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
 ${dolarData?.oficial?.venta ? Math.round(dolarData.oficial.venta) : '--'}
 </span>
 <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-700/50">
 <span className="text-[10px] text-tx-secondary">Compra: ${dolarData?.oficial?.compra ? Math.round(dolarData.oficial.compra) : '--'}</span>
 </div>
 </div>

 {/* Blue */}
 <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 flex flex-col hover:bg-slate-700/50 transition-all group">
 <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">Blue</span>
 <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
 ${dolarData?.blue?.venta ? Math.round(dolarData.blue.venta) : '--'}
 </span>
 <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-700/50">
 <span className="text-[10px] text-tx-secondary">Compra: ${dolarData?.blue?.compra ? Math.round(dolarData.blue.compra) : '--'}</span>
 </div>
 </div>

 {/* MEP */}
 <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 flex flex-col hover:bg-slate-700/50 transition-all group">
 <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">MEP</span>
 <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
 ${dolarData?.mep?.venta ? Math.round(dolarData.mep.venta) : '--'}
 </span>
 <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-700/50">
 <span className="text-[10px] text-tx-secondary">Venta de bolsa</span>
 </div>
 </div>
 </>
 ) : (
 <>
 {/* BNA Oficial */}
 <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 flex flex-col hover:bg-slate-700/50 transition-all group">
 <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">Oficial BNA</span>
 <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
 ${dolarData?.oficial?.venta ? Math.round(dolarData.oficial.venta) : '--'}
 </span>
 <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-700/50">
 <span className="text-[10px] text-tx-secondary">Compra: ${dolarData?.oficial?.compra ? Math.round(dolarData.oficial.compra) : '--'}</span>
 </div>
 </div>

 {/* Mayorista */}
 <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 flex flex-col hover:bg-slate-700/50 transition-all group">
 <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">Mayorista</span>
 <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
 ${dolarData?.mayorista?.venta ? Math.round(dolarData.mayorista.venta) : '--'}
 </span>
 <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-700/50">
 <span className="text-[10px] text-tx-secondary">Compra: ${dolarData?.mayorista?.compra ? Math.round(dolarData.mayorista.compra) : '--'}</span>
 </div>
 </div>

 {/* Tarjeta */}
 <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 flex flex-col hover:bg-slate-700/50 transition-all group">
 <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">Tarjeta</span>
 <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
 ${dolarData?.tarjeta?.venta ? Math.round(dolarData.tarjeta.venta) : '--'}
 </span>
 <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-700/50">
 <span className="text-[10px] text-tx-secondary">Compra: ${dolarData?.tarjeta?.compra ? Math.round(dolarData.tarjeta.compra) : '--'}</span>
 </div>
 </div>
 </>
  )}
  </div>
  </div>
  </div>
  )}

  {/* Agenda de Hoy Widget */}
  <section className="bg-card rounded-2xl p-6 shadow-sm border border-bd-lines">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <Calendar className="size-6 text-accent" />
 <h2 className="text-tx-primary text-xl font-bold tracking-tight">Agenda de Hoy</h2>
 </div>
 <button onClick={() => window.open('https://calendar.google.com/calendar/u/0/r', '_blank')} className="text-accent text-sm font-semibold hover:underline">Ver Google Calendar</button>
 </div>
 
 <div className="space-y-4">
 {todayJobs.length > 0 ? todayJobs.map((job: any) => (
 <button type="button" key={job.id} onClick={() => window.open('https://calendar.google.com/calendar/u/0/r', '_blank')} className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-main rounded-xl border border-bd-lines cursor-pointer hover:shadow-sm hover:border-accent transition-all group gap-4 appearance-none outline-none">
 <div className="flex items-center gap-4 w-full sm:w-auto">
 <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
 <Briefcase className="size-6 text-accent" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-bold text-tx-primary group-hover:text-accent transition-colors truncate">{job.titulo}</h3>
 <p className="text-sm text-tx-secondary flex items-center gap-1 mt-1 truncate">
 <MapPin size={14} className="shrink-0" /> <span className="truncate">{job.ubicacion || 'Sin ubicación'}</span> • {job.cliente}
 </p>
 </div>
 </div>
 <div className={cn(
 "px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap",
 job.estado === 'Completado' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
 job.estado === 'En Proceso' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
 "bg-orange-500/10 text-orange-500 border border-orange-500/20"
 )}>
 {job.estado}
 </div>
 </button>
 )) : (
 <div className="text-center py-8 bg-main rounded-xl border border-dashed border-bd-lines">
 <Calendar className="size-12 text-tx-secondary mx-auto mb-3 opacity-50" />
 <p className="text-tx-secondary font-medium">No hay trabajos programados para hoy</p>
 <button type="button" onClick={() => navigate('/trabajos?action=new')} className="mt-4 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl shadow-sm hover:bg-accent transition-colors border border-transparent">Programar Trabajo</button>
        </div>
      )}
      </div>
    </section>

    {/* Socios Estratégicos */}
    <section className="bg-card rounded-2xl p-6 shadow-sm border border-bd-lines">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-1 gap-4">
        <div className="flex items-center gap-3">
          <Handshake className="size-6 text-accent" />
          <h2 className="text-tx-primary text-xl font-bold tracking-tight">Novedades de Socios</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
               onClick={() => setIsAddPartnerNewsOpen(true)}
               className="flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-accent hover:text-white transition-colors"
            >
               <Settings2 size={16} /> Fuentes
            </button>
          )}

          <div className="flex items-center gap-2 lg:ml-2 border-l border-bd-lines pl-3">
            <button
              onClick={() => scrollCarousel('left')}
              className="p-2 rounded-lg bg-main text-tx-secondary hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-transparent shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="p-2 rounded-lg bg-main text-tx-secondary hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-transparent shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {novedades.length > 0 ? (
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {novedades.map((news: any) => (
            <div
              key={news.id}
              className={cn(
                "min-w-[100%] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] snap-start shrink-0 relative rounded-2xl overflow-hidden group shadow-md border flex flex-col",
                news.isInstagram ? "border-pink-500/30 hover:shadow-pink-500/20" : "border-bd-lines hover:border-blue-500/50"
              )}
            >
              <div className="h-44 relative overflow-hidden bg-main">
                {news.imagen ? (
                  <img
                    src={news.imagen}
                    alt={news.titulo}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  {news.isInstagram ? (
                     <div className="px-5 py-2.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] rounded-full text-white text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border-[1.5px] border-white/40 backdrop-blur-xl">
                       <Instagram size={18} /> {news.socio}
                     </div>
                   ) : (
                     <div className="px-5 py-2.5 bg-white dark:bg-slate-900 backdrop-blur-xl border-[1.5px] border-white/20 dark:border-slate-700/50 rounded-full text-tx-primary text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                       <Newspaper size={18} className="text-blue-500" /> {news.socio}
                     </div>
                   )}
                </div>
              </div>

              <div className="flex flex-col flex-1 bg-card p-5 relative">
                <div className="absolute -top-6 right-4 z-10 px-2.5 py-1 bg-card border border-bd-lines text-[10px] font-bold text-tx-secondary rounded-full shadow-sm">
                  {format(news.fecha, "d/M - HH:mm", { locale: es })}
                </div>

                <h3 className={cn(
                  "text-lg font-bold leading-tight mb-2 transition-colors line-clamp-2 mt-1",
                   news.isInstagram ? "text-tx-primary group-hover:text-pink-500" : "text-tx-primary group-hover:text-blue-500"
                )}>
                  {news.titulo}
                </h3>
                <p className="text-sm text-tx-secondary leading-relaxed line-clamp-3 mb-6 flex-1">
                  {news.descripcion}
                </p>
                <div className="mt-auto">
                   <a
                     href={news.link}
                     target="_blank"
                     rel="noopener noreferrer"
                     className={cn(
                       "flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                       news.isInstagram ? "bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white" : "bg-main text-tx-primary hover:bg-slate-200 dark:hover:bg-slate-800 border-bd-lines border"
                     )}
                   >
                     <span>{news.isInstagram ? "Ver en Instagram" : "Leer novedad completa"}</span>
                     <ExternalLink size={16} className="ml-2" />
                   </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-main rounded-xl p-8 text-center border border-bd-lines">
          <Handshake className="size-12 text-slate-300 mx-auto mb-3" />
          <p className="text-tx-secondary font-medium">Próximamente novedades de nuestros socios estratégicos</p>
        </div>
      )}
    </section>

    {/* Modal - Vista de Todas las Novedades */}
 <Modal
 isOpen={showAllNews}
 onClose={() => setShowAllNews(false)}
 title="Novedades Argent Software"
 >
 <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
 {irrideltaNews.map((news) => (
 <button
 type="button"
 key={news.id}
 onClick={() => { setShowAllNews(false); handleOpenNews(news); }}
 className="w-full text-left flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-bd-lines hover:bg-main cursor-pointer transition-colors relative appearance-none outline-none"
 >
 <div className="w-full sm:w-24 h-40 sm:h-24 shrink-0 rounded-lg overflow-hidden relative">
 <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
 {news.badge === 'Urgente' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
 </div>
 <div className="flex-1 w-full min-w-0 mt-2 sm:mt-0">
 <div className="flex justify-between items-start mb-1">
 <h4 className="font-bold text-tx-primary truncate pr-4">{news.title}</h4>
 {!readNews.includes(news.id) && <div className="w-2 h-2 shrink-0 bg-red-500 rounded-full mt-1.5 shadow-sm shadow-red-500/50"></div>}
 </div>
 <p className="text-xs text-tx-secondary mb-2">{news.date}</p>
 <p className="text-sm text-tx-secondary line-clamp-2">{news.content}</p>
 </div>
 </button>
 ))}
 </div>
 </Modal>

 {/* Modal - Noticia Completa */}
 <Modal
 isOpen={!!selectedNews}
 onClose={() => setSelectedNews(null)}
 title={selectedNews?.title || "Novedad"}
 >
 {selectedNews && (
 <div className="space-y-6">
 <div className="w-full aspect-video rounded-xl overflow-hidden relative">
 <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-full object-cover" />
 <div className="absolute top-4 left-4">
 <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded uppercase tracking-widest border border-white/20">{selectedNews.badge}</span>
 </div>
 </div>

 <div>
 <p className="font-medium text-accent mb-1">{selectedNews.subtitle}</p>
 <div className="flex border-b border-bd-lines pb-4 mb-4 justify-between items-center">
 <p className="text-sm text-tx-secondary font-medium">{selectedNews.date}</p>
 </div>

 <div className="prose prose-slate max-w-none text-tx-secondary leading-relaxed text-sm">
 <p>{selectedNews.content}</p>
 </div>

 {/* Acciones Relacionadas */}
 {(selectedNews.relatedWorkId || selectedNews.relatedProductLink) && (
 <div className="flex flex-col gap-2 pt-6 pb-2">
 <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-1">Acciones sugeridas</span>
 {selectedNews.relatedWorkId && (
 <button
 onClick={() => { setSelectedNews(null); navigate('/proyectos'); }}
 className="flex items-center gap-3 w-full p-3 rounded-xl border border-bd-lines hover:bg-main transition-colors text-left group"
 >
 <div className="bg-accent/10 p-2 rounded-lg group-hover:bg-accent/20 transition-colors">
 <Briefcase className="size-5 text-accent" />
 </div>
 <div>
 <span className="block text-sm font-bold text-tx-primary">Ver trabajo relacionado</span>
 <span className="block text-xs text-tx-secondary">Ir al módulo de proyectos</span>
 </div>
 </button>
 )}
 {selectedNews.relatedProductLink && (
 <button
 onClick={() => { setSelectedNews(null); navigate(selectedNews.relatedProductLink); }}
 className="flex items-center gap-3 w-full p-3 rounded-xl border border-bd-lines hover:bg-main transition-colors text-left group"
 >
 <div className="bg-accent/10 p-2 rounded-lg group-hover:bg-accent/20 transition-colors">
 <ExternalLink className="size-5 text-accent" />
 </div>
 <div>
 <span className="block text-sm font-bold text-tx-primary">Ir al producto relacionado</span>
 <span className="block text-xs text-tx-secondary">Ver detalles en inventario</span>
 </div>
 </button>
 )}
 </div>
 )}
 </div>

 <div className="pt-4 flex justify-end gap-3 border-t border-bd-lines">
 <button
 onClick={() => { setSelectedNews(null); setShowAllNews(true); }}
 className="px-5 py-2.5 bg-main text-tx-secondary font-bold rounded-xl hover:bg-slate-200 transition-colors"
 >
 Volver a novedades
 </button>
 <button onClick={() => setSelectedNews(null)} className="px-5 py-2.5 bg-accent text-white font-bold rounded-xl hover:bg-[#15803d] transition-colors">Cerrar</button>
 </div>
 </div>
 )}
 </Modal>

  {/* Modal - Añadir Novedad de Socio */}
  <Modal isOpen={isAddPartnerNewsOpen} onClose={() => setIsAddPartnerNewsOpen(false)} title="Gestor de Fuentes RSS/Web">
    <div className="space-y-6">
      <div className="bg-main border border-bd-lines rounded-xl p-4">
        <p className="text-sm text-tx-secondary mb-3">Conecta URLs en formato RSS de blogs corporativos o perfiles de Instagram de Socios. El sistema detectará automáticamente al socio y extraerá la información.</p>
        <form onSubmit={handleAddPartnerNews} className="space-y-3">
          <div>
            <input type="url" required value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full bg-card border border-bd-lines rounded-lg px-4 py-3 text-tx-primary font-mono text-sm shadow-inner" placeholder="Ej: https://instagram.com/mi_socio o https://misocio.com/blog" />
          </div>
          <button type="submit" disabled={isUploadingNews} className="w-full bg-accent text-white font-bold py-2.5 rounded-lg hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2 shadow-sm">
            {isUploadingNews ? <Loader2 className="animate-spin size-4" /> : <><Plus size={16} /> Añadir Fuente</>}
          </button>
        </form>
      </div>
      
      <div>
         <h4 className="font-bold text-tx-primary mb-3">Fuentes Conectadas ({fuentes.length})</h4>
         <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
            {fuentes.length === 0 ? (
               <p className="text-center text-sm text-tx-secondary py-4 bg-main rounded-xl border border-dashed border-bd-lines">No hay enlaces conectados.</p>
            ) : (
               fuentes.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-main border border-bd-lines rounded-lg group hover:border-red-500/30 transition-colors">
                     <div className="flex-1 min-w-0 pr-4">
                       <span className="font-bold text-sm text-tx-primary block truncate">{f.socio}</span>
                       <span className="text-xs text-tx-secondary truncate block">{f.urlRss}</span>
                     </div>
                     <button
                        onClick={async () => await remove(f.id)}
                        className="text-tx-secondary hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors shrink-0"
                        title="Eliminar enlace"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               ))
            )}
         </div>
      </div>
      
      <div className="flex justify-end pt-2 border-t border-bd-lines">
        <button type="button" onClick={() => { fetchNovedades(); setIsAddPartnerNewsOpen(false); }} className="px-5 py-2.5 bg-card border border-bd-lines font-bold rounded-xl text-tx-primary hover:bg-main transition-colors text-sm">Cerrar y Actualizar</button>
      </div>
    </div>
  </Modal>

 {/* Toast Notification */}
 {showToast && (
 <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom border border-slate-700">
 <CheckCircle size={20} className="text-emerald-400" />
 <span className="font-medium text-sm">{toastMessage}</span>
 </div>
 )}
 </div>
 );
}
