import React, { useState, useMemo } from 'react';
import { Bell, AlertTriangle, Info, Calendar, DollarSign, CloudRain, X, Filter, Thermometer, Check, Trash2, Plus, MoreVertical, Edit2, Settings, ArrowLeft, BellRing, AlertOctagon, Truck, Cloud, Users, ChevronRight, Wallet, Zap, CalendarDays, Moon, Save, Activity, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Modal } from '../components/Modal';
import ActividadReciente from './ActividadReciente';

export default function Alertas() {
 const [view, setView] = useState<'list' | 'config' | 'config-finance'>('list');
 const [activeMainTab, setActiveMainTab] = useState<'alertas' | 'actividad'>('alertas');
 const { data: alertasRaw, add: addAlertaToDB, remove: removeAlertaFromDB, update: updateAlertaInDB } = useFirestoreCollection<any>('alertas');
 const { data: maquinarias } = useFirestoreCollection<any>('inventario_maquinas');
 const { data: aditivos } = useFirestoreCollection<any>('inventario_aditivos');
 const { data: generales } = useFirestoreCollection<any>('inventario_generales');
 const [localDismissed, setLocalDismissed] = useState<string[]>(() => {
 try { 
 const d = JSON.parse(localStorage.getItem('alertasDismissed') || '[]'); 
 return Array.isArray(d) ? d : [];
 } catch { return []; }
 });
 const [localResolved, setLocalResolved] = useState<string[]>(() => {
 try { 
 const r = JSON.parse(localStorage.getItem('alertasResolved') || '[]'); 
 return Array.isArray(r) ? r : [];
 } catch { return []; }
 });

 React.useEffect(() => {
 localStorage.setItem('alertasDismissed', JSON.stringify(localDismissed));
 window.dispatchEvent(new Event('alertas-local-updated'));
 }, [localDismissed]);

 React.useEffect(() => {
 localStorage.setItem('alertasResolved', JSON.stringify(localResolved));
 window.dispatchEvent(new Event('alertas-local-updated'));
 }, [localResolved]);

 const [detailModalAlert, setDetailModalAlert] = useState<any>(null);

 const displayAlerts = useMemo(() => {
    const inventoryAlerts: any[] = [];
   
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

    const baseAlertas = alertasRaw;
    return [...baseAlertas, ...inventoryAlerts];
  }, [alertasRaw, maquinarias, aditivos, generales]);

 const alertasDataState = displayAlerts.filter((a: any) => !localDismissed.includes(a.id));
 const [showMobileFilters, setShowMobileFilters] = useState(false);
 const [activeFilter, setActiveFilter] = useState('todos');
 const [showToast, setShowToast] = useState<string | null>(null);

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
 const [editingAlert, setEditingAlert] = useState<any>(null);

 const [alertForm, setAlertForm] = useState({
 titulo: '',
 contexto: '',
 nivel: 'informativa',
 tipo: 'comercial'
 });

 const handleResolveAlert = async (alerta: any) => {
 const isLocalResolved = localResolved.includes(alerta.id);
 const currentState = alerta.resuelta !== undefined ? alerta.resuelta : isLocalResolved;
 
 // Si la alerta tiene ID real (no en mock), sincronizar a Firebase
 if (alerta.id && alerta.id.length > 5) {
 await updateAlertaInDB(alerta.id, { resuelta: !currentState });
 }
 
 if (!currentState) {
 setLocalResolved(prev => [...prev, alerta.id]);
 setShowToast('Alerta marcada como resuelta');
 } else {
 setLocalResolved(prev => prev.filter(id => id !== alerta.id));
 setShowToast('Alerta marcada como pendiente');
 }
 setTimeout(() => setShowToast(null), 3000);
 };

 const handleVerDetalle = (alerta: any) => {
 setDetailModalAlert(alerta);
 };

 const handleDeleteAlert = async (id: string) => {
 if (id) {
 await removeAlertaFromDB(id);
 setLocalDismissed(prev => [...prev, id]);
 }
 setActiveDropdown(null);
 };

 const handleEditClick = (alerta: any) => {
 setEditingAlert(alerta);
 setAlertForm({
 titulo: alerta.titulo,
 contexto: alerta.contexto,
 nivel: alerta.nivel,
 tipo: alerta.tipo
 });
 setActiveDropdown(null);
 setIsModalOpen(true);
 };

 const handleSaveAlert = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!alertForm.titulo.trim() || !alertForm.contexto.trim()) return;

 if (editingAlert) {
 await updateAlertaInDB(editingAlert.id, alertForm);
 setShowToast('Alerta actualizada correctamente');
 } else {
 await addAlertaToDB({
 ...alertForm,
 fecha: 'Justo ahora'
 });
 setShowToast('Alerta creada correctamente');
 }

 setIsModalOpen(false);
 setEditingAlert(null);
 setAlertForm({ titulo: '', contexto: '', nivel: 'informativa', tipo: 'comercial' });
 setTimeout(() => setShowToast(null), 3000);
 };

 const openNewModal = () => {
 setEditingAlert(null);
 setAlertForm({ titulo: '', contexto: '', nivel: 'informativa', tipo: 'comercial' });
 setIsModalOpen(true);
 };

 const getNivelStyles = (nivel: string, isResolved: boolean = false) => {
    if (isResolved) return 'border-bd-lines bg-main dark:bg-[#111827] opacity-80';
    switch (nivel) {
      case 'accion': return 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-[#1E293B]';
      case 'atencion': return 'border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-[#1E293B]';
      case 'informativa': return 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-[#1E293B]';
      default: return 'border-bd-lines bg-main dark:bg-[#1E293B]';
    }
  };

 const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'accion': return <span className="bg-red-500 dark:bg-[#7f1d1d] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Acción Inmediata</span>;
      case 'atencion': return <span className="bg-orange-500 dark:bg-[#7c2d12] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Atención</span>;
      case 'informativa': return <span className="bg-blue-500 dark:bg-[#1e3a8a] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Informativa</span>;
      default: return null;
    }
  };

 const getIcon = (tipo: string, nivel: string) => {

 const colorClass = nivel === 'accion' ? 'text-red-500 dark:text-[#f87171]' : nivel === 'atencion' ? 'text-orange-500 dark:text-[#fb923c]' : 'text-blue-500 dark:text-[#60a5fa]';
 switch (tipo) {
 case 'cheque': return <DollarSign className={colorClass} size={20} />;
 case 'cuenta': return <AlertTriangle className={colorClass} size={20} />;
 case 'clima': return <CloudRain className={colorClass} size={20} />;
 case 'evento': return <Calendar className={colorClass} size={20} />;
 case 'comercial': return <Info className={colorClass} size={20} />;
 default: return <Bell className={colorClass} size={20} />;
 }
 };



 const filteredAlertas = alertasDataState.filter((a: any) => activeFilter === 'todos' || a.nivel === activeFilter);

 if (view === 'config') {
 return (
 <div className="max-w-md mx-auto bg-card rounded-xl shadow-sm border border-bd-lines overflow-hidden min-h-[80vh] flex flex-col">
 {/* Header */}
 <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-10 bg-card border-b border-bd-lines">
 <button onClick={() => setView('list')} className="text-tx-primary flex size-10 shrink-0 items-center justify-center hover:bg-main rounded-full transition-colors">
 <ArrowLeft size={24} />
 </button>
 <h2 className="text-tx-primary text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">Configuración de Alertas</h2>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-y-auto pb-6">
 {/* Master Toggle */}
 <div className="flex items-center gap-4 px-4 py-4 min-h-14 justify-between bg-card mt-2">
 <div className="flex items-center gap-4">
 <div className="text-accent flex items-center justify-center rounded-lg bg-accent/10 shrink-0 size-10">
 <BellRing size={20} />
 </div>
 <div className="flex flex-col">
 <p className="text-tx-primary text-base font-semibold leading-normal">Notificaciones Generales</p>
 <p className="text-tx-secondary text-sm">Activar o desactivar todas</p>
 </div>
 </div>
 <div className="shrink-0">
 <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-accent transition-colors duration-200">
 <div className="h-full w-[27px] rounded-full bg-card shadow-sm"></div>
 <input type="checkbox" className="invisible absolute" defaultChecked />
 </label>
 </div>
 </div>

 <div className="h-px bg-main mx-4"></div>

 {/* Severity Channels Section */}
 <div className="px-4 pt-6 pb-2">
 <h3 className="text-tx-primary text-lg font-bold leading-tight tracking-[-0.015em]">Canales por Severidad</h3>
 <p className="text-tx-secondary text-sm mt-1">Configura cómo recibes cada nivel de alerta.</p>
 </div>

 {/* Info Level */}
 <div className="flex items-center gap-4 px-4 py-3 min-h-[72px] justify-between hover:bg-main cursor-pointer transition-colors rounded-lg mx-2">
 <div className="flex items-center gap-4">
 <div className="text-blue-600 flex items-center justify-center rounded-lg bg-blue-100 shrink-0 size-12">
 <Info size={24} />
 </div>
 <div className="flex flex-col justify-center">
 <p className="text-tx-primary text-base font-medium leading-normal line-clamp-1">Información</p>
 <p className="text-tx-secondary text-sm font-normal leading-normal line-clamp-2">Push, Email</p>
 </div>
 </div>
 <div className="shrink-0 text-tx-secondary">
 <ChevronRight size={24} />
 </div>
 </div>

 {/* Warning Level */}
 <div className="flex items-center gap-4 px-4 py-3 min-h-[72px] justify-between hover:bg-main cursor-pointer transition-colors rounded-lg mx-2">
 <div className="flex items-center gap-4">
 <div className="text-orange-600 flex items-center justify-center rounded-lg bg-orange-100 shrink-0 size-12">
 <AlertTriangle size={24} />
 </div>
 <div className="flex flex-col justify-center">
 <p className="text-tx-primary text-base font-medium leading-normal line-clamp-1">Atención</p>
 <p className="text-tx-secondary text-sm font-normal leading-normal line-clamp-2">Push, SMS</p>
 </div>
 </div>
 <div className="shrink-0 text-tx-secondary">
 <ChevronRight size={24} />
 </div>
 </div>

 {/* Critical Level */}
 <div className="flex items-center gap-4 px-4 py-3 min-h-[72px] justify-between hover:bg-main cursor-pointer transition-colors rounded-lg mx-2">
 <div className="flex items-center gap-4">
 <div className="text-red-600 flex items-center justify-center rounded-lg bg-red-100 shrink-0 size-12">
 <AlertOctagon size={24} />
 </div>
 <div className="flex flex-col justify-center">
 <p className="text-tx-primary text-base font-medium leading-normal line-clamp-1">Inmediato</p>
 <p className="text-tx-secondary text-sm font-normal leading-normal line-clamp-2">Push, Email, SMS, Llamada</p>
 </div>
 </div>
 <div className="shrink-0 text-tx-secondary">
 <ChevronRight size={24} />
 </div>
 </div>

 <div className="h-px bg-main mx-4 my-2"></div>

 {/* Categories Section */}
 <div className="px-4 pt-4 pb-2">
 <h3 className="text-tx-primary text-lg font-bold leading-tight tracking-[-0.015em]">Categorías de Alerta</h3>
 </div>

 {/* Finance Category */}
 <div className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-main cursor-pointer transition-colors" onClick={() => setView('config-finance')}>
 <div className="flex items-center gap-4 flex-1">
 <div className="text-accent flex items-center justify-center rounded-lg bg-accent/10 shrink-0 size-10">
 <DollarSign size={20} />
 </div>
 <p className="text-tx-primary text-base font-medium leading-normal flex-1">Finanzas</p>
 </div>
 <div className="flex items-center gap-4">
 <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-accent transition-colors duration-200" onClick={e => e.stopPropagation()}>
 <div className="h-full w-[20px] rounded-full bg-card shadow-sm"></div>
 <input type="checkbox" className="invisible absolute" defaultChecked />
 </label>
 <div className="shrink-0 text-tx-secondary">
 <ChevronRight size={24} />
 </div>
 </div>
 </div>

 {/* Logistics Category */}
 <div className="flex items-center gap-4 px-4 py-3 justify-between">
 <div className="flex items-center gap-4 flex-1">
 <div className="text-accent flex items-center justify-center rounded-lg bg-accent/10 shrink-0 size-10">
 <Truck size={20} />
 </div>
 <p className="text-tx-primary text-base font-medium leading-normal flex-1">Logística</p>
 </div>
 <div className="flex items-center gap-4">
 <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-accent transition-colors duration-200">
 <div className="h-full w-[20px] rounded-full bg-card shadow-sm"></div>
 <input type="checkbox" className="invisible absolute" defaultChecked />
 </label>
 <div className="shrink-0 text-tx-secondary cursor-pointer">
 <ChevronRight size={24} />
 </div>
 </div>
 </div>

 {/* Weather Category */}
 <div className="flex items-center gap-4 px-4 py-3 justify-between">
 <div className="flex items-center gap-4 flex-1">
 <div className="text-accent flex items-center justify-center rounded-lg bg-accent/10 shrink-0 size-10">
 <Cloud size={20} />
 </div>
 <p className="text-tx-primary text-base font-medium leading-normal flex-1">Clima</p>
 </div>
 <div className="flex items-center gap-4">
 <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-accent transition-colors duration-200">
 <div className="h-full w-[20px] rounded-full bg-card shadow-sm"></div>
 <input type="checkbox" className="invisible absolute" defaultChecked />
 </label>
 <div className="shrink-0 text-tx-secondary cursor-pointer">
 <ChevronRight size={24} />
 </div>
 </div>
 </div>

 {/* Clients Category */}
 <div className="flex items-center gap-4 px-4 py-3 justify-between">
 <div className="flex items-center gap-4 flex-1">
 <div className="text-accent flex items-center justify-center rounded-lg bg-accent/10 shrink-0 size-10">
 <Users size={20} />
 </div>
 <p className="text-tx-primary text-base font-medium leading-normal flex-1">Clientes</p>
 </div>
 <div className="flex items-center gap-4">
 <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-accent transition-colors duration-200">
 <div className="h-full w-[20px] rounded-full bg-card shadow-sm"></div>
 <input type="checkbox" className="invisible absolute" />
 </label>
 <div className="shrink-0 text-tx-secondary cursor-pointer">
 <ChevronRight size={24} />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 }

 if (view === 'config-finance') {
 return (
 <div className="max-w-md mx-auto flex flex-col space-y-6">
 {/* Header */}
 <header className="bg-card border-b border-bd-lines sticky top-0 z-50 px-4 py-3 shadow-sm rounded-t-xl flex items-center gap-3">
 <button onClick={() => setView('config')} className="flex items-center justify-center p-2 rounded-full hover:bg-main text-tx-primary transition-colors">
 <ArrowLeft size={24} />
 </button>
 <h1 className="text-lg font-bold flex-1 text-center pr-10 text-tx-primary">Configuración de Alertas</h1>
 </header>

 {/* Main Content */}
 <main className="flex-1 px-4 pb-6 w-full space-y-6">
 {/* Intro Section */}
 <div className="bg-card p-5 rounded-2xl shadow-sm border border-bd-lines">
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
 <Wallet size={20} className="text-accent" />
 </div>
 <div>
 <h2 className="text-base font-bold text-tx-primary">Alertas Financieras</h2>
 <p className="text-sm text-tx-secondary mt-1">Configure notificaciones para saldos bajos, cheques y movimientos inusuales.</p>
 </div>
 </div>
 </div>

 {/* Threshold Section (Slider) */}
 <section className="bg-card p-5 rounded-2xl shadow-sm border border-bd-lines">
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-bold text-base text-tx-primary">Umbral de Saldo Mínimo</h3>
 <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-bold">$1,500</span>
 </div>
 <p className="text-sm text-tx-secondary mb-6">Notificarme cuando el saldo operativo caiga por debajo de este monto.</p>
 <div className="relative w-full h-12 flex items-center">
 {/* Track background */}
 <div className="absolute w-full h-2 bg-gray-200 rounded-full overflow-hidden">
 <div className="h-full bg-accent w-[30%]"></div>
 </div>
 <input type="range" min="0" max="5000" step="100" defaultValue="1500" className="absolute w-full h-2 opacity-0 cursor-pointer z-10" />
 {/* Visual Thumb */}
 <div className="absolute left-[30%] w-6 h-6 bg-card border-2 border-accent rounded-full shadow-md transform -translate-x-1/2 pointer-events-none flex items-center justify-center">
 <div className="w-2 h-2 bg-accent rounded-full"></div>
 </div>
 </div>
 <div className="flex justify-between text-xs text-tx-secondary font-medium mt-1">
 <span>$0</span>
 <span>$5,000</span>
 </div>
 </section>

 {/* Frequency Section (Radio) */}
 <section className="bg-card p-5 rounded-2xl shadow-sm border border-bd-lines">
 <h3 className="font-bold text-base text-tx-primary mb-4">Frecuencia de Notificación</h3>
 <div className="space-y-3">
 <label className="flex items-center justify-between p-3 border border-accent bg-accent/5 rounded-xl cursor-pointer transition-all">
 <div className="flex items-center gap-3">
 <Zap size={20} className="text-accent" />
 <div>
 <span className="block text-sm font-bold text-tx-primary">Inmediata</span>
 <span className="block text-xs text-tx-secondary">Al momento que ocurre el evento</span>
 </div>
 </div>
 <div className="relative flex items-center">
 <input type="radio" name="frequency" defaultChecked className="peer h-5 w-5 border-bd-lines text-accent focus:ring-accent" />
 </div>
 </label>

 <label className="flex items-center justify-between p-3 border border-bd-lines hover:border-bd-lines hover:bg-main rounded-xl cursor-pointer transition-all">
 <div className="flex items-center gap-3">
 <Calendar size={20} className="text-tx-secondary" />
 <div>
 <span className="block text-sm font-bold text-tx-primary">Resumen Diario</span>
 <span className="block text-xs text-tx-secondary">Un reporte al final del día (18:00)</span>
 </div>
 </div>
 <div className="relative flex items-center">
 <input type="radio" name="frequency" className="peer h-5 w-5 border-bd-lines text-accent focus:ring-accent" />
 </div>
 </label>

 <label className="flex items-center justify-between p-3 border border-bd-lines hover:border-bd-lines hover:bg-main rounded-xl cursor-pointer transition-all">
 <div className="flex items-center gap-3">
 <CalendarDays size={20} className="text-tx-secondary" />
 <div>
 <span className="block text-sm font-bold text-tx-primary">Resumen Semanal</span>
 <span className="block text-xs text-tx-secondary">Todos los viernes a las 17:00</span>
 </div>
 </div>
 <div className="relative flex items-center">
 <input type="radio" name="frequency" className="peer h-5 w-5 border-bd-lines text-accent focus:ring-accent" />
 </div>
 </label>
 </div>
 </section>

 {/* Quiet Hours Section */}
 <section className="bg-card p-5 rounded-2xl shadow-sm border border-bd-lines">
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-2">
 <Moon size={20} className="text-tx-primary" />
 <h3 className="font-bold text-base text-tx-primary">Horas de Silencio</h3>
 </div>
 {/* Toggle Switch */}
 <label className="inline-flex items-center cursor-pointer">
 <input type="checkbox" value="" className="sr-only peer" defaultChecked />
 <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-bd-lines after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
 </label>
 </div>
 <p className="text-sm text-tx-secondary mb-6">Silenciar notificaciones durante este periodo. Las alertas críticas seguirán sonando.</p>

 <div className="flex gap-4">
 <div className="flex-1">
 <label className="block text-xs font-bold text-tx-secondary mb-2 uppercase tracking-wide">Inicio</label>
 <div className="relative">
 <input type="time" defaultValue="22:00" className="block w-full rounded-lg border-bd-lines bg-main p-2.5 text-sm text-tx-primary focus:border-accent focus:ring-accent font-bold shadow-sm" />
 </div>
 </div>
 <div className="flex-1">
 <label className="block text-xs font-bold text-tx-secondary mb-2 uppercase tracking-wide">Fin</label>
 <div className="relative">
 <input type="time" defaultValue="07:00" className="block w-full rounded-lg border-bd-lines bg-main p-2.5 text-sm text-tx-primary focus:border-accent focus:ring-accent font-bold shadow-sm" />
 </div>
 </div>
 </div>
 </section>

 {/* Action Buttons */}
 <div className="pt-2">
 <button
 onClick={() => {
 setShowToast('Configuración guardada');
 setTimeout(() => setShowToast(null), 3000);
 setView('config');
 }}
 className="w-full bg-accent text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-accent/30 hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
 >
 <Save size={20} />
 Guardar Cambios
 </button>
 </div>
 </main>
 </div>
 );
 }

 return (
 <div className="space-y-6 relative" onClick={() => setActiveDropdown(null)}>
 {/* Toast Notification */}
 {showToast && (
 <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
 <div className="bg-green-500 rounded-full p-1">
 <Check size={16} className="text-white" />
 </div>
 <span className="font-medium">{showToast}</span>
 </div>
 )}

 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex bg-main p-1 rounded-xl w-full sm:w-auto">
 <button
 onClick={() => setActiveMainTab('alertas')}
 className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2", activeMainTab === 'alertas' ? "bg-card text-tx-primary shadow-sm" : "text-tx-secondary hover:text-tx-secondary")}
 >
 <Bell size={18} />
 Alertas
 </button>
 <button
 onClick={() => setActiveMainTab('actividad')}
 className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2", activeMainTab === 'actividad' ? "bg-card text-tx-primary shadow-sm" : "text-tx-secondary hover:text-tx-secondary")}
 >
 <Activity size={18} />
 Actividad
 </button>
 </div>

 {activeMainTab === 'alertas' && (
 <div className="flex w-full sm:w-auto gap-2">
 <button
 onClick={() => setView('config')}
 className="flex items-center justify-center gap-2 bg-card border border-bd-lines px-4 py-2 rounded-lg text-tx-secondary font-medium hover:bg-main transition-colors"
 title="Configuración de Alertas"
 >
 <Settings size={20} />
 <span className="hidden sm:inline">Configuración</span>
 </button>
 <button
 onClick={() => setShowMobileFilters(true)}
 className="md:hidden flex-1 flex items-center justify-center gap-2 bg-card border border-bd-lines px-4 py-2 rounded-lg text-tx-secondary font-medium"
 >
 <Filter size={18} />
 Filtrar
 </button>
 <button
 onClick={openNewModal}
 className="flex-1 sm:flex-none bg-accent text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#15803d] transition-colors"
 >
 <Plus size={20} />
 <span className="hidden sm:inline">Nueva Alerta</span>
 </button>
 </div>
 )}
 </div>

 {activeMainTab === 'alertas' ? (
 <>
 <div className="hidden md:flex bg-card p-1 rounded-lg border border-bd-lines w-fit">
 <button onClick={() => setActiveFilter('todos')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'todos' ? "bg-main text-tx-primary" : "text-tx-secondary hover:text-tx-secondary")}>Todas</button>
 <button onClick={() => setActiveFilter('accion')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'accion' ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "text-tx-secondary hover:text-tx-secondary")}>Acción</button>
 <button onClick={() => setActiveFilter('atencion')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'atencion' ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "text-tx-secondary hover:text-tx-secondary")}>Atención</button>
 <button onClick={() => setActiveFilter('informativa')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'informativa' ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-tx-secondary hover:text-tx-secondary")}>Informativas</button>
 </div>

 <div className="space-y-4">
 {filteredAlertas.map((alerta: any) => {
 const isResolved = alerta.resuelta || localResolved.includes(alerta.id);
 return (
 <div key={alerta.id} className={cn("rounded-xl p-5 border transition-all hover:shadow-md", getNivelStyles(alerta.nivel, isResolved))}>
 <div className="flex flex-col sm:flex-row gap-4">
 <div className="flex-shrink-0 mt-1">
 <div className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
 {getIcon(alerta.tipo, alerta.nivel)}
 </div>
 </div>

 <div className="flex-1 space-y-2">
 <div className="flex flex-wrap justify-between items-start gap-2">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 {isResolved ? (
 <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
 <Check size={10} /> Resuelta
 </span>
 ) : (
 getNivelBadge(alerta.nivel)
 )}
 <span className="text-xs text-tx-secondary">{alerta.fecha}</span>
 </div>
 <h3 className="font-bold text-tx-primary text-lg pr-8">{alerta.titulo}</h3>
 </div>
 <div className="relative">
 <button
 onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === alerta.id ? null : alerta.id); }}
 className="p-1 rounded text-tx-secondary hover:text-tx-secondary hover:bg-main transition-colors absolute top-0 right-0"
 >
 <MoreVertical size={18} />
 </button>
 {activeDropdown === alerta.id && (
 <div className="absolute right-0 top-8 mt-1 w-40 bg-card rounded-xl shadow-lg border border-bd-lines py-1 z-10">
 <button
 onClick={(e) => { e.stopPropagation(); handleEditClick(alerta); }}
 className="w-full text-left px-4 py-2 text-sm text-tx-secondary hover:bg-main flex items-center gap-2"
 >
 <Edit2 size={14} /> Editar
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); handleDeleteAlert(alerta.id); }}
 className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
 >
 <Trash2 size={14} /> Eliminar
 </button>
 </div>
 )}
 </div>
 </div>

 <p className="text-tx-secondary text-sm">{alerta.contexto}</p>

 {/* Contextual Metadata */}
 {alerta.progreso && (
 <div className="mt-3">
 <div className="flex justify-between text-xs mb-1">
 <span className="font-medium text-tx-secondary">Uso de cuenta</span>
 <span className="font-bold text-red-600 dark:text-[#f87171]">{alerta.progreso}%</span>
 </div>
 <div className="w-full bg-gray-200 dark:bg-[#374151] rounded-full h-2">
 <div className="bg-red-500 dark:bg-[#991B1B] h-2 rounded-full" style={{ width: `${alerta.progreso}%` }}></div>
 </div>
 </div>
 )}

 {alerta.monto && (
 <div className="mt-2 inline-block bg-card px-3 py-1 rounded-md border border-bd-lines text-sm font-bold text-tx-primary">
 {alerta.monto}
 </div>
 )}

 {alerta.temperatura && (
 <div className="mt-2 inline-flex items-center gap-1 bg-card px-3 py-1 rounded-md border border-bd-lines text-sm font-bold text-tx-primary">
 <Thermometer size={16} className="text-blue-500" />
 {alerta.temperatura}
 </div>
 )}
 </div>

 <div className="flex flex-col sm:flex-row justify-end mt-4 sm:mt-0 border-t sm:border-t-0 sm:border-l border-bd-lines/50 pt-4 sm:pt-0 sm:pl-4 gap-2 min-w-[170px]">
 <div className="flex flex-col gap-2 w-full">
 <button
 onClick={() => handleVerDetalle(alerta)}
 className="w-full bg-card dark:bg-[#334155] border border-bd-lines dark:border-transparent hover:bg-main dark:hover:bg-[#475569] text-tx-secondary dark:text-tx-primary px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                          Ver detalle
 </button>
 {(alerta.nivel === 'accion' || alerta.nivel === 'atencion') && (
 <button
 onClick={() => handleResolveAlert(alerta)}
 className={cn(
 "w-full px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 border",
 isResolved
                                ? "bg-main border-bd-lines text-tx-secondary hover:bg-gray-200 dark:bg-[#14532D] dark:text-tx-primary dark:border-transparent"
                                : "bg-accent/5 border-bd-lines text-accent hover:bg-accent/10 dark:bg-transparent dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B]"
 )}
 >
 <div className={cn(
 "flex items-center justify-center w-4 h-4 rounded border transition-colors",
 isResolved ? "bg-gray-400 border-gray-400 dark:bg-transparent dark:border-white" : "bg-card border-accent dark:bg-transparent dark:border-gray-500"
 )}>
 {isResolved && <Check size={12} className="text-white" />}
 </div>
 {isResolved ? "Marcar pendiente" : "Marcar resuelta"}
 </button>
 )}
 {alerta.whatsappMsg && (
 <a
 href={`https://wa.me/?text=${encodeURIComponent(alerta.whatsappMsg)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5"
 title="Pedir por WhatsApp"
 >
 <MessageCircle size={16} /> WhatsApp
 </a>
 )}
 <button
 onClick={() => handleDeleteAlert(alerta.id)}
 className="w-full bg-transparent border border-transparent hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-tx-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
 >
 Descartar
 </button>
 </div>
 </div>
 </div>
 </div>
 );})}
 </div>
 </>
 ) : (
 <div className="pt-2">
 <ActividadReciente />
 </div>
 )}

 {/* Mobile Filters Bottom Sheet */}
 {showMobileFilters && (
 <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
 <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
 <div className="bg-card rounded-t-2xl p-6 relative z-10">
 <div className="flex justify-between items-center mb-6">
 <h3 className="font-bold text-xl text-tx-primary">Filtrar Alertas</h3>
 <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-main rounded-full">
 <X size={20} />
 </button>
 </div>

 <div className="space-y-3">
 <button
 onClick={() => { setActiveFilter('todos'); setShowMobileFilters(false); }}
 className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border", activeFilter === 'todos' ? "border-accent bg-accent/5 text-accent" : "border-bd-lines text-tx-secondary")}
 >
 Todas las alertas
 </button>
 <button
 onClick={() => { setActiveFilter('accion'); setShowMobileFilters(false); }}
 className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border flex items-center justify-between", activeFilter === 'accion' ? "border-red-500 bg-red-50 text-red-700 dark:bg-[#7f1d1d]/80 dark:text-[#fca5a5] dark:border-[#991b1b]" : "border-bd-lines text-tx-secondary dark:text-gray-400")}
 >
 Acción Inmediata
 <span className="w-3 h-3 rounded-full bg-red-500"></span>
 </button>
 <button
 onClick={() => { setActiveFilter('atencion'); setShowMobileFilters(false); }}
 className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border flex items-center justify-between", activeFilter === 'atencion' ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-[#7c2d12]/80 dark:text-[#fdba74] dark:border-[#9a3412]" : "border-bd-lines text-tx-secondary dark:text-gray-400")}
 >
 Atención
 <span className="w-3 h-3 rounded-full bg-orange-500"></span>
 </button>
 <button
 onClick={() => { setActiveFilter('informativa'); setShowMobileFilters(false); }}
 className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border flex items-center justify-between", activeFilter === 'informativa' ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-[#1e3a8a]/80 dark:text-[#93c5fd] dark:border-[#1d4ed8]" : "border-bd-lines text-tx-secondary dark:text-gray-400")}
 >
 Informativas
 <span className="w-3 h-3 rounded-full bg-blue-500"></span>
 </button>
 </div>
 </div>
 </div>
 )}
 {/* Modal for New/Edit Alert */}
 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title={editingAlert ? "Editar Alerta" : "Nueva Alerta"}
 >
 <form onSubmit={handleSaveAlert} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Título</label>
 <input
 type="text"
 required
 value={alertForm.titulo}
 onChange={e => setAlertForm({ ...alertForm, titulo: e.target.value })}
 className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
 placeholder="Ej: Cheque próximo a vencer"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Contexto / Descripción</label>
 <textarea
 required
 rows={3}
 value={alertForm.contexto}
 onChange={e => setAlertForm({ ...alertForm, contexto: e.target.value })}
 className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-none"
 placeholder="Detalles de la alerta..."
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Nivel</label>
 <select
 value={alertForm.nivel}
 onChange={e => setAlertForm({ ...alertForm, nivel: e.target.value })}
 className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card"
 >
 <option value="informativa">Informativa</option>
 <option value="atencion">Atención</option>
 <option value="accion">Acción Inmediata</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Tipo de Icono</label>
 <select
 value={alertForm.tipo}
 onChange={e => setAlertForm({ ...alertForm, tipo: e.target.value })}
 className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card"
 >
 <option value="comercial">General / Info</option>
 <option value="cheque">Finanzas / Dinero</option>
 <option value="cuenta">Alerta / Peligro</option>
 <option value="evento">Calendario / Evento</option>
 <option value="clima">Clima</option>
 </select>
 </div>
 </div>
 <div className="pt-4 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="px-4 py-2 text-tx-secondary font-medium hover:bg-main rounded-lg transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-[#15803d] transition-colors"
 >
 Guardar
 </button>
 </div>
 </form>
 </Modal>

 {/* Modal for Details */}
 <Modal
 isOpen={!!detailModalAlert}
 onClose={() => setDetailModalAlert(null)}
 title="Detalles de la Alerta"
 >
 {detailModalAlert && (
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Título</label>
 <input
 type="text"
 readOnly={detailModalAlert.nivel === 'informativa' || localResolved.includes(detailModalAlert.id)}
 defaultValue={detailModalAlert.titulo}
 className={cn("w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20", 
 (detailModalAlert.nivel === 'informativa' || localResolved.includes(detailModalAlert.id)) ? "bg-main border-bd-lines text-tx-secondary" : "border-bd-lines bg-card")}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-tx-secondary mb-1">Descripción</label>
 <textarea
 rows={4}
 readOnly={detailModalAlert.nivel === 'informativa' || localResolved.includes(detailModalAlert.id)}
 defaultValue={detailModalAlert.contexto}
 className={cn("w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none",
 (detailModalAlert.nivel === 'informativa' || localResolved.includes(detailModalAlert.id)) ? "bg-main border-bd-lines text-tx-secondary" : "border-bd-lines bg-card")}
 />
 </div>
 <div className="pt-4 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setDetailModalAlert(null)}
 className="px-4 py-2 text-tx-secondary font-medium hover:bg-main rounded-lg transition-colors"
 >
 Cerrar
 </button>
 {(detailModalAlert.nivel === 'accion' || detailModalAlert.nivel === 'atencion') && !localResolved.includes(detailModalAlert.id) && (
 <button
 type="button"
 onClick={() => {
 setShowToast('Cambios guardados exitosamente');
 setTimeout(() => setShowToast(null), 3000);
 setDetailModalAlert(null);
 }}
 className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-[#15803d] transition-colors"
 >
 Guardar Cambios
 </button>
 )}
 </div>
 </div>
 )}
 </Modal>
 </div>
 );
}
