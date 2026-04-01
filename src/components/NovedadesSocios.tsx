import React, { useState } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Plus, Settings2, Trash2, Instagram } from 'lucide-react';
import { Modal } from './Modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useNovedadesAutomaticas, Fuente } from '../hooks/useNovedadesAutomaticas';

export function NovedadesSocios({ isAdmin }: { isAdmin: boolean }) {
  const { novedades, loading, errorCount, fuentes, fetchNovedades, addUrl, remove, update } = useNovedadesAutomaticas();

  // Modal Configuración
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  const handleAddFuente = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addUrl(newUrl);
    if(success) setNewUrl('');
  };

  const toggleFuente = async (f: Fuente) => {
    if (f.id) {
       await update(f.id, { activo: !f.activo });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
         <h2 className="text-2xl font-black text-tx-primary flex items-center gap-2">
            <Newspaper className="text-blue-500" /> Novedades de Socios
         </h2>
         <div className="flex items-center gap-3 self-end sm:self-auto">
            <button onClick={() => fetchNovedades()} className="p-3 bg-main rounded-xl border border-bd-lines hover:bg-card hover:border-accent transition-all text-tx-secondary shadow-sm group relative" title="Forzar Sincronización">
               <RefreshCw size={20} className={loading ? "animate-spin text-accent" : "group-hover:text-accent"} />
               {loading && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span></span>}
            </button>
            {isAdmin && (
               <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-bd-lines shadow-sm rounded-xl text-sm font-bold text-tx-primary hover:border-accent hover:text-accent transition-all">
                 <Settings2 size={18} /> Fuentes
               </button>
            )}
         </div>
      </div>

      {loading && novedades.length === 0 ? (
        <div className="py-24 text-center animate-pulse flex flex-col items-center">
           <RefreshCw size={40} className="text-accent/60 animate-spin mb-4" />
           <p className="text-tx-secondary font-semibold">Buscando actualizaciones en tiempo real...</p>
        </div>
      ) : novedades.length === 0 ? (
        <div className="py-24 text-center text-tx-secondary bg-card rounded-3xl border border-bd-lines border-dashed">
             <div className="w-20 h-20 bg-main rounded-full flex items-center justify-center mx-auto mb-4 border border-bd-lines shadow-inner">
                <Newspaper size={32} className="text-accent/50" />
             </div>
             <h3 className="text-lg font-bold text-tx-primary mb-1">Próximamente nuevas novedades</h3>
             <p className="max-w-md mx-auto text-sm">El sistema está monitoreando activamente a los socios. Sus noticias, innovaciones y actualizaciones oficiales aparecerán aquí.</p>
             {isAdmin && fuentes.length === 0 && (
               <button onClick={() => setIsSettingsOpen(true)} className="mt-4 px-5 py-2 bg-accent text-white rounded-lg text-sm font-bold shadow-sm hover:brightness-110">Configurar Primera Fuente</button>
             )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {novedades.map((n, i) => (
             <a
               key={n.id || i}
               href={n.link}
               target="_blank"
               rel="noopener noreferrer"
               className={cn(
                 "group relative rounded-2xl overflow-hidden shadow-md border flex flex-col h-full",
                 n.isInstagram ? "border-pink-500/30 hover:shadow-pink-500/20" : "border-bd-lines hover:border-blue-500/50"
               )}
             >
               <div className="h-44 relative overflow-hidden bg-main">
                 {n.imagen ? (
                   <img
                     src={n.imagen}
                     alt={n.titulo}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700"></div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                 <div className="absolute top-4 left-4 flex items-center gap-2">
                   {n.isInstagram ? (
                      <div className="px-5 py-2.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] rounded-full text-white text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border-[1.5px] border-white/40 backdrop-blur-xl">
                        <Instagram size={18} /> {n.socio}
                      </div>
                    ) : (
                      <div className="px-5 py-2.5 bg-white dark:bg-slate-900 backdrop-blur-xl border-[1.5px] border-white/20 dark:border-slate-700/50 rounded-full text-tx-primary text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                        <Newspaper size={18} className="text-blue-500" /> {n.socio}
                      </div>
                    )}
                 </div>
               </div>

               <div className="flex flex-col flex-1 bg-card p-5 relative">
                 <div className="absolute -top-6 right-4 z-10 px-2.5 py-1 bg-card border border-bd-lines text-[10px] font-bold text-tx-secondary rounded-full shadow-sm">
                   {format(n.fecha, "d/M - HH:mm", { locale: es })}
                 </div>

                 <h3 className={cn(
                   "text-lg font-bold leading-tight mb-2 transition-colors line-clamp-2 mt-1",
                    n.isInstagram ? "text-tx-primary group-hover:text-pink-500" : "text-tx-primary group-hover:text-blue-500"
                 )}>
                   {n.titulo}
                 </h3>
                 <p className="text-sm text-tx-secondary leading-relaxed line-clamp-3 mb-6 flex-1">
                   {n.descripcion}
                 </p>

                 <div className="mt-auto">
                    <div className={cn(
                        "flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                        n.isInstagram ? "bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white" : "bg-main text-tx-primary hover:bg-slate-200 dark:hover:bg-slate-800 border-bd-lines border"
                      )}>
                      <span>{n.isInstagram ? "Ver en Instagram" : "Leer novedad completa"}</span>
                      <ExternalLink size={16} className="ml-2" />
                    </div>
                 </div>
               </div>
             </a>
           ))}
        </div>
      )}

      <div className="mt-8 text-center px-4 pb-4">
        <p className="text-[13px] sm:text-sm text-tx-secondary">
          * Estas novedades son extraídas de forma automática mediante web-crawling desde las fuentes públicas y redes oficiales de cada Socio/Marca.
        </p>
        <p className="text-[13px] sm:text-sm text-tx-secondary mt-1">
          ¿Representás a un fabricante y te gustaría tener tu propia pestaña o banner destacado en el Ecosistema? <a href="mailto:soporte@argensoftware.com" className="text-accent font-bold hover:underline">Comunicate con Argent Software</a>
        </p>
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Gestor de Novedades (Fuentes RSS/Web)">
         <div className="space-y-6">
            <div className="bg-[#1E2A28] dark:bg-slate-900 border border-bd-lines rounded-xl p-4">
              <p className="text-sm text-tx-secondary mb-3">Conecta URLs en formato RSS de blogs corporativos o pega el link de un perfil de Instagram. El sistema detectará automáticamente el socio y extraerá la información sin que cargues títulos ni descripciones manualmente.</p>
              <form onSubmit={handleAddFuente} className="space-y-3">
                 <input required type="url" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="Pega el Link del Socio (Ej: https://instagram.com/munditol)" className="w-full bg-card border border-bd-lines rounded-lg px-4 py-3 text-sm text-tx-primary focus:ring-1 focus:ring-accent shadow-inner outline-none" />
                 <button type="submit" className="w-full bg-accent text-white font-bold py-3 rounded-lg text-sm hover:brightness-110 shadow-sm flex items-center justify-center gap-2"><Plus size={16} /> Autodetectar y Vincular Fuente</button>
              </form>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
               <h4 className="font-black text-xs uppercase tracking-widest text-tx-secondary mb-3">Conexiones Activas ({fuentes.length})</h4>
               {fuentes.map((f, i) => (
                 <div key={i} className={cn("flex flex-col gap-2 p-3 border rounded-xl transition-all", f.activo ? "border-bd-lines bg-card" : "border-bd-lines border-dashed bg-main opacity-60")}>
                    <div className="flex items-center justify-between">
                       <span className="font-bold text-tx-primary text-sm flex items-center gap-2">
                         <div className={cn("w-2 h-2 rounded-full", f.activo ? "bg-green-500" : "bg-gray-500 animate-pulse")}></div>
                         {f.socio}
                       </span>
                       <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleFuente(f)} className={cn("px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-wider transition-colors border", f.activo ? "bg-accent/10 text-accent border-accent/30" : "bg-main text-tx-secondary border-bd-lines")}>
                            {f.activo ? 'ACTIVO' : 'PAUSADO'}
                          </button>
                          <button onClick={() => f.id && remove(f.id)} className="p-1 px-2 hover:bg-red-500 border border-transparent hover:border-red-600 hover:text-white text-red-400 rounded-md transition-all">
                             <Trash2 size={14}/>
                          </button>
                       </div>
                    </div>
                    <a href={f.urlRss} target="_blank" rel="noopener noreferrer" className="text-xs text-tx-secondary truncate hover:text-accent font-mono bg-main p-1.5 rounded-md border border-bd-lines">{f.urlRss}</a>
                 </div>
               ))}
               {fuentes.length === 0 && <p className="text-center text-sm text-tx-secondary italic py-6">El sistema general no tiene reglas configuradas en la central.</p>}
            </div>
         </div>
      </Modal>
    </div>
  );
}
