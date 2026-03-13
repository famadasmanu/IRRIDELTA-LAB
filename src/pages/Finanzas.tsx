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
  Edit2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocalStorage } from '../hooks/useLocalStorage';
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

const defaultRentabilidad: RentabilidadProject[] = [
  {
    id: '1',
    name: 'Jardines del Valle - Fase 2',
    status: 'Finalizado • 12 Oct 2023',
    statusCategory: 'Finalizado',
    type: 'Residencial',
    margin: 32,
    color: 'bg-[#3A5F4B]',
    isExpanded: true
  },
  {
    id: '2',
    name: 'Residencial Los Olivos',
    status: 'En Progreso • Entrega 15 Nov',
    statusCategory: 'En Progreso',
    type: 'Residencial',
    margin: 18,
    color: 'bg-yellow-500'
  },
  {
    id: '3',
    name: 'Mantenimiento Corp. Tech',
    status: 'Recurrente • Mensual',
    statusCategory: 'Recurrente',
    type: 'Mantenimiento',
    margin: 45,
    color: 'bg-[#3A5F4B]'
  },
  {
    id: '4',
    name: 'Parque Central Renovación',
    status: 'Pausado • Pendiente Materiales',
    statusCategory: 'Pausado',
    type: 'Comercial',
    margin: 12,
    color: 'bg-red-400'
  }
];

export default function Finanzas() {
  const [activeTab, setActiveTab] = useState<'cheques' | 'pagos' | 'rentabilidad'>('cheques');
  const [view, setView] = useState<'main' | 'reporte'>('main');

  const [rentabilidadData, setRentabilidadData] = useLocalStorage<RentabilidadProject[]>('rentabilidadData', defaultRentabilidad);
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
  const [editingChequeId, setEditingChequeId] = useState<number | null>(null);
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
  id: number;
  banco: string;
  titular: string;
  ref: string;
  status: string;
  amount: string;
  date: string;
  statusColor: string;
};

type Pago = {
  id: number;
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

  const [chequesData, setChequesData] = useLocalStorage<Cheque[]>('finanzas_cheques_v2', [
    { id: 1, banco: 'Banco Santander', titular: 'Juan Pérez', ref: '#8942', status: 'Pendiente', amount: '$4,250.00', date: 'Vence Hoy', statusColor: 'yellow' },
    { id: 2, banco: 'BBVA', titular: 'Tech Corp SA', ref: '#3321', status: 'Pendiente', amount: '$1,800.00', date: 'Vence en 3 días', statusColor: 'yellow' },
    { id: 3, banco: 'Citibanamex', titular: 'María Gómez', ref: '#5590', status: 'Depositado', amount: '$6,400.00', date: '12 Oct 2023', statusColor: 'green' },
  ]);

  const [pagosData, setPagosData] = useLocalStorage<Pago[]>('finanzas_pagos_v2', [
    { id: 1, recipient: 'Suministros Green Thumb', amount: 450.00, date: '24 Oct', method: 'Cheque', ref: '#1024', status: 'Acreditado', icon: 'Payments', color: 'green', projectName: 'Jardines del Valle - Fase 2' },
    { id: 2, recipient: 'Compañía de Riego Pacífico', amount: 1280.50, date: '22 Oct', method: 'Transferencia', ref: '', status: 'Completado', icon: 'AccountBalance', color: 'blue', projectName: 'Residencial Los Olivos' },
  ]);

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

  const handleDepositar = (id: number) => {
    setChequesData(prev => prev.map(c => {
      if (c.id === id) {
        if (c.status === 'Depositado') {
          return { ...c, status: 'Pendiente', statusColor: 'yellow', date: 'Vence en 3 días' };
        } else {
          return { ...c, status: 'Depositado', statusColor: 'green', date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) };
        }
      }
      return c;
    }));
    showToast('Estado del cheque actualizado');
  };

  const handleAddCheque = () => {
    if (!newChequeBanco.trim() || !newChequeAmount.trim() || !newChequeTitular.trim() || !newChequeDate.trim()) {
      showToast('Por favor, completa los campos requeridos (Banco, Titular, Monto, Fecha)');
      return;
    }

    const newCheque = {
      id: Date.now(),
      banco: newChequeBanco,
      titular: newChequeTitular,
      ref: newChequeRef || `#${Math.floor(Math.random() * 10000)}`,
      status: 'Pendiente',
      amount: newChequeAmount,
      date: newChequeDate,
      statusColor: 'yellow'
    };

    setChequesData([newCheque, ...chequesData]);
    setIsAddChequeModalOpen(false);
    setNewChequeBanco('');
    setNewChequeTitular('');
    setNewChequeAmount('');
    setNewChequeDate('');
    setNewChequeRef('');
    showToast('Cheque agregado exitosamente');
  };

  const handleAddPago = () => {
    if (!newPagoRecipient.trim() || !newPagoAmount.trim() || !newPagoDate.trim()) {
      showToast('Por favor, completa los campos requeridos mínimos (Destinatario, Monto, Fecha)');
      return;
    }

    const amountCost = parseFloat(newPagoAmount.replace(/[^0-9.-]+/g, ""));

    // Add logic to discount from project margin if mapped:
    if (newPagoProject && amountCost > 0) {
      setRentabilidadData(prev => prev.map(p => {
        if (p.name === newPagoProject) {
          // We do a mock reduction of the margin by 1% for every $1000 spent for demo purposes
          const marginReduction = Math.min((amountCost / 1000), p.margin - 1);
          return { ...p, margin: Math.max(0, Number((p.margin - marginReduction).toFixed(1))) };
        }
        return p;
      }));
    }

    const newPago = {
      id: Date.now(),
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

    setPagosData([newPago, ...pagosData]);
    setIsAddPagoModalOpen(false);
    setNewPagoRecipient('');
    setNewPagoAmount('');
    setNewPagoDate('');
    setNewPagoMethod('');
    setNewPagoProject('');
    showToast('Gasto agregado exitosamente');
  };

  const handleEditCheque = (id: number) => {
    const cheque = chequesData.find(c => c.id === id);
    if (!cheque) return;

    setEditingChequeId(id);
    setEditChequeBanco(cheque.banco);
    setEditChequeTitular(cheque.titular || '');
    setEditChequeAmount(cheque.amount);
    setEditChequeDate(cheque.date);
    setIsEditChequeModalOpen(true);
  };

  const handleSaveChequeEdit = () => {
    if (editingChequeId === null) return;

    setChequesData(prev => prev.map(c =>
      c.id === editingChequeId ? { ...c, banco: editChequeBanco, titular: editChequeTitular, amount: editChequeAmount, date: editChequeDate } : c
    ));
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

  const handleSaveEdit = () => {
    if (selectedProject && editName.trim() !== '') {
      setRentabilidadData(prev => prev.map(p =>
        p.id === selectedProject.id ? { ...p, name: editName.trim() } : p
      ));
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

  if (view === 'reporte') {
    return (
      <div className="flex flex-col min-h-[80vh] bg-transparent -m-4 sm:-m-6 p-4 sm:p-6">
        <div className="sticky top-0 z-10 bg-background-light/95 backdrop-blur-sm border-b border-gray-200 pb-3 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setView('main')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 text-gray-700">
              <ArrowBack size={24} />
            </button>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reporte Financiero</p>
              <h1 className="text-lg font-bold text-gray-900">{selectedProject?.name || 'Jardines del Sur - F2'}</h1>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 text-gray-700">
              <Share size={24} />
            </button>
          </div>
        </div>

        <div id="reporte-financiero" className="flex flex-col gap-6 max-w-2xl mx-auto w-full bg-gray-50 p-4 rounded-xl">
          {/* Hero Status Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-[#3A5F4B1A] blur-3xl"></div>
            <div className="flex flex-col items-center justify-center gap-2 mb-6">
              <span className="text-sm font-medium text-gray-500">Rentabilidad Actual</span>
              <div className="flex items-center gap-2 rounded-full bg-[#3A5F4B1A] px-4 py-1.5 text-[#3A5F4B]">
                <TrendingUp size={20} />
                <span className="text-lg font-bold">+24.5%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 divide-x divide-gray-100">
              <div className="flex flex-col gap-1 text-center">
                <span className="text-xs text-gray-500">Presupuestado</span>
                <span className="text-lg font-bold text-gray-900">$15,000</span>
              </div>
              <div className="flex flex-col gap-1 text-center pl-4">
                <span className="text-xs text-gray-500">Costo Real</span>
                <span className="text-lg font-bold text-[#3A5F4B]">$11,325</span>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso Financiero</span>
                <span className="text-xs font-semibold text-[#3A5F4B]">75.5% Gastado</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full w-[75.5%] rounded-full bg-[#3A5F4B]"></div>
              </div>
            </div>
          </div>

          {/* Breakdown Chart Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="text-[#3A5F4B]" size={20} />
              Desglose de Gastos
            </h2>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-6">
                <div className="relative h-32 w-32 shrink-0">
                  <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8"></path>
                    <path className="text-[#3A5F4B]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="50, 100" strokeWidth="3.8"></path>
                    <path className="text-yellow-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="30, 100" strokeDashoffset="-50" strokeWidth="3.8"></path>
                    <path className="text-gray-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="20, 100" strokeDashoffset="-80" strokeWidth="3.8"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[10px] text-gray-400 font-medium">Total</span>
                    <span className="text-xs font-bold text-gray-900">$11.3k</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#3A5F4B]"></div>
                      <span className="text-sm font-medium text-gray-600">Materiales</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">50%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
                      <span className="text-sm font-medium text-gray-600">Mano de Obra</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-300"></div>
                      <span className="text-sm font-medium text-gray-600">Logística</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Material Balance Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-[#3A5F4B]" size={20} />
                Balance de Insumos
              </h2>
              <button className="text-xs font-bold text-[#3A5F4B] hover:underline">Ver todo</button>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3A5F4B1A] text-[#3A5F4B]">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Plantas Ornamentales</p>
                    <p className="text-xs text-gray-500">Presupuesto: 400 u</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#3A5F4B]">-$450</p>
                  <p className="text-xs font-medium text-[#3A5F4B] bg-[#3A5F4B1A] px-2 py-0.5 rounded inline-block">Ahorro</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
                    <Mountain size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Tierra Negra (Topsoil)</p>
                    <p className="text-xs text-gray-500">Presupuesto: 15 m³</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-500">+$120</p>
                  <p className="text-xs font-medium text-red-500 bg-red-100 px-2 py-0.5 rounded inline-block">Exceso</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Sistema de Riego</p>
                    <p className="text-xs text-gray-500">Presupuesto: 1 Lote</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">$0</p>
                  <p className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block">En regla</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3A5F4B] py-4 font-bold text-white shadow-lg shadow-[#3A5F4B33] hover:bg-[#2d4a3a] transition-colors active:scale-[0.98]"
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Finanzas</h1>
      </div>

      <div className="flex p-1 rounded-xl bg-gray-100 w-full overflow-x-auto hide-scrollbar">
        <label className="flex-1 cursor-pointer min-w-[100px]">
          <input
            type="radio"
            name="view-mode"
            className="peer sr-only"
            checked={activeTab === 'cheques'}
            onChange={() => setActiveTab('cheques')}
          />
          <div className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200 peer-checked:bg-[#3A5F4B] peer-checked:text-white peer-checked:shadow-sm">
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
          <div className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200 peer-checked:bg-[#3A5F4B] peer-checked:text-white peer-checked:shadow-sm">
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
          <div className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200 peer-checked:bg-[#3A5F4B] peer-checked:text-white peer-checked:shadow-sm">
            Rentabilidad
          </div>
        </label>
      </div>

      {activeTab === 'cheques' && (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsAddChequeModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#3A5F4B] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#2d4a3a] transition-colors"
            >
              <AddCircle size={20} />
              Agregar Cheque
            </button>
          </div>
          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Total */}
            <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-[#3A5F4B] to-[#2c4a3b] p-5 text-white shadow-lg">
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
            <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-sm font-medium">Próximos a Vencer</span>
                  <span className="text-3xl font-bold text-gray-900">3 Cheques</span>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por banco o #..."
                value={searchCheque}
                onChange={(e) => setSearchCheque(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-[#3A5F4B] focus:outline-none"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsChequeFilterOpen(!isChequeFilterOpen)}
                className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm border transition-colors", chequeFilterStatus ? "bg-[#3A5F4B] text-white border-[#3A5F4B]" : "bg-white border-gray-200 text-gray-500 hover:text-[#3A5F4B]")}
              >
                <FilterList size={20} />
              </button>
              {isChequeFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  <button onClick={() => { setChequeFilterStatus(null); setIsChequeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Todos</button>
                  <button onClick={() => { setChequeFilterStatus('Pendiente'); setIsChequeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Pendientes</button>
                  <button onClick={() => { setChequeFilterStatus('Depositado'); setIsChequeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Depositados</button>
                </div>
              )}
            </div>
          </div>

          {/* Check List */}
          <div className="flex flex-col gap-3">
            {filteredCheques.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron cheques con esos criterios
              </div>
            ) : (
              filteredCheques.map(cheque => (
                <div key={cheque.id} className={cn("group relative flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md", cheque.statusColor === 'green' && "opacity-75")}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", cheque.statusColor === 'yellow' ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600")}>
                        <AccountBalance size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{cheque.banco}</p>
                          <button onClick={() => handleEditCheque(cheque.id)} className="text-gray-400 hover:text-[#3A5F4B] transition-colors p-1 rounded-full hover:bg-gray-100">
                            <Edit2 size={14} />
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{cheque.titular}</p>
                        <p className="text-xs text-gray-500 font-medium">Ref: {cheque.ref} · <span className={cheque.date.includes('Vence Hoy') ? "text-orange-600" : ""}>{cheque.date}</span></p>
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", cheque.statusColor === 'yellow' ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700")}>{cheque.status}</span>
                  </div>
                  <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-xs text-gray-500">Monto</p>
                      <p className="text-lg font-bold text-gray-900">{cheque.amount}</p>
                    </div>
                    {cheque.statusColor === 'yellow' ? (
                      <button
                        onClick={() => handleDepositar(cheque.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#3A5F4B] px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2d4a3a] active:scale-95 transition-all"
                      >
                        <CheckCircle size={18} />
                        Depositar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDepositar(cheque.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
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
                className={cn("flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors", pagoDateFilter ? "bg-[#3A5F4B] text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}
              >
                <span className="text-xs font-semibold whitespace-nowrap">{pagoDateFilter || 'Rango de Fechas'}</span>
                <ExpandMore size={16} />
              </button>
              {isPagoDateOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  <button onClick={() => { setPagoDateFilter(null); setIsPagoDateOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Todas</button>
                  <button onClick={() => { setPagoDateFilter('Oct'); setIsPagoDateOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Octubre</button>
                  <button onClick={() => { setPagoDateFilter('Nov'); setIsPagoDateOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Noviembre</button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsPagoMethodOpen(!isPagoMethodOpen)}
                className={cn("flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 transition-colors", pagoMethodFilter ? "bg-[#3A5F4B] text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200")}
              >
                <span className="text-xs font-semibold whitespace-nowrap">{pagoMethodFilter || 'Método'}</span>
                <ExpandMore size={16} />
              </button>
              {isPagoMethodOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  <button onClick={() => { setPagoMethodFilter(null); setIsPagoMethodOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Todos</button>
                  <button onClick={() => { setPagoMethodFilter('Cheque'); setIsPagoMethodOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Cheque</button>
                  <button onClick={() => { setPagoMethodFilter('Transferencia'); setIsPagoMethodOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Transferencia</button>
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
          <div className="bg-[#3A5F4B] rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
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
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Este Mes</h2>
              <button
                onClick={() => setIsAddPagoModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition-colors"
              >
                <AddCircle size={16} />
                Registrar Gasto
              </button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-6">
              {filteredPagos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron pagos con esos criterios
                </div>
              ) : (
                filteredPagos.map(pago => (
                  <div key={pago.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer">
                    <div className={cn("flex items-center justify-center rounded-lg shrink-0 h-12 w-12", pago.color === 'green' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                      {pago.icon === 'Payments' ? <Payments size={24} /> : <AccountBalance size={24} />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-gray-900 text-base font-semibold truncate pr-2">{pago.recipient}</p>
                        <p className="text-gray-900 text-base font-bold whitespace-nowrap">-${pago.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-gray-500 text-xs font-medium flex items-center gap-1">
                          {pago.date} • {pago.method} {pago.ref && `${pago.ref}`}
                        </p>
                        <div className="flex items-center gap-2">
                          {pago.projectName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded pl-1.5 pr-1.5 bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[120px]">
                              {pago.projectName}
                            </span>
                          )}
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", pago.color === 'green' ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700")}>{pago.status}</span>
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
                className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors", filterType ? "bg-[#3A5F4B] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-700")}
              >
                <span>{filterType || 'Tipo de Proyecto'}</span>
                <ExpandMore size={18} />
              </button>
              {isTypeFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  <button onClick={() => { setFilterType(null); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Todos</button>
                  <button onClick={() => { setFilterType('Residencial'); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Residencial</button>
                  <button onClick={() => { setFilterType('Comercial'); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Comercial</button>
                  <button onClick={() => { setFilterType('Mantenimiento'); setIsTypeFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Mantenimiento</button>
                </div>
              )}
            </div>

            <button
              onClick={() => showToast('Función en desarrollo')}
              className="flex shrink-0 items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <span>Rango de Fechas</span>
              <Calendar size={18} />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                className={cn("flex shrink-0 items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors", filterStatus ? "bg-[#3A5F4B] text-white shadow-sm" : "bg-white border border-gray-200 text-gray-700")}
              >
                <span>{filterStatus || 'Estado'}</span>
                <FilterList size={18} />
              </button>
              {isStatusFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  <button onClick={() => { setFilterStatus(null); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Todos</button>
                  <button onClick={() => { setFilterStatus('Finalizado'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Finalizado</button>
                  <button onClick={() => { setFilterStatus('En Progreso'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">En Progreso</button>
                  <button onClick={() => { setFilterStatus('Recurrente'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Recurrente</button>
                  <button onClick={() => { setFilterStatus('Pausado'); setIsStatusFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Pausado</button>
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
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-[#3A5F4B1A] rounded-lg">
                    <TrendingUp className="text-[#3A5F4B]" size={20} />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+2.4%</span>
                </div>
                <p className="text-gray-500 text-sm font-medium">Margen Global</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">24.8%</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <AccountBalanceWallet className="text-orange-600" size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">30 días</span>
                </div>
                <p className="text-gray-500 text-sm font-medium">Beneficio Neto</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">$42k</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#3A5F4B] to-[#2c4a3b] p-4 rounded-2xl shadow-sm border border-transparent text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
              <div className="flex items-start justify-between mb-2 relative z-10">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <PieChart className="text-white" size={20} />
                </div>
                <span className="text-[10px] font-bold text-[#3A5F4B] bg-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
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
                  <div key={i} className="flex-1 bg-white/20 rounded-sm hover:bg-white/40 transition-colors" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Desglose por Proyecto</h2>
              <button className="text-[#3A5F4B] text-sm font-bold hover:underline">Ver todos</button>
            </div>
            <div className="space-y-4">
              {filteredRentabilidad.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron proyectos con los filtros seleccionados.
                </div>
              ) : (
                filteredRentabilidad.map((project) => (
                  <div key={project.id} className={cn("bg-white rounded-2xl p-5 shadow-sm border", project.isExpanded ? "border-[#3A5F4B33] ring-1 ring-[#3A5F4B1A]" : "border-gray-100")}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 text-base">{project.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{project.status}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <span className={cn("block font-bold", project.isExpanded ? "text-2xl font-extrabold text-[#3A5F4B]" : "text-xl text-gray-900")}>{project.margin}%</span>
                          <span className="text-xs text-gray-500">Margen</span>
                        </div>
                        <button
                          onClick={() => handleOpenOptions(project)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors mt-1"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex mb-2">
                      <div className={cn("h-full", project.color)} style={{ width: `${project.margin}%` }}></div>
                    </div>

                    {project.isExpanded && (
                      <div className="pt-4 border-t border-gray-100 mt-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Factores de Costo</p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="text-gray-700">Mano de Obra</span>
                            </div>
                            <span className="font-medium text-gray-900">$12,450 (45%)</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <span className="text-gray-700">Materiales</span>
                            </div>
                            <span className="font-medium text-gray-900">$8,200 (30%)</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-gray-700">Equipamiento</span>
                            </div>
                            <span className="font-medium text-gray-900">$6,850 (25%)</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewReport(project)}
                          className="w-full mt-4 py-2 text-xs font-bold text-[#3A5F4B] bg-[#3A5F4B0D] hover:bg-[#3A5F4B1A] rounded-lg transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f9fafb80]">
              <h3 className="font-bold text-gray-900 truncate pr-4">Opciones: {selectedProject.name}</h3>
              <button onClick={() => setIsOptionsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors shrink-0">
                <Close size={20} />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={handleOpenEdit}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
              >
                <Edit2 size={18} className="text-gray-400" />
                Editar Nombre
              </button>
              <button
                onClick={() => {
                  setIsOptionsModalOpen(false);
                  handleViewReport(selectedProject);
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
              >
                <PieChart size={18} className="text-gray-400" />
                Ver Reporte Completo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedProject && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f9fafb80]">
              <h3 className="font-bold text-gray-900">Editar Proyecto</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <Close size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. Jardines del Valle"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-xl bg-[#3A5F4B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2d4a3a] transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f9fafb80]">
              <h3 className="font-bold text-gray-900">Agregar Cheque</h3>
              <button onClick={() => setIsAddChequeModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <Close size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Banco *</label>
                <input
                  type="text"
                  value={newChequeBanco}
                  onChange={(e) => setNewChequeBanco(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. Banco Santander"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Titular / Emisor *</label>
                <input
                  type="text"
                  value={newChequeTitular}
                  onChange={(e) => setNewChequeTitular(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Monto *</label>
                <input
                  type="text"
                  value={newChequeAmount}
                  onChange={(e) => setNewChequeAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. $4,250.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fecha de Cobro *</label>
                <input
                  type="text"
                  value={newChequeDate}
                  onChange={(e) => setNewChequeDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. 15 Nov 2023 o 'Vence Hoy'"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Referencia / Número (Opcional)</label>
                <input
                  type="text"
                  value={newChequeRef}
                  onChange={(e) => setNewChequeRef(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. #8942"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsAddChequeModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCheque}
                  className="flex-1 rounded-xl bg-[#3A5F4B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2d4a3a] transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f9fafb80]">
              <h3 className="font-bold text-gray-900">Editar Cheque</h3>
              <button onClick={() => setIsEditChequeModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <Close size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Banco</label>
                <input
                  type="text"
                  value={editChequeBanco}
                  onChange={(e) => setEditChequeBanco(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. Banco Santander"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Titular / Emisor</label>
                <input
                  type="text"
                  value={editChequeTitular}
                  onChange={(e) => setEditChequeTitular(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Monto</label>
                <input
                  type="text"
                  value={editChequeAmount}
                  onChange={(e) => setEditChequeAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. $4,250.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fecha de Cobro</label>
                <input
                  type="text"
                  value={editChequeDate}
                  onChange={(e) => setEditChequeDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. 15 Nov 2023 o 'Vence Hoy'"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditChequeModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveChequeEdit}
                  className="flex-1 rounded-xl bg-[#3A5F4B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2d4a3a] transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f9fafb80]">
              <h3 className="font-bold text-gray-900">Registrar Gasto / Pago</h3>
              <button onClick={() => setIsAddPagoModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <Close size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Destinatario / Concepto *</label>
                <input
                  type="text"
                  value={newPagoRecipient}
                  onChange={(e) => setNewPagoRecipient(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Ej. Suministros Riego SA"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Monto *</label>
                  <input
                    type="number"
                    value={newPagoAmount}
                    onChange={(e) => setNewPagoAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Ej. 1250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fecha *</label>
                  <input
                    type="text"
                    value={newPagoDate}
                    onChange={(e) => setNewPagoDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Ej. Hoy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Método de Pago</label>
                <select
                  value={newPagoMethod}
                  onChange={(e) => setNewPagoMethod(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vincular a Proyecto</label>
                <select
                  value={newPagoProject}
                  onChange={(e) => setNewPagoProject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
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
