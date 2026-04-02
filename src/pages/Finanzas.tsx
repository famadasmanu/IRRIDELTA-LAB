import React, { useState } from 'react';
import {
 ArrowLeft as ArrowBack,
 PlusCircle as AddCircle,
 Wallet as AccountBalanceWallet,
 TrendingUp,
 AlertTriangle as Warning,
 Search,
 Filter as FilterList,
 Landmark as AccountBalance,
 CheckCircle,
 Check as Done,
 RefreshCw as Refresh,
 Banknote as Payments,
 CreditCard,
 HardHat as Engineering,
 ChevronDown as ExpandMore,
 X as Close,
 MoreVertical,
 Calendar,
 PieChart,
 Package,
 Leaf,
 Mountain,
 Droplets,
 Download,
 Share,
 Edit2,
 Eye,
 EyeOff,
 DollarSign,
 Activity,
 TrendingDown,
 Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';



export default function Finanzas() {
 const [activeTab, setActiveTab] = useState<'rentabilidad' | 'pagos' | 'cheques'>('rentabilidad');
 const [showFinancialStatus, setShowFinancialStatus] = useState(() => {
 return sessionStorage.getItem('showFinancialStatus') !== 'false';
 });

 const toggleFinancialStatus = () => {
 setShowFinancialStatus(prev => {
 const newState = !prev;
 sessionStorage.setItem('showFinancialStatus', String(newState));
 return newState;
 });
 };

 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const [searchCheque, setSearchCheque] = useState('');
 const [chequeFilterStatus, setChequeFilterStatus] = useState<string | null>(null);
 const [isChequeFilterOpen, setIsChequeFilterOpen] = useState(false);

 const [isPagoDateOpen, setIsPagoDateOpen] = useState(false);
 const [isPagoMethodOpen, setIsPagoMethodOpen] = useState(false);
 const [pagoDateFilter, setPagoDateFilter] = useState<string | null>(null);
 const [pagoMethodFilter, setPagoMethodFilter] = useState<string | null>(null);

 const [isAddChequeModalOpen, setIsAddChequeModalOpen] = useState(false);
 const [newChequeBanco, setNewChequeBanco] = useState('');
 const [newChequeTitular, setNewChequeTitular] = useState('');
 const [newChequeAmount, setNewChequeAmount] = useState('');
 const [newChequeDate, setNewChequeDate] = useState('');
 const [newChequeRef, setNewChequeRef] = useState('');

 const [isEditChequeModalOpen, setIsEditChequeModalOpen] = useState(false);
 const [editingChequeId, setEditingChequeId] = useState<string | null>(null);
 const [editChequeBanco, setEditChequeBanco] = useState('');
 const [editChequeTitular, setEditChequeTitular] = useState('');
 const [editChequeAmount, setEditChequeAmount] = useState('');
 const [editChequeDate, setEditChequeDate] = useState('');

 const [isAddPagoModalOpen, setIsAddPagoModalOpen] = useState(false);
 const [newPagoRecipient, setNewPagoRecipient] = useState('');
 const [newPagoAmount, setNewPagoAmount] = useState('');
 const [newPagoDate, setNewPagoDate] = useState('');
 const [newPagoMethod, setNewPagoMethod] = useState('');
 const [newPagoProject, setNewPagoProject] = useState('');

type Cheque = {
 id: string;
 banco: string;
 titular: string;
 ref: string;
 status: string;
 amount: string;
 date: string;
 statusColor: string;
};

type Pago = {
 id: string;
 recipient: string;
 amount: number;
 date: string;
 method: string;
 ref: string;
 status: string;
 icon: string;
 color: string;
 projectName: string | null;
};

 const { data: chequesRaw, add: addChequeToDB, update: updateChequeInDB, remove: removeChequeFromDB } = useFirestoreCollection<Cheque>('cheques');
 const chequesData = chequesRaw;

 const { data: pagosRaw, add: addPagoToDB } = useFirestoreCollection<Pago>('pagos');
 const pagosData = pagosRaw;

 const { data: trabajosRaw } = useFirestoreCollection<any>('trabajos_portfolio');

 const filteredCheques = chequesData.filter(c => {
 const matchesSearch = c.banco.toLowerCase().includes(searchCheque.toLowerCase()) || c.ref.toLowerCase().includes(searchCheque.toLowerCase());
 const matchesStatus = chequeFilterStatus ? c.status === chequeFilterStatus : true;
 return matchesSearch && matchesStatus;
 });

 const filteredPagos = pagosData.filter(p => {
 const matchesDate = pagoDateFilter ? p.date.includes(pagoDateFilter) : true;
 const matchesMethod = pagoMethodFilter ? p.method === pagoMethodFilter : true;
 return matchesDate && matchesMethod;
 });

 const handleDepositar = async (id: string) => {
 const cheque = chequesData.find(c => c.id === id);
 if (!cheque) return;

 if (cheque.status === 'Depositado') {
 await updateChequeInDB(id, { status: 'Pendiente', statusColor: 'yellow', date: 'Vence en 3 días' });
 } else {
 await updateChequeInDB(id, { status: 'Depositado', statusColor: 'green', date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) });
 }
 showToast('Estado del cheque actualizado');
 };

 const handleDeleteCheque = async (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  if (window.confirm('¿Estás seguro de que deseas eliminar este cheque permanentemente?')) {
    await removeChequeFromDB(id);
    showToast('Cheque eliminado');
  }
 };

 const handleAddCheque = async () => {
 if (!newChequeBanco.trim() || !newChequeAmount.trim() || !newChequeTitular.trim() || !newChequeDate.trim()) {
 showToast('Por favor, completa los campos requeridos (Banco, Titular, Monto, Fecha)');
 return;
 }

 const newCheque: Omit<Cheque, 'id'> = {
 banco: newChequeBanco,
 titular: newChequeTitular,
 ref: newChequeRef || `#${Math.floor(Math.random() * 10000)}`,
 status: 'Pendiente',
 amount: newChequeAmount,
 date: newChequeDate,
 statusColor: 'yellow'
 };

 await addChequeToDB(newCheque);
 setIsAddChequeModalOpen(false);
 setNewChequeBanco('');
 setNewChequeTitular('');
 setNewChequeAmount('');
 setNewChequeDate('');
 setNewChequeRef('');
 showToast('Cheque agregado exitosamente');
 };

 const handleAddPago = async () => {
 if (!newPagoRecipient.trim() || !newPagoAmount.trim() || !newPagoDate.trim()) {
 showToast('Por favor, completa los campos requeridos mínimos (Destinatario, Monto, Fecha)');
 return;
 }

 const amountCost = parseFloat(newPagoAmount.replace(/[^0-9.-]+/g, ""));



 const newPago: Omit<Pago, 'id'> = {
 recipient: newPagoRecipient,
 amount: amountCost,
 date: newPagoDate,
 method: newPagoMethod || 'Transferencia',
 ref: '',
 status: 'Acreditado',
 icon: 'Payments',
 color: 'blue',
 projectName: newPagoProject || null
 };

 await addPagoToDB(newPago);
 setIsAddPagoModalOpen(false);
 setNewPagoRecipient('');
 setNewPagoAmount('');
 setNewPagoDate('');
 setNewPagoMethod('');
 setNewPagoProject('');
 showToast('Gasto agregado exitosamente');
 };

 const handleEditCheque = (id: string) => {
 const cheque = chequesData.find(c => c.id === id);
 if (!cheque) return;

 setEditingChequeId(id);
 setEditChequeBanco(cheque.banco);
 setEditChequeTitular(cheque.titular || '');
 setEditChequeAmount(cheque.amount);
 setEditChequeDate(cheque.date);
 setIsEditChequeModalOpen(true);
 };

 const handleSaveChequeEdit = async () => {
 if (editingChequeId === null) return;

 await updateChequeInDB(editingChequeId, { banco: editChequeBanco, titular: editChequeTitular, amount: editChequeAmount, date: editChequeDate });
 setIsEditChequeModalOpen(false);
 showToast('Cheque actualizado');
 };

 const showToast = (message: string) => {
 setToastMessage(message);
 setTimeout(() => setToastMessage(null), 3000);
 };

 // --- Cálculos de Estado Financiero Avanzado --- //
 const pendingChequesList = chequesData.filter(c => c.status === 'Pendiente');
 const totalChequesAmount = pendingChequesList.reduce((sum, c) => {
 const val = parseFloat(c.amount.replace(/[^0-9.-]+/g, ""));
 return sum + (isNaN(val) ? 0 : val);
 }, 0);
 const chequesProntoVencer = pendingChequesList.filter(c => c.date.toLowerCase().includes('hoy') || c.date.toLowerCase().includes('día') || c.date.toLowerCase().includes('vence')).length;
 
 // Valores reales desde proyectos (Obras)
 const totalEgresosObras = trabajosRaw.reduce((sum, t) => {
   const val = parseFloat(String(t.gastos || 0).replace(/[^0-9.-]+/g, ""));
   return sum + (isNaN(val) ? 0 : val);
 }, 0);
 const totalIngresosObras = trabajosRaw.reduce((sum, t) => {
   const gastos = parseFloat(String(t.gastos || 0).replace(/[^0-9.-]+/g, ""));
   const rent = parseFloat(String(t.rentabilidad || 0).replace(/[^0-9.-]+/g, ""));
   if (rent === 0) return sum + gastos;
   if (rent <= 100 && rent > 0) {
       // Si es un porcentaje, calculamos ingresos = gastos / (1 - margen)
       const ing = gastos / (1 - (rent / 100));
       return sum + (isNaN(ing) ? 0 : ing);
   } else {
       // Si parece ser un valor absoluto de rentabilidad en dinero
       return sum + gastos + rent;
   }
 }, 0);
 const rentabilidadGlobal = totalIngresosObras > 0 
   ? (((totalIngresosObras - totalEgresosObras) / totalIngresosObras) * 100).toFixed(1)
   : '0.0';

 // Egresos calculados desde comprobantes de pago reales 
 const totalPagosRegistrados = pagosData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
 
 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">Finanzas</h1>
 </div>

 <div className="flex bg-main p-1 rounded-xl border border-bd-lines shadow-sm w-full md:w-max mx-auto md:mx-0 overflow-x-auto hide-scrollbar">
 <button
 onClick={() => setActiveTab('rentabilidad')}
 className={cn(
 "px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 md:flex-none",
 activeTab === 'rentabilidad' ? "bg-card text-accent shadow-sm" : "text-tx-secondary hover:text-tx-primary"
 )}
 >
 Rentabilidad de Obra
 </button>
 <button
 onClick={() => setActiveTab('pagos')}
 className={cn(
 "px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex flex-col items-center justify-center gap-0.5 flex-1 md:flex-none",
 activeTab === 'pagos' ? "bg-card text-accent shadow-sm" : "text-tx-secondary hover:text-tx-primary"
 )}
 >
 <span>Ingresos / Egresos</span>
 <span className="text-[10px] opacity-70 font-medium">Extra (Prov, Transf, Com)</span>
 </button>
 <button
 onClick={() => setActiveTab('cheques')}
 className={cn(
 "px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 md:flex-none",
 activeTab === 'cheques' ? "bg-card text-accent shadow-sm" : "text-tx-secondary hover:text-tx-primary"
 )}
 >
 Cheques
 </button>
 </div>

 {activeTab === 'cheques' && (
 <div className="space-y-6">
 <div className="flex justify-end mb-4">
 <button
 onClick={() => setIsAddChequeModalOpen(true)}
 className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#15803d] transition-colors"
 >
 <AddCircle size={20} />
 Agregar Cheque
 </button>
 </div>
 {/* Dashboard Widgets */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Card 1: Total */}
 <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-accent to-[#2c4a3b] p-5 text-white shadow-lg">
 <div className="flex justify-between items-start">
 <div className="flex flex-col gap-1">
 <span className="text-[#ffffffcc] text-sm font-medium">Total en Cartera</span>
 <span className="text-3xl font-bold tracking-tight">${totalChequesAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
 </div>
 <div className="rounded-full bg-[#ffffff33] p-2 backdrop-blur-sm">
 <AccountBalanceWallet className="text-white" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <span className="flex items-center rounded-full bg-[#ffffff33] px-2 py-0.5 text-xs font-semibold text-white">
 <TrendingUp size={14} className="mr-1" />
 Activo
 </span>
 <span className="text-xs text-[#ffffffb3]">Calculado en tiempo real</span>
 </div>
 </div>

 {/* Card 2: Vencimientos */}
 <div className="flex flex-col justify-between rounded-xl bg-card p-5 shadow-sm border border-bd-lines">
 <div className="flex justify-between items-start">
 <div className="flex flex-col gap-1">
 <span className="text-tx-secondary text-sm font-medium">Próximos a Vencer</span>
 <span className="text-3xl font-bold text-tx-primary">{chequesProntoVencer} {chequesProntoVencer === 1 ? 'Cheque' : 'Cheques'}</span>
 </div>
 <div className="rounded-full bg-orange-100 p-2">
 <Warning className="text-orange-600" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <span className="text-xs font-medium text-orange-600">Requieren atención pronto</span>
 </div>
 </div>
 </div>

 {/* Filters & Search */}
 <div className="flex items-center gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-secondary" size={20} />
 <input
 type="text"
 placeholder="Buscar por banco o #..."
 value={searchCheque}
 onChange={(e) => setSearchCheque(e.target.value)}
 className="w-full rounded-lg border border-bd-lines bg-card py-2.5 pl-10 pr-4 text-sm text-tx-primary shadow-sm focus:ring-2 focus:ring-accent focus:outline-none"
 />
 </div>
 <div className="relative">
 <button
 onClick={() => setIsChequeFilterOpen(!isChequeFilterOpen)}
 className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm border transition-colors", chequeFilterStatus ? "bg-accent text-white border-accent" : "bg-card border-bd-lines text-tx-secondary hover:text-accent")}
 >
 <FilterList size={20} />
 </button>
 {isChequeFilterOpen && (
 <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-bd-lines py-2 z-20">
 <button onClick={() => { setChequeFilterStatus(null); setIsChequeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Todos</button>
 <button onClick={() => { setChequeFilterStatus('Pendiente'); setIsChequeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Pendientes</button>
 <button onClick={() => { setChequeFilterStatus('Depositado'); setIsChequeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Depositados</button>
 </div>
 )}
 </div>
 </div>

 {/* Check List */}
 <div className="flex flex-col gap-3">
 {filteredCheques.length === 0 ? (
 <div className="text-center py-8 text-tx-secondary">
 No se encontraron cheques con esos criterios
 </div>
 ) : (
 filteredCheques.map(cheque => (
 <div key={cheque.id} className={cn("group relative flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm border border-bd-lines transition-all hover:shadow-md", cheque.statusColor === 'green' && "opacity-75")}>
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-3">
 <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", cheque.statusColor === 'yellow' ? "bg-blue-50 text-blue-600" : "bg-main text-tx-secondary")}>
 <AccountBalance size={20} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <p className="font-bold text-tx-primary">{cheque.banco}</p>
 <button onClick={() => handleEditCheque(cheque.id)} className="text-tx-secondary hover:text-accent transition-colors p-1 rounded-full hover:bg-main">
 <Edit2 size={14} />
 </button>
 <button onClick={(e) => handleDeleteCheque(cheque.id, e)} className="text-tx-secondary hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
 <Trash2 size={14} />
 </button>
 </div>
 <p className="text-sm font-medium text-tx-secondary">{cheque.titular}</p>
 <p className="text-xs text-tx-secondary font-medium">Ref: {cheque.ref} · <span className={cheque.date.includes('Vence Hoy') ? "text-orange-600" : ""}>{cheque.date}</span></p>
 </div>
 </div>
 <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", cheque.statusColor === 'yellow' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700")}>{cheque.status}</span>
 </div>
 <div className="flex items-end justify-between border-t border-bd-lines pt-3">
 <div>
 <p className="text-xs text-tx-secondary">Monto</p>
 <p className="text-lg font-bold text-tx-primary">{cheque.amount}</p>
 </div>
 {cheque.statusColor === 'yellow' ? (
 <button
 onClick={() => handleDepositar(cheque.id)}
 className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#15803d] active:scale-95 transition-all"
 >
 <CheckCircle size={18} />
 Depositar
 </button>
 ) : (
 <button
 onClick={() => handleDepositar(cheque.id)}
 className="flex items-center gap-1.5 rounded-lg bg-main px-3 py-1.5 text-sm font-semibold text-tx-secondary hover:bg-gray-200 active:scale-95 transition-all"
 >
 <Refresh size={18} />
 Deshacer
 </button>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}

 {activeTab === 'pagos' && (
 <div className="space-y-6">
 {/* Filters Scroll */}
 <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
 <div className="relative">
 <button
 onClick={() => setIsPagoDateOpen(!isPagoDateOpen)}
 className={cn("flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors", pagoDateFilter ? "bg-accent text-white" : "bg-main text-tx-primary hover:bg-gray-200")}
 >
 <span className="text-xs font-semibold whitespace-nowrap">{pagoDateFilter || 'Rango de Fechas'}</span>
 <ExpandMore size={16} />
 </button>
 {isPagoDateOpen && (
 <div className="absolute top-full left-0 mt-2 w-40 bg-card rounded-xl shadow-lg border border-bd-lines py-2 z-20">
 <button onClick={() => { setPagoDateFilter(null); setIsPagoDateOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Todas</button>
 <button onClick={() => { setPagoDateFilter('Oct'); setIsPagoDateOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Octubre</button>
 <button onClick={() => { setPagoDateFilter('Nov'); setIsPagoDateOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Noviembre</button>
 </div>
 )}
 </div>

 <div className="relative">
 <button
 onClick={() => setIsPagoMethodOpen(!isPagoMethodOpen)}
 className={cn("flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors", pagoMethodFilter ? "bg-accent text-white" : "bg-main text-tx-primary hover:bg-gray-200")}
 >
 <span className="text-xs font-semibold whitespace-nowrap">{pagoMethodFilter || 'Método'}</span>
 <ExpandMore size={16} />
 </button>
 {isPagoMethodOpen && (
 <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-bd-lines py-2 z-20">
 <button onClick={() => { setPagoMethodFilter(null); setIsPagoMethodOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Todos</button>
 <button onClick={() => { setPagoMethodFilter('Cheque'); setIsPagoMethodOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Cheque</button>
 <button onClick={() => { setPagoMethodFilter('Transferencia'); setIsPagoMethodOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Transferencia</button>
 </div>
 )}
 </div>

 {(pagoDateFilter || pagoMethodFilter) && (
 <button
 onClick={() => { setPagoDateFilter(null); setPagoMethodFilter(null); }}
 className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-red-50 text-red-600 px-4 border border-red-100 hover:bg-red-100 transition-colors"
 >
 <span className="text-xs font-semibold whitespace-nowrap">Limpiar</span>
 <Close size={16} />
 </button>
 )}
 </div>

 {/* Summary Card */}
 <div className="bg-accent rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
 <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#ffffff1a] rounded-full blur-2xl"></div>
 <p className="text-sm font-medium opacity-80 mb-1">Total Pagos Registrados</p>
 <div className="flex items-end gap-2">
 <h2 className="text-3xl font-bold tracking-tight">${totalPagosRegistrados.toLocaleString('es-AR', {minimumFractionDigits: 2})}</h2>
 <span className="text-sm font-medium mb-1.5 opacity-90">USD/ARS</span>
 </div>
 <div className="mt-4 flex gap-4">
 <div className="flex items-center gap-1.5 text-xs bg-[#ffffff33] px-2 py-1 rounded-lg">
 <TrendingUp size={16} />
 <span>Representa {pagosData.length} transacciones documentadas</span>
 </div>
 </div>
 </div>

 {/* Section: This Month */}
 <div>
 <div className="flex justify-between items-center mb-3">
 <h2 className="text-sm font-bold text-tx-secondary uppercase tracking-wider">Este Mes</h2>
 <button
 onClick={() => setIsAddPagoModalOpen(true)}
 className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition-colors"
 >
 <AddCircle size={16} />
 Registrar Gasto
 </button>
 </div>
 <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-bd-lines mb-6">
 {filteredPagos.length === 0 ? (
 <div className="text-center py-8 text-tx-secondary">
 No se encontraron pagos con esos criterios
 </div>
 ) : (
 filteredPagos.map(pago => (
 <div key={pago.id} className="flex items-center gap-4 p-4 hover:bg-main transition-colors border-b border-bd-lines last:border-0 cursor-pointer">
 <div className={cn("flex items-center justify-center rounded-lg shrink-0 h-12 w-12", pago.color === 'green' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
 {pago.icon === 'Payments' ? <Payments size={24} /> : <AccountBalance size={24} />}
 </div>
 <div className="flex flex-col flex-1 min-w-0">
 <div className="flex justify-between items-start">
 <p className="text-tx-primary text-base font-semibold truncate pr-2">{pago.recipient}</p>
 <p className="text-tx-primary text-base font-bold whitespace-nowrap">-${pago.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
 </div>
 <div className="flex justify-between items-center mt-0.5">
 <p className="text-tx-secondary text-xs font-medium flex items-center gap-1">
 {pago.date} • {pago.method} {pago.ref && `${pago.ref}`}
 </p>
 <div className="flex items-center gap-2">
 {pago.projectName && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded pl-1.5 pr-1.5 bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[120px]">
 {pago.projectName}
 </span>
 )}
 <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", pago.color === 'green' ? "bg-main text-tx-secondary" : "bg-green-100 text-green-700")}>{pago.status}</span>
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}
 {activeTab === 'rentabilidad' && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
 {/* HERO BANNER PREMIUM */}
 <div className="bg-gradient-to-r from-[#1a3a2a] to-[#0f2419] rounded-2xl p-6 md:p-8 border border-accent/20 shadow-lg relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <PieChart size={150} />
 </div>
 <div className="relative z-10">
 <span className="bg-accent/20 text-accent text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block border border-accent/30">
 Central de Finanzas Maestral
 </span>
 <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Market Intelligence & Rentabilidad</h2>
 <p className="text-accent/70 max-w-2xl text-sm leading-relaxed mb-6">
 Toda la información transaccional de tus obras centralizada. Mide la salud financiera, compara márgenes en tiempo real y controla egresos.
 </p>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
 <div className="bg-black/20 rounded-xl p-4 border border-white/5">
 <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Margen Global</p>
 <p className="text-2xl font-bold text-accent">{rentabilidadGlobal}%</p>
 </div>
 <div className="bg-black/20 rounded-xl p-4 border border-white/5">
 <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Ingresos</p>
 <p className="text-xl font-bold text-white">${totalIngresosObras.toLocaleString('es-AR', {maximumFractionDigits:0})}</p>
 </div>
 <div className="bg-black/20 rounded-xl p-4 border border-white/5">
 <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Egresos Obras</p>
 <p className="text-xl font-bold text-red-400">${totalEgresosObras.toLocaleString('es-AR', {maximumFractionDigits:0})}</p>
 </div>
 <div className="bg-black/20 rounded-xl p-4 border border-white/5">
 <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Operaciones Fijas</p>
 <p className="text-xl font-bold text-blue-400">{pagosData.length} Regs.</p>
 </div>
 </div>
 </div>
 </div>

 {/* ALERTAS Y ATAJOS DIRECTOS */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Card Pagos */}
 <div 
 onClick={() => { setActiveTab('pagos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="bg-card border border-bd-lines rounded-2xl p-6 shadow-sm hover:border-accent hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
 >
 <div className="flex-1 pr-4">
 <h3 className="text-[1.1rem] font-black text-tx-primary group-hover:text-accent transition-colors flex items-center gap-2">
 <Payments className="text-blue-500" size={20} /> Ingresos / Egresos
 </h3>
 <p className="text-xs text-tx-secondary mt-1.5 leading-relaxed">Liquidaciones a proveedores directos, viáticos o comisiones independientes.</p>
 </div>
 <div className="text-right shrink-0">
 <span className="block text-2xl font-extrabold text-tx-primary">${totalPagosRegistrados.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
 <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">Módulo Activo</span>
 </div>
 </div>

 {/* Card Cheques */}
 <div 
 onClick={() => { setActiveTab('cheques'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="bg-card border border-bd-lines rounded-2xl p-6 shadow-sm hover:border-accent hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
 >
 <div className="flex-1 pr-4">
 <h3 className="text-[1.1rem] font-black text-tx-primary group-hover:text-accent transition-colors flex items-center gap-2">
 <AccountBalance className="text-yellow-500" size={20} /> Cartera de Cheques
 </h3>
 {chequesProntoVencer > 0 ? (
 <p className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block mt-1.5">Tienes {chequesProntoVencer} prox. a vencer</p>
 ) : (
 <p className="text-xs text-tx-secondary mt-1.5 leading-relaxed">Administración delegada de valores diferidos ({pendingChequesList.length} al cobro).</p>
 )}
 </div>
 <div className="text-right shrink-0">
 <span className="block text-2xl font-extrabold text-tx-primary">${totalChequesAmount.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
 <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded mt-1 inline-block">Cartera Física</span>
 </div>
 </div>
 </div>

 {/* Desglose por Proyecto REAL via trabajosRaw */}
 <div className="mt-8 border-t border-bd-lines pt-8">
 <h2 className="text-xl font-bold text-tx-primary mb-6 flex items-center gap-2 text-center lg:text-left justify-center lg:justify-start">
 <Activity className="text-accent" size={24} /> Desglose de Rentabilidad Activa
 </h2>
 <div className="space-y-4">
 {trabajosRaw.map((t: any) => {
 const gastos = Number(t.gastos) || 0;
 const rentabilidadPercent = Number(t.rentabilidad) || 0;
 const ingresosGenerados = rentabilidadPercent === 100 ? gastos * 2 : (gastos / (1 - (rentabilidadPercent / 100)));
 const beneficio = ingresosGenerados - gastos;
 return (
 <div key={t.id} className="bg-card rounded-2xl p-5 shadow-sm border border-bd-lines flex flex-col md:flex-row gap-4 items-center justify-between hover:shadow-md transition-shadow">
 <div className="flex-1 w-full text-center md:text-left">
 <h3 className="font-bold text-tx-primary text-base">{t.titulo}</h3>
 <p className="text-xs text-tx-secondary mt-1 max-w-[300px] truncate mx-auto md:mx-0">{t.ubicacion || 'Sin ubicación'} | {t.cliente || 'Sin cliente'}</p>
 </div>
 <div className="flex shrink-0 w-full md:w-auto gap-4 md:gap-8 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-bd-lines mt-2 md:mt-0 items-center">
 <div className="text-center md:text-right">
 <span className="block text-sm font-bold text-red-500">${gastos.toLocaleString('es-AR', {maximumFractionDigits:0})}</span>
 <span className="text-[10px] uppercase font-bold text-tx-secondary tracking-wider">Costo</span>
 </div>
 <div className="text-center md:text-right">
 <span className="block text-sm font-bold text-accent">${beneficio.toLocaleString('es-AR', {maximumFractionDigits:0})}</span>
 <span className="text-[10px] uppercase font-bold text-tx-secondary tracking-wider">Benef. Neto</span>
 </div>
 <div className="text-center bg-gray-900 px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-sm shrink-0">
 <span className="text-sm font-extrabold text-white">{rentabilidadPercent}%</span>
 <TrendingUp size={14} className="text-[#10b981]" />
 </div>
 </div>
 </div>
 )})}
 {trabajosRaw.length === 0 && (
 <div className="text-center py-10 text-tx-secondary bg-card rounded-2xl border border-bd-lines border-dashed">
 No hay obras activas registradas en el Portfolio para analizar su rentabilidad.
 <br/> <p className="text-xs mt-2 opacity-70">Asegúrate de agregar Obras en el apartado principal de Trabajos.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}



 {/* Add Cheque Modal */}
 {isAddChequeModalOpen && (
 <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
 <div className="p-4 border-b border-bd-lines flex justify-between items-center bg-[#f9fafb80]">
 <h3 className="font-bold text-tx-primary">Agregar Cheque</h3>
 <button onClick={() => setIsAddChequeModalOpen(false)} className="text-tx-secondary hover:text-tx-secondary p-1 rounded-full hover:bg-gray-200 transition-colors">
 <Close size={20} />
 </button>
 </div>
 <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Banco *</label>
 <input
 type="text"
 value={newChequeBanco}
 onChange={(e) => setNewChequeBanco(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. Banco Santander"
 autoFocus
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Titular / Emisor *</label>
 <input
 type="text"
 value={newChequeTitular}
 onChange={(e) => setNewChequeTitular(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. Juan Pérez"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Monto *</label>
 <input
 type="text"
 value={newChequeAmount}
 onChange={(e) => setNewChequeAmount(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. $4,250.00"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Fecha de Cobro *</label>
 <input
 type="text"
 value={newChequeDate}
 onChange={(e) => setNewChequeDate(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. 15 Nov 2023 o 'Vence Hoy'"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Referencia / Número (Opcional)</label>
 <input
 type="text"
 value={newChequeRef}
 onChange={(e) => setNewChequeRef(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. #8942"
 />
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setIsAddChequeModalOpen(false)}
 className="flex-1 rounded-xl border border-bd-lines bg-card px-4 py-2.5 text-sm font-bold text-tx-secondary hover:bg-main transition-colors"
 >
 Cancelar
 </button>
 <button
 onClick={handleAddCheque}
 className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15803d] transition-colors"
 >
 Guardar Cheque
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Edit Cheque Modal */}
 {isEditChequeModalOpen && (
 <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
 <div className="p-4 border-b border-bd-lines flex justify-between items-center bg-[#f9fafb80]">
 <h3 className="font-bold text-tx-primary">Editar Cheque</h3>
 <button onClick={() => setIsEditChequeModalOpen(false)} className="text-tx-secondary hover:text-tx-secondary p-1 rounded-full hover:bg-gray-200 transition-colors">
 <Close size={20} />
 </button>
 </div>
 <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Banco</label>
 <input
 type="text"
 value={editChequeBanco}
 onChange={(e) => setEditChequeBanco(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. Banco Santander"
 autoFocus
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Titular / Emisor</label>
 <input
 type="text"
 value={editChequeTitular}
 onChange={(e) => setEditChequeTitular(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. Juan Pérez"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Monto</label>
 <input
 type="text"
 value={editChequeAmount}
 onChange={(e) => setEditChequeAmount(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. $4,250.00"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Fecha de Cobro</label>
 <input
 type="text"
 value={editChequeDate}
 onChange={(e) => setEditChequeDate(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. 15 Nov 2023 o 'Vence Hoy'"
 />
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setIsEditChequeModalOpen(false)}
 className="flex-1 rounded-xl border border-bd-lines bg-card px-4 py-2.5 text-sm font-bold text-tx-secondary hover:bg-main transition-colors"
 >
 Cancelar
 </button>
 <button
 onClick={handleSaveChequeEdit}
 className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15803d] transition-colors"
 >
 Guardar
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Add Pago Modal */}
 {isAddPagoModalOpen && (
 <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
 <div className="p-4 border-b border-bd-lines flex justify-between items-center bg-[#f9fafb80]">
 <h3 className="font-bold text-tx-primary">Registrar Gasto / Pago</h3>
 <button onClick={() => setIsAddPagoModalOpen(false)} className="text-tx-secondary hover:text-tx-secondary p-1 rounded-full hover:bg-gray-200 transition-colors">
 <Close size={20} />
 </button>
 </div>
 <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Destinatario / Concepto *</label>
 <input
 type="text"
 value={newPagoRecipient}
 onChange={(e) => setNewPagoRecipient(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
 placeholder="Ej. Suministros Riego SA"
 autoFocus
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Monto *</label>
 <input
 type="number"
 value={newPagoAmount}
 onChange={(e) => setNewPagoAmount(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
 placeholder="Ej. 1250"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Fecha *</label>
 <input
 type="text"
 value={newPagoDate}
 onChange={(e) => setNewPagoDate(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
 placeholder="Ej. Hoy"
 />
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Método de Pago</label>
 <select
 value={newPagoMethod}
 onChange={(e) => setNewPagoMethod(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
 >
 <option value="">Seleccionar...</option>
 <option value="Transferencia">Transferencia</option>
 <option value="Cheque">Cheque</option>
 <option value="Efectivo">Efectivo</option>
 <option value="Tarjeta">Tarjeta</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Vincular a Proyecto</label>
 <select
 value={newPagoProject}
 onChange={(e) => setNewPagoProject(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
 >
 <option value="">Ninguno (Gasto general)</option>
 {trabajosRaw.map((p: any) => (
 <option key={p.id} value={p.titulo || p.identificador}>
 {p.titulo || p.identificador || 'Proyecto sin nombre'}
 </option>
 ))}
 </select>
 {newPagoProject && <p className="text-xs text-tx-secondary mt-1 font-medium bg-main p-1.5 rounded">Esta operación quedará vinculada al historial de: {newPagoProject}</p>}
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setIsAddPagoModalOpen(false)}
 className="flex-1 rounded-xl border border-bd-lines bg-card px-4 py-2.5 text-sm font-bold text-tx-secondary hover:bg-main transition-colors"
 >
 Cancelar
 </button>
 <button
 onClick={handleAddPago}
 className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
 >
 Registrar
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Final Summary Wrapper completely replaced by activeTab rentabilidad */}

 {/* Toast Notification */}
 {toastMessage && (
 <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
 <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
 <CheckCircle size={20} className="text-green-400" />
 <span className="text-sm font-medium">{toastMessage}</span>
 </div>
 </div>
 )}
 </div>
 );
}
