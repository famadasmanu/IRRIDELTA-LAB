import React, { useState } from 'react';
import { Modal } from './Modal';
import { Check, Trash2, Box, Droplet, FileText } from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

export function ModalVisitaRapida({ isOpen, onClose, client }: { isOpen: boolean, onClose: () => void, client: any }) {
    const { data: aditivosData, update: updateAditivo } = useFirestoreCollection<any>('inventario_aditivos');
    const { data: materialesData, update: updateMaterial } = useFirestoreCollection<any>('inventario_generales');
    const { data: portfolioData, update: updatePortfolioInDB } = useFirestoreCollection<any>('trabajos_portfolio');
    const { data: personalData } = useFirestoreCollection<any>('personalData');
    const { data: archivoNodos, add: addArchivoNode } = useFirestoreCollection<any>('archivo_nodos');

    const [protocolo, setProtocolo] = useState('');
    const [notas, setNotas] = useState('');
    const [encargado, setEncargado] = useState('');
    const [insumosUsados, setInsumosUsados] = useState<any[]>([]);
    const [isSelectingInsumo, setIsSelectingInsumo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!client) return null;

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
            costoUnitario: item.precioCompra || 0 
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
        setIsSubmitting(true);

        try {
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
                protocolo: protocolo || 'Visita Express',
                notas,
                encargado: encargado || 'No especificado',
                insumosUsados: insumosFinales,
                costoTotalInsumos: totalCostoInsumos
            };

            // 2. Descontar del inventario real!
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

            // 3. Vincular al Proyecto de Trabajo si existe para analíticas
            // Intentamos encontrar el proyecto asociado a este cliente
            const proyectoAsociado = portfolioData.find((p:any) => p.clienteId === client.id || p.cliente === client.name);
            
            if (proyectoAsociado) {
                const ordenesActuales = proyectoAsociado.ordenesTrabajo || [];
                await updatePortfolioInDB(proyectoAsociado.id, { 
                    ordenesTrabajo: [...ordenesActuales, newOrden] 
                });
            }

            // 4. Guardar copia en el HUB CENTRAL DE ARCHIVOS (Archivo.tsx)
            if (addArchivoNode) {
                const ordenesFolder = archivoNodos?.find((n:any) => n.name === 'Órdenes de Trabajo' && n.type === 'folder');
                await addArchivoNode({
                    name: `Protocolo Mantenimiento: ${client.name} - ${new Date().toLocaleDateString()}`,
                    type: 'file',
                    fileType: 'pdf', 
                    size: 15420, // size sim
                    uploadDate: Date.now(),
                    parentId: ordenesFolder ? ordenesFolder.id : 'root',
                });
            }

            setProtocolo('');
            setNotas('');
            setInsumosUsados([]);
            onClose();
            // Ir al Hub
            window.location.hash = '#archivo';

        } catch (error) {
            console.error(error);
            alert("Hubo un error al guardar la orden de trabajo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendWhatsApp = () => {
        let msg = `*🛠 PROTOCOLO DIARIO DE MANTENIMIENTO*\n`;
        msg += `*Cliente:* ${client?.name || 'No especificado'}\n`;
        msg += `*Actividad / Protocolo:* ${protocolo || 'Visita Estándar'}\n`;
        msg += `*Técnico / Encargado:* ${encargado || 'A definir'}\n`;
        if (insumosUsados.length > 0) {
            msg += `\n*Insumos a retirar del Inventario:*\n`;
            insumosUsados.forEach(i => {
               msg += `- ${i.cantidadUsada} ${i.unidad} • ${i.nombre}\n`;
            });
        }
        if (notas) {
            msg += `\n*Observaciones:* ${notas}\n`;
        }
        msg += `\n⚠️ *El técnico firmante debe responder "ENTERADO" al ver este mensaje para acusar recibo oficial.*`;
        
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Visita: ${client.name}`}>
            <form onSubmit={handleSubmitOrden} className="space-y-4 px-1 pb-2">
                
                <div className="bg-violet-50 dark:bg-violet-900/10 p-3 rounded-xl border border-violet-200 dark:border-violet-800/30 mb-2">
                    <p className="text-violet-600/80 dark:text-violet-400 text-xs font-bold">Modo Rápido: Los insumos descontados aquí se verán reflejados globalmente y en las estadísticas de {client.name}.</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-tx-secondary tracking-wide mb-1">Actividad Realizada</label>
                    <input 
                        required 
                        type="text" 
                        placeholder="Ej: Control Químico" 
                        value={protocolo} 
                        onChange={e => setProtocolo(e.target.value)} 
                        className="w-full px-3 py-2.5 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-violet-500/50 outline-none transition-all shadow-sm" 
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-tx-secondary tracking-wide mb-1">Técnico / Encargado</label>
                    <select 
                        required 
                        value={encargado} 
                        onChange={e => setEncargado(e.target.value)} 
                        className="w-full px-3 py-2 border border-bd-lines rounded-xl bg-card font-semibold text-tx-primary focus:ring-2 focus:ring-violet-500/50 outline-none transition-all shadow-sm"
                    >
                        <option value="" disabled>Seleccione personal...</option>
                        {personalData.map((p: any) => (
                            <option key={p.id} value={p.name}>{p.name} ({p.role || 'Personal'})</option>
                        ))}
                    </select>
                </div>
                
                <div className="border-t border-bd-lines pt-3">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-tx-secondary tracking-wide">Insumos a Descontar</label>
                        <button type="button" onClick={() => setIsSelectingInsumo(true)} className="text-[10px] bg-main hover:bg-slate-200 border border-bd-lines text-tx-primary px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm">
                            + Agregar Químico
                        </button>
                    </div>
                    
                    {isSelectingInsumo && (
                        <div className="bg-main p-3 rounded-xl border border-bd-lines mb-3 max-h-52 overflow-y-auto">
                            <p className="text-[10px] font-bold text-tx-secondary mb-1 uppercase tracking-wide">Aditivos Químicos:</p>
                            <div className="space-y-1">
                                {aditivosData.filter((a:any) => a.cantidad > 0).map((aditivo: any) => (
                                    <div key={aditivo.id} onClick={() => handleAddInsumo(aditivo, false)} className="flex justify-between items-center p-2 hover:bg-card rounded-lg cursor-pointer transition-colors border border-transparent hover:border-bd-lines">
                                        <span className="text-xs font-bold text-tx-primary">{aditivo.nombre} <span className="text-[10px] text-tx-secondary ml-1">(Hay {aditivo.cantidad} {aditivo.unidad})</span></span>
                                        <span className="text-[10px] text-violet-500 font-bold">Sumar</span>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => setIsSelectingInsumo(false)} className="w-full mt-2 py-1 text-[10px] text-tx-secondary hover:text-tx-primary font-bold">Cerrar Selección</button>
                        </div>
                    )}

                    <div className="space-y-2">
                        {insumosUsados.length === 0 ? (
                            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-bd-lines text-[10px] font-medium text-tx-secondary">
                                Ningún insumo añadido (Solo registro de visita).
                            </div>
                        ) : (
                            insumosUsados.map((ins, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-card px-2 py-2 rounded-xl border border-bd-lines shadow-sm">
                                    <div className="flex-1">
                                        <span className="text-xs font-bold text-tx-primary block">{ins.nombre}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            min="0.1"
                                            max={ins.cantidadDisponible}
                                            value={ins.cantidadUsada}
                                            onChange={(e) => handleUpdateUsada(idx, e.target.value)}
                                            className="w-14 px-1 py-1 text-xs border border-bd-lines rounded-md text-center font-bold focus:border-violet-500 outline-none"
                                        />
                                        <span className="text-[10px] font-bold text-tx-secondary w-6">{ins.unidad}</span>
                                        <button type="button" onClick={() => handleRemoveInsumo(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-tx-secondary tracking-wide mb-1 mt-2">Observaciones breves</label>
                    <input 
                        type="text" 
                        placeholder="Ej: Agua en buen estado..." 
                        value={notas} 
                        onChange={e => setNotas(e.target.value)} 
                        className="w-full px-3 py-2 border border-bd-lines rounded-xl bg-card text-xs font-medium text-tx-primary focus:ring-2 focus:ring-violet-500/50 outline-none" 
                    />
                </div>

                <div className="pt-4 flex justify-between items-center mt-2 border-t border-bd-lines">
                    <button type="button" onClick={handleSendWhatsApp} className="px-4 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-[#25D366]/20 shadow-[0_0_10px_rgba(37,211,102,0.1)]">
                        Enviar x WhatsApp
                    </button>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-tx-secondary hover:bg-main rounded-xl font-bold transition-all" disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-500 shadow-md shadow-violet-500/30 transition-all flex items-center gap-2">
                            {isSubmitting ? 'Procesando...' : <><Check size={16} /> Emitir al Hub</>}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
