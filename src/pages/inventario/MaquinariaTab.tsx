import React, { useState } from 'react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { Plus, Edit2, Trash2, MapPin, Wrench, AlertTriangle, Image as ImageIcon, UploadCloud, MessageCircle, ShoppingCart, UserCircle, Calendar } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function MaquinariaTab({ searchQuery, onAddToPedido }: { searchQuery: string, onAddToPedido?: (item: any) => void }) {
  const { data: maquinaria, add, update, remove } = useFirestoreCollection<any>('inventario_maquinas');
  const { data: trabajos } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: clientesData } = useFirestoreCollection<any>('clientes_data');
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const filtered = maquinaria.filter(m => m.nombre?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) {
      await add(formData);
    } else {
      const id = formData.id;
      const copy = { ...formData };
      delete copy.id;
      await update(id, copy);
    }
    setEditingItem(null);
    setIsAdding(false);
    setFormData({});
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const storageRef = ref(storage, `inventario/maquinaria/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData({ ...formData, imagenUrl: url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const addMantenimiento = () => {
    const list = formData.historialMantenimiento || [];
    setFormData({ ...formData, historialMantenimiento: [...list, { fecha: new Date().toISOString().split('T')[0], detalle: '' }] });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black tracking-tight text-tx-primary flex items-center gap-2">
          <Wrench className="text-orange-500" /> Directorio de Maquinaría
        </h2>
        <button onClick={() => { setIsAdding(true); setFormData({ nombre: '', costo: 0, ubicacionTipo: 'deposito', solicitaReparacion: false, imagenUrl: '' }); }} className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          <Plus size={14} /> Nuevo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
            <div key={item.id} className="bg-[#111827] dark:bg-[#0f172a] rounded-2xl overflow-hidden relative shadow-2xl border border-white/5 border-l-[4px] border-l-orange-500 group transition-all flex flex-col h-full hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              
              {/* IMAGE HEADER */}
              <div className="relative h-28 w-full overflow-hidden bg-slate-900">
                <img 
                  src={item.imagenUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nombre || 'M')}&background=020617&color=f97316&size=512&font-size=0.4`} 
                  alt={item.nombre} 
                  onError={(e: any) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nombre || 'M')}&background=020617&color=f97316&size=512`; }} 
                  className="w-full h-full object-cover opacity-60 group-hover:bg-black/30 transition-all duration-700" 
                />
                
                {/* Gradient overlay mimicking the screenshot */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>

                {/* OVERLAY CONTENT */}
                <div className="absolute bottom-3 left-6 text-white pr-20 z-10">
                  <h4 className="font-bold text-lg leading-tight text-white mb-1 truncate drop-shadow-md">{item.nombre}</h4>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 drop-shadow-sm">
                      <UserCircle className="w-3.5 h-3.5 text-orange-400" /> {item.asignadoA || 'Sin asignar'}
                    </p>
                    <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5 drop-shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-tx-secondary" /> {item.clienteNombre || 'Bodega Central'}
                    </p>
                  </div>
                </div>

                {/* FLOATING ACTION BUTTONS (TOP RIGHT) */}
                <div className="absolute top-3 right-3 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label onClick={e => e.stopPropagation()} className="p-1.5 bg-black/50 hover:bg-slate-700/80 backdrop-blur-sm rounded-lg text-tx-secondary hover:text-white cursor-pointer transition-colors" title="Actualizar foto">
                    <UploadCloud size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={async e => {
                      const file = e.target.files?.[0];
                      if(!file) return;
                      const storageRef = ref(storage, `inventario/maquinaria/${Date.now()}_${file.name}`);
                      try { await uploadBytes(storageRef, file); const url = await getDownloadURL(storageRef); await update(item.id, { imagenUrl: url }); } catch(err) { alert('Error al subir foto'); }
                    }} />
                  </label>
                  <button onClick={() => { setEditingItem(item); setFormData(item); }} className="p-1.5 bg-black/50 hover:bg-slate-700/80 backdrop-blur-sm rounded-lg text-tx-secondary hover:text-white transition-colors" title="Ficha Técnica">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if(window.confirm('¿Eliminar máquina permanentemente?')) remove(item.id); }} className="p-1.5 bg-black/50 hover:bg-red-500/80 backdrop-blur-sm rounded-lg text-tx-secondary hover:text-white transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>

                {item.solicitaReparacion && (
                  <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] uppercase font-bold flex items-center gap-1 z-20 shadow-lg animate-pulse">
                    <AlertTriangle size={12} />
                  </div>
                )}
              </div>

              {/* LOWER CONTENT SECTION */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-[#111827] dark:bg-[#0f172a]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-tx-secondary dark:text-tx-secondary uppercase tracking-widest">Responsable</span>
                    <span className="text-xs font-black text-tx-primary dark:text-tx-primary bg-main dark:bg-slate-700/50 px-2 py-1 rounded-md">{item.asignadoA || 'Sin Asignar'}</span>
                  </div>
                  
                  {/* Matching exact 'flex -space-x-2 h-8 mb-5' spacer logic from projects */}
                  <div className="flex -space-x-2 overflow-hidden mb-5">
                    <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-main dark:bg-slate-700 items-center justify-center text-orange-500">
                      <Wrench className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* BOTONES ANCHOS DE ABAJO */}
                <div className="flex flex-col gap-2 mt-auto">
                  <button 
                    onClick={() => onAddToPedido && onAddToPedido(item)} 
                    className="w-full py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                     Checklist Pedido
                  </button>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingItem(item); setFormData(item); }} 
                      className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 flex justify-center items-center"
                    >
                      Gestionar Equipo
                    </button>
                    
                    <a 
                      href={`https://wa.me/?text=${item.solicitaReparacion ? encodeURIComponent(`Hola, necesito soporte urgente para la máquina: ${item.nombre}. Cliente asignado: ${item.clienteNombre || 'Bodega Central'}.`) : encodeURIComponent(`Hola, quisiera consultar por el equipo: ${item.nombre}. Cliente asignado: ${item.clienteNombre || 'Bodega Central'}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-4 bg-[#1e293b] hover:bg-[#25D366] hover:border-[#25D366]/30 hover:text-white text-[#25D366] border border-[#25D366]/20 rounded-xl transition-colors"
                      title={item.solicitaReparacion ? "Soporte Técnico Urgente" : "Consultar por equipo"}
                      onClick={e => e.stopPropagation()}
                    >
                      <MessageCircle size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-bd-lines rounded-3xl bg-card">
            <Wrench className="mx-auto text-tx-secondary opacity-30 w-16 h-16 mb-4" />
            <p className="text-lg font-bold text-tx-primary">Aún no registraste maquinaria</p>
            <p className="text-sm font-medium text-tx-secondary mt-1">Hacé clic en "Registrar Máquina" para crear la primera tarjeta.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isAdding || !!editingItem} onClose={() => { setIsAdding(false); setEditingItem(null); }} title={isAdding ? "Nueva Máquina / Herramienta" : "Ficha de Máquina"}>
        <form onSubmit={handleSave} className="space-y-5 pr-2">
          
          {/* FOTO UPLOAD */}
          <div>
            <label className="block text-sm font-bold text-tx-secondary tracking-wide mb-2">Fotografía (Plantilla)</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-main border-2 border-bd-lines overflow-hidden flex items-center justify-center shrink-0">
                {formData.imagenUrl ? (
                  <img src={formData.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={32} className="text-tx-secondary opacity-50" />
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer bg-card border border-bd-lines hover:border-accent text-tx-primary font-bold text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group">
                  <UploadCloud size={18} className="text-accent group-hover:-translate-y-1 transition-transform" />
                  {isUploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
                <p className="text-xs text-tx-secondary mt-2 font-medium">Recomendado formato apaisado, max 5MB.</p>
              </div>
            </div>
          </div>

          <div className="bg-main h-px w-full my-4" />

          <div>
            <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Nombre y Modelo</label>
            <input required type="text" placeholder="Ej: Motoguadaña Stihl FS Series" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Costo Adquisición ($)</label>
              <input type="number" value={formData.costo || ''} onChange={e => setFormData({...formData, costo: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Vida Útil (Horas)</label>
              <input type="number" placeholder="Ej: 5000" value={formData.horasEstimadas || ''} onChange={e => setFormData({...formData, horasEstimadas: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Fecha de Compra</label>
              <input type="date" value={formData.fechaCompra || ''} onChange={e => setFormData({...formData, fechaCompra: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Responsable Actual</label>
              <input type="text" value={formData.asignadoA || ''} onChange={e => setFormData({...formData, asignadoA: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none" placeholder="Empleado..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Cliente / Asignación Central</label>
              <select value={formData.clienteId || 'sin-asignar'} onChange={e => {
                if (e.target.value === 'sin-asignar') {
                  setFormData({...formData, clienteId: 'sin-asignar', clienteNombre: 'Bodega Central'});
                } else {
                  const client = clientesData.find((c: any) => c.id === e.target.value);
                  setFormData({...formData, clienteId: e.target.value, clienteNombre: client?.name || 'Cliente'});
                }
              }} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none text-center">
                <option value="sin-asignar">Bodega Central (Sin Asignar)</option>
                {clientesData?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Categoría General</label>
              <select value={formData.categoriaGeneral || 'Maquinaria'} onChange={e => setFormData({...formData, categoriaGeneral: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none text-center">
                <option value="Maquinaria">Maquinaria</option>
                <option value="Aditivos">Aditivos</option>
                <option value="Insumos">Insumos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Obra / Rastreo Específico (Opcional)</label>
            <select value={formData.ubicacionTipo || 'deposito'} onChange={e => setFormData({...formData, ubicacionTipo: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none mb-3 text-center">
              <option value="deposito">Sin obra particular asignada</option>
              <option value="proyecto">Asignado a una Obra (Espejo)</option>
            </select>
            {formData.ubicacionTipo === 'proyecto' && (
              <select value={formData.proyectoId || ''} onChange={e => {
                const proj = trabajos.find((t: any) => t.id === e.target.value);
                setFormData({...formData, proyectoId: e.target.value, proyectoNombre: proj?.titulo || 'Desconocido'});
              }} className="w-full px-4 py-3 border border-accent rounded-xl bg-accent/5 text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent outline-none text-center">
                <option value="">Seleccionar Obra del Cliente...</option>
                {trabajos.map((t: any) => <option key={t.id} value={t.id}>{t.titulo} ({t.cliente})</option>)}
              </select>
            )}
          </div>

          <div className="bg-red-50/50 p-4 rounded-xl border-2 border-red-100 hover:border-red-200 transition-colors">
            <label className="flex items-center gap-3 text-sm font-bold text-tx-primary cursor-pointer w-full">
              <input type="checkbox" checked={formData.solicitaReparacion || false} onChange={e => setFormData({...formData, solicitaReparacion: e.target.checked})} className="rounded text-red-500 border-bd-lines focus:ring-red-500 w-5 h-5" />
              Solicitar Presupuesto para Reparación Urgente
            </label>
            <p className="text-xs text-tx-secondary mt-1 ml-8 font-medium">Marcá esto si el equipo requiere service urgente, mostrará un candado rojo en la tarjeta.</p>
          </div>

          <div className="border-t border-bd-lines pt-5">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest">Historial de Revisiones / Extras</label>
              <button type="button" onClick={addMantenimiento} className="text-xs bg-main border border-bd-lines hover:bg-card px-3 py-1.5 rounded-lg text-tx-primary font-bold shadow-sm transition-all">+ Añadir</button>
            </div>
            <div className="space-y-3">
              {(formData.historialMantenimiento || []).map((m: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input type="date" value={m.fecha} onChange={e => {
                    const list = [...formData.historialMantenimiento];
                    list[idx].fecha = e.target.value;
                    setFormData({...formData, historialMantenimiento: list});
                  }} className="w-2/5 px-2 py-2 border border-bd-lines rounded-lg text-sm bg-card font-semibold focus:outline-none focus:border-accent" />
                  <input type="text" placeholder="Detalle (Ej: Cambio de bujía)" value={m.detalle} onChange={e => {
                    const list = [...formData.historialMantenimiento];
                    list[idx].detalle = e.target.value;
                    setFormData({...formData, historialMantenimiento: list});
                  }} className="flex-1 px-3 py-2 border border-bd-lines rounded-lg text-sm bg-card font-medium focus:outline-none focus:border-accent" />
                  <button type="button" onClick={() => {
                    const list = formData.historialMantenimiento.filter((_: any, i: number) => i !== idx);
                    setFormData({...formData, historialMantenimiento: list});
                  }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              ))}
              {(!formData.historialMantenimiento || formData.historialMantenimiento.length === 0) && <p className="text-sm text-tx-secondary italic font-medium">El equipo no posee registro de arreglos o cambios recientes.</p>}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-card py-4 border-t border-bd-lines mt-6">
            <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="px-5 py-3 text-tx-secondary hover:bg-main rounded-xl font-bold transition-all border border-transparent hover:border-bd-lines">Cancelar</button>
            <button type="submit" className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-[#15803d] shadow-lg shadow-accent/20 transition-all transform hover:scale-[1.02]">
              Guardar Ficha
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
