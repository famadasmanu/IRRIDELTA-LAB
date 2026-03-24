import React, { useState, useEffect } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { 
  Truck, 
  MapPin, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Wrench,
  User,
  Activity,
  Calendar,
  Layers,
  Search,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/Modal';



const COLUMNAS = [
  { id: 'Pendiente', titulo: 'Pendientes / A Confirmar', borderColor: 'border-slate-500/30' },
  { id: 'Planificación', titulo: 'En Planificación', borderColor: 'border-blue-500/30' },
  { id: 'En Proceso', titulo: 'En Obra / Ejecutando', borderColor: 'border-yellow-500/30' },
  { id: 'Completado', titulo: 'Finalizado', borderColor: 'border-emerald-500/30' }
];

export default function Operaciones() {
  const { data: portfolioData, update: updatePortfolioInDB } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: personalData } = useFirestoreCollection<any>('personalData');
  const { data: vehicles } = useFirestoreCollection<any>('personal_vehicles');
  
  const colors = [
    `bg-blue-500/10 text-blue-500 border-blue-500/20`, 
    `bg-emerald-500/10 text-emerald-500 border-emerald-500/20`, 
    `bg-purple-500/10 text-purple-500 border-purple-500/20`, 
    `bg-orange-500/10 text-orange-500 border-orange-500/20`
  ];

  const EQUIPOS = [
    { id: 'sin-asignar', nombre: 'Sin Asignar', color: 'bg-slate-500/10 text-tx-secondary border-slate-500/20' },
    ...vehicles.map((v: any, i: number) => ({
      id: v.id,
      nombre: v.name,
      color: colors[i % colors.length]
    })),
    ...personalData.map((p: any, i: number) => ({
      id: p.id,
      nombre: p.name,
      color: colors[(i + vehicles.length) % colors.length]
    }))
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [equipoFilter, setEquipoFilter] = useState('Todos');

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  
  const [selectedTrabajo, setSelectedTrabajo] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEquipo, setEditEquipo] = useState('sin-asignar');

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Para estética al arrastrar
    setTimeout(() => {
      const el = document.getElementById(`card-${id}`);
      if (el) el.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    setDraggedItem(null);
    setDraggedOverColumn(null);
    const el = document.getElementById(`card-${id}`);
    if (el) el.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverColumn !== columnId) {
      setDraggedOverColumn(columnId);
    }
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const trabajo = portfolioData.find((t: any) => t.id === itemId);
    if (!trabajo) return;

    if (trabajo.estado !== columnId) {
      // Optimizacion: Actualizar local primero si se quiere, o esperar a DB
      await updatePortfolioInDB(itemId, { estado: columnId });
    }
  };

  // Asignar equipo
  const handleAssignEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrabajo) return;
    await updatePortfolioInDB(selectedTrabajo.id, { equipoAsignado: editEquipo });
    setIsModalOpen(false);
    setSelectedTrabajo(null);
  };

  const filteredData = portfolioData.filter((t: any) => {
    const matchesSearch = 
      (t.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.cliente || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const reqEquipo = equipoFilter === 'Todos' || (t.equipoAsignado || 'sin-asignar') === equipoFilter;
    
    return matchesSearch && reqEquipo;
  });

  return (
    <div className="flex flex-col h-full w-full font-sans pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="glass-card rounded-2xl p-5 mb-6 shadow-sm border border-bd-lines flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 text-accent">
            <Layers size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-tx-primary tracking-tight">Tablero Operativo</h1>
            <p className="text-sm text-tx-secondary font-medium mt-1">Gestión Logística KanBan (Arrastrar y Soltar)</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search size={18} className="absolute inset-y-0 left-3 my-auto text-tx-secondary group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              className="glass p-2.5 pl-10 rounded-xl text-sm border border-bd-lines w-full sm:w-64 outline-none focus:border-accent/40 font-medium placeholder-slate-400 text-tx-primary"
              placeholder="Buscar obra o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Truck size={16} className="absolute inset-y-0 left-3 my-auto text-tx-secondary" />
            <select 
              className="glass p-2.5 pl-9 pr-8 rounded-xl text-sm border border-bd-lines w-full sm:w-auto outline-none focus:border-accent/40 font-medium text-tx-primary appearance-none cursor-pointer"
              value={equipoFilter}
              onChange={(e) => setEquipoFilter(e.target.value)}
            >
              <option value="Todos">Todos los Equipos</option>
              {EQUIPOS.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto hide-scrollbar snap-x rounded-xl pb-4">
        <div className="flex gap-4 min-w-max h-full px-1">
          {COLUMNAS.map(columna => {
            const trabajosColumna = filteredData.filter((t: any) => {
              const est = t.estado || 'Pendiente';
              return est === columna.id || 
                     (columna.id === 'Pendiente' && est !== 'Planificación' && est !== 'En Proceso' && est !== 'Completado'); 
            });

            return (
              <div 
                key={columna.id}
                onDragOver={(e) => handleDragOver(e, columna.id)}
                onDrop={(e) => handleDrop(e, columna.id)}
                className={cn(
                  "w-80 sm:w-96 flex flex-col snap-center rounded-2xl glass border shadow-sm transition-all duration-300",
                  columna.borderColor,
                  draggedOverColumn === columna.id ? "bg-card/5 dark:bg-black/20 ring-2 ring-accent/50 scale-[1.01]" : "bg-card/40 backdrop-blur-md"
                )}
                style={{ minHeight: '600px' }}
              >
                {/* Cabecera Columna */}
                <div className="p-4 border-b border-bd-lines/50 flex justify-between items-center bg-card/50 rounded-t-2xl">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-tx-primary flex items-center gap-2">
                    {columna.id === 'Pendiente' && <AlertCircle size={16} className="text-tx-secondary" />}
                    {columna.id === 'Planificación' && <Calendar size={16} className="text-blue-500" />}
                    {columna.id === 'En Proceso' && <Activity size={16} className="text-yellow-500" />}
                    {columna.id === 'Completado' && <CheckCircle2 size={16} className="text-emerald-500" />}
                    {columna.titulo}
                  </h3>
                  <span className="bg-main text-tx-secondary text-xs font-black px-2.5 py-1 rounded-full border border-bd-lines shadow-inner">
                    {trabajosColumna.length}
                  </span>
                </div>

                {/* Zona Arrojable */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {trabajosColumna.map((trabajo: any) => {
                    const equipoAsignado = EQUIPOS.find(e => e.id === (trabajo.equipoAsignado || 'sin-asignar'));
                    
                    return (
                      <div
                        id={`card-${trabajo.id}`}
                        key={trabajo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, trabajo.id)}
                        onDragEnd={(e) => handleDragEnd(e, trabajo.id)}
                        className={cn(
                          "bg-card rounded-xl p-4 shadow-sm border border-bd-lines cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:border-accent/30 group",
                          draggedItem === trabajo.id && "bg-accent/5 border-dashed border-accent/50 scale-95"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="font-bold text-tx-primary leading-tight text-sm line-clamp-2">
                            {trabajo.titulo}
                          </h4>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrabajo(trabajo);
                              setEditEquipo(trabajo.equipoAsignado || 'sin-asignar');
                              setIsModalOpen(true);
                            }}
                            className="text-tx-secondary hover:text-accent p-1 bg-main rounded hover:bg-accent/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            title="Asignar Equipo"
                          >
                            <Truck size={14} />
                          </button>
                        </div>
                        
                        {(trabajo.cliente || trabajo.ubicacion) && (
                          <div className="space-y-1 mb-3">
                            {trabajo.cliente && (
                              <div className="flex items-center gap-1.5 text-xs text-tx-secondary font-medium">
                                <User size={12} className="text-tx-secondary" />
                                <span className="truncate">{trabajo.cliente}</span>
                              </div>
                            )}
                            {trabajo.ubicacion && (
                              <div className="flex items-center gap-1.5 text-xs text-tx-secondary font-medium">
                                <MapPin size={12} className="text-tx-secondary" />
                                <span className="truncate">{trabajo.ubicacion}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-bd-lines/50">
                          <div className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1",
                            equipoAsignado?.color || "bg-main text-tx-secondary border-bd-lines"
                          )}>
                            <Truck size={10} />
                            {equipoAsignado?.nombre || 'Sin Asignar'}
                          </div>
                          
                          {trabajo.fechaInicio && (
                            <span className="text-[10px] text-tx-secondary font-bold flex items-center gap-1">
                              <Calendar size={10} />
                              {trabajo.fechaInicio.split('-').reverse().join('/')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {trabajosColumna.length === 0 && (
                    <div className="h-full flex items-center justify-center p-6 border-2 border-dashed border-bd-lines rounded-xl opacity-50">
                      <p className="text-center text-xs font-bold text-tx-secondary uppercase tracking-widest">Arrastra aquí</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--bd-lines, #e2e8f0);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}} />

      {/* Modal Asignar Equipo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Asignar Equipo / Logística"
      >
        <form onSubmit={handleAssignEquipo} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-tx-primary mb-2">Seleccione Equipo Operativo o Vehículo</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EQUIPOS.map((eq) => (
                <div 
                  key={eq.id}
                  onClick={() => setEditEquipo(eq.id)}
                  className={cn(
                    "p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm",
                    eq.color.replace('text-', 'bg-').replace('/10', '/5'),
                    editEquipo === eq.id ? "ring-2 ring-accent/50 scale-[1.02]" : "hover:border-accent/40 opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="bg-card p-1.5 rounded-lg border border-bd-lines">
                    <Truck size={18} className="text-current" />
                  </div>
                  <span className="text-sm font-bold text-tx-primary">{eq.nombre}</span>
                  {editEquipo === eq.id && (
                    <CheckCircle2 size={16} className="ml-auto text-current" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-bd-lines flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-bold text-tx-secondary rounded-xl hover:bg-main transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 font-bold text-white bg-accent rounded-xl hover:bg-[#15803d] transition-colors shadow-sm"
            >
              Guardar Asignación
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
