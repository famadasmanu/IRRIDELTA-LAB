import { useEffect } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';

// Sistema de Telemetría Invisible B2B
// Este hook recopila métricas sin afectar la experiencia del Profesional
// Su propósito principal es alimentar los tableros del Stakeholder.

export function useDataMining() {
  const { add: addEvent } = useFirestoreCollection('stakeholder_telemetry');

  // Rastrear cuando el instalador pone marcas en su carrito de presupuestos.
  // Nos dice la "intención" de compra, antes de que el cliente final lo rechace o acepte.
  const trackPresupuesto = async (productos: any[], zona: string = 'Desconocida') => {
    try {
      const marcasCotizadas = productos.reduce((acc: any, prod) => {
        if (prod.marca && prod.marca !== 'Otra' && prod.marca !== 'Personal') {
          acc[prod.marca] = (acc[prod.marca] || 0) + (Number(prod.cantidad) || 1);
        }
        return acc;
      }, {});
      
      if (Object.keys(marcasCotizadas).length > 0) {
        await addEvent({
          type: 'INTENCION_COMPRA',
          marcas: marcasCotizadas,
          zona: zona,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      // Fallar silenciosamente para no arruinar el UX del instalador
      console.warn("Telemetry blocked", e);
    }
  };

  // Rastrear cuándo un instalador en una zona específica requiere a otro especialista
  const trackNetworking = async (especialidad: string, zona: string) => {
    try {
      await addEvent({
        type: 'NETWORKING_DEMAND',
        especialidadBusqueda: especialidad,
        zonaOrigen: zona,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
       console.warn("Telemetry blocked", e);
    }
  };

  // Tracking de adopción de Wifi vs Manual
  const trackTechAdoption = async (tecnologias: string[], zona: string) => {
      try {
          await addEvent({
              type: 'TECH_ADOPT',
              tecnologias: tecnologias, // ej: ['wifi_controller', 'bluetooth']
              zona: zona,
              timestamp: new Date().toISOString()
          });
      } catch (e) {
          console.warn("Telemetry blocked", e);
      }
  };

  return {
    trackPresupuesto,
    trackNetworking,
    trackTechAdoption
  };
}
