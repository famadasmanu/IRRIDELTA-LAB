import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Calendar, DollarSign, CloudRain, ChevronDown, X, Filter, Thermometer, Check, Trash2, Plus, MoreVertical, Edit2, Settings, ArrowLeft, BellRing, AlertOctagon, Truck, Cloud, Users, ChevronRight, Wallet, Zap, CalendarDays, Moon, Save, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Modal } from '../components/Modal';
import ActividadReciente from './ActividadReciente';

const alertasData = [
  { id: 1, tipo: 'cheque', nivel: 'atencion', titulo: 'Cheque próximo a vencer', contexto: 'Cheque #45892 por $450,000 vence en 2 días.', fecha: 'Hoy, 09:00', monto: '$450,000' },
  { id: 2, tipo: 'cuenta', nivel: 'accion', titulo: 'Límite de cuenta corriente', contexto: 'Has alcanzado el 90% del límite en Vivero Central.', fecha: 'Ayer, 15:30', progreso: 90 },
  { id: 3, tipo: 'clima', nivel: 'informativa', titulo: 'Alerta de Lluvia', contexto: 'Probabilidad de lluvia del 80% para mañana en Zona Norte. Revisar obras al aire libre.', fecha: 'Hoy, 07:15', temperatura: '18°C' },
  { id: 4, tipo: 'evento', nivel: 'atencion', titulo: 'Reunión reprogramada', contexto: 'El cliente Familia Pérez solicitó mover la reunión al jueves.', fecha: 'Hace 2 horas' },
  { id: 5, tipo: 'comercial', nivel: 'informativa', titulo: 'Nueva lista de precios', contexto: 'Materiales San Isidro actualizó sus precios (+5% promedio).', fecha: 'Ayer, 10:00' },
];

export default function Alertas() {
  const [view, setView] = useState<'list' | 'config' | 'config-finance'>('list');
  const [activeMainTab, setActiveMainTab] = useState<'alertas' | 'actividad'>('alertas');
  const [alertasDataState, setAlertasDataState] = useLocalStorage('alertas_data', alertasData);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [showToast, setShowToast] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [editingAlert, setEditingAlert] = useState<any>(null);

  const [alertForm, setAlertForm] = useState({
    titulo: '',
    contexto: '',
    nivel: 'informativa',
    tipo: 'comercial'
  });

  const handleAction = (titulo: string, id: number) => {
    setShowToast(`Acción ejecutada para: ${titulo}`);
    setTimeout(() => setShowToast(null), 3000);
    // setAlertasDataState(alertasDataState.filter((a: any) => a.id !== id));
  };

  const handleDeleteAlert = (id: number) => {
    setAlertasDataState(alertasDataState.filter((a: any) => a.id !== id));
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

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.titulo.trim() || !alertForm.contexto.trim()) return;

    if (editingAlert) {
      setAlertasDataState(alertasDataState.map((a: any) =>
        a.id === editingAlert.id ? { ...a, ...alertForm } : a
      ));
      setShowToast('Alerta actualizada correctamente');
    } else {
      setAlertasDataState([{
        id: Date.now(),
        ...alertForm,
        fecha: 'Justo ahora'
      }, ...alertasDataState]);
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

  const getNivelStyles = (nivel: string) => {
    switch (nivel) {
      case 'accion': return 'border-red-200 bg-red-50/50';
      case 'atencion': return 'border-orange-200 bg-orange-50/50';
      case 'informativa': return 'border-blue-200 bg-blue-50/50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'accion': return <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Acción Inmediata</span>;
      case 'atencion': return <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Atención</span>;
      case 'informativa': return <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Informativa</span>;
      default: return null;
    }
  };

  const getIcon = (tipo: string, nivel: string) => {
    const colorClass = nivel === 'accion' ? 'text-red-500' : nivel === 'atencion' ? 'text-orange-500' : 'text-blue-500';
    switch (tipo) {
      case 'cheque': return <DollarSign className={colorClass} size={20} />;
      case 'cuenta': return <AlertTriangle className={colorClass} size={20} />;
      case 'clima': return <CloudRain className={colorClass} size={20} />;
      case 'evento': return <Calendar className={colorClass} size={20} />;
      case 'comercial': return <Info className={colorClass} size={20} />;
      default: return <Bell className={colorClass} size={20} />;
    }
  };

  const getActionButton = (tipo: string) => {
    switch (tipo) {
      case 'cheque': return 'Ver detalle';
      case 'cuenta': return 'Realizar pago';
      case 'clima': return 'Ver pronóstico';
      case 'evento': return 'Ver agenda';
      case 'comercial': return 'Descargar lista';
      default: return 'Revisar';
    }
  };

  const filteredAlertas = alertasDataState.filter((a: any) => activeFilter === 'todos' || a.nivel === activeFilter);

  if (view === 'config') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-10 bg-white border-b border-gray-100">
          <button onClick={() => setView('list')} className="text-gray-800 flex size-10 shrink-0 items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-gray-800 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">Configuración de Alertas</h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Master Toggle */}
          <div className="flex items-center gap-4 px-4 py-4 min-h-14 justify-between bg-white mt-2">
            <div className="flex items-center gap-4">
              <div className="text-[#3A5F4B] flex items-center justify-center rounded-lg bg-[#3A5F4B]/10 shrink-0 size-10">
                <BellRing size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-gray-800 text-base font-semibold leading-normal">Notificaciones Generales</p>
                <p className="text-gray-500 text-sm">Activar o desactivar todas</p>
              </div>
            </div>
            <div className="shrink-0">
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#3A5F4B] transition-colors duration-200">
                <div className="h-full w-[27px] rounded-full bg-white shadow-sm"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4"></div>

          {/* Severity Channels Section */}
          <div className="px-4 pt-6 pb-2">
            <h3 className="text-gray-800 text-lg font-bold leading-tight tracking-[-0.015em]">Canales por Severidad</h3>
            <p className="text-gray-500 text-sm mt-1">Configura cómo recibes cada nivel de alerta.</p>
          </div>

          {/* Info Level */}
          <div className="flex items-center gap-4 px-4 py-3 min-h-[72px] justify-between hover:bg-gray-50 cursor-pointer transition-colors rounded-lg mx-2">
            <div className="flex items-center gap-4">
              <div className="text-blue-600 flex items-center justify-center rounded-lg bg-blue-100 shrink-0 size-12">
                <Info size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-gray-800 text-base font-medium leading-normal line-clamp-1">Información</p>
                <p className="text-gray-500 text-sm font-normal leading-normal line-clamp-2">Push, Email</p>
              </div>
            </div>
            <div className="shrink-0 text-gray-400">
              <ChevronRight size={24} />
            </div>
          </div>

          {/* Warning Level */}
          <div className="flex items-center gap-4 px-4 py-3 min-h-[72px] justify-between hover:bg-gray-50 cursor-pointer transition-colors rounded-lg mx-2">
            <div className="flex items-center gap-4">
              <div className="text-orange-600 flex items-center justify-center rounded-lg bg-orange-100 shrink-0 size-12">
                <AlertTriangle size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-gray-800 text-base font-medium leading-normal line-clamp-1">Atención</p>
                <p className="text-gray-500 text-sm font-normal leading-normal line-clamp-2">Push, SMS</p>
              </div>
            </div>
            <div className="shrink-0 text-gray-400">
              <ChevronRight size={24} />
            </div>
          </div>

          {/* Critical Level */}
          <div className="flex items-center gap-4 px-4 py-3 min-h-[72px] justify-between hover:bg-gray-50 cursor-pointer transition-colors rounded-lg mx-2">
            <div className="flex items-center gap-4">
              <div className="text-red-600 flex items-center justify-center rounded-lg bg-red-100 shrink-0 size-12">
                <AlertOctagon size={24} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-gray-800 text-base font-medium leading-normal line-clamp-1">Inmediato</p>
                <p className="text-gray-500 text-sm font-normal leading-normal line-clamp-2">Push, Email, SMS, Llamada</p>
              </div>
            </div>
            <div className="shrink-0 text-gray-400">
              <ChevronRight size={24} />
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4 my-2"></div>

          {/* Categories Section */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-gray-800 text-lg font-bold leading-tight tracking-[-0.015em]">Categorías de Alerta</h3>
          </div>

          {/* Finance Category */}
          <div className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setView('config-finance')}>
            <div className="flex items-center gap-4 flex-1">
              <div className="text-[#3A5F4B] flex items-center justify-center rounded-lg bg-[#3A5F4B]/10 shrink-0 size-10">
                <DollarSign size={20} />
              </div>
              <p className="text-gray-800 text-base font-medium leading-normal flex-1">Finanzas</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#3A5F4B] transition-colors duration-200" onClick={e => e.stopPropagation()}>
                <div className="h-full w-[20px] rounded-full bg-white shadow-sm"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
              <div className="shrink-0 text-gray-400">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>

          {/* Logistics Category */}
          <div className="flex items-center gap-4 px-4 py-3 justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-[#3A5F4B] flex items-center justify-center rounded-lg bg-[#3A5F4B]/10 shrink-0 size-10">
                <Truck size={20} />
              </div>
              <p className="text-gray-800 text-base font-medium leading-normal flex-1">Logística</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#3A5F4B] transition-colors duration-200">
                <div className="h-full w-[20px] rounded-full bg-white shadow-sm"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
              <div className="shrink-0 text-gray-400 cursor-pointer">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>

          {/* Weather Category */}
          <div className="flex items-center gap-4 px-4 py-3 justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-[#3A5F4B] flex items-center justify-center rounded-lg bg-[#3A5F4B]/10 shrink-0 size-10">
                <Cloud size={20} />
              </div>
              <p className="text-gray-800 text-base font-medium leading-normal flex-1">Clima</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#3A5F4B] transition-colors duration-200">
                <div className="h-full w-[20px] rounded-full bg-white shadow-sm"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
              <div className="shrink-0 text-gray-400 cursor-pointer">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>

          {/* Clients Category */}
          <div className="flex items-center gap-4 px-4 py-3 justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-[#3A5F4B] flex items-center justify-center rounded-lg bg-[#3A5F4B]/10 shrink-0 size-10">
                <Users size={20} />
              </div>
              <p className="text-gray-800 text-base font-medium leading-normal flex-1">Clientes</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-gray-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#3A5F4B] transition-colors duration-200">
                <div className="h-full w-[20px] rounded-full bg-white shadow-sm"></div>
                <input type="checkbox" className="invisible absolute" />
              </label>
              <div className="shrink-0 text-gray-400 cursor-pointer">
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
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 py-3 shadow-sm rounded-t-xl flex items-center gap-3">
          <button onClick={() => setView('config')} className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold flex-1 text-center pr-10 text-gray-800">Configuración de Alertas</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pb-6 w-full space-y-6">
          {/* Intro Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#3A5F4B]/10 flex items-center justify-center shrink-0">
                <Wallet size={20} className="text-[#3A5F4B]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Alertas Financieras</h2>
                <p className="text-sm text-gray-500 mt-1">Configure notificaciones para saldos bajos, cheques y movimientos inusuales.</p>
              </div>
            </div>
          </div>

          {/* Threshold Section (Slider) */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-gray-800">Umbral de Saldo Mínimo</h3>
              <span className="bg-[#3A5F4B]/10 text-[#3A5F4B] px-3 py-1 rounded-full text-sm font-bold">$1,500</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Notificarme cuando el saldo operativo caiga por debajo de este monto.</p>
            <div className="relative w-full h-12 flex items-center">
              {/* Track background */}
              <div className="absolute w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#3A5F4B] w-[30%]"></div>
              </div>
              <input type="range" min="0" max="5000" step="100" defaultValue="1500" className="absolute w-full h-2 opacity-0 cursor-pointer z-10" />
              {/* Visual Thumb */}
              <div className="absolute left-[30%] w-6 h-6 bg-white border-2 border-[#3A5F4B] rounded-full shadow-md transform -translate-x-1/2 pointer-events-none flex items-center justify-center">
                <div className="w-2 h-2 bg-[#3A5F4B] rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-medium mt-1">
              <span>$0</span>
              <span>$5,000</span>
            </div>
          </section>

          {/* Frequency Section (Radio) */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-base text-gray-800 mb-4">Frecuencia de Notificación</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border border-[#3A5F4B] bg-[#3A5F4B]/5 rounded-xl cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <Zap size={20} className="text-[#3A5F4B]" />
                  <div>
                    <span className="block text-sm font-bold text-gray-800">Inmediata</span>
                    <span className="block text-xs text-gray-500">Al momento que ocurre el evento</span>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <input type="radio" name="frequency" defaultChecked className="peer h-5 w-5 border-gray-300 text-[#3A5F4B] focus:ring-[#3A5F4B]" />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-gray-400" />
                  <div>
                    <span className="block text-sm font-bold text-gray-800">Resumen Diario</span>
                    <span className="block text-xs text-gray-500">Un reporte al final del día (18:00)</span>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <input type="radio" name="frequency" className="peer h-5 w-5 border-gray-300 text-[#3A5F4B] focus:ring-[#3A5F4B]" />
                </div>
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <CalendarDays size={20} className="text-gray-400" />
                  <div>
                    <span className="block text-sm font-bold text-gray-800">Resumen Semanal</span>
                    <span className="block text-xs text-gray-500">Todos los viernes a las 17:00</span>
                  </div>
                </div>
                <div className="relative flex items-center">
                  <input type="radio" name="frequency" className="peer h-5 w-5 border-gray-300 text-[#3A5F4B] focus:ring-[#3A5F4B]" />
                </div>
              </label>
            </div>
          </section>

          {/* Quiet Hours Section */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Moon size={20} className="text-gray-800" />
                <h3 className="font-bold text-base text-gray-800">Horas de Silencio</h3>
              </div>
              {/* Toggle Switch */}
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A5F4B]"></div>
              </label>
            </div>
            <p className="text-sm text-gray-500 mb-6">Silenciar notificaciones durante este periodo. Las alertas críticas seguirán sonando.</p>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Inicio</label>
                <div className="relative">
                  <input type="time" defaultValue="22:00" className="block w-full rounded-lg border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-800 focus:border-[#3A5F4B] focus:ring-[#3A5F4B] font-bold shadow-sm" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Fin</label>
                <div className="relative">
                  <input type="time" defaultValue="07:00" className="block w-full rounded-lg border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-800 focus:border-[#3A5F4B] focus:ring-[#3A5F4B] font-bold shadow-sm" />
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
              className="w-full bg-[#3A5F4B] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#3A5F4B]/30 hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
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
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveMainTab('alertas')}
            className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2", activeMainTab === 'alertas' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <Bell size={18} />
            Alertas
          </button>
          <button
            onClick={() => setActiveMainTab('actividad')}
            className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2", activeMainTab === 'actividad' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <Activity size={18} />
            Actividad
          </button>
        </div>

        {activeMainTab === 'alertas' && (
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => setView('config')}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              title="Configuración de Alertas"
            >
              <Settings size={20} />
              <span className="hidden sm:inline">Configuración</span>
            </button>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-700 font-medium"
            >
              <Filter size={18} />
              Filtrar
            </button>
            <button
              onClick={openNewModal}
              className="flex-1 sm:flex-none bg-[#3A5F4B] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#2d4a3a] transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nueva Alerta</span>
            </button>
          </div>
        )}
      </div>

      {activeMainTab === 'alertas' ? (
        <>
          <div className="hidden md:flex bg-white p-1 rounded-lg border border-gray-200 w-fit">
            <button onClick={() => setActiveFilter('todos')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'todos' ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:text-gray-700")}>Todas</button>
            <button onClick={() => setActiveFilter('accion')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'accion' ? "bg-red-50 text-red-700" : "text-gray-500 hover:text-gray-700")}>Acción</button>
            <button onClick={() => setActiveFilter('atencion')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'atencion' ? "bg-orange-50 text-orange-700" : "text-gray-500 hover:text-gray-700")}>Atención</button>
            <button onClick={() => setActiveFilter('informativa')} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", activeFilter === 'informativa' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700")}>Informativas</button>
          </div>

          <div className="space-y-4">
            {filteredAlertas.map((alerta: any) => (
              <div key={alerta.id} className={cn("rounded-xl p-5 border transition-all hover:shadow-md", getNivelStyles(alerta.nivel))}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      {getIcon(alerta.tipo, alerta.nivel)}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getNivelBadge(alerta.nivel)}
                          <span className="text-xs text-gray-500">{alerta.fecha}</span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg pr-8">{alerta.titulo}</h3>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === alerta.id ? null : alerta.id); }}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors absolute top-0 right-0"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeDropdown === alerta.id && (
                          <div className="absolute right-0 top-8 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditClick(alerta); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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

                    <p className="text-gray-600 text-sm">{alerta.contexto}</p>

                    {/* Contextual Metadata */}
                    {alerta.progreso && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">Uso de cuenta</span>
                          <span className="font-bold text-red-600">{alerta.progreso}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${alerta.progreso}%` }}></div>
                        </div>
                      </div>
                    )}

                    {alerta.monto && (
                      <div className="mt-2 inline-block bg-white px-3 py-1 rounded-md border border-gray-200 text-sm font-bold text-gray-800">
                        {alerta.monto}
                      </div>
                    )}

                    {alerta.temperatura && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-white px-3 py-1 rounded-md border border-gray-200 text-sm font-bold text-gray-800">
                        <Thermometer size={16} className="text-blue-500" />
                        {alerta.temperatura}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end mt-4 sm:mt-0 border-t sm:border-t-0 sm:border-l border-gray-200/50 pt-4 sm:pt-0 sm:pl-4 gap-2 min-w-[140px]">
                    <button
                      onClick={() => handleAction(alerta.titulo, alerta.id)}
                      className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      {getActionButton(alerta.tipo)}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alerta.id)}
                      className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Descartar
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="bg-white rounded-t-2xl p-6 relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800">Filtrar Alertas</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setActiveFilter('todos'); setShowMobileFilters(false); }}
                className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border", activeFilter === 'todos' ? "border-[#3A5F4B] bg-[#3A5F4B]/5 text-[#3A5F4B]" : "border-gray-200 text-gray-700")}
              >
                Todas las alertas
              </button>
              <button
                onClick={() => { setActiveFilter('accion'); setShowMobileFilters(false); }}
                className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border flex items-center justify-between", activeFilter === 'accion' ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-700")}
              >
                Acción Inmediata
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
              </button>
              <button
                onClick={() => { setActiveFilter('atencion'); setShowMobileFilters(false); }}
                className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border flex items-center justify-between", activeFilter === 'atencion' ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-700")}
              >
                Atención
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              </button>
              <button
                onClick={() => { setActiveFilter('informativa'); setShowMobileFilters(false); }}
                className={cn("w-full text-left px-4 py-3 rounded-xl font-medium border flex items-center justify-between", activeFilter === 'informativa' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700")}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              required
              value={alertForm.titulo}
              onChange={e => setAlertForm({ ...alertForm, titulo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              placeholder="Ej: Cheque próximo a vencer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contexto / Descripción</label>
            <textarea
              required
              rows={3}
              value={alertForm.contexto}
              onChange={e => setAlertForm({ ...alertForm, contexto: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none resize-none"
              placeholder="Detalles de la alerta..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
              <select
                value={alertForm.nivel}
                onChange={e => setAlertForm({ ...alertForm, nivel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none bg-white"
              >
                <option value="informativa">Informativa</option>
                <option value="atencion">Atención</option>
                <option value="accion">Acción Inmediata</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Icono</label>
              <select
                value={alertForm.tipo}
                onChange={e => setAlertForm({ ...alertForm, tipo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none bg-white"
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
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
