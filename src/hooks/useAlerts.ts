import { useState, useEffect, useMemo } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';

export function useAlerts() {
  const { data: alertasRaw, add: addAlertaToDB, remove: removeAlertaFromDB, update: updateAlertaInDB } = useFirestoreCollection<any>('alertas');
  const { data: maquinarias } = useFirestoreCollection<any>('inventario_maquinas');
  const { data: aditivos } = useFirestoreCollection<any>('inventario_aditivos');
  const { data: generales } = useFirestoreCollection<any>('inventario_generales');
  const { data: clientesData } = useFirestoreCollection<any>('clientes');

  const [localDismissed, setLocalDismissed] = useState<string[]>([]);
  const [localResolved, setLocalResolved] = useState<string[]>([]);

  useEffect(() => {
    const fetchLocalAlertStates = () => {
      try {
        const d = JSON.parse(localStorage.getItem('alertasDismissed') || '[]');
        const r = JSON.parse(localStorage.getItem('alertasResolved') || '[]');
        setLocalDismissed(Array.isArray(d) ? d : []);
        setLocalResolved(Array.isArray(r) ? r : []);
      } catch (e) {}
    };
    fetchLocalAlertStates();
    window.addEventListener('alertas-local-updated', fetchLocalAlertStates);
    return () => window.removeEventListener('alertas-local-updated', fetchLocalAlertStates);
  }, []);

  const displayAlerts = useMemo(() => {
    const inventoryAlerts: any[] = [];
    const maintenanceAlerts: any[] = [];
    
    // Generador de Leads: Mantenimiento de Invierno
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - 5); // 5 meses de antigüedad
    
    clientesData.forEach((cliente: any) => {
      if (cliente.status === 'FINALIZADO' && cliente.fechaFinalizacion) {
         const finishDate = new Date(cliente.fechaFinalizacion);
         if (finishDate < thresholdDate) {
             const diffMonths = Math.floor((new Date().getTime() - finishDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
             const phoneOnlyDigits = cliente.phone ? cliente.phone.replace(/\D/g, '') : '';
             const whatsappMsg = `Hola ${cliente.name}, ¿cómo estás? Hace ${diffMonths} meses armamos tu riego. Con la llegada de los fríos, tenemos la agenda abierta para hacer el service anti-heladas y el mantenimiento de invierno. ¿Querés que te reservemos un lugar?`;
             
             maintenanceAlerts.push({
               id: `auto-maint-${cliente.id}`,
               tipo: 'evento',
               categoria: 'Mantenimiento',
               nivel: 'atencion',
               titulo: `Service de Invierno: ${cliente.name}`,
               contexto: `La obra fue finalizada en ${cliente.fechaFinalizacion.split('-').reverse().join('/')} (Hace ${diffMonths} meses). Oportunidad de facturar mantenimiento preventivo.`,
               fecha: 'Automático',
               whatsappMsg,
               whatsappPhone: phoneOnlyDigits
             });
         }
      }
    });
   
    aditivos.forEach((ad: any) => {
      let expired = false;
      let rotateAlert = false;
      if (ad.fechaCaducidad) {
        const diffDays = Math.ceil((new Date(ad.fechaCaducidad).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) expired = true;
        else if (diffDays <= 30) rotateAlert = true;
      }

      const isLowStock = ad.cantidad !== undefined && ad.cantidad <= 5;
      const loc = ad.clienteNombre || 'Bodega Central';
      
      if (expired || rotateAlert) {
        const isExpiredStr = expired ? 'Vencido' : 'Próximo a vencer';
        const whatsappMsg = `Hola Argent Software, necesito reposición de [${ad.nombre}] para [${loc}]. Cantidad restante: [${ad.cantidad} ${ad.unidad}]. Motivo: Vencimiento.`;
        inventoryAlerts.push({
          id: `auto-adit-${ad.id}`,
          tipo: 'inventario',
          categoria: 'Aditivos',
          nivel: expired ? 'accion' : 'atencion',
          titulo: `Aditivo ${isExpiredStr}: ${ad.nombre}`,
          contexto: `El producto se encuentra ${isExpiredStr.toLowerCase()}. Ubicación: ${loc}. Cantidad actual: ${ad.cantidad} ${ad.unidad}.`,
          fecha: 'Automático',
          whatsappMsg
        });
      }

      if (isLowStock && !expired && !rotateAlert) {
        const whatsappMsg = `Hola Argent Software, necesito reposición de [${ad.nombre}] para [${loc}]. Cantidad restante: [${ad.cantidad} ${ad.unidad}]`;
        inventoryAlerts.push({
          id: `auto-stock-adit-${ad.id}`,
          tipo: 'inventario',
          categoria: 'Aditivos',
          nivel: 'accion',
          titulo: `Bajo Stock: ${ad.nombre}`,
          contexto: `El producto tiene stock crítico. Ubicación: ${loc}. Cantidad actual: ${ad.cantidad} ${ad.unidad}.`,
          fecha: 'Automático',
          whatsappMsg
        });
      }
    });

    maquinarias.forEach((maq: any) => {
      if (maq.solicitaReparacion) {
        const loc = maq.clienteNombre || 'Bodega Central';
        const whatsappMsg = `Hola Argent Software, necesito pedir urgente presupuesto para reparar equipo [${maq.nombre}] asignado a [${loc}].`;
        inventoryAlerts.push({
          id: `auto-maq-${maq.id}`,
          tipo: 'inventario',
          categoria: 'Maquinarias',
          nivel: 'accion',
          titulo: `Service Urgente: ${maq.nombre}`,
          contexto: `Equipo requiere atención prioritaria. Responsable: ${maq.asignadoA||'N/A'}. Ubicación: ${loc}.`,
          fecha: 'Automático',
          whatsappMsg
        });
      }
    });

    generales.forEach((mat: any) => {
      const isLowStock = mat.cantidad !== undefined && mat.cantidad <= 5;
      if (isLowStock) {
        const loc = mat.clienteNombre || 'Bodega Central';
        const whatsappMsg = `Hola Argent Software, precisamos pedir más insumo: [${mat.nombre}]. Stock actual: [${mat.cantidad} ${mat.unidad}]. Ubicación: [${loc}]`;
        inventoryAlerts.push({
          id: `auto-mat-${mat.id}`,
          tipo: 'inventario',
          categoria: mat.categoriaGeneral || 'Insumos',
          nivel: mat.cantidad <= 2 ? 'accion' : 'atencion',
          titulo: `Stock Bajo: ${mat.nombre}`,
          contexto: `El recurso general está en estado crítico/bajo. Ubicación: ${loc}. Cantidad actual: ${mat.cantidad} ${mat.unidad}.`,
          fecha: 'Automático',
          whatsappMsg
        });
      }
    });

    return [...alertasRaw, ...inventoryAlerts, ...maintenanceAlerts];
  }, [alertasRaw, maquinarias, aditivos, generales, clientesData]);

  // Contabilizar únicamente las notificaciones cuya categoría (nivel) sea "acción" o "atención"
  const unreadCount = displayAlerts.filter((a: any) => {
    const isDismissed = localDismissed.includes(a.id);
    const isResolved = a.resuelta || localResolved.includes(a.id);
    const requiresAction = a.nivel === 'accion' || a.nivel === 'atencion';
    return !isDismissed && !isResolved && requiresAction;
  }).length;

  return {
    displayAlerts,
    unreadCount,
    localDismissed,
    localResolved,
    addAlertaToDB,
    removeAlertaFromDB,
    updateAlertaInDB,
    setLocalDismissed: (newVal: string[]) => {
      localStorage.setItem('alertasDismissed', JSON.stringify(newVal));
      window.dispatchEvent(new Event('alertas-local-updated'));
    },
    setLocalResolved: (newVal: string[]) => {
      localStorage.setItem('alertasResolved', JSON.stringify(newVal));
      window.dispatchEvent(new Event('alertas-local-updated'));
    }
  };
}
