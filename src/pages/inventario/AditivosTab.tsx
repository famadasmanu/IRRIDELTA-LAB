import React, { useState } from 'react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { Plus, Edit2, Trash2, MapPin, Droplet, AlertTriangle, Calendar, Image as ImageIcon, UploadCloud, MessageCircle, ShoppingCart } from 'lucide-react';
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
        <button onClick={() => { setIsAdding(true); setFormData({ nombre: '', cantidad: 0, unidad: 'Lts', ubicacionTipo: 'deposito', imagenUrl: '' }); }} className="flex items-center gap-2 text-sm font-bold text-white bg-accent px-4 py-2.5 rounded-xl hover:bg-[#2c4a3b] transition-all shadow-md transform hover:scale-[1.02]">
          <Plus size={18} /> Nuevo Insumo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => {
          const expired = isExpired(item.fechaCaducidad);
          return (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all group flex flex-col">
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-200 dark:border-slate-700/50">
                <img src={item.imagenUrl || 'https://images.unsplash.com/photo-1584483758117-640a1b5c2106?auto=format&fit=crop&q=80&w=800'} alt={item.nombre} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!item.imagenUrl ? 'opacity-50 grayscale' : ''}`} />
                <label onClick={e => e.stopPropagation()} className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-white cursor-pointer z-10 transition-colors" title="Actualizar foto">
                  <UploadCloud size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={async e => {
                      const file = e.target.files?.[0];
                      if(!file) return;
                      const storageRef = ref(storage, `inventario/aditivos/${Date.now()}_${file.name}`);
                      try {
                        await uploadBytes(storageRef, file);
                        const url = await getDownloadURL(storageRef);
                        await update(item.id, { imagenUrl: url });
                      } catch(err) { alert('Error al subir foto'); }
                  }} />
                </label>
                {expired && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                    <AlertTriangle size={14} /> Producto Vencido
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm flex items-center gap-1 text-slate-800 dark:text-white font-black text-lg">
                  {item.cantidad} <span className="text-sm text-slate-500 dark:text-slate-400 font-bold ml-1">{item.unidad}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col pt-6 relative items-center text-center">
                {/* Decorative Accent Top Border */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-b-full"></div>

                <div className="flex justify-center items-start mb-3 w-full">
                  <div className="w-full">
                    <h3 className="text-xl font-black text-tx-primary leading-tight capitalize truncate px-2">{item.nombre}</h3>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <MapPin size={12} className={item.ubicacionTipo === 'proyecto' ? 'text-blue-500' : 'text-tx-secondary'} /> 
                      <span className="text-xs font-bold uppercase tracking-wider text-tx-secondary truncate max-w-[200px]">{item.ubicacionTipo === 'proyecto' ? item.proyectoNombre : 'Stock Central'}</span>
                    </div>
                  </div>
                </div>

                {/* Info Blocks Vertically Stacked */}
                <div className="mt-2 flex flex-col gap-2 mb-4 w-full text-left">
                   <div className="bg-main px-4 py-2.5 rounded-xl border border-bd-lines flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-tx-secondary" />
                      <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest shrink-0">Sitio</span>
                    </div>
                    <span className="text-sm font-black text-tx-primary truncate text-right">{item.clienteNombre || 'Bodega Central'}</span>
                  </div>
                  <div className="bg-main px-4 py-2.5 rounded-xl border border-bd-lines flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={expired ? 'text-red-500' : 'text-tx-secondary'} />
                      <span className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest shrink-0">Vencimiento</span>
                    </div>
                    <span className={`text-sm font-black tabular-nums transition-colors ${expired ? 'text-red-500 font-extrabold' : 'text-tx-primary'}`}>{item.fechaCaducidad ? new Date(item.fechaCaducidad).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Main Actions */}
                <div className="flex flex-col gap-2 w-full mb-2">
                  <button
                    onClick={() => onAddToPedido && onAddToPedido(item)}
                    className="w-full bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#15803d] transition-all flex items-center justify-center gap-2 shadow-md"
                    title="Añadir a checklist de pedido"
                  >
                    <ShoppingCart size={18} /> Pedir Traslado
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Hola Argent Software, necesitamos que repongan stock del ítem: ${item.nombre}. Cliente asignado: ${item.clienteNombre || 'Bodega Central'}. (Hay ${item.cantidad || 0} restante)`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-[#25D366]/30 shadow-md"
                    title="Enviar WhatsApp de reposición rápido"
                  >
                    <MessageCircle size={18} /> Reabastecer WA
                  </a>
                </div>

                {/* Bottom Admin Actions */}
                <div className="mt-auto pt-4 border-t border-bd-lines/50 flex gap-2 w-full">
                  <button onClick={() => { setEditingItem(item); setFormData(item); }} className="flex-1 py-2.5 bg-card hover:bg-main text-tx-primary font-bold text-sm rounded-xl transition-colors border border-bd-lines shadow-sm flex items-center justify-center gap-2">
                    <Edit2 size={16} className="text-tx-secondary" /> Modificar Registro
                  </button>
                  <button onClick={() => { if(window.confirm('¿Borrar insumo?')) remove(item.id); }} className="px-3.5 py-2.5 bg-red-50/50 dark:bg-red-500/10 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-colors border border-red-200 dark:border-red-500/30 flex items-center justify-center shrink-0 shadow-sm">
                    <Trash2 size={18} />
                  </button>
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
