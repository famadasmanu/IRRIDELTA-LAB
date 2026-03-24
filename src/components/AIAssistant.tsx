import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Leaf, ArrowLeft, MessageSquare, Phone, PackageCheck, Wrench, Search, Contact, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useNavigate } from 'react-router-dom';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  isMenu?: boolean;
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('inicio');
  const [tempData, setTempData] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { data: proyectosRaw } = useFirestoreCollection<any>('trabajos_portfolio');
  const proyectosActivos = (proyectosRaw || []).filter((p: any) => p.estado !== 'Completado');
  const clientesActivos = Array.from(new Set(proyectosActivos.map((p: any) => p.cliente))).filter(Boolean) as string[];

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStep, isOpen]);

  // Manejar Reseteo al Inicio
  const resetToMenu = () => {
    setCurrentStep('inicio');
    setTempData({});
    setMessages(prev => [
      ...prev, 
      { id: Date.now().toString(), sender: 'bot', text: 'Volvimos al menú principal. ¿Qué deseas hacer?', isMenu: true }
    ]);
  };

  // Inicialización
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          id: Date.now().toString(), 
          sender: 'bot', 
          text: '¡Hola! Soy tu asistente de Argent Software 🌱. Estoy para ayudarte a gestionar de forma rápida.', 
          isMenu: true 
        }
      ]);
    }
  }, []);

  // Función para manejar acciones de los botones del chatbot
  const handleAction = (action: string, textObj?: string) => {
    if (textObj) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: textObj }]);
    }

    setTimeout(() => {
      switch (action) {
        case 'consultar_stock':
          setCurrentStep('consultar_stock_paso1');
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Por favor, selecciona el cliente o sede a gestionar:' }]);
          break;
        case 'pedir_reposicion':
          setCurrentStep('consultar_stock_paso1');
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Selecciona la obra para la cual necesitas pedir reposición:' }]);
          break;
        case 'estado_pedido':
          setCurrentStep('estado_pedido_view');
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Aquí tienes los estados de los pedidos más recientes:' }]);
          break;
        case 'soporte':
          setCurrentStep('soporte_paso1');
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Entendido. ¿Qué tipo de problema estás experimentando?' }]);
          break;
        case 'hablar_persona':
          setCurrentStep('hablar_persona_view');
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Para hablar con un representante puedes usar nuestras vías directas:' }]);
          break;
        default:
          break;
      }
    }, 400);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 p-4 rounded-full bg-accent text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group",
          isOpen ? "opacity-0 pointer-events-none scale-50" : "opacity-100"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-20" />
        <div className="relative z-10">
          <Leaf size={14} className="absolute -top-2 left-1/2 -translate-x-1/2 text-green-300 transform -rotate-12 group-hover:rotate-12 transition-transform" />
          <Bot size={28} className="translate-y-1" />
        </div>
      </button>

      <div 
        className={cn(
          "fixed bottom-6 right-6 z-[100] w-[350px] sm:w-[400px] h-[600px] max-h-[85vh] bg-card flex flex-col rounded-3xl shadow-2xl border border-bd-lines overflow-hidden transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-accent text-white p-4 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm relative">
              <Leaf size={12} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-green-300 transform -rotate-12" />
              <Bot size={24} className="text-white mt-0.5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-1">Asistente Virtual</h3>
              <p className="text-green-100 text-xs font-medium">Gestión y Soporte Argent Software</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentStep !== 'inicio' && (
              <button onClick={resetToMenu} className="p-1.5 sm:p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors" title="Volver al inicio">
                <ArrowLeft size={16} />
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-1.5 sm:p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-[#0f172a]/50">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full", msg.sender === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl p-3 shadow-sm text-sm border",
                msg.sender === 'user' 
                  ? "bg-accent text-white rounded-br-none border-[#2e4a3b]" 
                  : "bg-white dark:bg-slate-800 text-tx-primary border-bd-lines rounded-bl-none"
              )}>
                <p className="leading-relaxed font-medium">{msg.text}</p>
                
                {msg.isMenu && msg.sender === 'bot' && currentStep === 'inicio' && (
                  <div className="mt-4 space-y-2 flex flex-col">
                    <button onClick={() => handleAction('consultar_stock', '📦 Consultar stock')} className="w-full text-left p-2.5 bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl text-accent dark:text-[#52856A] text-xs font-bold flex items-center gap-2 transition-colors">
                      <Search size={14} /> 1. Consultar stock
                    </button>
                    <button onClick={() => handleAction('pedir_reposicion', '🔄 Pedir reposición')} className="w-full text-left p-2.5 bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl text-accent dark:text-[#52856A] text-xs font-bold flex items-center gap-2 transition-colors">
                      <PackageCheck size={14} /> 2. Pedir reposición
                    </button>
                    <button onClick={() => handleAction('estado_pedido', '📋 Estado de pedido')} className="w-full text-left p-2.5 bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl text-accent dark:text-[#52856A] text-xs font-bold flex items-center gap-2 transition-colors">
                      <HelpCircle size={14} /> 3. Estado de pedido
                    </button>
                    <button onClick={() => handleAction('soporte', '🛠️ Soporte técnico')} className="w-full text-left p-2.5 bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl text-accent dark:text-[#52856A] text-xs font-bold flex items-center gap-2 transition-colors">
                      <Wrench size={14} /> 4. Soporte técnico
                    </button>
                    <button onClick={() => handleAction('hablar_persona', '📞 Hablar con una persona')} className="w-full text-left p-2.5 bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl text-accent dark:text-[#52856A] text-xs font-bold flex items-center gap-2 transition-colors">
                      <Contact size={14} /> 5. Hablar con una persona
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Vistas Dinámicas Dependiendo del Flujo */}
          
          {/* -------------- 1. SELECCIONAR CLIENTE -------------- */}
          {currentStep === 'consultar_stock_paso1' && (
            <div className="bg-card border border-bd-lines rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <label className="text-xs font-bold text-tx-secondary uppercase mb-2 block">Seleccionar Usuario / Cliente</label>
              <select 
                className="w-full p-2.5 bg-main border border-bd-lines rounded-xl text-sm font-medium focus:outline-none mb-3 text-tx-primary cursor-pointer hover:border-accent transition-colors"
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  setTempData({...tempData, clienteSeleccionado: selectedVal});
                  setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: `Cliente ${selectedVal} seleccionado. Ahora elige la obra asignada:` }]);
                  setTimeout(() => setCurrentStep('consultar_stock_paso2'), 400);
                }}
                defaultValue=""
              >
                <option value="" disabled>Seleccione cliente primero...</option>
                <option value="Depósito Central">Depósito Central Argent Software</option>
                {clientesActivos.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* -------------- 2. SELECCIONAR OBRA -------------- */}
          {currentStep === 'consultar_stock_paso2' && (
            <div className="bg-card border border-bd-lines rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <label className="text-xs font-bold text-tx-secondary uppercase mb-2 block">Obra de {tempData.clienteSeleccionado}</label>
              <select 
                className="w-full p-2.5 bg-main border border-bd-lines rounded-xl text-sm font-medium focus:outline-none mb-3 text-tx-primary cursor-pointer hover:border-accent transition-colors"
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  setTempData({...tempData, obraSeleccionada: selectedVal});
                  setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: `Abriendo la gestión de la Obra: ${selectedVal}...` }]);
                  
                  // Retraso visual de la acción y redirección real
                  setTimeout(() => {
                    localStorage.setItem('inventario_search_query', selectedVal);
                    navigate('/inventario');
                    setIsOpen(false);
                    setTimeout(resetToMenu, 500); // Volver al inicio invisiblemente
                  }, 1200);
                }}
                defaultValue=""
              >
                <option value="" disabled>Seleccione proyecto p/ gestionar...</option>
                {proyectosActivos
                  .filter((p: any) => p.cliente === tempData.clienteSeleccionado)
                  .map((p: any) => (
                    <option key={p.id} value={p.titulo}>{p.titulo}</option>
                  ))}
                {tempData.clienteSeleccionado === 'Depósito Central' && (
                  <option value="Central">Ver Inventario Central Completo</option>
                )}
              </select>
            </div>
          )}

          {/* -------------- 2. ESTADO DE PEDIDO -------------- */}
          {currentStep === 'estado_pedido_view' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-card border border-bd-lines rounded-2xl p-3 shadow-sm border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-tx-primary">Pedido #4022</h4>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full dark:bg-amber-900/30 dark:text-amber-400">En Tránsito</span>
                </div>
                <p className="text-xs text-tx-secondary mb-1">25x Bentonita, 1x Bomba sumergible</p>
                <p className="text-[10px] font-medium text-tx-secondary opacity-80">Destino: Barrio Nordelta</p>
              </div>
              <div className="bg-card border border-bd-lines rounded-2xl p-3 shadow-sm border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-tx-primary">Pedido #4019</h4>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">Entregado</span>
                </div>
                <p className="text-xs text-tx-secondary mb-1">Mechas Perforación 10mm</p>
                <p className="text-[10px] font-medium text-tx-secondary opacity-80">Hace 2 días • Central Escobar</p>
              </div>
            </div>
          )}

          {/* -------------- 4. SOPORTE TÉCNICO -------------- */}
          {currentStep === 'soporte_paso1' && (
            <div className="bg-card border border-bd-lines rounded-2xl p-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-2">
              <button onClick={() => { setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Se ha notificado al mecánico de turno. Tu prioridad es ALTA. En breve te contactarán.' }]); resetToMenu(); }} className="w-full text-left p-3 hover:bg-main rounded-xl border border-transparent hover:border-bd-lines transition-all">
                <p className="text-sm font-bold text-red-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> Falla crítica de Maquinaria</p>
                <p className="text-[10px] text-tx-secondary mt-1 ml-4">Detiene la obra o perforación por completo.</p>
              </button>
              <div className="h-[1px] bg-bd-lines w-full" />
              <button onClick={() => { setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Ticket "Problema de App" generado. El soporte de sistemas lo revisará.' }]); resetToMenu(); }} className="w-full text-left p-3 hover:bg-main rounded-xl border border-transparent hover:border-bd-lines transition-all">
                <p className="text-sm font-bold text-tx-primary ml-4">Problema con la Aplicación</p>
                <p className="text-[10px] text-tx-secondary mt-1 ml-4">No puedo ver datos o error del sistema.</p>
              </button>
              <div className="h-[1px] bg-bd-lines w-full" />
               <button onClick={() => { setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Registrado. ¿Deseas detallar algo más? Envialo vía WhatsApp con el botón Contacto Directo.' }]); resetToMenu(); }} className="w-full text-left p-3 hover:bg-main rounded-xl border border-transparent hover:border-bd-lines transition-all">
                <p className="text-sm font-bold text-tx-primary ml-4">Duda sobre procedimientos</p>
                <p className="text-[10px] text-tx-secondary mt-1 ml-4">Otras consultas no urgentes.</p>
              </button>
            </div>
          )}

          {/* -------------- 5. HABLAR CON ALGUIEN -------------- */}
          {currentStep === 'hablar_persona_view' && (
             <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
               <button onClick={() => window.open('https://wa.me/', '_blank')} className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                 <MessageSquare size={24} className="text-emerald-600" />
                 <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">WhatsApp Urgente</span>
               </button>
               <button onClick={() => window.open('tel:0800', '_blank')} className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
                 <Phone size={24} className="text-blue-600" />
                 <span className="text-xs font-bold text-blue-800 dark:text-blue-400">Línea Directa (Llamar)</span>
               </button>
             </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="p-3 bg-card border-t border-bd-lines shrink-0 text-center">
          <p className="text-[10px] font-bold text-tx-secondary">Soporte Operativo Integrado • Argent Software</p>
        </div>
      </div>
    </>
  );
}
