import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Download, Plus, Trash2, FileText, CheckCircle, Calculator, User as UserIcon, Calendar, MapPin, Building2, Package, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

type Detalle = {
  id: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  costoOriginal?: number;
};

export function PresupuestoFormalModal({ isOpen, onClose, client, initialItems }: { isOpen: boolean; onClose: () => void; client: any; initialItems?: any[] }) {
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [condiciones, setCondiciones] = useState('Presupuesto válido por 15 días. Pago 50% anticipo, 50% al finalizar la obra. La garantía sobre la instalación es de 12 meses.');
  const [manoObra, setManoObra] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
  const [markup, setMarkup] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        setMarkup(35); // Default markup 35% on import
        const mapped = initialItems.map(item => ({
            id: Math.random().toString(),
            concepto: item.desc,
            cantidad: item.cant,
            costoOriginal: item.costo,
            precioUnitario: Math.round(item.costo * 1.35)
        }));
        setDetalles(mapped);
      } else {
        // Fallback default items if not importing
        if(detalles.length === 0) {
          setDetalles([]);
        }
      }
    }
  }, [isOpen, initialItems]);

  const handleApplyMarkup = (newMarkup: number) => {
    setMarkup(newMarkup);
    setDetalles(prev => prev.map(det => {
      if (det.costoOriginal !== undefined) {
         return {
           ...det,
           precioUnitario: Math.round(det.costoOriginal * (1 + (newMarkup / 100)))
         };
      }
      return det;
    }));
  };
  
  const { data: inventarioProyectos } = useFirestoreCollection<any>('projects');
  const { data: materiales, add: addMaterialToDB, remove: removeMaterialFromDB } = useFirestoreCollection<any>('inventario_generales');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isAddingNewMaterial, setIsAddingNewMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', qty: 1, unit: 'un', price: 0 });
  
  const receiptRef = useRef<HTMLDivElement>(null);

  const calculateSubtotal = () => {
    return detalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precioUnitario), 0);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + Number(manoObra) - Number(descuento);
  };

  const handleExportPDF = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);
    try {
      // Usamos scale mayor para alta calidad en impresion A4
      const canvasObj = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvasObj.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvasObj.height * pdfWidth) / canvasObj.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Presupuesto_${client?.name?.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
    } catch (error) {
      console.error('Error generando el PDF', error);
      alert('Hubo un error al generar el PDF. Asegúrate de estar usando un navegador compatible.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Generar Presupuesto Formal (PDF)" className="max-w-7xl w-[98vw] lg:w-[95vw] h-[95vh] !max-h-[95vh] flex flex-col">
      <div className="flex flex-col gap-6 lg:flex-row h-full min-h-0">
        {/* Lado Izquierdo: Controles */}
        <div className="w-full lg:w-[35%] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4 h-full">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><UserIcon size={18} /> Datos del Cliente</h3>
             <p className="text-sm font-semibold text-slate-700">{client?.name || 'Consumidor Final'}</p>
             <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {client?.location || 'Sin dirección'}</p>
             <p className="text-xs text-slate-500 mt-1">Tel: {client?.phone || 'N/A'}</p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
             <div className="flex justify-between items-center mb-1">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} /> Conceptos (Materiales / Tareas)</h3>
             </div>
             
             {initialItems && initialItems.length > 0 && (
               <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-2 shadow-sm">
                 <div className="flex flex-col">
                   <span className="text-sm font-bold text-indigo-800">Margen Comercial (Markup)</span>
                   <span className="text-[10px] text-indigo-600 font-medium">Multiplicador sobre insumos importados.</span>
                 </div>
                 <div className="relative">
                   <input 
                     type="number" 
                     value={markup} 
                     onChange={e => handleApplyMarkup(Number(e.target.value))} 
                     className="w-20 pl-2 pr-6 py-1.5 rounded-lg border border-indigo-200 outline-none text-sm font-black text-center text-indigo-700 bg-white" 
                   />
                   <span className="absolute right-2 top-2 text-sm font-bold text-indigo-400">%</span>
                 </div>
               </div>
             )}

             {detalles.map((det, index) => (
                <div key={det.id} className="flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-xl relative">
                  <button onClick={() => setDetalles(prev => prev.filter(p => p.id !== det.id))} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200"><Trash2 size={12}/></button>
                  <input 
                    type="text" 
                    value={det.concepto} 
                    onChange={e => setDetalles(prev => prev.map(p => p.id === det.id ? {...p, concepto: e.target.value} : p))}
                    className="w-full text-xs font-bold text-slate-700 border-none bg-slate-50 p-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Descripción..."
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={det.cantidad} 
                      onChange={e => setDetalles(prev => prev.map(p => p.id === det.id ? {...p, cantidad: Number(e.target.value)} : p))}
                      className="w-1/3 text-xs font-bold text-slate-700 border-none bg-slate-50 p-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                      placeholder="Cant."
                    />
                    <div className="relative w-2/3">
                      <span className="absolute left-2 top-2 text-xs text-emerald-600 font-bold">$</span>
                      <input 
                        type="number" 
                        value={det.precioUnitario} 
                        onChange={e => setDetalles(prev => prev.map(p => p.id === det.id ? {...p, precioUnitario: Number(e.target.value)} : p))}
                        className="w-full text-xs font-bold text-slate-700 border-none bg-emerald-50 pl-6 pr-2 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Precio U."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                 <button onClick={() => setIsCatalogOpen(true)} className="flex-[2] text-xs font-bold text-white bg-indigo-600 py-2 rounded-xl flex justify-center items-center gap-1 hover:bg-indigo-700 transition-colors">
                   <Package size={14} /> Importar Catálogo
                 </button>
                 <button onClick={() => setDetalles([...detalles, { id: Math.random().toString(), concepto: 'Nuevo Item', cantidad: 1, precioUnitario: 0 }])} className="flex-1 text-xs font-bold text-accent bg-accent/10 py-2 rounded-xl flex justify-center items-center gap-1 hover:bg-accent/20 transition-colors">
                   <Plus size={14} /> Manual
                 </button>
               </div>
               
               
               {inventarioProyectos && inventarioProyectos.filter((p: any) => p.clienteId === client?.id).length > 0 && (
                 <select 
                   className="w-full mt-2 text-xs font-bold text-slate-700 bg-slate-100 py-2 px-3 rounded-xl appearance-none outline-none border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors text-center"
                   onChange={(e) => {
                     if(!e.target.value) return;
                     const proj = inventarioProyectos.find((p: any) => p.id === e.target.value);
                     if (proj && proj.assignedItems) {
                       const mapped = proj.assignedItems.map((item: any) => ({
                           id: Math.random().toString(),
                           concepto: item.name,
                           cantidad: item.qty || 1,
                           precioUnitario: item.price || 0
                       }));
                       setDetalles(prev => [...prev.filter(d => !d.concepto.includes('Ej:')), ...mapped]);
                     }
                     e.target.value = "";
                   }}
                 >
                   <option value="">⭳ Importar desde Inventario (Obra) ⭳</option>
                   {inventarioProyectos.filter((p: any) => p.clienteId === client?.id).map((p: any) => (
                     <option key={p.id} value={p.id}>{p.name} ({p.itemsCount} ítems)</option>
                   ))}
                 </select>
               )}

               {client?.pedidos_irridelta && client.pedidos_irridelta.length > 0 && (
                 <select 
                   className="w-full mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl appearance-none outline-none border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors text-center"
                   onChange={(e) => {
                     if(!e.target.value) return;
                     const pedido = client.pedidos_irridelta.find((p: any) => p.id === e.target.value);
                     if (pedido && pedido.items) {
                       setMarkup(35); // Default markup
                       const mapped = pedido.items.map((item: any) => ({
                           id: Math.random().toString(),
                           concepto: item.desc,
                           cantidad: item.cant || 1,
                           costoOriginal: item.costo || 0,
                           precioUnitario: Math.round((item.costo || 0) * 1.35)
                       }));
                       setDetalles(prev => [...prev.filter(d => !d.concepto.includes('Ej:')), ...mapped]);
                     }
                     e.target.value = "";
                   }}
                 >
                   <option value="">⭳ Importar Cotización PDF (IA) ⭳</option>
                   {client.pedidos_irridelta.map((p: any) => (
                     <option key={p.id} value={p.id}>{p.pdfName || 'Cotización'} ({p.fecha})</option>
                   ))}
                 </select>
               )}

               {client?.proyectos_riego && client.proyectos_riego.length > 0 && (
                 <select 
                   className="w-full mt-2 text-xs font-bold text-slate-700 bg-slate-100 py-2 px-3 rounded-xl appearance-none outline-none border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors text-center"
                   onChange={(e) => {
                     if(!e.target.value) return;
                     const proj = client.proyectos_riego.find((p: any) => p.id === e.target.value);
                     if (proj) {
                       setDetalles(prev => [...prev.filter(d => !d.concepto.includes('Ej:')), {
                         id: Math.random().toString(),
                         concepto: `Instalación Sistema: ${proj.nombre} (${proj.distancia} ${proj.material})`,
                         cantidad: 1,
                         precioUnitario: 250000
                       }]);
                     }
                     e.target.value = "";
                   }}
                 >
                   <option value="">⭳ Importar Diseño Calculadora ⭳</option>
                   {client.proyectos_riego.map((p: any) => (
                     <option key={p.id} value={p.id}>{p.nombre} ({p.fecha})</option>
                   ))}
                 </select>
               )}
             </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
             <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calculator size={18} /> Ajustes Finales</h3>
             <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl mb-2">
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest pl-1">Costo Materiales (Oculto al Cliente)</span>
                <span className="font-black text-indigo-900 text-sm">${calculateSubtotal().toLocaleString('es-AR')}</span>
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Extras (Mano de Obra, Traslados)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-bold">$</span>
                  <input type="number" value={manoObra} onChange={e => setManoObra(Number(e.target.value))} className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-accent text-sm font-bold text-slate-700" />
                </div>
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Descuento Global (Opcional)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm text-red-400 font-bold">-$</span>
                  <input type="number" value={descuento} onChange={e => setDescuento(Number(e.target.value))} className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-red-500 text-sm font-bold text-red-600 bg-red-50" />
                </div>
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Términos y Condiciones</label>
                <textarea value={condiciones} onChange={e => setCondiciones(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-accent text-xs text-slate-600 mt-1 h-20 resize-none" />
             </div>
          </div>
        </div>

        {/* Lado Derecho: Preview del PDF */}
        <div className="w-full lg:w-[65%] flex flex-col h-full min-h-0">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-bold text-slate-800">Vista Previa del Documento</h3>
            <button 
              onClick={handleExportPDF}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-white transition-all shadow-md shrink-0 ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-accent to-[#25D366] hover:scale-105 hover:shadow-lg'}`}
            >
              <Download size={18} />
              {isGenerating ? 'Generando PDF...' : 'Exportar PDF'}
            </button>
          </div>
          
          <div className="bg-slate-200 p-4 sm:p-8 rounded-2xl overflow-y-auto custom-scrollbar flex-1">
             {/* "Hoja A4" virtual */}
             <div ref={receiptRef} className="bg-white w-full max-w-[800px] mx-auto shadow-sm p-8 sm:p-12 text-slate-800 font-sans relative min-h-[800px]">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-slate-800 to-slate-600 z-10"></div>
                
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
                  <img src="/argen-logo.png" alt="" className="w-[500px] object-contain opacity-[0.05] grayscale" />
                </div>
                
                {/* Encabezado */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8 mt-4 relative z-10">
                  <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">POWERED BY <span className="text-indigo-600">ARGEN SOFTWARE</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">SISTEMAS DE RIEGO PROFESIONALES</p>
                    <div className="mt-4 space-y-1 text-xs text-slate-500">
                      <p>CUIT: 30-12345678-9</p>
                      <p>contacto@argensoftware.com</p>
                      <p>+54 9 11 1234-5678</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-light text-slate-300 mb-2 uppercase tracking-widest">Presupuesto</h2>
                    <p className="text-sm font-bold text-slate-700">FECHA: <span className="font-normal">{new Date().toLocaleDateString('es-AR')}</span></p>
                    <p className="text-sm font-bold text-slate-700 mt-1">DO-Nº: <span className="font-normal text-slate-500">COT-{Math.floor(Date.now() / 1000).toString().slice(-6)}</span></p>
                  </div>
                </div>

                {/* Cliente */}
                <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">PREPARADO PARA:</h3>
                  <p className="text-xl font-bold text-slate-800">{client?.name || 'Cliente sin registrar'}</p>
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1"><MapPin size={14}/> {client?.location || 'Dirección no especificada'}</p>
                  <p className="text-sm text-slate-600 mt-1">Tel: {client?.phone || 'No registrado'}</p>
                </div>

                {/* Tabla de Conceptos */}
                <table className="w-full text-left mb-8">
                  <thead>
                    <tr className="border-b-2 border-slate-800">
                      <th className="py-3 text-sm font-black text-slate-800 uppercase">Despiece General de Proyecto (Materiales)</th>
                      <th className="py-3 text-sm font-black text-slate-800 uppercase text-right w-40">Unidades Asignadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((det, i) => (
                      <tr key={det.id} className="border-b border-slate-100">
                        <td className="py-3 text-sm font-medium text-slate-700">{det.concepto}</td>
                        <td className="py-3 text-sm text-right font-bold text-slate-600">{det.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Opcionales y Totales */}
                <div className="flex justify-end mt-8 border-t border-slate-200 pt-6">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Insumos Generales:</span>
                      <span className="font-bold text-slate-800">${calculateSubtotal().toLocaleString('es-AR')}</span>
                    </div>
                    {manoObra > 0 && (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Mano de Obra y Extras:</span>
                        <span className="font-bold text-slate-800">${manoObra.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    {descuento > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Descuento aplicado:</span>
                        <span className="font-bold">-${descuento.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-slate-800 text-white p-4 rounded-xl mt-4">
                       <span className="text-sm font-bold uppercase tracking-widest">Total Final</span>
                       <span className="text-xl font-black">${calculateTotal().toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer/Términos */}
                <div className="mt-12 pb-4">
                   <div className="border-t-2 border-slate-100 pt-6">
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Términos y Condiciones</h4>
                     <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-2xl">{condiciones}</p>
                   </div>
                   <div className="mt-8 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <p>Generado con ARGEN SOFTWARE</p>
                     <p>¡Gracias por confiar en nosotros!</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Modal>

    {/* Modal del Catálogo de Materiales */}
    <Modal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} title="Importar desde Catálogo de Materiales" className="max-w-3xl">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar materiales por nombre o código..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={() => setIsAddingNewMaterial(!isAddingNewMaterial)}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl whitespace-nowrap hover:bg-slate-200 transition-colors"
          >
            {isAddingNewMaterial ? 'Cerrar' : '+ Insumo Nuevo'}
          </button>
        </div>
        
        {isAddingNewMaterial && (
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col gap-3">
            <h4 className="font-bold text-indigo-800 text-sm">Crear Nuevo Insumo en Inventario</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <input type="text" placeholder="Nombre" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="col-span-2 text-sm px-3 py-2 rounded-lg border border-indigo-200 outline-none focus:border-indigo-500" />
              <input type="number" placeholder="Precio Unidad" value={newMaterial.price || ''} onChange={e => setNewMaterial({...newMaterial, price: Number(e.target.value)})} className="text-sm px-3 py-2 rounded-lg border border-indigo-200 outline-none focus:border-indigo-500" />
              <div className="flex gap-2">
                <input type="number" placeholder="Stock" value={newMaterial.qty || ''} onChange={e => setNewMaterial({...newMaterial, qty: Number(e.target.value)})} className="w-1/2 text-sm px-3 py-2 rounded-lg border border-indigo-200 outline-none focus:border-indigo-500" />
                <select value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="w-1/2 text-sm px-2 py-2 rounded-lg border border-indigo-200 outline-none bg-white">
                  <option value="un">un</option>
                  <option value="mts">mts</option>
                  <option value="kg">kg</option>
                  <option value="L">lts</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
               <button 
                 onClick={async () => {
                   if (!newMaterial.name) return;
                   const idNuevo = await addMaterialToDB({
                     ...newMaterial, 
                     nombre: newMaterial.name, 
                     cantidad: newMaterial.qty, 
                     unidad: newMaterial.unit, 
                     costo: newMaterial.price, 
                     status: 'Estable'
                   });
                   setDetalles(prev => [...prev, { id: Math.random().toString(), concepto: newMaterial.name, cantidad: 1, precioUnitario: newMaterial.price }]);
                   setIsAddingNewMaterial(false);
                   setNewMaterial({ name: '', qty: 1, unit: 'un', price: 0 });
                 }}
                 className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700"
               >
                 Guardar en Inventario y Añadir
               </button>
            </div>
          </div>
        )}
        
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
          {materiales
            .filter((m: any) => (m.name || m.nombre || '').toLowerCase().includes(catalogSearch.toLowerCase()) || (m.brand && m.brand.toLowerCase().includes(catalogSearch.toLowerCase())))
            .map((mat: any) => (
            <div key={mat.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm">{mat.name || mat.nombre || 'Insumo Sin Nombre'}</span>
                <span className="text-xs text-slate-500">{mat.brand || mat.marca || 'Genérico'} - Stock: {mat.qty || mat.cantidad || 0} {mat.unit || mat.unidad || 'un'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700 w-24 text-right">${(mat.price || mat.costo || 0).toLocaleString('es-AR')}</span>
                <button
                  onClick={() => {
                    setDetalles(prev => [...prev, {
                      id: Math.random().toString(),
                      concepto: mat.name || mat.nombre || 'Insumo',
                      cantidad: 1,
                      precioUnitario: mat.price || mat.costo || 0
                    }]);
                  }}
                  className="bg-emerald-100 text-emerald-700 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-200 transition-colors"
                  title="Añadir a presupuesto"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('¿Eliminar este material del inventario definitivamente?')) {
                      await removeMaterialFromDB(mat.id);
                    }
                  }}
                  className="bg-red-100 text-red-600 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-200 transition-colors"
                  title="Eliminar Insumo (Incluyendo Fantasmas)"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {materiales.filter((m: any) => (m.name || m.nombre || '').toLowerCase().includes(catalogSearch.toLowerCase())).length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
               <p>No se encontraron materiales que coincidan con <b>"{catalogSearch}"</b>.</p>
               <button onClick={() => { setIsAddingNewMaterial(true); setNewMaterial({...newMaterial, name: catalogSearch}); }} className="mt-2 text-indigo-600 font-bold hover:underline">
                 + Crear "{catalogSearch}" ahora
               </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-slate-100">
           <button onClick={() => setIsCatalogOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm">Terminar de Agregar</button>
        </div>
      </div>
    </Modal>
    </>
  );
}
