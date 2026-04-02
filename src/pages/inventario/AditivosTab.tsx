import React, { useState } from 'react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { Plus, Edit2, Trash2, MapPin, Droplet, AlertTriangle, Calendar, Image as ImageIcon, UploadCloud, MessageCircle, ShoppingCart, UserCircle } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function AditivosTab({ searchQuery, onAddToPedido }: { searchQuery: string, onAddToPedido?: (item: any) => void }) {
  const { data: aditivos, add, update, remove } = useFirestoreCollection<any>('inventario_aditivos');
  const { data: trabajos } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: clientesData } = useFirestoreCollection<any>('clientes_data');
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const filtered = aditivos.filter(item => item.nombre?.toLowerCase().includes(searchQuery.toLowerCase()));

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
      const storageRef = ref(storage, `inventario/aditivos/${Date.now()}_${file.name}`);
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

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black tracking-tight text-tx-primary flex items-center gap-2">
          <Droplet className="text-blue-500" /> Químicos / Aditivos
        </h2>
        <button onClick={() => { setIsAdding(true); setFormData({ nombre: '', cantidad: 0, unidad: 'Lts', ubicacionTipo: 'deposito', imagenUrl: '' }); }} className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          <Plus size={14} /> Nuevo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => {
          const expired = isExpired(item.fechaCaducidad);
          return (
            <div key={item.id} className="bg-[#111827] dark:bg-[#0f172a] rounded-2xl overflow-hidden relative shadow-2xl border border-white/5 border-l-[4px] border-l-emerald-400 group transition-all flex flex-col h-full hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              
              {/* IMAGE HEADER */}
              <div className="relative h-28 w-full overflow-hidden bg-slate-900">
                <img 
                  src={item.imagenUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nombre || 'A')}&background=020617&color=10b981&size=512&font-size=0.4`} 
                  alt={item.nombre} 
                  onError={(e: any) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nombre || 'A')}&background=020617&color=10b981&size=512`; }} 
                  className="w-full h-full object-cover opacity-60 group-hover:bg-black/30 transition-all duration-700" 
                />
                
                {/* Gradient overlay mimicking the screenshot */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>

                {/* OVERLAY CONTENT */}
                <div className="absolute bottom-3 left-6 text-white pr-20 z-10">
                  <h4 className="font-bold text-lg leading-tight text-white mb-1 truncate drop-shadow-md">{item.nombre}</h4>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 drop-shadow-sm">
                      <UserCircle className="w-3.5 h-3.5 text-emerald-400" /> {item.clienteNombre || 'Bodega Central'}
                    </p>
                    <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5 drop-shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-tx-secondary" /> {item.ubicacionTipo === 'proyecto' ? item.proyectoNombre : 'Stock Central'}
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
                      const storageRef = ref(storage, `inventario/aditivos/${Date.now()}_${file.name}`);
                      try { await uploadBytes(storageRef, file); const url = await getDownloadURL(storageRef); await update(item.id, { imagenUrl: url }); } catch(err) { alert('Error al subir foto'); }
                    }} />
                  </label>
                  <button onClick={() => { setEditingItem(item); setFormData(item); }} className="p-1.5 bg-black/50 hover:bg-slate-700/80 backdrop-blur-sm rounded-lg text-tx-secondary hover:text-white transition-colors" title="Modificar Datos">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if(window.confirm('¿Borrar insumo?')) remove(item.id); }} className="p-1.5 bg-black/50 hover:bg-red-500/80 backdrop-blur-sm rounded-lg text-tx-secondary hover:text-white transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>

                {expired && (
                  <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] uppercase font-bold flex items-center gap-1 z-20 animate-pulse">
                    <AlertTriangle size={12} />
                  </div>
                )}
              </div>

              {/* LOWER CONTENT SECTION */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-[#111827] dark:bg-[#0f172a]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-tx-secondary dark:text-tx-secondary uppercase tracking-widest">Stock Disponible</span>
                    <span className="text-xs font-black text-tx-primary dark:text-tx-primary bg-main dark:bg-slate-700/50 px-2 py-1 rounded-md">{item.cantidad} {item.unidad}</span>
                  </div>
                  
                  {/* Matching exact 'flex -space-x-2 h-8 mb-5' spacer logic from projects */}
                  <div className="flex -space-x-2 overflow-hidden mb-5">
                    <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-main dark:bg-slate-700 items-center justify-center text-emerald-400">
                      <Droplet className="w-4 h-4" />
                    </div>
                    {item.fechaCaducidad && !expired && (
                      <div className="inline-flex bg-main dark:bg-slate-700 h-8 px-3 rounded-full ring-2 ring-white dark:ring-slate-800 items-center justify-center ml-2">
                        <span className="text-[10px] font-bold text-tx-secondary dark:text-tx-secondary uppercase tracking-widest mr-1">Vence:</span>
                        <span className="text-xs font-bold text-white px-1">{new Date(item.fechaCaducidad).toLocaleDateString()}</span>
                      </div>
                    )}
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
                      className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:-translate-y-0.5 flex justify-center items-center"
                    >
                      Gestionar Stock
                    </button>
                    
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`Hola, repongan stock del ítem: ${item.nombre}. Cliente asignado: ${item.clienteNombre || 'Bodega Central'}. (Hay ${item.cantidad || 0} restante)`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-4 bg-[#1e293b] hover:bg-[#25D366] hover:border-[#25D366]/30 hover:text-white text-[#25D366] border border-[#25D366]/20 rounded-xl transition-colors"
                      title="Pedido directo por WhatsApp"
                      onClick={e => e.stopPropagation()}
                    >
                      <MessageCircle size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-bd-lines rounded-3xl bg-card">
            <Droplet className="mx-auto text-tx-secondary opacity-30 w-16 h-16 mb-4" />
            <p className="text-lg font-bold text-tx-primary">Sin aditivos ni químicos</p>
            <p className="text-sm font-medium text-tx-secondary mt-1">Registrá la primer ficha de fertilizante para ver la tarjeta gráfica.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isAdding || !!editingItem} onClose={() => { setIsAdding(false); setEditingItem(null); }} title={isAdding ? "Nuevo Registro Químico" : "Panel de Insumo"}>
        <form onSubmit={handleSave} className="space-y-5 pr-2">
          
          {/* FOTO UPLOAD */}
          <div>
            <label className="block text-sm font-bold text-tx-secondary tracking-wide mb-2">Imagen del Enbase / Producto</label>
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
                  {isUploadingImage ? 'Cargando Archivo...' : 'Subir Portada'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
                <p className="text-xs text-tx-secondary mt-2 font-medium">Recomendado formato 1:1, max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="bg-main h-px w-full my-4" />

          <div>
            <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Denominación del Producto</label>
            <input required type="text" placeholder="Ej: Fertilizante Triple 15" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Cantidad</label>
              <input type="number" step="0.1" value={formData.cantidad || ''} onChange={e => setFormData({...formData, cantidad: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-black text-xl text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Unidad de Medida</label>
              <select value={formData.unidad || 'Lts'} onChange={e => setFormData({...formData, unidad: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-bold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none text-center">
                <option value="Lts">Litros (Lts)</option>
                <option value="Mts">Metros (Mts)</option>
                <option value="Cajas">Cajas</option>
                <option value="Unidades">Unid. Sueltas</option>
                <option value="Kgs">Kilos (Kgs)</option>
                <option value="Grs">Gramos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Fecha de Compra</label>
              <input type="date" value={formData.fechaCompra || ''} onChange={e => setFormData({...formData, fechaCompra: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Caducidad / Vencimiento</label>
              <input type="date" value={formData.fechaCaducidad || ''} onChange={e => setFormData({...formData, fechaCaducidad: e.target.value})} className="w-full px-4 py-3 border-accent border rounded-xl bg-accent/5 focus:bg-card text-sm font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Cliente / Asignación</label>
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
              <select value={formData.categoriaGeneral || 'Aditivos'} onChange={e => setFormData({...formData, categoriaGeneral: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none text-center">
                <option value="Aditivos">Aditivos</option>
                <option value="Maquinaria">Maquinaria</option>
                <option value="Insumos">Insumos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Enlace a Obra (Trazabilidad Específica Opcional)</label>
            <select value={formData.ubicacionTipo || 'deposito'} onChange={e => setFormData({...formData, ubicacionTipo: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none mb-3 text-center">
              <option value="deposito">Lugar Central / Uso Regular</option>
              <option value="proyecto">En Curso dentro de un Proyecto</option>
            </select>
            {formData.ubicacionTipo === 'proyecto' && (
              <select value={formData.proyectoId || ''} onChange={e => {
                const proj = trabajos.find((t: any) => t.id === e.target.value);
                setFormData({...formData, proyectoId: e.target.value, proyectoNombre: proj?.titulo || 'Desconocido'});
              }} className="w-full px-4 py-4 border-2 border-accent rounded-xl bg-accent/5 text-sm font-bold text-tx-primary focus:ring-4 focus:ring-accent/20 outline-none shadow-sm transition-all text-center">
                <option value="">Seleccionar Carpeta de Cliente...</option>
                {trabajos.map((t: any) => <option key={t.id} value={t.id}>{t.titulo} ({t.cliente})</option>)}
              </select>
            )}
            <p className="text-xs text-tx-secondary mt-1 font-medium">Asignándolo a un proyecto restará lógicamente este stock del depósito central.</p>
          </div>

          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-card py-4 border-t border-bd-lines mt-6">
             <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="px-5 py-3 text-tx-secondary hover:bg-main rounded-xl font-bold transition-all border border-transparent hover:border-bd-lines">Cancelar</button>
            <button type="submit" className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-[#15803d] shadow-lg shadow-accent/20 transition-all transform hover:scale-[1.02]">
              Guardar Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
