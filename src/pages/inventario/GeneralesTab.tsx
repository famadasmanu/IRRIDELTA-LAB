import React, { useState } from 'react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { Plus, Edit2, Trash2, Box, Image as ImageIcon, UploadCloud, MessageCircle, ShoppingCart } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function GeneralesTab({ searchQuery, onAddToPedido }: { searchQuery: string, onAddToPedido?: (item: any) => void }) {
  const { data: recursos, add, update, remove } = useFirestoreCollection<any>('inventario_generales');
  const { data: clientesData } = useFirestoreCollection<any>('clientes_data');
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const filtered = recursos.filter(item => item.nombre?.toLowerCase().includes(searchQuery.toLowerCase()));

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
      const storageRef = ref(storage, `inventario/generales/${Date.now()}_${file.name}`);
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

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black tracking-tight text-tx-primary flex items-center gap-2">
          <Box className="text-slate-500" /> Stock y Recursos Generales
        </h2>
        <button onClick={() => { setIsAdding(true); setFormData({ nombre: '', cantidad: 0, unidad: 'Unid', imagenUrl: '' }); }} className="flex items-center gap-2 text-sm font-bold text-white bg-accent px-4 py-2.5 rounded-xl hover:bg-[#2c4a3b] transition-all shadow-md transform hover:scale-[1.02]">
          <Plus size={18} /> Cargar Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all group flex flex-col">
            <div className="relative h-32 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-200 dark:border-slate-700/50">
              {item.imagenUrl ? (
                <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900">
                  <ImageIcon size={32} className="mb-2 opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sin Portada</span>
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col relative text-center pt-8">
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm flex flex-col items-center justify-center px-4 py-1 z-10">
                 <span className="text-xl font-black text-slate-800 dark:text-white min-w-[30px]">{item.cantidad}</span>
                 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{item.unidad}</span>
               </div>
               
               {/* Decorative Accent Top Border (Materiales use Purple-500 as accent) */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-500 rounded-b-full"></div>

              <div className="mt-2 mb-2">
                <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight px-2">{item.nombre}</h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 bg-slate-50 dark:bg-slate-700/50 inline-block px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600/30">
                  {item.categoriaGeneral || 'Insumo'} | {item.clienteNombre || 'Bodega'}
                </p>
              </div>

              <div className="flex gap-2 w-full mt-2 mb-3">
                <button
                  onClick={() => onAddToPedido && onAddToPedido(item)}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-blue-500/30 shadow-sm"
                  title="Añadir a checklist de pedido"
                >
                  <ShoppingCart size={14} /> Pedir
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hola Argent Software, precisamos pedir más de este insumo: ${item.nombre}. Stock actual: ${item.cantidad || 0} ${item.unidad || 'Unid'}. Cliente/Lugar: ${item.clienteNombre || 'Bodega Central'}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#25D366]/30 shadow-sm"
                  title="WhatsApp Rápido"
                >
                  <MessageCircle size={14} /> WA Rápido
                </a>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/50 flex justify-center gap-2">
                <button onClick={() => { setEditingItem(item); setFormData(item); }} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => { if(window.confirm('¿Borrar ítem del conteo general?')) remove(item.id); }} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-xl transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-bd-lines rounded-3xl bg-card">
            <Box className="mx-auto text-tx-secondary opacity-30 w-16 h-16 mb-4" />
            <p className="text-lg font-bold text-tx-primary">El pañol está vacío</p>
            <p className="text-sm font-medium text-tx-secondary mt-1">Hacé clic arriba para comenzar a inventariar cajas, cables, uniones...</p>
          </div>
        )}
      </div>

      <Modal isOpen={isAdding || !!editingItem} onClose={() => { setIsAdding(false); setEditingItem(null); }} title={isAdding ? "Nuevo Componente General" : "Modificar Cantidades"}>
        <form onSubmit={handleSave} className="space-y-4 pr-2">
          
          {/* FOTO UPLOAD */}
          <div>
            <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-2">Referencia Visual (Opcional)</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-main border-2 border-bd-lines overflow-hidden flex items-center justify-center shrink-0">
                {formData.imagenUrl ? (
                  <img src={formData.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-tx-secondary opacity-50" />
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer bg-card border border-bd-lines hover:border-accent text-tx-primary font-bold text-xs px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all w-fit group">
                  <UploadCloud size={16} className="text-accent group-hover:-translate-y-1 transition-transform" />
                  {isUploadingImage ? 'Cargando...' : 'Cambiar Imagen'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-main h-px w-full my-4" />

          <div>
            <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Concepto o Producto</label>
            <input required type="text" placeholder="Ej: Cable subterráneo 2x1.5mm" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-accent outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Cantidad Exacta</label>
              <input type="number" step="0.5" value={formData.cantidad || ''} onChange={e => setFormData({...formData, cantidad: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-black text-xl text-tx-primary focus:ring-2 focus:ring-accent outline-none text-center" />
            </div>
            <div>
              <label className="block text-xs font-bold text-tx-secondary uppercase tracking-widest mb-1.5">Presentación / Unidad</label>
              <select value={formData.unidad || 'Unid'} onChange={e => setFormData({...formData, unidad: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-bold text-tx-primary focus:ring-2 focus:ring-accent outline-none text-center">
                <option value="Unid">Unidades</option>
                <option value="Cajas">Cajas</option>
                <option value="Rollos">Rollos</option>
                <option value="Paquetes">Paquetes</option>
                <option value="Mts">Metros (Mts)</option>
                <option value="Lts">Litros (Lts)</option>
                <option value="Kgs">Kilos (Kgs)</option>
                <option value="Grs">Gramos</option>
              </select>
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
              <select value={formData.categoriaGeneral || 'Insumos'} onChange={e => setFormData({...formData, categoriaGeneral: e.target.value})} className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none text-center">
                <option value="Insumos">Insumos</option>
                <option value="Aditivos">Aditivos</option>
                <option value="Maquinaria">Maquinaria</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-card py-4 border-t border-bd-lines mt-6">
            <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="px-5 py-3 text-tx-secondary hover:bg-main rounded-xl font-bold transition-all border border-transparent hover:border-bd-lines">Cancelar</button>
            <button type="submit" className="px-6 py-3 bg-accent text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-[1.02]">Guardar Ficha</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
