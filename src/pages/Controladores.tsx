import React, { useState, useEffect } from 'react';
import { Wifi, Droplets, RefreshCw, AlertCircle, CheckCircle, Smartphone, Power, Loader2, Play, Square, Pause, Calendar } from 'lucide-react';

// Interfaz para la respuesta de Hydrawise
interface HydrawiseController {
 id: number;
 name: string;
 status: string;
 last_contact: number;
}

interface HydrawiseZone {
 relay_id: number;
 name: string;
 timeRemaining: number;
 nextRunStr?: string;
 suspendedUntil?: string;
}

export default function Controladores() {
 const [apiKey, setApiKey] = useState(() => {
 try {
 const item = window.localStorage.getItem('hydrawise_api_key');
 return item ? JSON.parse(item) : 'e429-b649-3d97-5f25';
 } catch {
 return 'e429-b649-3d97-5f25';
 }
 });

 useEffect(() => {
 try {
 window.localStorage.setItem('hydrawise_api_key', JSON.stringify(apiKey));
 } catch {}
 }, [apiKey]);
 const [controllers, setControllers] = useState<HydrawiseController[]>([]);
 const [zones, setZones] = useState<HydrawiseZone[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [activeZone, setActiveZone] = useState<number | null>(null);

  const hydrawiseFetch = async (endpoint: string) => {
    // Intentar directamente con un Public CORS Proxy para evitar bloqueos del navegador y de Vite (especialmente en Prod)
    const targetUrl = `https://api.hydrawise.com/api/v1/${endpoint}`;
    const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    
    const res = await fetch(corsUrl, {
       headers: { 'Accept': 'application/json' }
    });
    
    const textData = await res.text();
    let jsonData = null;
    
    try {
       jsonData = JSON.parse(textData);
    } catch (e) {
       // La API devolvió un texto en lugar de JSON (Ej: "Controller require API Key...")
       throw new Error(`La API rechazó la llave: ${textData.substring(0, 100)}`);
    }

    if (!res.ok) {
        throw new Error(`Hydrawise rechazó la conexión (HTTP ${res.status}). Motivo: ${jsonData.error_message || jsonData.message || jsonData.error || textData.substring(0, 50)}`);
    }
    
    return jsonData;
  };

 const fetchHydrawiseData = async (loadingState = true) => {
 if (!apiKey) return;
 
 if (loadingState) setLoading(true);
 setError('');
 
 try {
 // 1. Obtener controladores (Customer Details)
 const customerData = await hydrawiseFetch(`customerdetails.php?api_key=${apiKey}&type=controllers`);
 
 // 2. Obtener estado de las zonas (Status Schedule)
 const statusData = await hydrawiseFetch(`statusschedule.php?api_key=${apiKey}`);

 if (customerData?.error_message || customerData?.message) {
    throw new Error(customerData.error_message || customerData.message);
 }

 if (customerData?.controllers) {
 setControllers(customerData.controllers);
 }
 
 if (statusData?.relays) {
 setZones(statusData.relays.map((r: any) => {
   let nextRunStr;
   if (r.next_run && r.next_run > 0) {
     nextRunStr = new Date(r.next_run * 1000).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
   }
   let suspendedUntil;
   if (r.suspend && r.suspend > 0) {
     suspendedUntil = new Date(r.suspend * 1000).toLocaleDateString('es-AR');
   }

   return {
     relay_id: r.relay_id,
     name: r.name,
     timeRemaining: r.time > 0 ? r.time : 0, // time is in seconds if running
     nextRunStr,
     suspendedUntil
   };
 }));
 }

 } catch (err: any) {
 console.error("Hydrawise Fetch Error:", err);
 setError(err.message || 'No se pudo establecer conexión con Hydrawise. Revisa tu API Key o conexión de internet.');
 } finally {
 if (loadingState) setLoading(false);
 }
 };

 useEffect(() => {
 fetchHydrawiseData();
 // Refresh interval for live status
 const interval = setInterval(() => {
 fetchHydrawiseData(false); // Fetch behind the scenes without big loader
 }, 15000);
 return () => clearInterval(interval);
 }, [apiKey]);

 const handleRunZone = async (relayId: number, seconds: number = 600) => {
 setActiveZone(relayId);
 try {
 const data = await hydrawiseFetch(`setzone.php?api_key=${apiKey}&action=run&relay_id=${relayId}&custom=${seconds}`);
 if (data.message && data.message.includes('successful')) {
 // Todo bien, actualizar listado
 await fetchHydrawiseData(false);
 } else {
 throw new Error(data.message || 'Error al encender la zona');
 }
 } catch (err: any) {
 alert(err.message);
 } finally {
 setActiveZone(null);
 }
 };

 const handleStopZone = async (relayId: number) => {
 setActiveZone(relayId);
 try {
 const data = await hydrawiseFetch(`setzone.php?api_key=${apiKey}&action=stop&relay_id=${relayId}`);
 if (data.message && data.message.includes('successful')) {
 await fetchHydrawiseData(false);
 } else {
 throw new Error(data.message || 'Error al apagar la zona');
 }
 } catch (err: any) {
 alert(err.message);
 } finally {
 setActiveZone(null);
 }
 };

 const handleGlobalAction = async (action: 'runall' | 'suspendall', isSuspend = false) => {
   const valStr = isSuspend 
     ? prompt("Días a suspender todas las zonas (Escribe 0 para reanudar todas):", "7") 
     : prompt("Segundos a regar cada zona (ej: 300 para 5 mins):", "300");
   if (valStr === null) return;
   const custom = Number(valStr);
   if (isNaN(custom)) return;

   setLoading(true);
   try {
     const data = await hydrawiseFetch(`setzone.php?api_key=${apiKey}&action=${action}&custom=${custom}`);
     if (data.message && data.message.includes('successful')) {
       await fetchHydrawiseData(true);
     } else {
       throw new Error(data.message || `Fallo al procesar ${action}`);
     }
   } catch (err: any) {
     alert(err.message);
   } finally {
     setLoading(false);
   }
 };

 const handleSuspendZone = async (relayId: number) => {
   const valStr = prompt("Días para suspender esta zona (Escribe 0 para cancelar la suspensión):", "7");
   if (valStr === null) return;
   const days = Number(valStr);
   if (isNaN(days)) return;
   
   setActiveZone(relayId);
   try {
     const data = await hydrawiseFetch(`setzone.php?api_key=${apiKey}&action=suspend&relay_id=${relayId}&custom=${days}`);
     if (data.message && data.message.includes('successful')) {
       await fetchHydrawiseData(false);
     } else {
       throw new Error(data.message || 'Error en endpoint Hydrawise');
     }
   } catch (err: any) {
     alert(err.message);
   } finally {
     setActiveZone(null);
   }
 };

 return (
 <div className="space-y-6 md:space-y-8 pb-24">
 <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
 <Wifi className="text-accent" />
 Controladores Hydrawise
 </h1>
 <p className="text-tx-secondary font-medium mt-1">
 Gestión en tiempo real de equipos y válvulas
 </p>
 </div>
 
 <div className="flex gap-2 relative">
 <input 
 type="text" 
 placeholder="Hydrawise API Key..." 
 value={apiKey}
 onChange={(e) => setApiKey(e.target.value)}
 className="input-base text-sm w-48 sm:w-64"
 />
 <button 
 onClick={() => fetchHydrawiseData(true)} 
 disabled={loading}
 className="btn-primary p-3 flex items-center justify-center disabled:opacity-50"
 >
 <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
 </button>
 </div>
 </header>

 {error && (
 <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 flex items-center gap-3">
 <AlertCircle className="w-6 h-6 shrink-0" />
 <p className="font-medium text-sm">{error}</p>
 </div>
 )}

 {loading && !controllers.length ? (
 <div className="flex flex-col items-center justify-center p-12 py-20 bg-card rounded-2xl border border-bd-lines shadow-sm">
 <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
 <p className="text-tx-secondary font-medium">Conectando con servidores de Hydrawise...</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {controllers.map(controller => (
 <div key={controller.id} className="card-base flex flex-col justify-between hover:shadow-lg transition-shadow">
 <div>
 <div className="flex justify-between items-start mb-4">
 <div className="bg-accent/10 p-3 rounded-xl">
 <Smartphone className="w-6 h-6 text-accent" />
 </div>
 <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
 controller.status === 'All good!' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
 }`}>
 {controller.status === 'All good!' ? 'Online' : controller.status}
 </span>
 </div>
 
 <h3 className="h3-title text-tx-primary mb-1">{controller.name}</h3>
 <p className="text-xs text-tx-secondary font-medium mb-6">
 Última vez visto: {controller.last_contact > 0 ? new Date(controller.last_contact * 1000).toLocaleString() : 'Desconocido'}
 </p>
 </div>
 
 <div className="pt-4 border-t border-bd-lines flex items-center gap-2 text-sm text-tx-secondary font-bold">
 <CheckCircle className="w-4 h-4 text-emerald-500" />
 Sistema Operativo
 </div>
 </div>
 ))}

 {controllers.length === 0 && !error && (
 <div className="col-span-full bg-main border-2 border-dashed border-bd-lines rounded-2xl p-12 text-center">
 <Smartphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
 <h3 className="text-lg font-bold text-tx-secondary mb-2">No se encontraron equipos</h3>
 <p className="text-tx-secondary max-w-md mx-auto">
 No hay controladores asociados a esta API Key o la cuenta no tiene permisos suficientes para leer la información.
 </p>
 </div>
 )}
 </div>
 )}

 {zones.length > 0 && (
 <div className="mt-8">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
   <h2 className="text-xl font-bold text-tx-primary flex items-center gap-2">
     <Droplets className="text-accent" />
     Control de Zonas
   </h2>
   <div className="flex flex-wrap gap-2">
     <button onClick={() => handleGlobalAction('runall', false)} className="btn-primary text-xs py-2 px-4 shadow-sm" disabled={loading}>
       <Play size={14} className="inline mr-1" /> Ejecutar Todas
     </button>
     <button onClick={() => handleGlobalAction('suspendall', true)} className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-colors" disabled={loading}>
       <Pause size={14} className="inline mr-1" /> Suspender Todas
     </button>
   </div>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {zones.map(zone => {
 const isRunning = zone.timeRemaining > 0;
 const isProcessing = activeZone === zone.relay_id;

 return (
 <div key={zone.relay_id} className={`p-5 rounded-2xl border transition-all ${
 isRunning ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-card border-bd-lines hover:border-bd-lines'
 }`}>
 <div className="flex justify-between items-start mb-3">
 <h4 className="font-bold text-tx-primary line-clamp-1 flex-1 pr-2" title={zone.name}>
 {zone.name}
 </h4>
 {isRunning && (
 <span className="flex h-3 w-3 relative shrink-0 mt-1">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
 </span>
 )}
 </div>
 
 <div className="flex flex-col gap-1 mb-4 h-12 text-xs font-medium text-tx-secondary">
 {isRunning ? (
 <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded flex items-center w-fit gap-1 font-bold">
 <Droplets size={12} fill="currentColor" /> Riego Activo
 </span>
 ) : zone.suspendedUntil ? (
 <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center w-fit gap-1 font-bold border border-amber-200">
 <Pause size={12} fill="currentColor" /> Susp. hasta {zone.suspendedUntil}
 </span>
 ) : (
 <>
   <span className="bg-main px-2 py-0.5 rounded w-fit">En espera</span>
   {zone.nextRunStr && <span className="flex items-center gap-1 mt-1 text-[10px] text-slate-400"><Calendar size={10}/> Próx: {zone.nextRunStr}</span>}
 </>
 )}
 </div>

 <div className="mt-auto grid grid-cols-2 gap-2">
 <button 
 onClick={() => {
   const val = prompt("Ingresa los MINUTOS a regar (ej: 10):", "10");
   if(val && !isNaN(Number(val))) handleRunZone(zone.relay_id, Number(val) * 60);
 }}
 disabled={isRunning || isProcessing}
 className="py-2 flex items-center justify-center gap-1 bg-accent hover:bg-[#15803d] text-white disabled:bg-slate-300 disabled:text-tx-secondary rounded-lg text-xs font-bold transition-colors"
 >
 {isProcessing && !isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
 Regar...
 </button>
 
 <button 
 onClick={() => handleStopZone(zone.relay_id)}
 disabled={!isRunning || isProcessing}
 className="py-2 flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 disabled:bg-main disabled:text-tx-secondary rounded-lg text-xs font-bold transition-colors"
 >
 {isProcessing && isRunning ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} fill="currentColor" />}
 Detener
 </button>

 <button 
 onClick={() => handleSuspendZone(zone.relay_id)}
 disabled={isProcessing}
 className="col-span-2 py-2 flex items-center justify-center gap-1 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 disabled:opacity-50 rounded-lg text-xs font-bold transition-colors"
 >
 {isProcessing && !isRunning ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
 Suspender / Reanudar
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 </div>
 );
}
