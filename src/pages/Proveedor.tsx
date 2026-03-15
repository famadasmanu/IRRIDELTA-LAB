import { useState } from 'react';
import {
  Building2,
  FileText,
  Download,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Megaphone,
  BookOpen,
  ChevronRight,
  Info,
  UploadCloud,
  Plus,
  Trash2,
  Video,
  MessageSquare,
  Activity,
  UserCircle,
  Store,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export type NoticeType = 'alert' | 'info' | 'success' | 'course' | 'comment';

export type Notice = {
  id: string;
  type: NoticeType;
  title: string;
  date: string;
  description: string;
  link?: string;
};

export type Catalog = {
  id: string;
  title: string;
  category: string;
  date: string;
  fileSize: string;
};

const defaultNotices: Notice[] = [
  { id: '1', type: 'alert', title: 'Actualización de Precios', date: 'Hoy', description: 'Aumento del 5% en tuberías de polietileno desde el lunes.' },
  { id: '2', type: 'info', title: 'Quiebre de Stock', date: 'Ayer', description: 'Stock limitado en controladores X-Core. Próximo ingreso en 15 días.' },
  { id: '3', type: 'course', title: 'Capacitación en Riego Inteligente', date: 'Hace 3 días', description: 'Seminario web exclusivo para instaladores sobre controladores Wi-Fi.', link: 'https://zoom.us/webinar/123' },
  { id: '4', type: 'comment', title: 'Mensaje de Sucursal', date: 'Esta semana', description: 'Matías, recordá pasar a retirar los repuestos encargados la semana pasada.' }
];

const defaultCatalogs: Catalog[] = [
  { id: 'c1', title: 'Catálogo Oficial Hunter 2024', category: 'Catálogos Generales', date: '01 Nov', fileSize: '15 MB' },
  { id: 'c2', title: 'Lista de Precios Mayorista', category: 'Precios', date: '05 Nov', fileSize: '2.5 MB' },
  { id: 'c3', title: 'Manual Técnico Hydrawise', category: 'Manuales', date: '12 Oct', fileSize: '8 MB' }
];

const expenseMetrics = [
  { name: 'Ene', gasto: 1200000, promedio: 1000000 },
  { name: 'Feb', gasto: 1900000, promedio: 1100000 },
  { name: 'Mar', gasto: 1500000, promedio: 1200000 },
  { name: 'Abr', gasto: 2200000, promedio: 1300000 },
  { name: 'May', gasto: 2800000, promedio: 1400000 },
  { name: 'Jun', gasto: 3500000, promedio: 1500000 },
  { name: 'Jul', gasto: 3100000, promedio: 1800000 },
  { name: 'Ago', gasto: 3800000, promedio: 2000000 },
  { name: 'Sep', gasto: 4100000, promedio: 2200000 },
  { name: 'Oct', gasto: 4250000, promedio: 2500000 },
];

export default function Proveedor() {
  const [selectedBranch, setSelectedBranch] = useState<'escobar' | 'benavidez' | null>(null);
  const [viewMode, setViewMode] = useState<'profesional' | 'admin'>('profesional');
  const [showToast, setShowToast] = useState<string | null>(null);
  const [approvalState] = useState<'pending' | 'approved'>('pending');

  // Storage states
  const { data: noticesData, add: addNoticeToDB, remove: removeNoticeFromDB } = useFirestoreCollection<Notice>('notices');
  const notices = noticesData.length > 0 ? noticesData : defaultNotices;

  const { data: catalogsData, add: addCatalogToDB, remove: removeCatalogFromDB } = useFirestoreCollection<Catalog>('catalogs');
  const catalogs = catalogsData.length > 0 ? catalogsData : defaultCatalogs;

  // Form states (Admin)
  const [newNotice, setNewNotice] = useState({ title: '', type: 'info', description: '', link: '' });
  const [newCatalog, setNewCatalog] = useState({ title: '', category: 'Catálogos Generales' });

  // CC Data
  const limiteCredito = 5000000;
  const saldoUtilizado = 4250000;
  //const disponible = limiteCredito - saldoUtilizado;
  const porcentajeUso = (saldoUtilizado / limiteCredito) * 100;
  const isWarningCC = porcentajeUso > 80;

  const handleDownload = (docName: string) => {
    setShowToast(`Descargando ${docName}...`);
    setTimeout(() => setShowToast(null), 3000);
  };

  const getAvisoIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="text-red-500 min-w-[20px]" size={20} />;
      case 'info': return <Info className="text-blue-500 min-w-[20px]" size={20} />;
      case 'success': return <ShieldCheck className="text-green-500 min-w-[20px]" size={20} />;
      case 'course': return <Video className="text-purple-500 min-w-[20px]" size={20} />;
      case 'comment': return <MessageSquare className="text-orange-500 min-w-[20px]" size={20} />;
      default: return <Megaphone className="text-[#3A5F4B] min-w-[20px]" size={20} />;
    }
  };

  const getAvisoColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20';
      case 'info': return 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20';
      case 'success': return 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20';
      case 'course': return 'bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20';
      case 'comment': return 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700';
    }
  };

  const handleAddNotice = async () => {
    if (!newNotice.title || !newNotice.description) {
      setShowToast('Por favor, complete título y descripción.');
      setTimeout(() => setShowToast(null), 3000);
      return;
    }
    const notice: Omit<Notice, 'id'> = {
      type: newNotice.type as NoticeType,
      title: newNotice.title,
      description: newNotice.description,
      link: newNotice.link,
      date: 'Justo ahora'
    };
    await addNoticeToDB(notice);
    setNewNotice({ title: '', type: 'info', description: '', link: '' });
    setShowToast('Publicación agregada con éxito');
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleAddCatalog = async () => {
    if (!newCatalog.title) {
      setShowToast('Por favor, complete el título del catálogo.');
      setTimeout(() => setShowToast(null), 3000);
      return;
    }
    const cat: Omit<Catalog, 'id'> = {
      title: newCatalog.title,
      category: newCatalog.category,
      date: 'Justo ahora',
      fileSize: 'Adjunto'
    };
    await addCatalogToDB(cat);
    setNewCatalog({ title: '', category: 'Catálogos Generales' });
    setShowToast('Catálogo subido con éxito');
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 relative text-slate-800 dark:text-slate-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-[100] border border-slate-700">
          <Info size={18} className="text-blue-400" />
          <span className="font-bold text-sm tracking-wide">{showToast}</span>
        </div>
      )}

      {/* Branch Selector Interstitial */}
      {!selectedBranch && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <Store size={48} className="text-[#3A5F4B] mx-auto mb-2" />
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Portal Proveedores</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto text-lg leading-relaxed">Seleccioná a qué sucursal independiente querés vincularte para operar hoy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4 mt-8">
            <button onClick={() => setSelectedBranch('escobar')} className="p-10 bg-white dark:bg-slate-800/80 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700/50 hover:border-[#3A5F4B] dark:hover:border-[#52856A] hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-all text-center flex flex-col items-center gap-5 group shadow-sm hover:shadow-xl">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-[#3A5F4B] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                <Building2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Sede Escobar</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sede Principal</p>
              </div>
            </button>
            <button onClick={() => setSelectedBranch('benavidez')} className="p-10 bg-white dark:bg-slate-800/80 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700/50 hover:border-[#3A5F4B] dark:hover:border-[#52856A] hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-all text-center flex flex-col items-center gap-5 group shadow-sm hover:shadow-xl">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-[#3A5F4B] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                <Building2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Sede Benavidez</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sede Nordelta</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {selectedBranch && (
        <>
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 flex-col sm:flex-row sm:items-center">
              <button 
                onClick={() => setSelectedBranch(null)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight flex items-center gap-2">
                  Portal IRRIDELTA 
                  <span className="text-sm px-2 py-0.5 bg-[#3A5F4B] text-white rounded-md uppercase tracking-wider font-bold">
                    {selectedBranch === 'escobar' ? 'Escobar' : 'Benavidez'}
                  </span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Panel de relación comercial entre Local y Profesional.</p>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto mt-4 md:mt-0">
          <button
            onClick={() => setViewMode('profesional')}
            className={cn(
              "flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
              viewMode === 'profesional' ? "bg-white dark:bg-slate-700 text-[#3A5F4B] dark:text-[#52856A] shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            )}
          >
            <UserCircle size={18} />
            Vista Profesional
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={cn(
              "flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
              viewMode === 'admin' ? "bg-[#3A5F4B] text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            )}
          >
            <Store size={18} />
            Sucursal (Subir Datos)
          </button>
        </div>
      </div>

      {viewMode === 'profesional' ? (
        /* ============================ VISTA PROFESIONAL ============================ */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Fila 1: Cuenta Corriente y Gráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Resumen CC - Diseño Minimalista y Funcional */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-md border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Estado de Cuenta</h2>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       Aprobación IRRIDELTA
                    </h3>
                  </div>
                  <span className={cn("px-4 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-full border shadow-sm", 
                    approvalState === 'pending' ? "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30" 
                                                : "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/30"
                  )}>
                    {approvalState === 'pending' ? "Pendiente" : "Certificado"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Saldo a Avalar</p>
                    <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">$4.25<span className="text-2xl text-slate-300 font-bold">M</span></p>
                    <p className="text-xs text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg inline-block border border-slate-100 dark:border-slate-700">Límite Total: $5M</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Presencialidad Local</p>
                    <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-2">14 <span className="text-lg text-[#3A5F4B] dark:text-[#52856A] font-bold opacity-80 mt-2 block">Visitas</span></p>
                    <p className="text-xs text-[#3A5F4B] dark:text-[#52856A] font-bold bg-[#3A5F4B]/5 p-2 rounded-lg inline-flex items-center gap-1.5 border border-[#3A5F4B]/10">
                      <MapPin size={12} /> Rastreo GPS Validado
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-slate-400">Consumo de Línea</span>
                    <span className="text-slate-800 dark:text-slate-200">{porcentajeUso.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", isWarningCC ? "bg-red-500" : "bg-[#3A5F4B]")} style={{ width: `${porcentajeUso}%` }} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                   const msg = encodeURIComponent("Hola IRRIDELTA, solicito la certificación y aprobación rápida de mi Estado de Cuenta Corriente para evitar errores humanos. Saldo de mi cuenta a certificar: $4.25M.");
                   window.open(`https://wa.me/?text=${msg}`, "_blank");
                }}
                className="w-full mt-auto flex items-center justify-center gap-2.5 px-4 py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30 dark:hover:bg-emerald-900/40 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <MessageSquare size={18} /> Solicitar Certificación por WhatsApp
              </button>
            </div>

            {/* Gráfico Desempeño */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="text-[#3A5F4B]" size={20} />
                    Desempeño Anual
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Gasto Acumulado vs Anterior</p>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-black text-slate-800 dark:text-white">$ 24.5M</span>
                  <span className="text-xs font-bold text-[#3A5F4B]">Total Año en Curso</span>
                </div>
              </div>
              
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={expenseMetrics} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3A5F4B" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#3A5F4B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `$${value/1000}k`}/>
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Gasto (Mes)']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="gasto" stroke="#3A5F4B" strokeWidth={3} fillOpacity={1} fill="url(#colorGasto)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fila 2: Centro de Info y Catálogos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tablero Info IRRIDELTA (Alertas, Cursos, Comentarios) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Megaphone className="text-[#3A5F4B]" size={20} />
                Novedades y Comunicados de la Sucursal
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {notices.map(notice => (
                  <div key={notice.id} className={cn("p-4 rounded-xl border flex gap-4 transition-all hover:shadow-md", getAvisoColor(notice.type))}>
                    <div className="mt-0.5 shrink-0 bg-white/60 dark:bg-slate-900/40 p-2 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                      {getAvisoIcon(notice.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{notice.title}</h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md backdrop-blur-sm whitespace-nowrap">{notice.date}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {notice.description}
                      </p>
                      {notice.link && (
                        <a href={notice.link} target="_blank" rel="noreferrer" className="inline-flex mt-3 items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-[#3A5F4B] dark:text-[#52856A] text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                          Acceder al enlace <ChevronRight size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {notices.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center">
                    <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                      <Info size={16} /> No hay comunicados recientes por parte de la sucursal.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Repositorio Catálogos */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Building2 className="text-[#3A5F4B]" size={20} />
                Repositorio Técnico y Catálogos
              </h2>
              <div className="space-y-3">
                {catalogs.map(catalog => (
                  <div key={catalog.id} className="group flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-[#3A5F4B]/30 hover:bg-[#3A5F4B]/5 transition-all cursor-pointer" onClick={() => handleDownload(catalog.title)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[#3A5F4B] dark:text-[#52856A] group-hover:scale-110 transition-transform">
                        {catalog.category.toLowerCase().includes('precio') ? <DollarSign size={24} /> : <BookOpen size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{catalog.title}</h3>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{catalog.category} • {catalog.fileSize}</p>
                      </div>
                    </div>
                    <button className="text-slate-400 group-hover:text-[#3A5F4B] p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                      <Download size={18} />
                    </button>
                  </div>
                ))}
                {catalogs.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center">
                    <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                      <FileText size={16} /> El local aún no ha subido catálogos o archivos.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      ) : (
        /* ============================ VISTA SUCURSAL / ADMIN ============================ */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#3A5F4B] rounded-2xl p-6 shadow-sm text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10">
              <Store size={24} /> Gestión de Sucursal
            </h2>
            <p className="text-[#3A5F4B] text-slate-100 text-sm opacity-90 relative z-10">
              Desde aquí publicás contenido que será visto por los instaladores y profesionales en su portal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Formulario Noticias / Cursos / Alertas */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Megaphone className="text-[#3A5F4B]" size={20} />
                Publicar Novedad / Alerta
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Publicación</label>
                  <select
                    value={newNotice.type}
                    onChange={(e) => setNewNotice({ ...newNotice, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/50"
                  >
                    <option value="info">Información General</option>
                    <option value="alert">Alerta / Advertencia</option>
                    <option value="success">Noticia Positiva / Promoción</option>
                    <option value="course">Curso / Capacitación</option>
                    <option value="comment">Comentario Directo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Título Principal</label>
                  <input
                    type="text"
                    placeholder="Ej. Nuevo stock de rotatores..."
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción</label>
                  <textarea
                    rows={3}
                    placeholder="Escribe el cuerpo del comunicado..."
                    value={newNotice.description}
                    onChange={(e) => setNewNotice({ ...newNotice, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/50"
                  />
                </div>
                {newNotice.type === 'course' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Enlace de acceso (URL)</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={newNotice.link}
                      onChange={(e) => setNewNotice({ ...newNotice, link: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/50"
                    />
                  </div>
                )}
                <button
                  onClick={handleAddNotice}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#3A5F4B] hover:bg-[#2e4a3b] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#3A5F4B]/30 transition-all transform hover:scale-[1.02]"
                >
                  <Plus size={18} /> Publicar Contenido
                </button>
              </div>
            </div>

            {/* Formulario Catálogos */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen className="text-[#3A5F4B]" size={20} />
                Subir Catálogo o Lista
              </h2>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Documento</label>
                  <input
                    type="text"
                    placeholder="Ej. Catálogo RainBird 2024"
                    value={newCatalog.title}
                    onChange={(e) => setNewCatalog({ ...newCatalog, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoría</label>
                  <select
                    value={newCatalog.category}
                    onChange={(e) => setNewCatalog({ ...newCatalog, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/50"
                  >
                    <option value="Catálogos Generales">Catálogos Generales</option>
                    <option value="Precios">Lista de Precios</option>
                    <option value="Manuales">Manuales Técnicos</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                
                {/* Zona de Drop para Archivo */}
                <div className="mt-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} className="text-[#3A5F4B] dark:text-[#52856A]" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Arrastrá el PDF aquí o hacé clic</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Tamaño máximo 20MB</p>
                </div>

                <button
                  onClick={handleAddCatalog}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-[#3A5F4B] text-[#3A5F4B] hover:bg-[#3A5F4B]/5 rounded-xl text-sm font-bold shadow-sm transition-all"
                >
                  <UploadCloud size={18} /> Subir Documento
                </button>
              </div>
            </div>

          </div>

          {/* Listado Histórico Admin */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
             <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Contenido Activo en la App</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               
               <div>
                 <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Comunicados Publicados</h3>
                 <div className="space-y-3">
                   {notices.map(notice => (
                     <div key={notice.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                       <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                         {getAvisoIcon(notice.type)}
                         <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate leading-tight">{notice.title}</p>
                            <p className="text-xs text-slate-500 capitalize">{notice.type} • {notice.date}</p>
                         </div>
                       </div>
                       <button 
                         onClick={() => removeNoticeFromDB(notice.id)}
                         className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                         title="Eliminar publicación"
                       >
                         <Trash2 size={18} />
                       </button>
                     </div>
                   ))}
                   {notices.length === 0 && (
                     <p className="text-sm font-medium text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">Sin comunicados publicados.</p>
                   )}
                 </div>
               </div>

               <div>
                 <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Documentos Subidos</h3>
                 <div className="space-y-3">
                   {catalogs.map(catalog => (
                     <div key={catalog.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                       <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                         <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg text-slate-500 dark:text-slate-400">
                           {catalog.category.toLowerCase().includes('precio') ? <DollarSign size={16} /> : <BookOpen size={16} />}
                         </div>
                         <div>
                           <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate leading-tight">{catalog.title}</p>
                           <p className="text-xs text-slate-500 uppercase">{catalog.category}</p>
                         </div>
                       </div>
                       <button 
                         onClick={() => removeCatalogFromDB(catalog.id)}
                         className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                         title="Borrar documento"
                       >
                         <Trash2 size={18} />
                       </button>
                     </div>
                   ))}
                   {catalogs.length === 0 && (
                     <p className="text-sm font-medium text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">Sin documentos subidos.</p>
                   )}
                 </div>
               </div>

             </div>
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
}
