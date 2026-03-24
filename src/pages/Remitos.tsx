import React, { useState, useRef, useEffect } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { 
  ClipboardSignature, 
  MapPin, 
  Truck, 
  User, 
  Package, 
  Plus, 
  X, 
  CheckCircle2, 
  Search,
  FileText
} from 'lucide-react';
import { Modal } from '../components/Modal';

// --- COMPONENTE: PAD DE FIRMA DIGITAL NATIVO ---
const SignaturePad = ({ onSave, onCancel }: { onSave: (dataUrl: string) => void, onCancel: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Ajustar resolución para pantallas retina
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
      }
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }
    return {
      x: (event as React.MouseEvent).clientX - rect.left,
      y: (event as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 overflow-hidden touch-none h-[300px] w-full relative">
        <canvas
          ref={canvasRef}
          width={window.innerWidth > 600 ? 500 : window.innerWidth - 64}
          height={300}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute top-2 right-2 text-gray-300 pointer-events-none flex items-center gap-1">
          <ClipboardSignature size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Firme Aquí</span>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <button type="button" onClick={clearCanvas} className="text-sm font-bold text-gray-500 hover:text-red-500">
          Limpiar firma
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg">Cancelar</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-accent text-white font-bold rounded-lg shadow-md hover:bg-[#15803d]">Guardar Firma</button>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function Remitos() {
  const { data: remitosData, add: addRemito } = useFirestoreCollection<any>('remitos');
  const { data: proyectos } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: personal } = useFirestoreCollection<any>('personal_staff');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newRemito, setNewRemito] = useState({
    chofer: '',
    destino: '',
    origen: 'Galpón Central',
    items: [{ cantidad: 1, descripcion: '' }],
    notas: '',
    firma: '' // Base64 image
  });

  const filteredRemitos = remitosData.filter(r => 
    (r.destino || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.chofer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    setNewRemito(prev => ({ ...prev, items: [...prev.items, { cantidad: 1, descripcion: '' }] }));
  };

  const handleUpdateItem = (index: number, field: string, value: string | number) => {
    setNewRemito(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index: number) => {
    setNewRemito(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!newRemito.destino || !newRemito.chofer || !newRemito.firma) {
      alert("Por favor complete chofer, destino y FIRMA MÓVIL obligatoria.");
      return;
    }
    
    // Solo permitir items validos
    const validItems = newRemito.items.filter(i => i.descripcion.trim() !== '');
    if (validItems.length === 0) {
      alert("Debe agregar al menos un ítem al remito.");
      return;
    }

    try {
      await addRemito({
        ...newRemito,
        items: validItems,
        fecha: new Date().toISOString(),
        estado: 'ENTREGADO',
      });
      setIsModalOpen(false);
      setNewRemito({ chofer: '', destino: '', origen: 'Galpón Central', items: [{ cantidad: 1, descripcion: '' }], notas: '', firma: '' });
    } catch (e) {
      console.error("Error guardando el remito: ", e);
      alert("Error al guardar el remito.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full font-sans pb-8 max-w-[1200px] mx-auto animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <header className="bg-card rounded-2xl p-5 shadow-sm border border-bd-lines mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] border border-white/20 flex items-center justify-center">
                <ClipboardSignature size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-tx-primary">Remitos Digitales</h1>
                <p className="text-sm font-medium text-tx-secondary hidden md:block">Logística, envíos a obra y firmas en campo</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-sm font-bold text-white bg-accent px-5 py-2.5 rounded-full hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Generar Remito</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative group/search mt-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within/search:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-main border-none rounded-xl text-sm placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none text-tx-primary font-medium shadow-inner"
              placeholder="Buscar por obra ID o chofer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Grid de Remitos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRemitos.slice().reverse().map(remito => (
          <div key={remito.id} className="bg-card rounded-2xl p-5 border border-bd-lines shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-accent bg-accent/10 px-2.5 py-1 rounded-md text-xs font-bold border border-accent/20">
                <CheckCircle2 size={14} /> Entregado
              </div>
              <span className="text-xs font-bold text-tx-secondary bg-main px-2 py-1 rounded-md border border-bd-lines break-all max-w-[120px] truncate">
                #{remito.id?.substring(0,6).toUpperCase()}
              </span>
            </div>

            <h3 className="text-lg font-black text-tx-primary leading-tight mb-2 truncate" title={remito.destino}>
              {remito.destino}
            </h3>
            
            <div className="space-y-2 mt-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-tx-secondary font-medium">
                <Truck size={14} className="text-emerald-500" />
                Chofer: <span className="text-tx-primary truncate">{remito.chofer}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-tx-secondary font-medium">
                <Package size={14} className="text-blue-500" />
                Items: <span className="text-tx-primary font-bold">{remito.items?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-tx-secondary font-medium">
                <MapPin size={14} className="text-orange-500" />
                Desde: {remito.origen}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-bd-lines flex justify-between items-end">
              <div className="text-xs text-tx-secondary font-medium">
                {new Date(remito.fecha).toLocaleDateString()} a las {new Date(remito.fecha).toLocaleTimeString().slice(0,5)}
              </div>
              {remito.firma && (
                <div className="bg-white p-1 rounded border border-gray-200 shadow-sm rotate-[-2deg]">
                  <img src={remito.firma} alt="Firma" className="h-8 max-w-[80px] object-contain opacity-80 mix-blend-multiply" />
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredRemitos.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-dashed border-bd-lines opacity-70">
            <FileText size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-tx-primary">Sin Remitos Aún</h3>
            <p className="text-tx-secondary font-medium mt-1">Crea el primer remito de movimiento logístico.</p>
          </div>
        )}
      </div>

      {/* Modal Creación de Remito */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confeccionar Remito de Entrega">
        {!newRemito.firma ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[60vh] md:min-h-0">
            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1">Carga a nombre de (Chofer / Encargado)</label>
                <select 
                  className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-accent/20 outline-none"
                  value={newRemito.chofer}
                  onChange={e => setNewRemito({...newRemito, chofer: e.target.value})}
                >
                  <option value="">Seleccionar personal...</option>
                  {personal.map((p: any) => (
                    <option key={p.id} value={p.name}>{p.name} ({p.role})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1">Origen</label>
                  <input 
                    type="text" 
                    className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl px-4 py-2.5 outline-none font-medium opacity-70"
                    value={newRemito.origen}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1">Destino (Obra)</label>
                  <select 
                    className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-accent/20 outline-none"
                    value={newRemito.destino}
                    onChange={e => setNewRemito({...newRemito, destino: e.target.value})}
                  >
                    <option value="">Seleccionar obra...</option>
                    {proyectos.map((p: any) => (
                      <option key={p.id} value={p.titulo}>{p.titulo}</option>
                    ))}
                    <option value="OTRO">Otro Destino Manual...</option>
                  </select>
                </div>
              </div>
              {newRemito.destino === 'OTRO' && (
                <input 
                  type="text" 
                  placeholder="Especificar destino manual"
                  className="w-full bg-main border border-bd-lines text-tx-primary rounded-xl px-4 py-2.5 outline-none font-medium focus:ring-2 focus:ring-accent/20 mt-2"
                  onChange={e => setNewRemito({...newRemito, destino: e.target.value})}
                />
              )}

              {/* Items */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-2 flex justify-between items-center">
                  Carga (Insumos)
                  <button type="button" onClick={handleAddItem} className="text-accent hover:bg-accent/10 px-2 py-1 rounded"> + Ítem </button>
                </label>
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                  {newRemito.items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="number" min="1"
                        className="w-20 bg-main border border-bd-lines text-tx-primary rounded-lg px-2 py-2 text-center"
                        value={item.cantidad}
                        onChange={e => handleUpdateItem(i, 'cantidad', parseInt(e.target.value) || 1)}
                      />
                      <input 
                        type="text" placeholder="Descripción del material o máquina"
                        className="flex-1 bg-main border border-bd-lines text-tx-primary rounded-lg px-3 py-2"
                        value={item.descripcion}
                        onChange={e => handleUpdateItem(i, 'descripcion', e.target.value)}
                      />
                      {newRemito.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(i)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de Firma (Condicional 1) */}
            <div className="bg-main/50 p-4 rounded-xl border border-bd-lines flex flex-col items-center justify-center text-center">
              <ClipboardSignature size={48} className="text-gray-300 mb-3" />
              <h3 className="font-bold text-tx-primary text-lg">Recepción en Obra</h3>
              <p className="text-sm text-tx-secondary font-medium mt-1 mb-4">La carga debe ser validada con una firma para asegurar responsabilidades.</p>
              
              <button 
                type="button" 
                onClick={() => {
                  if(!newRemito.chofer || !newRemito.destino) alert("Complete chofer y destino antes de firmar.");
                  else setNewRemito({...newRemito, firma: 'PENDIENTE'}); // Activa la vista del pad
                }}
                className="w-full py-3 bg-card border-2 border-dashed border-emerald-500/50 text-emerald-500 font-bold rounded-xl hover:bg-emerald-500/10 transition-colors"
              >
                Tocar para Firmar Conformidad
              </button>
            </div>
          </div>
        ) : (
          /* PANTALLA EXCLUSIVA DE FIRMA (Modo Kiosko) */
          <div className="flex flex-col h-[60vh] min-h-[400px]">
             <div className="mb-4">
               <h3 className="font-bold text-tx-primary text-lg">Confirme Recepción</h3>
               <p className="text-xs text-tx-secondary">Chofer: <span className="font-bold text-tx-primary">{newRemito.chofer}</span> | Destino: <span className="font-bold text-tx-primary">{newRemito.destino}</span></p>
             </div>
             <div className="flex-1 bg-gray-50 rounded-xl overflow-hidden relative shadow-inner">
               <SignaturePad 
                 onSave={(base64Str) => {
                   setNewRemito({...newRemito, firma: base64Str});
                   // Optional: auto submit
                   setTimeout(handleSubmit, 300);
                 }} 
                 onCancel={() => setNewRemito({...newRemito, firma: ''})}
               />
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
