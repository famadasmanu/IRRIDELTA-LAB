import React, { useState } from 'react';
import { FileText, Plus, Check, MapPin, Calendar, Trash2, Box, Droplet, CheckSquare } from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { Modal } from '../../components/Modal';

export function OrdenesTab({ selectedTrabajo, updatePortfolioInDB, setSelectedTrabajo }: any) {
    const { data: aditivosData, update: updateAditivo } = useFirestoreCollection<any>('inventario_aditivos');
    const { data: materialesData, update: updateMaterial } = useFirestoreCollection<any>('inventario_generales');
    const { data: archivoNodos, add: addArchivoNode } = useFirestoreCollection<any>('archivo_nodos');

    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Formulario de Nueva Orden
    const [protocolo, setProtocolo] = useState('');
    const [notas, setNotas] = useState('');
    const [insumosUsados, setInsumosUsados] = useState<any[]>([]);

    const [isSelectingInsumo, setIsSelectingInsumo] = useState(false);
    
    const ordenes = selectedTrabajo.ordenesTrabajo || [];

    const handleAddInsumo = (item: any, isMaterial: boolean = false) => {
        const alreadyExists = insumosUsados.find(i => i.id === item.id && i.isMaterial === isMaterial);
        if (alreadyExists) return;

        setInsumosUsados([...insumosUsados, {
            id: item.id,
            nombre: item.nombre,
            unidad: item.unidad || 'Unid',
            cantidadDisponible: item.cantidad || 0,
            cantidadUsada: 1,
            isMaterial,
            costoUnitario: item.precioCompra || 0 // Assuming cost exists or will be added
        }]);
        setIsSelectingInsumo(false);
    };

    const handleUpdateUsada = (index: number, quantity: string) => {
        const val = Number(quantity);
        const newArr = [...insumosUsados];
        newArr[index].cantidadUsada = val;
        setInsumosUsados(newArr);
    };

    const handleRemoveInsumo = (index: number) => {
        const newArr = [...insumosUsados];
        newArr.splice(index, 1);
        setInsumosUsados(newArr);
    };

    const handleSubmitOrden = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Calculate costs and structure the order
        let totalCostoInsumos = 0;
        
        const insumosFinales = insumosUsados.map(i => {
           const costo = i.cantidadUsada * i.costoUnitario;
           totalCostoInsumos += costo;
           return {
               id: i.id,
               nombre: i.nombre,
               cantidadUsada: i.cantidadUsada,
               unidad: i.unidad,
               costoAproximado: costo,
               isMaterial: i.isMaterial
           };
        });

        const newOrden = {
            id: Date.now().toString(),
            fecha: new Date().toISOString(),
            protocolo: protocolo || 'Mantenimiento General',
            notas,
            insumosUsados: insumosFinales,
            costoTotalInsumos: totalCostoInsumos
        };

        const updatedTrabajo = {
            ...selectedTrabajo,
            ordenesTrabajo: [...ordenes, newOrden]
        };

        // 2. Descontar del inventario real!
        try {
            for (const insumo of insumosUsados) {
                if (insumo.cantidadUsada > 0) {
                    if (insumo.isMaterial) {
                        const original = materialesData.find((m:any) => m.id === insumo.id);
                        if (original) {
                            await updateMaterial(insumo.id, { cantidad: Math.max(0, original.cantidad - insumo.cantidadUsada) });
                        }
                    } else {
                        const original = aditivosData.find((a:any) => a.id === insumo.id);
                        if (original) {
                            await updateAditivo(insumo.id, { cantidad: Math.max(0, original.cantidad - insumo.cantidadUsada) });
                        }
                    }
                }
            }

            // 3. Update the Work Project
            await updatePortfolioInDB(selectedTrabajo.id, { ordenesTrabajo: updatedTrabajo.ordenesTrabajo });
            
            // 4. Sink to Archivo
            if (addArchivoNode) {
                const ordenesFolder = archivoNodos?.find((n:any) => n.name === 'Órdenes de Trabajo' && n.type === 'folder');
                await addArchivoNode({
                    name: `Orden de Riego/Avance: ${selectedTrabajo.cliente || 'Obra'} - ${new Date().toLocaleDateString()}`,
                    type: 'file',
                    fileType: 'pdf', 
                    size: 15420, // size sim
                    uploadDate: Date.now(),
                    parentId: ordenesFolder ? ordenesFolder.id : 'root',
                });
            }

            setSelectedTrabajo(updatedTrabajo);

            setIsModalOpen(false);
            setProtocolo('');
            setNotas('');
            setInsumosUsados([]);
            
            window.location.hash = '#archivo';

        } catch (error) {
            console.error(error);
            alert("Hubo un error al guardar la orden de trabajo");
        }
    };

    const handleSendWhatsApp = () => {
        let msg = `*🛠 ORDEN DE TRABAJO EN OBRA*\n`;
        msg += `*Proyecto:* ${selectedTrabajo?.name || 'No especificado'}\n`;
        msg += `*Cliente:* ${selectedTrabajo?.cliente || 'No especificado'}\n`;
        msg += `*Instrucción:* ${protocolo || 'Avance General'}\n`;
        if (insumosUsados.length > 0) {
            msg += `\n*Materiales de Pañol Requeridos:*\n`;
            insumosUsados.forEach((i: any) => {
               msg += `- ${i.cantidadUsada} ${i.unidad} • ${i.nombre}\n`;
            });
        }
        if (notas) {
            msg += `\n*Observaciones:* ${notas}\n`;
        }
        msg += `\n⚠️ *El jefe de obra o personal asignado debe responder "ENTERADO" al recibir esta directiva.*`;
        
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-tx-primary flex items-center gap-2">
                    <CheckSquare size={20} className="text-accent" />
                    Órdenes de Trabajo & Mantenimiento
                </h2>
                <button onClick={() => setIsModalOpen(true)} className="text-sm bg-accent text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#15803d] shadow-md transition-colors flex items-center gap-2">
                    <Plus size={16} /> Crear Orden Visita
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {ordenes.length === 0 ? (
                    <div className="text-center py-10 bg-main rounded-2xl border border-bd-lines border-dashed">
                        <FileText className="mx-auto text-tx-secondary opacity-50 mb-3" size={32} />
                        <p className="text-tx-primary font-bold">No hay órdenes de mantenimiento</p>
                        <p className="text-sm text-tx-secondary mt-1">Registra la primera visita para descontar insumos.</p>
                    </div>
                ) : (
                    ordenes.slice().reverse().map((orden: any) => (
                        <div key={orden.id} className="bg-card p-5 rounded-2xl shadow-sm border border-bd-lines">
                            <div className="flex justify-between items-start mb-3 border-b border-bd-lines pb-3">
                                <div>
                                    <h3 className="font-black text-tx-primary text-lg">{orden.protocolo}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-tx-secondary text-xs font-bold uppercase tracking-wider">
                                        <Calendar size={14} />
                                        {new Date(orden.fecha).toLocaleDateString()} a las {new Date(orden.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <div className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs">
                                    Costo: ${orden.costoTotalInsumos?.toLocaleString('es-AR') || 0}
                                </div>
                            </div>

                            {orden.notas && (
                                <p className="text-tx-secondary text-sm italic mb-4">"{orden.notas}"</p>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-tx-secondary uppercase tracking-widest mb-2">Insumos Utilizados</h4>
                                {orden.insumosUsados && orden.insumosUsados.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {orden.insumosUsados.map((ins: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center bg-main px-3 py-2 rounded-lg border border-bd-lines text-sm font-medium text-tx-primary">
                                                <div className="flex items-center gap-2">
                                                    {ins.isMaterial ? <Box size={14} className="text-amber-500"/> : <Droplet size={14} className="text-blue-500" />}
                                                    {ins.nombre}
                                                </div>
                                                <span className="font-black text-accent">{ins.cantidadUsada} {ins.unidad}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-tx-secondary">Ningún insumo seleccionado.</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Nueva Orden */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Orden de Mantenimiento">
                <form onSubmit={handleSubmitOrden} className="space-y-5 px-1 pb-4">
                    
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30">
                        <h4 className="text-blue-700 dark:text-blue-400 font-bold text-sm mb-1">Dosificación Inteligente</h4>
                        <p className="text-blue-600/80 dark:text-blue-400/80 text-xs font-medium">Los químicos e insumos que agregues aquí serán descontados automáticamente de tu inventario general.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-tx-secondary tracking-wide mb-2">Protocolo Aplicado / Tarea</label>
                        <input 
                            required 
                            type="text" 
                            placeholder="Ej: Aspirado de fondo y shock de cloro" 
                            value={protocolo} 
                            onChange={e => setProtocolo(e.target.value)} 
                            className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all shadow-sm" 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-tx-secondary tracking-wide mb-2">Comentarios Adicionales (Opcional)</label>
                        <textarea 
                            rows={2}
                            placeholder="Agua turbia, se requiere revisar filtro próximo mes..." 
                            value={notas} 
                            onChange={e => setNotas(e.target.value)} 
                            className="w-full px-4 py-3 border border-bd-lines rounded-xl bg-card text-sm font-medium text-tx-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all" 
                        />
                    </div>

                    <div className="border-t border-bd-lines pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-bold text-tx-secondary tracking-wide">Desglose de Materiales Usados</label>
                            <button type="button" onClick={() => setIsSelectingInsumo(true)} className="text-xs bg-main hover:bg-slate-200 border border-bd-lines text-tx-primary px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm">
                                + Químico / Insumo
                            </button>
                        </div>
                        
                        {isSelectingInsumo && (
                            <div className="bg-main p-4 rounded-xl border border-bd-lines mb-4 max-h-60 overflow-y-auto">
                                <p className="text-xs font-bold text-tx-secondary mb-2 uppercase tracking-wide">Selecciona Insumo a descontar (Aditivos):</p>
                                <div className="space-y-2">
                                    {aditivosData.filter((a:any) => a.cantidad > 0).map((aditivo: any) => (
                                        <div key={aditivo.id} onClick={() => handleAddInsumo(aditivo, false)} className="flex justify-between items-center p-2 hover:bg-card rounded-lg cursor-pointer transition-colors border border-transparent hover:border-bd-lines">
                                            <span className="text-sm font-bold text-tx-primary">{aditivo.nombre} <span className="text-xs text-tx-secondary ml-1">(Stock: {aditivo.cantidad} {aditivo.unidad})</span></span>
                                            <span className="text-xs text-accent font-bold">Añadir</span>
                                        </div>
                                    ))}
                                    {aditivosData.length === 0 && <span className="text-xs text-tx-secondary">No hay aditivos disponibles.</span>}
                                </div>
                                <hr className="my-3 border-bd-lines" />
                                <p className="text-xs font-bold text-tx-secondary mb-2 uppercase tracking-wide">Materiales Generales:</p>
                                <div className="space-y-2">
                                    {materialesData.filter((m:any) => m.cantidad > 0).map((material: any) => (
                                        <div key={material.id} onClick={() => handleAddInsumo(material, true)} className="flex justify-between items-center p-2 hover:bg-card rounded-lg cursor-pointer transition-colors border border-transparent hover:border-bd-lines">
                                            <span className="text-sm font-bold text-tx-primary">{material.nombre} <span className="text-xs text-tx-secondary ml-1">(Stock: {material.cantidad} {material.unidad})</span></span>
                                            <span className="text-xs text-accent font-bold">Añadir</span>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => setIsSelectingInsumo(false)} className="w-full mt-3 py-1.5 text-xs text-tx-secondary hover:text-tx-primary font-bold">Cancelar Selección</button>
                            </div>
                        )}

                        <div className="space-y-2">
                            {insumosUsados.length === 0 ? (
                                <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-bd-lines text-xs font-medium text-tx-secondary">
                                    No se utilizaron insumos extra para este protocolo.
                                </div>
                            ) : (
                                insumosUsados.map((ins, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-card px-3 py-2 rounded-xl border border-bd-lines shadow-sm">
                                        <div className="flex-1">
                                            <span className="text-sm font-bold text-tx-primary block">{ins.nombre}</span>
                                            <span className="text-[10px] text-tx-secondary">Max Disp: {ins.cantidadDisponible} {ins.unidad}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                min="0.1"
                                                max={ins.cantidadDisponible}
                                                value={ins.cantidadUsada}
                                                onChange={(e) => handleUpdateUsada(idx, e.target.value)}
                                                className="w-20 px-2 py-1 text-sm border border-bd-lines rounded-lg text-center font-bold focus:border-accent outline-none"
                                            />
                                            <span className="text-xs font-bold text-tx-secondary w-8">{ins.unidad}</span>
                                            <button type="button" onClick={() => handleRemoveInsumo(idx)} className="text-red-400 hover:text-red-600 p-1 bg-main rounded-md"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center sticky bottom-0 bg-card py-4 border-t border-bd-lines mt-6">
                        <button type="button" onClick={handleSendWhatsApp} className="px-4 py-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-[#25D366]/20 shadow-[0_0_10px_rgba(37,211,102,0.1)]">
                            Enviar x WhatsApp
                        </button>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-tx-secondary hover:bg-main rounded-xl font-bold transition-all">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-[#15803d] shadow-lg shadow-accent/20 transition-all flex items-center gap-2">
                                <Check size={18} /> Expedir al Hub
                            </button>
                        </div>
                    </div>

                </form>
            </Modal>

        </div>
    );
}
