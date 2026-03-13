import React, { useState } from 'react';
import {
  Building2,
  FileText,
  Download,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Megaphone,
  BookOpen,
  ArrowDownToLine,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Mocks for Announcements
const avisos = [
  { id: 1, type: 'alert', title: 'Aviso de Aumento', date: 'Hoy', description: 'Aumento del 5% en línea de cañerías PVC vigente desde el próximo lunes.' },
  { id: 2, type: 'info', title: 'Quiebre de Stock', date: 'Ayer', description: 'Stock limitado en controladores X-Core. Próximo ingreso estimado en 15 días.' },
  { id: 3, type: 'success', title: 'Nueva Lista de Precios', date: 'Hace 3 días', description: 'Ya está disponible la lista de precios oficial con promociones de temporada.' }
];

// Mocks for Brands Technical Library
const marcas = [
  {
    id: 'hunter',
    name: 'Hunter Industries',
    logo: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    docs: ['Manual Hydrawise', 'Ficha Téc. PGP Ultra', 'Curvas MP Rotator']
  },
  {
    id: 'rainbird',
    name: 'Rain Bird',
    logo: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=800',
    docs: ['Catálogo 2024', 'Manual ESP-TM2', 'Toberas VAN']
  },
  {
    id: 'azud',
    name: 'AZUD',
    logo: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800',
    docs: ['Sistemas de Filtrado', 'Mantenimiento de Goteo']
  }
];

export default function Proveedor() {
  const [showToast, setShowToast] = useState<string | null>(null);

  // CC Data
  const limiteCredito = 5000000;
  const saldoUtilizado = 4250000;
  const disponible = limiteCredito - saldoUtilizado;
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
      default: return <Megaphone className="text-[#3A5F4B] min-w-[20px]" size={20} />;
    }
  };

  return (
    <div className="space-y-8 pb-12 relative text-slate-800 dark:text-slate-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
          <div className="bg-blue-500 rounded-full p-1 border border-blue-400">
            <Download size={16} className="text-white" />
          </div>
          <span className="font-medium text-sm">{showToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Portal B2B IRRIDELTA</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Centro de Negocios, Cuenta Corriente y Soporte Técnico para Instaladores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Status & Price Lists */}
        <div className="lg:col-span-2 space-y-6">

          {/* Cuenta Corriente Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-[#3A5F4B]/10 dark:border-slate-700 relative overflow-hidden">
            <div className={cn(
              "absolute top-0 left-0 right-0 h-1.5",
              isWarningCC ? "bg-red-500" : "bg-green-500"
            )} />

            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className={isWarningCC ? "text-red-500" : "text-green-600"} size={24} />
                  Mi Cuenta Corriente
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider",
                    isWarningCC ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  )}>
                    {isWarningCC ? "Atención: Crédito Elevado" : "C.C. Activa"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Actualizado hace 5 min</span>
                </div>
              </div>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">
                <FileText size={16} />
                Ver Resumen
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Límite Aprobado</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">$ 5,000,000</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Saldo Deudor</p>
                <p className="text-2xl font-black text-[#3A5F4B] dark:text-[#52856A]">$ 4,250,000</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Disponible</p>
                <p className={cn(
                  "text-2xl font-black",
                  isWarningCC ? "text-red-500" : "text-green-600"
                )}>$ 750,000</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-600 dark:text-slate-300">Uso del crédito: {porcentajeUso.toFixed(0)}%</span>
                <span className="text-slate-500">Plazo pago: 30 días</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner flex">
                <div
                  className={cn(
                    "h-full transition-all duration-1000",
                    isWarningCC ? "bg-red-500" : "bg-[#3A5F4B]"
                  )}
                  style={{ width: `${porcentajeUso}%` }}
                />
              </div>
              {isWarningCC && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                  <TrendingDown className="text-red-500 mt-0.5 shrink-0" size={18} />
                  <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                    Su límite de crédito está cerca de agotarse. Sugerimos realizar un pago anticipado o solicitar a IRRIDELTA una evaluación de ampliación de límite enviando el plan de la próxima obra.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 sm:hidden">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors">
                <FileText size={18} />
                Descargar Último Resumen
              </button>
            </div>
          </div>

          {/* Listas de Precios y Catálogos Generales */}
          <div className="bg-[#3A5F4B] rounded-2xl p-6 md:p-8 shadow-sm text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <ArrowDownToLine size={24} />
                  Listas de Precios Oficiales
                </h2>
                <p className="text-[#3A5F4B] text-slate-100 text-sm opacity-90">
                  Descargue el tarifario vigente para uso en la Calculadora y presupuestos de obras.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <button
                  onClick={() => handleDownload('ListaGeneral_Nov2023.pdf')}
                  className="bg-white text-[#3A5F4B] px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Download size={18} />
                  Lista Excel Completa
                </button>
                <button
                  onClick={() => handleDownload('Catalogo_Productos.pdf')}
                  className="bg-[#2d4a3a] border border-white/20 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#233a2d] transition-colors"
                >
                  <BookOpen size={18} />
                  Ver Catálogo Gral.
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Alerts & Tech Library */}
        <div className="space-y-6">

          {/* Avisos Oficiales IRRIDELTA */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Megaphone className="text-[#3A5F4B]" size={20} />
              Avisos Oficiales
            </h2>
            <div className="space-y-4">
              {avisos.map(aviso => (
                <div key={aviso.id} className="flex gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <div className="mt-1">
                    {getAvisoIcon(aviso.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{aviso.title}</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{aviso.date}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {aviso.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Repositorio Técnico */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Building2 className="text-[#3A5F4B]" size={20} />
              Repositorio Técnico
            </h2>
            <div className="space-y-4">
              {marcas.map(marca => (
                <div key={marca.id} className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden group">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shadow-sm shrink-0 border border-slate-100 dark:border-slate-700">
                      <img src={marca.logo} alt={marca.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex-1">{marca.name}</h3>
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-[#3A5F4B] transition-colors mr-2" />
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 grid gap-2">
                    {marca.docs.map((doc, i) => (
                      <button
                        key={i}
                        onClick={() => handleDownload(doc)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors group/btn"
                      >
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover/btn:text-[#3A5F4B] dark:group-hover/btn:text-[#67b189] transition-colors">
                          {doc}
                        </span>
                        <ArrowDownToLine size={16} className="text-slate-300 group-hover/btn:text-[#3A5F4B] dark:group-hover/btn:text-[#67b189] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
