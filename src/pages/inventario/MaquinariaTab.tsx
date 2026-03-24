import React, { useState } from 'react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { Plus, Edit2, Trash2, MapPin, Wrench, AlertTriangle, Image as ImageIcon, UploadCloud, MessageCircle, ShoppingCart } from 'lucide-react';
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
        <button onClick={() => { setIsAdding(true); setFormData({ nombre: '', costo: 0, ubicacionTipo: 'deposito', solicitaReparacion: false, imagenUrl: '' }); }} className="flex items-center gap-2 text-sm font-bold text-white bg-accent px-4 py-2.5 rounded-xl hover:bg-[#2c4a3b] transition-all shadow-md transform hover:scale-[1.02]">
          <Plus size={18} /> Registrar Máquina
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all group flex flex-col">
            <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-200 dark:border-slate-700/50">
              <img src={item.imagenUrl || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800'} alt={item.nombre} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!item.imagenUrl ? 'opacity-50 grayscale' : ''}`} />
              <label onClick={e => e.stopPropagation()} className="absolute top-3 left-3 p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-white cursor-pointer z-10 transition-colors" title="Actualizar foto">
                 <UploadCloud size={16} />
                 <input type="file" className="hidden" accept="image/*" onChange={async e => {
                      const file = e.target.files?.[0];
                      if(!file) return;
                      const storageRef = ref(storage, `inventario/maquinaria/${Date.now()}_${file.name}`);
                      try {
                        await uploadBytes(storageRef, file);
                        const url = await getDownloadURL(storageRef);
                        await update(item.id, { imagenUrl: url });
                      } catch(err) { alert('Error al subir foto'); }
                 }} />
              </label>
              {item.solicitaReparacion && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                  <AlertTriangle size={14} /> Necesita Reparación
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col pt-6 relative items-center text-center">
              {/* Decorative Accent Top Border (Maquinarias use Slate-400 as accent) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-400 rounded-b-full"></div>

              <div className="flex justify-center items-start mb-2 w-full">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{item.nombre}</h3>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <MapPin size={12} className={item.ubicacionTipo === 'proyecto' ? 'text-slate-500 dark:text-slate-400' : 'text-accent'} /> 
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.ubicacionTipo === 'proyecto' ? item.proyectoNombre : 'Depósito Central'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 mb-4 w-full text-left">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600/30">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Asignado a</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate block">{item.asignadoA || 'Sin Asignar'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600/30">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Cliente / Ubicación</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate col-span-1">{item.clienteNombre || 'Bodega Central'}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full mt-2 mb-2">
                <button
                  onClick={() => onAddToPedido && onAddToPedido(item)}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 border border-blue-500/30 shadow-sm"
                  title="Añadir a checklist de pedido"
                >
                  <ShoppingCart size={16} /> Pedir
                </button>
                {item.solicitaReparacion && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Hola, necesito soporte urgente para la máquina: ${item.nombre}. Cliente asignado: ${item.clienteNombre || 'Bodega Central'}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 border border-[#25D366]/30 shadow-sm"
                    title="Contactar soporte técnico por falla"
                  >
                    <MessageCircle size={16} /> Soporte
                  </a>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between gap-2 w-full">
                <button onClick={() => { setEditingItem(item); setFormData(item); }} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/50 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl transition-colors border border-slate-200 dark:border-slate-600/30">
                  Gestionar Ficha
                </button>
                <button onClick={() => { if(window.confirm('¿Eliminar máquina permanentemente?')) remove(item.id); }} className="px-3 py-2 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-white hover:bg-red-50 dark:hover:bg-red-500/80 hover:border-red-200 dark:hover:border-red-600 rounded-xl transition-colors border border-slate-200 dark:border-slate-600/30">
                  <Trash2 size={18} />
                </button>
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
