import React, { useState, useRef, useEffect } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Plus, Trash2, Calendar, FileText, CheckCircle, Clock, AlertTriangle, User, PenTool, X, Search, ChevronRight, Package, Download, Send, CheckCheck, MapPin, Image as ImageIcon } from 'lucide-react';
import { Modal } from './Modal';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function TrabajosOrdenesTab() {
  const { data: ordenesData, add: addOrden, update: updateOrden, remove: removeOrden } = useFirestoreCollection<any>('trabajos_ordenes');
  const { data: proyectosData, update: updateProyecto } = useFirestoreCollection<any>('projects');
  const { data: personalData } = useFirestoreCollection<any>('personalData');
  const { data: clientesData } = useFirestoreCollection<any>('clientes');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<any>(null);

  // Formularios de Creación (Gestor)
  const [newInstrucciones, setNewInstrucciones] = useState('');
  const [newEmpleado, setNewEmpleado] = useState('');
  const [newClienteProyecto, setNewClienteProyecto] = useState('');
  const [newProyectoPadre, setNewProyectoPadre] = useState('');
  const [newProyectoId, setNewProyectoId] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ id: string, desc: string, cant: number }[]>([]);

  // Features Extras
  const [newPrioridad, setNewPrioridad] = useState('Media');
  const [newTipoTarea, setNewTipoTarea] = useState('');
  const [isUploadingAdjunto, setIsUploadingAdjunto] = useState(false);
  const [newAdjuntoUrl, setNewAdjuntoUrl] = useState('');

  // Formularios de Firma (Empleado)
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [anotacionesEmpleado, setAnotacionesEmpleado] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const isAdmin = true; // auth.currentUser?.email?.includes('admin') || auth.currentUser?.email === 'admin@irridelta.com';

  useEffect(() => {
    // Si la persona es técnico, por defecto solo le mostramos sus órdenes si se puede inferir.
    // Por simplicidad en esta demo, mostramos todo.
  }, []);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top  : (e as React.MouseEvent).nativeEvent.offsetY;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top  : (e as React.MouseEvent).nativeEvent.offsetY;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const initCanvas = () => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }, 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingAdjunto(true);
    try {
      const fileRef = ref(storage, `ordenes_adjuntos/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setNewAdjuntoUrl(url);
    } catch (err) {
      console.error(err);
      alert("Error al subir el archivo.");
    }
    setIsUploadingAdjunto(false);
  };

  const handleMarcarLeida = async (orden: any) => {
     if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
           const loc = `${pos.coords.latitude}, ${pos.coords.longitude}`;
           await updateOrden(orden.id, { leida: true, fechaLeida: new Date().toLocaleString('es-AR'), ubicacionLeida: loc });
           alert("Orden marcada como leída. Trazabilidad GPS Registrada.");
        }, async () => {
           await updateOrden(orden.id, { leida: true, fechaLeida: new Date().toLocaleString('es-AR'), ubicacionLeida: 'GPS Denegado' });
           alert("Orden marcada como leída (Sin GPS).");
        });
     } else {
        await updateOrden(orden.id, { leida: true, fechaLeida: new Date().toLocaleString('es-AR') });
     }
  };

  const handleCreateOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpleado || !newProyectoId || !newInstrucciones) {
      alert("Por favor completa Empleado, Proyecto e Instrucciones.");
      return;
    }

    const prj = proyectosData.find(p => p.id === newProyectoId || p.name === newProyectoId);
    
    // Guardamos el agrupador "proyectoPadre" en la propia obra si es que es nuevo o diferente
    if (prj && prj.proyectoPadre !== newProyectoPadre) {
      updateProyecto(prj.id, { proyectoPadre: newProyectoPadre });
    }

    await addOrden({
      fecha: new Date().toLocaleDateString('es-AR'),
      empleado: newEmpleado,
      proyectoId: prj?.id || newProyectoId, // Guardamos ID si existe, sino el texto libre
      proyectoPadre: newProyectoPadre || 'Proyecto Principal',
      proyectoNombre: prj?.name || newProyectoId, // Usar el texto libre como nombre
      instrucciones: newInstrucciones,
      materialesPrevistos: selectedItems,
      estado: 'Pendiente',
      anotacionesEmpleado: '',
      firmaUrl: '',
      prioridad: newPrioridad,
      tipoTarea: newTipoTarea,
      adjuntoUrl: newAdjuntoUrl,
      leida: false
    });

    setIsModalOpen(false);
    setNewInstrucciones('');
    setNewEmpleado('');
    setNewProyectoId('');
    setNewProyectoPadre('');
    setSelectedItems([]);
    setNewPrioridad('Media');
    setNewTipoTarea('');
    setNewAdjuntoUrl('');
  };

  const handleOpenSign = (orden: any) => {
    setSelectedOrden(orden);
    setAnotacionesEmpleado('');
    setIsSignModalOpen(true);
    initCanvas();
  };

  const handleCompleteAndDiscount = async () => {
    if (!selectedOrden) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is actually signed
    // We'll just grab the dataUrl, but a blank canvas could be rejected in a real app
    const firmaData = canvas.toDataURL('image/png');

    // Descuento de stock en Proyecto si es que hay items vinculados
    if (selectedOrden.materialesPrevistos && selectedOrden.materialesPrevistos.length > 0 && selectedOrden.proyectoId) {
      const projectDoc = proyectosData.find(p => p.id === selectedOrden.proyectoId);
      if (projectDoc && projectDoc.items) {
          const updatedItems = [...projectDoc.items];
          // Restar cantidades usadas (sumarlas al campo 'usado')
          for (let material of selectedOrden.materialesPrevistos) {
              const matchedIndex = updatedItems.findIndex(it => it.id === material.id || it.desc === material.desc);
              if (matchedIndex !== -1) {
                  // Incrementar el uso para evitar borrarlo pero que conste el descuento real del proyecto
                  updatedItems[matchedIndex].usadas = (updatedItems[matchedIndex].usadas || 0) + material.cant;
              }
          }
          await updateProyecto(projectDoc.id, { items: updatedItems });
      }
    }

    await updateOrden(selectedOrden.id, {
      estado: 'Finalizado',
      anotacionesEmpleado: anotacionesEmpleado,
      firmaUrl: firmaData,
      fechaFinalizado: new Date().toLocaleString('es-AR')
    });

    setIsSignModalOpen(false);
    setSelectedOrden(null);
    alert("¡Orden finalizada y firma registrada! Stock descontado del proyecto.");
  };

  const handleExportPDF = (orden: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Orden de Trabajo: ${orden.fecha}`, 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Empleado asignado: ${orden.empleado}`, 20, 35);
    doc.text(`Proyecto / Destino: ${orden.proyectoNombre}`, 20, 45);
    doc.text(`Estado: ${orden.estado}`, 20, 55);

    doc.setFontSize(12);
    doc.text("Instrucciones de Trabajo:", 20, 70);
    // wrap text
    const splitText = doc.splitTextToSize(orden.instrucciones, 170);
    doc.text(splitText, 20, 80);

    let yOffset = 80 + splitText.length * 7 + 10;

    doc.setFontSize(14);
    doc.text("Materiales Utilizados:", 20, yOffset);
    yOffset += 10;
    doc.setFontSize(12);
    if (orden.materialesPrevistos && orden.materialesPrevistos.length > 0) {
      orden.materialesPrevistos.forEach((m: any, idx: number) => {
         doc.text(`- ${m.cant}x ${m.desc}`, 20, yOffset);
         yOffset += 8;
      });
    } else {
      doc.text("- Ningún material particular.", 20, yOffset);
      yOffset += 8;
    }

    if (orden.estado === 'Finalizado') {
       yOffset += 10;
       doc.setFontSize(14);
       doc.text("Reporte / Anotaciones del Empleado:", 20, yOffset);
       yOffset += 10;
       doc.setFontSize(12);
       const noteLines = doc.splitTextToSize(orden.anotacionesEmpleado || 'Sin observaciones', 170);
       doc.text(noteLines, 20, yOffset);
       yOffset += noteLines.length * 7 + 10;

       if (orden.firmaUrl) {
         doc.text("Firma de Conformidad:", 20, yOffset);
         doc.addImage(orden.firmaUrl, 'PNG', 20, yOffset + 5, 60, 30);
       }
    }

    doc.save(`OrdenTrabajo_${orden.empleado.replace(/\s+/g, '_')}_${orden.fecha.replace(/\//g,'-')}.pdf`);
  };

  const handleShareWhatsApp = async (orden: any) => {
    try {
      alert("Generando PDF y preparando para enviar...");
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`Orden de Trabajo: ${orden.fecha}`, 20, 20);
      doc.setFontSize(14);
      doc.text(`Empleado asignado: ${orden.empleado}`, 20, 35);
      doc.text(`Proyecto / Destino: ${orden.proyectoNombre}`, 20, 45);
      doc.text(`Estado: ${orden.estado}`, 20, 55);
      doc.setFontSize(12);
      doc.text("Instrucciones:", 20, 70);
      const splitText = doc.splitTextToSize(orden.instrucciones, 170);
      doc.text(splitText, 20, 80);
      let yOffset = 80 + splitText.length * 7 + 10;
      doc.setFontSize(14);
      doc.text("Materiales Utilizados:", 20, yOffset);
      yOffset += 10;
      doc.setFontSize(12);
      if (orden.materialesPrevistos && orden.materialesPrevistos.length > 0) {
        orden.materialesPrevistos.forEach((m: any) => {
           doc.text(`- ${m.cant}x ${m.desc}`, 20, yOffset);
           yOffset += 8;
        });
      } else {
        doc.text("- Ningún material particular.", 20, yOffset);
        yOffset += 8;
      }
      if (orden.estado === 'Finalizado') {
         yOffset += 10;
         doc.setFontSize(14);
         doc.text("Reporte del Empleado:", 20, yOffset);
         yOffset += 10;
         doc.setFontSize(12);
         const noteLines = doc.splitTextToSize(orden.anotacionesEmpleado || 'Sin observaciones', 170);
         doc.text(noteLines, 20, yOffset);
         yOffset += noteLines.length * 7 + 10;
         if (orden.firmaUrl) {
           doc.text("Firma de Conformidad:", 20, yOffset);
           doc.addImage(orden.firmaUrl, 'PNG', 20, yOffset + 5, 60, 30);
         }
      }

      const pdfBlob = doc.output('blob');
      const filename = `OrdenTrabajo_${orden.empleado.replace(/\s+/g, '_')}_${orden.fecha.replace(/\//g,'-')}.pdf`;
      const pdfRef = ref(storage, `ordenes/${orden.id}_${filename}`);
      
      await uploadBytes(pdfRef, pdfBlob);
      const downloadUrl = await getDownloadURL(pdfRef);

      const mensajeStr = `✅ *Orden de Trabajo Finalizada*%0A*Empleado:* ${orden.empleado}%0A*Proyecto:* ${orden.proyectoNombre}%0A*Fecha:* ${orden.fecha}%0A%0APuedes ver el Acta PDF firmada aquí: %0A${downloadUrl}`;
      window.open(`https://wa.me/?text=${mensajeStr}`, '_blank');
      
    } catch (e) {
      console.error(e);
      alert("Error al intentar generar y compartir el PDF por WhatsApp.");
    }
  };

  // UI Helper: select items from project
  const handleToggleMaterialOrder = (mat: any) => {
     const exists = selectedItems.find(i => i.id === mat.id);
     if (exists) {
        setSelectedItems(selectedItems.filter(i => i.id !== mat.id));
     } else {
        setSelectedItems([...selectedItems, { id: mat.id, desc: mat.desc, cant: 1 }]);
     }
  };


  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card p-6 rounded-2xl border border-bd-lines shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-tx-primary flex items-center gap-2">
            <FileText className="text-accent" />
            Control de Órdenes de Trabajo (Diarias)
          </h2>
          <p className="text-tx-secondary text-sm font-medium mt-1">
            Gestión y firma de instrucciones diarias para técnicos operativos.
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus size={18} /> Crear Orden de Trabajo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {ordenesData.map((orden) => (
           <div key={orden.id} className="bg-main border border-bd-lines rounded-2xl p-5 hover:shadow-lg transition-all relative group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-tx-secondary bg-card px-2 py-1 rounded inline-flex w-max items-center gap-1">
                      <Calendar size={12}/> {orden.fecha}
                    </span>
                    <h3 className="text-lg font-bold text-tx-primary flex items-center gap-2">
                      <User size={16} className="text-accent" /> {orden.empleado}
                    </h3>
                  </div>

                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-max",
                    orden.estado === 'Finalizado' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                    "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  )}>
                    {orden.estado}
                    {orden.leida && orden.estado !== 'Finalizado' && <span title={`Leída: ${orden.fechaLeida}`}><CheckCheck size={14} /></span>}
                  </span>
                </div>

                <div className="flex gap-2 mb-3">
                   <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-widest", 
                      orden.prioridad === 'Alta' || orden.prioridad === 'Urgente' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      orden.prioridad === 'Media' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                      'bg-green-500/10 text-green-500 border-green-500/20'
                   )}>
                      PRIORIDAD: {orden.prioridad || 'Media'}
                   </span>
                   <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase tracking-widest">
                      {orden.tipoTarea || 'Obra'}
                   </span>
                </div>

                <div className="bg-card p-3 rounded-xl border border-bd-lines border-dashed mb-4">
                  <p className="text-sm text-tx-secondary font-medium uppercase text-[10px] tracking-wider mb-1 text-accent">Obra asignada:</p>
                  <p className="text-sm text-tx-primary font-bold">{orden.proyectoNombre}</p>
                </div>
                
                {orden.adjuntoUrl && (
                  <a href={orden.adjuntoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent font-bold text-sm px-3 py-2.5 rounded-xl mb-4 hover:bg-accent hover:text-white transition-colors">
                     <ImageIcon size={16}/> Ver Plano / Croquis Adjunto
                  </a>
                )}

                <div className="mb-6 bg-card dark:bg-slate-900 border border-bd-lines p-3 rounded-xl flex flex-col max-h-[140px] overflow-hidden">
                   <p className="text-[10px] font-bold text-tx-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                     <CheckCircle size={12} className="text-accent" /> Tareas a realizar
                   </p>
                   <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                     {orden.instrucciones.split('\n').map((line: string, i: number) => line.trim() ? (
                        <div key={i} className="flex items-start gap-2 text-sm text-tx-primary font-medium">
                          <div className="mt-1 min-w-[14px] h-[14px] w-[14px] rounded border border-accent flex-shrink-0 bg-card transition-colors"></div>
                          <span className="leading-snug">{line.trim()}</span>
                        </div>
                     ) : null)}
                   </div>
                   {orden.materialesPrevistos && orden.materialesPrevistos.length > 0 && (
                     <p className="text-[11px] font-bold text-tx-secondary flex items-center gap-1 mt-3 pt-3 border-t border-bd-lines/50">
                       <Package size={14} className="text-accent"/> +{orden.materialesPrevistos.length} insumos requeridos
                     </p>
                   )}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4 border-bd-lines mt-2">
                 {orden.estado !== 'Finalizado' ? (
                   !orden.leida ? (
                     <button
                       onClick={() => handleMarcarLeida(orden)}
                       className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white flex justify-center items-center gap-2 font-bold text-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-lg transition animate-pulse"
                     >
                       <CheckCheck size={16} /> Acuse de Recibo
                     </button>
                   ) : (
                     <button
                       onClick={() => handleOpenSign(orden)}
                       className="flex-1 py-2.5 rounded-xl bg-accent text-white flex justify-center items-center gap-2 font-bold text-sm shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition"
                     >
                       <CheckCircle size={16} /> Completar y Firmar
                     </button>
                   )
                 ) : (
                   <div className="flex-1 flex gap-2">
                     <button
                       onClick={() => handleExportPDF(orden)}
                       className="flex-1 py-3 rounded-xl bg-card border border-bd-lines text-tx-primary hover:text-accent hover:border-accent flex justify-center items-center gap-2 font-bold text-sm transition"
                     >
                       <Download size={16} /> Ver PDF
                     </button>
                     <button
                       onClick={() => handleShareWhatsApp(orden)}
                       className="py-3 px-4 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition flex justify-center items-center font-bold text-sm shadow-sm"
                       title="Compartir por WhatsApp"
                     >
                       <Send size={16} className="mr-2" /> WhatsApp
                     </button>
                   </div>
                 )}
                 {isAdmin && (
                   <button
                     onClick={() => { if(window.confirm('¿Eliminar orden?')) removeOrden(orden.id); }}
                     className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"
                   >
                     <Trash2 size={16} />
                   </button>
                 )}
              </div>
           </div>
         ))}

         {ordenesData.length === 0 && (
           <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-bd-lines dashed">
              <FileText size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-tx-secondary font-medium">Aún no se crearon Órdenes de Trabajo.</p>
           </div>
         )}
      </div>

      {/* MODAL CREAR ORDEN */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Orden Diaria" className="max-w-2xl">
        <form onSubmit={handleCreateOrden} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-bold text-tx-secondary mb-1">Técnico / Empleado asignado</label>
               <select 
                 value={newEmpleado} 
                 onChange={e => {
                   const empName = e.target.value;
                   setNewEmpleado(empName);
                   
                   // Si el empleado ya tiene una "Obra" (location) asignada en su perfil, tratar de mapearla con los proyectos
                   const emp = personalData.find(p => p.name === empName);
                   if (emp && emp.location && emp.location !== 'Base') {
                     const matchedProject = proyectosData.find(p => 
                       p.name.toLowerCase().includes(emp.location.toLowerCase()) || 
                       emp.location.toLowerCase().includes(p.name.toLowerCase())
                     );
                     if (matchedProject) {
                       setNewClienteProyecto(matchedProject.cliente || 'Sin Cliente Asociado');
                       setNewProyectoPadre(matchedProject.proyectoPadre || 'Proyecto Principal');
                       setNewProyectoId(matchedProject.name); // Usamos el nombre para el datalist 
                       setSelectedItems([]);
                     }
                   }
                 }}
                 className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all" 
                 required
               >
                 <option value="">Selecciona un empleado...</option>
                 {personalData.map(p => (
                   <option key={p.id} value={p.name}>{p.name} ({p.role})</option>
                 ))}
                 <option value="Técnico Externo">Otro Técnico Externo</option>
               </select>
             </div>
             <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-tx-secondary mb-1">Cliente / Cuenta</label>
                  <input 
                    list="clientesList"
                    value={newClienteProyecto} 
                    onChange={e => {
                      const val = e.target.value;
                      setNewClienteProyecto(val);
                      
                      const matches = proyectosData.filter(p => (p.cliente || 'Sin Cliente Asociado').toLowerCase() === val.toLowerCase());
                      if (matches.length > 0) {
                         // Auto-rellenar si hay 1 solo Proyecto Base
                         const padres = Array.from(new Set(matches.map(p => p.proyectoPadre || 'Proyecto Principal')));
                         if (padres.length === 1) {
                           setNewProyectoPadre(padres[0] as string);
                           // Auto-rellenar si hay 1 sola Obra
                           if (matches.length === 1) {
                             setNewProyectoId(matches[0].name);
                           } else {
                             setNewProyectoId('');
                           }
                         } else {
                           setNewProyectoPadre('');
                           setNewProyectoId('');
                         }
                      } else {
                         setNewProyectoPadre('');
                         setNewProyectoId('');
                      }
                      setSelectedItems([]);
                    }}
                    placeholder="Escribe o selecciona cliente..."
                    className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all" 
                    required
                  />
                  <datalist id="clientesList">
                    {Array.from(new Set([
                      ...proyectosData.map(p => p.cliente || 'Sin Cliente Asociado'),
                      ...clientesData.map(c => c.name || '')
                    ])).filter(Boolean).sort().map(cli => (
                      <option key={cli} value={cli as string} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-bold text-tx-secondary mb-1">Proyecto Asignado <span className="font-normal text-xs ml-1">(ej. Nombre de la Finca o Casa)</span></label>
                  <input 
                    list="proyectosPadreList"
                    value={newProyectoPadre} 
                    onChange={e => {
                      setNewProyectoPadre(e.target.value);
                      setNewProyectoId('');
                      setSelectedItems([]);
                    }}
                    placeholder={newClienteProyecto ? 'Selecciona o escribe nuevo proyecto...' : 'Selecciona un cliente arriba'}
                    className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all disabled:opacity-50" 
                    required
                    disabled={!newClienteProyecto}
                  />
                  <datalist id="proyectosPadreList">
                    {Array.from(new Set(
                        proyectosData
                        .filter(p => (p.cliente || 'Sin Cliente Asociado').toLowerCase() === newClienteProyecto.toLowerCase())
                        .map(p => p.proyectoPadre || 'Proyecto Principal')
                    )).sort().map(pPadre => (
                      <option key={pPadre as string} value={pPadre as string} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-bold text-tx-secondary mb-1">Obra / Tarea Específica <span className="font-normal text-xs ml-1">(Remito/PDF)</span></label>
                  <input 
                    list="obrasList"
                    value={newProyectoId} 
                    onChange={e => {
                      setNewProyectoId(e.target.value);
                      setSelectedItems([]); // reset items if project changes
                    }}
                    placeholder={newProyectoPadre ? 'Escribe o selecciona obra...' : 'Escribe nombre de tarea...'}
                    className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all" 
                    required
                  />
                  <datalist id="obrasList">
                    {proyectosData
                      .filter(p => (p.cliente || 'Sin Cliente Asociado').toLowerCase() === newClienteProyecto.toLowerCase())
                      .filter(p => (p.proyectoPadre || 'Proyecto Principal').toLowerCase() === (newProyectoPadre || 'Proyecto Principal').toLowerCase())
                      .map(p => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
              <div>
                 <label className="block text-sm font-bold text-tx-secondary mb-1">Prioridad Geográfica</label>
                 <select value={newPrioridad} onChange={e => setNewPrioridad(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all">
                    <option value="Baja">🟢 Baja (Flexible)</option>
                    <option value="Media">🟠 Media (Esperada)</option>
                    <option value="Alta">🔴 Alta (Urgente hoy)</option>
                    <option value="Urgente">🆘 CRÍTICA (Inmediata)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-bold text-tx-secondary mb-1">Plantilla Rápida</label>
                 <select value={newTipoTarea} onChange={e => {
                    setNewTipoTarea(e.target.value);
                    if (newInstrucciones.trim() === '') {
                      if (e.target.value === 'Reparación') setNewInstrucciones('1. Localizar la fuga.\n2. Cortar válvula principal y desagotar.\n3. Reemplazar pieza dañada.\n4. Prueba hidráulica funcional.');
                      if (e.target.value === 'Mantenimiento') setNewInstrucciones('1. Limpiar todos los filtros primarios.\n2. Purgar finales de línea (Flush).\n3. Revisar aspersores tapados según indicaciones.');
                      if (e.target.value === 'Instalación') setNewInstrucciones('1. Zanjeo a profundidad según plano adjunto.\n2. Tendido de cañería y pegado de transiciones.\n3. Tapado y pre-prueba de presión.');
                    }
                 }} className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all">
                    <option value="">Selecciona plantilla...</option>
                    <option value="Instalación">Instalación (Obra Nueva)</option>
                    <option value="Mantenimiento">Mantenimiento Preventivo</option>
                    <option value="Reparación">Reparación de Fugas</option>
                    <option value="Relevamiento">Relevamiento / Diagnóstico</option>
                 </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-tx-secondary mb-2">Instrucciones del día</label>
             <textarea 
               value={newInstrucciones}
               onChange={e => setNewInstrucciones(e.target.value)}
               placeholder="Describe qué trabajo debe hacerse, prioridades, precauciones, etc..."
               className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-4 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all custom-scrollbar resize-y min-h-[120px]"
               rows={4}
               required
             />
           </div>

           <div className="mt-4">
             <label className="block text-sm font-bold text-tx-secondary mb-2">Adjuntar Plano o Captura Visual (Opcional)</label>
             <div className="border-2 border-dashed border-bd-lines p-4 rounded-xl text-center bg-card hover:bg-main relative transition-all flex flex-col items-center justify-center min-h-[80px]">
                {isUploadingAdjunto ? (
                   <span className="text-sm font-bold text-tx-secondary animate-pulse">Subiendo documento seguro, espere...</span>
                ) : newAdjuntoUrl ? (
                   <div className="flex flex-col items-center">
                     <span className="text-sm font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={16}/> Documento adjuntado exitosamente en la nube</span>
                     <button type="button" onClick={() => setNewAdjuntoUrl('')} className="mt-2 text-xs text-red-500 hover:text-red-400 font-bold underline">Quitar adjunto</button>
                   </div>
                ) : (
                   <>
                     <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     <div className="pointer-events-none flex flex-col items-center">
                        <ImageIcon className="text-tx-secondary mb-1" size={20}/>
                        <span className="text-xs font-bold text-accent">Arrastra tu croquis o tócá para subir imagen/PDF</span>
                     </div>
                   </>
                )}
             </div>
           </div>

           {/* Material Selector from Project */}
           {newProyectoId && proyectosData.find(p => p.id === newProyectoId || p.name === newProyectoId)?.items && (
             <div className="bg-main p-4 rounded-xl border border-bd-lines">
               <label className="block text-sm font-bold text-tx-primary mb-2 flex items-center gap-2">
                 <Package size={16} className="text-accent" />
                 Ligar y provisionar materiales al técnico
               </label>
               <p className="text-xs text-tx-secondary mb-3">Estos materiales se descontarán del inventario del proyecto una vez que el empleado reciba y firme el acta de conformidad al terminar el trabajo.</p>
               
               <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                 {proyectosData.find(p => p.id === newProyectoId || p.name === newProyectoId)?.items?.map((it: any) => {
                    const isSelected = !!selectedItems.find(s => s.id === it.id);
                    return (
                      <div key={it.id} className="flex items-center gap-3 bg-card p-2 rounded-lg border border-bd-lines">
                        <input type="checkbox" checked={isSelected} onChange={() => handleToggleMaterialOrder(it)} className="w-4 h-4 text-accent bg-transparent rounded" />
                        <span className="flex-1 text-sm font-medium">{it.desc}</span>
                        {isSelected && (
                           <input type="number" 
                             className="w-20 rounded-lg border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-2 py-1 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-medium shadow-sm transition-all" min={1} max={it.cant || 999} 
                             value={selectedItems.find(s => s.id === it.id)?.cant || 1}
                             onChange={e => setSelectedItems(selectedItems.map(s => s.id === it.id ? {...s, cant: Number(e.target.value)} : s))}
                           />
                        )}
                        <span className="text-xs text-tx-secondary w-16 text-right">Stock: {it.cant}</span>
                      </div>
                    )
                 })}
               </div>
             </div>
           )}

           <div className="flex gap-4 pt-4 border-t border-bd-lines mt-6">
             <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-main px-4 py-3 text-sm font-bold text-gray-700 dark:text-tx-primary hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">Cancelar</button>
             <button type="submit" className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent/90 transition-colors shadow-md shadow-accent/20">Crear y Asignar Orden</button>
           </div>
        </form>
      </Modal>

      {/* MODAL COMPLETAR Y FIRMAR */}
      <Modal isOpen={isSignModalOpen} onClose={() => setIsSignModalOpen(false)} title="Completar Trabajos" className="max-w-xl">
        {selectedOrden && (
          <div className="space-y-5">
             <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-500 flex items-start gap-3">
               <AlertTriangle className="shrink-0" size={24}/>
               <p className="text-sm">Al confirmar y firmar esta orden, dejarás constancia de tu labor, y todo el material estipulado <strong>({selectedOrden.materialesPrevistos?.length || 0} ítems)</strong> será descontado del stock oficialmente.</p>
             </div>

             <div>
               <label className="block text-sm font-bold text-tx-secondary mb-2">Tus Anotaciones (Reporte)</label>
               <textarea 
                 value={anotacionesEmpleado}
                 onChange={e => setAnotacionesEmpleado(e.target.value)}
                 className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-4 py-3 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 font-medium shadow-sm transition-all custom-scrollbar resize-y min-h-[100px]"
                 placeholder="Ej: Terminé la zona 2. Faltó tiempo para limpiar herramientas."
                 rows={3}
                 required
               />
             </div>

             <div>
                <label className="block text-sm font-medium text-tx-secondary mb-1 flex justify-between">
                  <span>Dibuja tu firma digitalizada en el recuadro</span>
                  <button type="button" onClick={clearSignature} className="text-xs text-accent hover:underline flex items-center gap-1">
                    <Trash2 size={12}/> Limpiar
                  </button>
                </label>
                <div className="bg-white rounded-xl overflow-hidden border-2 border-dashed border-slate-300">
                  <canvas 
                    ref={canvasRef} 
                    width={500} 
                    height={200}
                    className="w-full h-[200px] cursor-crosshair touch-none"
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleEndDraw}
                    onMouseLeave={handleEndDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDraw}
                    onTouchEnd={handleEndDraw}
                  />
                </div>
             </div>

             <div className="flex gap-4 pt-4 border-t border-bd-lines mt-6">
               <button type="button" onClick={() => setIsSignModalOpen(false)} className="flex-1 rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-main px-4 py-3 text-sm font-bold text-gray-700 dark:text-tx-primary hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">Volver</button>
               <button type="button" onClick={handleCompleteAndDiscount} className="flex-[2] rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent/90 transition-colors shadow-md shadow-accent/20 flex items-center justify-center gap-2">
                 <CheckCircle size={18} /> Firmar y Descontar Materiales
               </button>
             </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
