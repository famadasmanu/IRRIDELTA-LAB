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
 TrendingDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type RentabilidadProject = {
 id: string;
 name: string;
 status: string;
 statusCategory: 'Finalizado' | 'En Progreso' | 'Recurrente' | 'Pausado';
 type: 'Residencial' | 'Comercial' | 'Mantenimiento';
 margin: number;
 color: string;
 isExpanded?: boolean;
};

export default function Finanzas() {
 const [activeTab, setActiveTab] = useState<'cheques' | 'pagos' | 'rentabilidad'>('cheques');
 const [view, setView] = useState<'main' | 'reporte'>('main');
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

  const { data: rentabilidadRaw, update: updateRentabilidad } = useFirestoreCollection<RentabilidadProject>('rentabilidad');
  const rentabilidadData = rentabilidadRaw;
 const [selectedProject, setSelectedProject] = useState<RentabilidadProject | null>(null);
 const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editName, setEditName] = useState('');
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const [filterType, setFilterType] = useState<string | null>(null);
 const [filterStatus, setFilterStatus] = useState<string | null>(null);
 const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
 const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
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

 const { data: chequesRaw, add: addChequeToDB, update: updateChequeInDB } = useFirestoreCollection<Cheque>('cheques');
 const chequesData = chequesRaw;

 const { data: pagosRaw, add: addPagoToDB } = useFirestoreCollection<Pago>('pagos');
 const pagosData = pagosRaw;

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

 // Add logic to discount from project margin if mapped:
 if (newPagoProject && amountCost > 0) {
 const project = rentabilidadData.find(p => p.name === newPagoProject);
 if (project) {
 const marginReduction = Math.min((amountCost / 1000), project.margin - 1);
 await updateRentabilidad(project.id, { margin: Math.max(0, Number((project.margin - marginReduction).toFixed(1))) });
 }
 }

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

 const handleOpenOptions = (project: RentabilidadProject) => {
 setSelectedProject(project);
 setIsOptionsModalOpen(true);
 };

 const handleOpenEdit = () => {
 if (selectedProject) {
 setEditName(selectedProject.name);
 setIsOptionsModalOpen(false);
 setIsEditModalOpen(true);
 }
 };

 const handleSaveEdit = async () => {
 if (selectedProject && editName.trim() !== '') {
 await updateRentabilidad(selectedProject.id, { name: editName.trim() });
 setIsEditModalOpen(false);
 showToast('Nombre de proyecto actualizado');
 }
 };

 const handleViewReport = (project: RentabilidadProject) => {
 setSelectedProject(project);
 setView('reporte');
 };

 const handleDownloadPDF = async () => {
 const element = document.getElementById('reporte-financiero');
 if (!element) return;

 showToast('Generando PDF...');

 try {
 const canvas = await html2canvas(element, {
 scale: 2,
 useCORS: true,
 logging: false
 });

 const imgData = canvas.toDataURL('image/png');
 const pdf = new jsPDF('p', 'mm', 'a4');
 const pdfWidth = pdf.internal.pageSize.getWidth();
 const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

 pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
 pdf.save(`Reporte_Financiero_${selectedProject?.name.replace(/\s+/g, '_') || 'Proyecto'}.pdf`);

 showToast('PDF descargado con éxito');
 } catch (error) {
 console.error('Error generating PDF:', error);
 showToast('Error al generar el PDF');
 }
 };

 const filteredRentabilidad = rentabilidadData.filter(project => {
 if (filterType && project.type !== filterType) return false;
 if (filterStatus && project.statusCategory !== filterStatus) return false;
 return true;
 });

 // --- Cálculos de Estado Financiero Avanzado --- //
 const pendingChequesList = chequesData.filter(c => c.status === 'Pendiente');
 const totalChequesAmount = pendingChequesList.reduce((sum, c) => {
 const val = parseFloat(c.amount.replace(/[^0-9.-]+/g, ""));
 return sum + (isNaN(val) ? 0 : val);
 }, 0);
 const chequesProntoVencer = pendingChequesList.filter(c => c.date.toLowerCase().includes('hoy') || c.date.toLowerCase().includes('días')).length;
 
 // Egresos calculados / mocks para resumen 
 const totalPagosPendientesAmount = 14200.50;
 const pagosProntoVencer = 5;

 const totalIngresosMes = 125400.00;
 const totalEgresosMes = 42850.00;
 const rentabilidadGlobal = (((totalIngresosMes - totalEgresosMes) / totalIngresosMes) * 100).toFixed(1);

 if (view === 'reporte') {
 return (
 <div className="flex flex-col min-h-[80vh] bg-transparent -m-4 sm:-m-6 p-4 sm:p-6">
 <div className="sticky top-0 z-10 bg-background-light/95 backdrop-blur-sm border-b border-bd-lines pb-3 mb-6">
 <div className="flex items-center justify-between">
 <button onClick={() => setView('main')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 text-tx-secondary">
 <ArrowBack size={24} />
 </button>
 <div className="text-center">
 <p className="text-xs font-medium text-tx-secondary uppercase tracking-wider">Reporte Financiero</p>
 <h1 className="text-lg font-bold text-tx-primary">{selectedProject?.name || 'Jardines del Sur - F2'}</h1>
 </div>
 <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 text-tx-secondary">
 <Share size={24} />
 </button>
 </div>
 </div>

 <div id="reporte-financiero" className="flex flex-col gap-6 max-w-2xl mx-auto w-full bg-main p-4 rounded-xl">
 {/* Hero Status Card */}
 <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm border border-bd-lines p-6">
 <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-[#0596691A] blur-3xl"></div>
 <div className="flex flex-col items-center justify-center gap-2 mb-6">
 <span className="text-sm font-medium text-tx-secondary">Rentabilidad Actual</span>
 <div className="flex items-center gap-2 rounded-full bg-[#0596691A] px-4 py-1.5 text-accent">
 <TrendingUp size={20} />
 <span className="text-lg font-bold">+24.5%</span>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4 divide-x divide-gray-100">
 <div className="flex flex-col gap-1 text-center">
 <span className="text-xs text-tx-secondary">Presupuestado</span>
 <span className="text-lg font-bold text-tx-primary">$15,000</span>
 </div>
 <div className="flex flex-col gap-1 text-center pl-4">
 <span className="text-xs text-tx-secondary">Costo Real</span>
 <span className="text-lg font-bold text-accent">$11,325</span>
 </div>
 </div>
 <div className="mt-6 border-t border-bd-lines pt-4">
 <div className="flex justify-between items-center mb-2">
 <span className="text-sm font-medium text-tx-secondary">Progreso Financiero</span>
 <span className="text-xs font-semibold text-accent">75.5% Gastado</span>
 </div>
 <div className="h-2 w-full rounded-full bg-main overflow-hidden">
 <div className="h-full w-[75.5%] rounded-full bg-accent"></div>
 </div>
 </div>
 </div>

 {/* Breakdown Chart Section */}
 <div className="flex flex-col gap-4">
 <h2 className="text-lg font-bold text-tx-primary flex items-center gap-2">
 <PieChart className="text-accent" size={20} />
 Desglose de Gastos
 </h2>
 <div className="rounded-xl bg-card p-5 shadow-sm border border-bd-lines">
 <div className="flex items-center gap-6">
 <div className="relative h-32 w-32 shrink-0">
 <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
 <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8"></path>
 <path className="text-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="50, 100" strokeWidth="3.8"></path>
 <path className="text-yellow-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="30, 100" strokeDashoffset="-50" strokeWidth="3.8"></path>
 <path className="text-gray-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="20, 100" strokeDashoffset="-80" strokeWidth="3.8"></path>
 </svg>
 <div className="absolute inset-0 flex items-center justify-center flex-col">
 <span className="text-[10px] text-tx-secondary font-medium">Total</span>
 <span className="text-xs font-bold text-tx-primary">$11.3k</span>
 </div>
 </div>
 <div className="flex flex-1 flex-col justify-center gap-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="h-2.5 w-2.5 rounded-full bg-accent"></div>
 <span className="text-sm font-medium text-tx-secondary">Materiales</span>
 </div>
 <span className="text-sm font-bold text-tx-primary">50%</span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
 <span className="text-sm font-medium text-tx-secondary">Mano de Obra</span>
 </div>
 <span className="text-sm font-bold text-tx-primary">30%</span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="h-2.5 w-2.5 rounded-full bg-gray-300"></div>
 <span className="text-sm font-medium text-tx-secondary">Logística</span>
 </div>
 <span className="text-sm font-bold text-tx-primary">20%</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Material Balance Section */}
 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-tx-primary flex items-center gap-2">
 <Package className="text-accent" size={20} />
 Balance de Insumos
 </h2>
 <button className="text-xs font-bold text-accent hover:underline">Ver todo</button>
 </div>
 <div className="grid gap-3">
 <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm border border-bd-lines">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0596691A] text-accent">
 <Leaf size={20} />
 </div>
 <div>
 <p className="font-bold text-tx-primary">Plantas Ornamentales</p>
 <p className="text-xs text-tx-secondary">Presupuesto: 400 u</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-accent">-$450</p>
 <p className="text-xs font-medium text-accent bg-[#0596691A] px-2 py-0.5 rounded inline-block">Ahorro</p>
 </div>
 </div>
 <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm border border-bd-lines">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
 <Mountain size={20} />
 </div>
 <div>
 <p className="font-bold text-tx-primary">Tierra Negra (Topsoil)</p>
 <p className="text-xs text-tx-secondary">Presupuesto: 15 m³</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-red-500">+$120</p>
 <p className="text-xs font-medium text-red-500 bg-red-100 px-2 py-0.5 rounded inline-block">Exceso</p>
 </div>
 </div>
 <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm border border-bd-lines">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-main text-tx-secondary">
 <Droplets size={20} />
 </div>
 <div>
 <p className="font-bold text-tx-primary">Sistema de Riego</p>
 <p className="text-xs text-tx-secondary">Presupuesto: 1 Lote</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-tx-primary">$0</p>
 <p className="text-xs font-medium text-tx-secondary bg-main px-2 py-0.5 rounded inline-block">En regla</p>
 </div>
 </div>
 </div>
 </div>

 <button
 onClick={handleDownloadPDF}
 className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-white shadow-lg shadow-[#05966933] hover:bg-[#15803d] transition-colors active:scale-[0.98]"
 >
 <Download size={20} />
 Descargar Reporte PDF
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">Finanzas</h1>
 </div>

 <div className="flex p-1 rounded-xl bg-main w-full overflow-x-auto hide-scrollbar">
 <label className="flex-1 cursor-pointer min-w-[100px]">
 <input
 type="radio"
 name="view-mode"
 className="peer sr-only"
 checked={activeTab === 'cheques'}
 onChange={() => setActiveTab('cheques')}
 />
 <div className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-tx-secondary transition-all hover:bg-gray-200 peer-checked:bg-accent peer-checked:text-white peer-checked:shadow-sm">
 Cheques
 </div>
 </label>
 <label className="flex-1 cursor-pointer min-w-[100px]">
 <input
 type="radio"
 name="view-mode"
 className="peer sr-only"
 checked={activeTab === 'pagos'}
 onChange={() => setActiveTab('pagos')}
 />
 <div className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-tx-secondary transition-all hover:bg-gray-200 peer-checked:bg-accent peer-checked:text-white peer-checked:shadow-sm">
 Pagos
 </div>
 </label>
 <label className="flex-1 cursor-pointer min-w-[120px]">
 <input
 type="radio"
 name="view-mode"
 className="peer sr-only"
 checked={activeTab === 'rentabilidad'}
 onChange={() => setActiveTab('rentabilidad')}
 />
 <div className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-tx-secondary transition-all hover:bg-gray-200 peer-checked:bg-accent peer-checked:text-white peer-checked:shadow-sm">
 Rentabilidad
 </div>
 </label>
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
 <span className="text-3xl font-bold tracking-tight">$12,450.00</span>
 </div>
 <div className="rounded-full bg-[#ffffff33] p-2 backdrop-blur-sm">
 <AccountBalanceWallet className="text-white" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <span className="flex items-center rounded-full bg-[#ffffff33] px-2 py-0.5 text-xs font-semibold text-white">
 <TrendingUp size={14} className="mr-1" />
 +2.5%
 </span>
 <span className="text-xs text-[#ffffffb3]">vs mes anterior</span>
 </div>
 </div>

 {/* Card 2: Vencimientos */}
 <div className="flex flex-col justify-between rounded-xl bg-card p-5 shadow-sm border border-bd-lines">
 <div className="flex justify-between items-start">
 <div className="flex flex-col gap-1">
 <span className="text-tx-secondary text-sm font-medium">Próximos a Vencer</span>
 <span className="text-3xl font-bold text-tx-primary">3 Cheques</span>
 </div>
 <div className="rounded-full bg-orange-100 p-2">
 <Warning className="text-orange-600" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2">
 <span className="text-xs font-medium text-orange-600">Acción requerida antes del viernes</span>
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
 <p className="text-sm font-medium opacity-80 mb-1">Total Egresos (Este Mes)</p>
 <div className="flex items-end gap-2">
 <h2 className="text-3xl font-bold tracking-tight">$42,850.00</h2>
 <span className="text-sm font-medium mb-1.5 opacity-90">USD</span>
 </div>
 <div className="mt-4 flex gap-4">
 <div className="flex items-center gap-1.5 text-xs bg-[#ffffff33] px-2 py-1 rounded-lg">
 <TrendingUp size={16} />
 <span>+12% vs mes anterior</span>
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
 <div className="space-y-6">
 <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
 <div className="relative">
 <button
 onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
 className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors", filterType ? "bg-accent text-white shadow-sm" : "bg-card border border-bd-lines text-tx-secondary")}
 >
 <span>{filterType || 'Tipo de Proyecto'}</span>
 <ExpandMore size={18} />
 </button>
 {isTypeFilterOpen && (
 <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-bd-lines py-2 z-20">
 <button onClick={() => { setFilterType(null); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Todos</button>
 <button onClick={() => { setFilterType('Residencial'); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Residencial</button>
 <button onClick={() => { setFilterType('Comercial'); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Comercial</button>
 <button onClick={() => { setFilterType('Mantenimiento'); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Mantenimiento</button>
 </div>
 )}
 </div>

 <button
 onClick={() => showToast('Función en desarrollo')}
 className="flex shrink-0 items-center gap-2 px-4 py-2 rounded-full bg-card border border-bd-lines text-tx-secondary text-sm font-medium hover:bg-main transition-colors"
 >
 <span>Rango de Fechas</span>
 <Calendar size={18} />
 </button>

 <div className="relative">
 <button
 onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
 className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors", filterStatus ? "bg-accent text-white shadow-sm" : "bg-card border border-bd-lines text-tx-secondary")}
 >
 <span>{filterStatus || 'Estado'}</span>
 <FilterList size={18} />
 </button>
 {isStatusFilterOpen && (
 <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-bd-lines py-2 z-20">
 <button onClick={() => { setFilterStatus(null); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Todos</button>
 <button onClick={() => { setFilterStatus('Finalizado'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Finalizado</button>
 <button onClick={() => { setFilterStatus('En Progreso'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">En Progreso</button>
 <button onClick={() => { setFilterStatus('Recurrente'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Recurrente</button>
 <button onClick={() => { setFilterStatus('Pausado'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-main">Pausado</button>
 </div>
 )}
 </div>

 {(filterType || filterStatus) && (
 <button
 onClick={() => { setFilterType(null); setFilterStatus(null); }}
 className="flex shrink-0 items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
 >
 <span>Limpiar filtros</span>
 <Close size={16} />
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-card p-4 rounded-2xl shadow-sm border border-bd-lines flex flex-col justify-between">
 <div>
 <div className="flex items-start justify-between mb-2">
 <div className="p-2 bg-[#0596691A] rounded-lg">
 <TrendingUp className="text-accent" size={20} />
 </div>
 <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+2.4%</span>
 </div>
 <p className="text-tx-secondary text-sm font-medium">Margen Global</p>
 <p className="text-2xl font-extrabold text-tx-primary mt-1">24.8%</p>
 </div>
 </div>
 
 <div className="bg-card p-4 rounded-2xl shadow-sm border border-bd-lines flex flex-col justify-between">
 <div>
 <div className="flex items-start justify-between mb-2">
 <div className="p-2 bg-orange-50 rounded-lg">
 <AccountBalanceWallet className="text-orange-600" size={20} />
 </div>
 <span className="text-xs font-bold text-tx-secondary bg-main px-2 py-0.5 rounded-full">30 días</span>
 </div>
 <p className="text-tx-secondary text-sm font-medium">Beneficio Neto</p>
 <p className="text-2xl font-extrabold text-tx-primary mt-1">$42k</p>
 </div>
 </div>

 <div className="bg-gradient-to-br from-accent to-[#2c4a3b] p-4 rounded-2xl shadow-sm border border-transparent text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-card/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
 <div className="flex items-start justify-between mb-2 relative z-10">
 <div className="p-2 bg-card/10 rounded-lg backdrop-blur-sm">
 <PieChart className="text-white" size={20} />
 </div>
 <span className="text-[10px] font-bold text-accent bg-card px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
 <span className="w-1.5 h-1.5 bg-[#F27D26] rounded-full animate-pulse"></span> IA Predictiva
 </span>
 </div>
 <div className="relative z-10">
 <p className="text-white/80 text-sm font-medium">Proyección Cierre Anual</p>
 <div className="flex items-end gap-2 mt-1">
 <p className="text-2xl font-extrabold text-white">$650k</p>
 <p className="text-xs text-white/60 mb-1">estimado</p>
 </div>
 </div>
 <div className="mt-3 relative z-10 flex gap-1 h-6 items-end">
 {[40, 50, 45, 60, 55, 75, 80, 70, 85, 95, 100, 90].map((h, i) => (
 <div key={i} className="flex-1 bg-card/20 rounded-sm hover:bg-card/40 transition-colors" style={{ height: `${h}%` }}></div>
 ))}
 </div>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold text-tx-primary">Desglose por Proyecto</h2>
 <button className="text-accent text-sm font-bold hover:underline">Ver todos</button>
 </div>
 <div className="space-y-4">
 {filteredRentabilidad.length === 0 ? (
 <div className="text-center py-8 text-tx-secondary">
 No se encontraron proyectos con los filtros seleccionados.
 </div>
 ) : (
 filteredRentabilidad.map((project) => (
 <div key={project.id} className={cn("bg-card rounded-2xl p-5 shadow-sm border", project.isExpanded ? "border-[#05966933] ring-1 ring-[#0596691A]" : "border-bd-lines")}>
 <div className="flex justify-between items-start mb-3">
 <div className="flex-1 pr-4">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-tx-primary text-base">{project.name}</h3>
 </div>
 <p className="text-xs text-tx-secondary mt-1">{project.status}</p>
 </div>
 <div className="flex items-start gap-3">
 <div className="text-right">
 <span className={cn("block font-bold", project.isExpanded ? "text-2xl font-extrabold text-accent" : "text-xl text-tx-primary")}>{project.margin}%</span>
 <span className="text-xs text-tx-secondary">Margen</span>
 </div>
 <button
 onClick={() => handleOpenOptions(project)}
 className="text-tx-secondary hover:text-tx-secondary p-1 rounded-full hover:bg-main transition-colors mt-1"
 >
 <MoreVertical size={16} />
 </button>
 </div>
 </div>
 <div className="h-2 w-full bg-main rounded-full overflow-hidden flex mb-2">
 <div className={cn("h-full", project.color)} style={{ width: `${project.margin}%` }}></div>
 </div>

 {project.isExpanded && (
 <div className="pt-4 border-t border-bd-lines mt-4">
 <p className="text-xs font-bold uppercase tracking-wider text-tx-secondary mb-3">Factores de Costo</p>
 <div className="space-y-3">
 <div className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-red-500"></div>
 <span className="text-tx-secondary">Mano de Obra</span>
 </div>
 <span className="font-medium text-tx-primary">$12,450 (45%)</span>
 </div>
 <div className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
 <span className="text-tx-secondary">Materiales</span>
 </div>
 <span className="font-medium text-tx-primary">$8,200 (30%)</span>
 </div>
 <div className="flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
 <span className="text-tx-secondary">Equipamiento</span>
 </div>
 <span className="font-medium text-tx-primary">$6,850 (25%)</span>
 </div>
 </div>
 <button
 onClick={() => handleViewReport(project)}
 className="w-full mt-4 py-2 text-xs font-bold text-accent bg-[#0596690D] hover:bg-[#0596691A] rounded-lg transition-colors"
 >
 Ver reporte completo
 </button>
 </div>
 )}
 </div>
 )))}
 </div>
 </div>
 </div>
 )}

 {/* Options Modal */}
 {isOptionsModalOpen && selectedProject && (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
 <div className="p-4 border-b border-bd-lines flex justify-between items-center bg-[#f9fafb80]">
 <h3 className="font-bold text-tx-primary truncate pr-4">Opciones: {selectedProject.name}</h3>
 <button onClick={() => setIsOptionsModalOpen(false)} className="text-tx-secondary hover:text-tx-secondary p-1 rounded-full hover:bg-gray-200 transition-colors shrink-0">
 <Close size={20} />
 </button>
 </div>
 <div className="p-2">
 <button
 onClick={handleOpenEdit}
 className="w-full text-left px-4 py-3 text-sm font-medium text-tx-secondary hover:bg-main rounded-xl transition-colors flex items-center gap-3"
 >
 <Edit2 size={18} className="text-tx-secondary" />
 Editar Nombre
 </button>
 <button
 onClick={() => {
 setIsOptionsModalOpen(false);
 handleViewReport(selectedProject);
 }}
 className="w-full text-left px-4 py-3 text-sm font-medium text-tx-secondary hover:bg-main rounded-xl transition-colors flex items-center gap-3"
 >
 <PieChart size={18} className="text-tx-secondary" />
 Ver Reporte Completo
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Edit Modal */}
 {isEditModalOpen && selectedProject && (
 <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
 <div className="p-4 border-b border-bd-lines flex justify-between items-center bg-[#f9fafb80]">
 <h3 className="font-bold text-tx-primary">Editar Proyecto</h3>
 <button onClick={() => setIsEditModalOpen(false)} className="text-tx-secondary hover:text-tx-secondary p-1 rounded-full hover:bg-gray-200 transition-colors">
 <Close size={20} />
 </button>
 </div>
 <div className="p-4 space-y-4">
 <div>
 <label className="block text-xs font-bold text-tx-secondary uppercase tracking-wider mb-1.5">Nombre del Proyecto</label>
 <input
 type="text"
 value={editName}
 onChange={(e) => setEditName(e.target.value)}
 className="w-full rounded-xl border border-bd-lines bg-card px-3 py-2.5 text-sm text-tx-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
 placeholder="Ej. Jardines del Valle"
 autoFocus
 />
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setIsEditModalOpen(false)}
 className="flex-1 rounded-xl border border-bd-lines bg-card px-4 py-2.5 text-sm font-bold text-tx-secondary hover:bg-main transition-colors"
 >
 Cancelar
 </button>
 <button
 onClick={handleSaveEdit}
 className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-[#15803d] transition-colors"
 >
 Guardar
 </button>
 </div>
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
 {rentabilidadData.map((p: any) => (
 <option key={p.id} value={p.name}>{p.name}</option>
 ))}
 </select>
 {newPagoProject && <p className="text-xs text-orange-600 mt-1 font-medium bg-orange-50 p-1.5 rounded">¡Cuidado! Este gasto descontará margen del proyecto: {newPagoProject}</p>}
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

 {/* Resumen de Estado Financiero al Final */}
 <div className="mt-8 pt-8 border-t border-bd-lines relative w-full">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <h2 className="text-xl font-bold text-tx-primary flex items-center gap-2">
 <Activity className="text-accent" size={24} />
 Resumen de Estado Financiero
 </h2>
 {showFinancialStatus && <span className="text-xs font-semibold text-tx-secondary bg-main px-2.5 py-1 rounded-lg hidden sm:inline-block">Cifras del Mes Actual</span>}
 </div>
 <button
 onClick={toggleFinancialStatus}
 className="flex items-center justify-center gap-2 text-sm font-semibold text-tx-secondary bg-card border border-bd-lines px-3 py-1.5 rounded-lg shadow-sm hover:bg-main transition-colors shrink-0"
 >
 {showFinancialStatus ? (
 <><EyeOff size={16} /> <span className="hidden sm:inline">Ocultar estado financiero</span></>
 ) : (
 <><Eye size={16} /> Mostrar estado financiero</>
 )}
 </button>
 </div>

 {showFinancialStatus && (
 <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
 {/* Insights automáticos */}
 <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
 {chequesProntoVencer > 0 && (
 <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
 <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0"><Warning size={16} /></div>
 <div>
 <p className="text-orange-900 font-bold text-sm">Alerta de Vencimiento de Cheques</p>
 <p className="text-orange-700 text-xs mt-0.5">Tienes {chequesProntoVencer} cheque(s) próximo(s) a vencer o vencido(s).</p>
 </div>
 </div>
 )}
 <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0"><TrendingUp size={16} /></div>
 <div>
 <p className="text-blue-900 font-bold text-sm">Incremento de Egresos vs Promedio</p>
 <p className="text-blue-700 text-xs mt-0.5">Los egresos han aumentado un 12% respecto al promedio trimestral.</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* 1. Rentabilidad */}
 <div 
 onClick={() => { setActiveTab('rentabilidad'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="bg-card border border-bd-lines rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
 >
 <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors blur-2xl z-0"></div>
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-4">
 <span className="text-sm font-bold text-tx-secondary group-hover:text-accent transition-colors">Rentabilidad Estimada</span>
 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors"><PieChart size={18} /></div>
 </div>
 <div className="mb-5">
 <p className="text-4xl font-extrabold text-accent">{rentabilidadGlobal}%</p>
 <p className="text-[11px] text-tx-secondary mt-2 font-medium bg-main inline-block px-2 py-1 rounded border border-bd-lines">
 Cálculo: (Ingresos - Egresos) / Ingresos
 </p>
 </div>
 <div className="grid grid-cols-2 gap-3 text-sm border-t border-bd-lines pt-4">
 <div>
 <p className="text-tx-secondary text-xs font-semibold uppercase tracking-wider mb-0.5">Ingresos</p>
 <p className="font-bold text-green-600">${totalIngresosMes.toLocaleString()}</p>
 </div>
 <div>
 <p className="text-tx-secondary text-xs font-semibold uppercase tracking-wider mb-0.5">Egresos</p>
 <p className="font-bold text-red-500">${totalEgresosMes.toLocaleString()}</p>
 </div>
 </div>
 </div>
 <button className="mt-5 text-sm font-bold text-accent w-full bg-main group-hover:bg-main group-hover:shadow-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 border border-transparent group-hover:border-bd-lines">
 <Activity size={16} /> Ver detalles de proyectos
 </button>
 </div>

 {/* 2. Cheques */}
 <div 
 onClick={() => { setActiveTab('cheques'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="bg-card border border-bd-lines rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
 >
 <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-yellow-50 group-hover:bg-yellow-100 transition-colors blur-2xl z-0"></div>
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-4">
 <span className="text-sm font-bold text-tx-secondary group-hover:text-accent transition-colors">Cheques en Cartera</span>
 <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-100 transition-colors"><AccountBalance size={18} /></div>
 </div>
 <div className="mb-5">
 <p className="text-4xl font-extrabold text-tx-primary">${totalChequesAmount.toLocaleString()}</p>
 <p className="text-xs text-tx-secondary mt-2 font-medium">Acumulado total de {pendingChequesList.length} cheques por depositar</p>
 </div>
 <div className="flex flex-col gap-2.5 border-t border-bd-lines pt-4">
 <div className="flex justify-between items-center text-sm">
 <span className="text-tx-secondary font-semibold text-xs tracking-wider uppercase">Vencimientos Próximos:</span>
 <span className="font-bold text-orange-600">{chequesProntoVencer}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-tx-secondary font-semibold text-xs tracking-wider uppercase">Prioridad:</span>
 <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", chequesProntoVencer > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
 {chequesProntoVencer > 0 ? "URGENTE" : "NORMAL"}
 </span>
 </div>
 </div>
 </div>
 <button className="mt-5 text-sm font-bold text-accent w-full bg-main group-hover:bg-main group-hover:shadow-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 border border-transparent group-hover:border-bd-lines">
 <CreditCard size={16} /> Gestionar cheques
 </button>
 </div>

 {/* 3. Pagos / Egresos */}
 <div 
 onClick={() => { setActiveTab('pagos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="bg-card border border-bd-lines rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
 >
 <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors blur-2xl z-0"></div>
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-4">
 <span className="text-sm font-bold text-tx-secondary group-hover:text-accent transition-colors">Pagos Pendientes</span>
 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors"><Payments size={18} /></div>
 </div>
 <div className="mb-5">
 <p className="text-4xl font-extrabold text-tx-primary">${totalPagosPendientesAmount.toLocaleString()}</p>
 <p className="text-xs text-tx-secondary mt-2 font-medium">Asignado a {pagosProntoVencer} pagos programados (estimado)</p>
 </div>
 <div className="flex flex-col gap-2.5 border-t border-bd-lines pt-4">
 <div className="flex justify-between items-center text-sm">
 <span className="text-tx-secondary font-semibold text-xs tracking-wider uppercase">Vencimientos Próximos:</span>
 <span className="font-bold text-orange-600">{pagosProntoVencer}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-tx-secondary font-semibold text-xs tracking-wider uppercase">Prioridad:</span>
 <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">ATENCIÓN</span>
 </div>
 </div>
 </div>
 <button className="mt-5 text-sm font-bold text-accent w-full bg-main group-hover:bg-main group-hover:shadow-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 border border-transparent group-hover:border-bd-lines">
 <DollarSign size={16} /> Ver cronograma de pagos
 </button>
 </div>
 </div>
 </div>
 )}
 </div>

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
