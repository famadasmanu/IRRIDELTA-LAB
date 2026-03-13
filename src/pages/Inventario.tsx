import React, { useState } from 'react';
import {
  Archive, UserCircle, Search, Filter,
  Droplet, Droplets, Waves, Plug, MapPin,
  Wrench, Plus, Edit2, Trash2, Box, Eye, AlertTriangle, Calendar, DollarSign, Activity, FileText,
  MessageCircle, Truck
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const initialMaterials = [
  { id: 1, name: 'Válvula Esférica 3/4"', category: 'Fontanería', qty: 8, unit: 'un', status: 'Crítico', statusColor: 'bg-red-100 text-red-700', iconBg: 'bg-red-50', iconColor: 'text-red-600', iconName: 'Droplet' },
  { id: 2, name: 'Aspersor Rotativo', category: 'Riego', qty: 142, unit: 'un', status: 'Estable', statusColor: 'bg-emerald-100 text-emerald-700', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', iconName: 'Droplets' },
  { id: 3, name: 'Tubería PVC 25mm', category: 'Estructural', qty: 450, unit: 'mts', status: 'Estable', statusColor: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', iconName: 'Waves' },
  { id: 4, name: 'Acople Rápido M', category: 'Accesorios', qty: 24, unit: 'un', status: 'Bajo', statusColor: 'bg-amber-100 text-amber-700', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', iconName: 'Plug' },
];

const initialAditivos = [
  {
    id: 1, name: 'Fertilizante NPK', category: 'Nutrición', qty: 50, unit: 'kg', status: 'Estable', statusColor: 'bg-emerald-100 text-emerald-700', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', iconName: 'Droplet',
    costo: 1500, frecuenciaDosificacion: 'Mensual', fechaVencimiento: '2026-12-01', ubicacionAlmacenamiento: 'Depósito A',
    historialUso: [
      { id: 1, cantidadUsada: 5, proyecto: 'Nordelta - Barrio El Golf', fecha: '2026-03-01' }
    ]
  },
  {
    id: 2, name: 'Herbicida Selectivo', category: 'Control', qty: 5, unit: 'L', status: 'Bajo', statusColor: 'bg-amber-100 text-amber-700', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', iconName: 'Droplets',
    costo: 3200, frecuenciaDosificacion: 'Trimestral', fechaVencimiento: '2026-04-10', ubicacionAlmacenamiento: 'Depósito B',
    historialUso: [
      { id: 1, cantidadUsada: 1, proyecto: 'Puertos del Lago', fecha: '2026-02-15' }
    ]
  },
];

const initialProjects = [
  { id: 1, name: 'Nordelta - Barrio El Golf', location: 'Tigre, Buenos Aires', itemsCount: 42, gradient: 'from-emerald-500 to-teal-600', checklist: [{ id: 1, text: 'Cemento Portland', isChecked: false }, { id: 2, text: 'Arena', isChecked: false }], assignedItems: [{ id: 1, name: 'Cemento', qty: 20 }, { id: 2, name: 'Arena', qty: 22 }] },
  { id: 2, name: 'Puertos del Lago', location: 'Escobar, Buenos Aires', itemsCount: 18, gradient: 'from-indigo-500 to-purple-500', checklist: [{ id: 1, text: 'Pintura Blanca', isChecked: true }], assignedItems: [{ id: 1, name: 'Pintura Blanca', qty: 18 }] },
];

const initialMaquinaria = [
  { id: 1, name: 'Excavadora Cat 320', image: 'https://images.unsplash.com/photo-1578507065211-1c4e99a5fd24?auto=format&fit=crop&q=80&w=400', user: 'Juan Pérez', time: '2 meses', location: 'Nordelta - Barrio El Golf' },
  { id: 2, name: 'Retroexcavadora JCB', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400', user: 'Carlos Gómez', time: '15 días', location: 'Puertos del Lago' },
];

const getIcon = (name: string) => {
  switch (name) {
    case 'Droplet': return Droplet;
    case 'Droplets': return Droplets;
    case 'Waves': return Waves;
    case 'Plug': return Plug;
    default: return Box;
  }
};

export default function Inventario() {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState(initialMaterials);
  const [aditivos, setAditivos] = useState(initialAditivos);
  const [projects, setProjects] = useState(initialProjects);
  const [maquinaria, setMaquinaria] = useState(initialMaquinaria);
  const [aditivosTitle, setAditivosTitle] = useState('Aditivos');
  const [activeAditivoFilter, setActiveAditivoFilter] = useState<string>('Todos');
  const [showAditivoFilters, setShowAditivoFilters] = useState(false);

  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editingAditivo, setEditingAditivo] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingMaquinaria, setEditingMaquinaria] = useState<any>(null);
  const [managingStockProject, setManagingStockProject] = useState<any>(null);
  const [selectedAditivoDetail, setSelectedAditivoDetail] = useState<any>(null);
  const [selectedProjectChecklist, setSelectedProjectChecklist] = useState<any>(null);
  const [isAddingItem, setIsAddingItem] = useState<'material' | 'aditivo' | 'project' | 'maquinaria' | null>(null);
  const [newItem, setNewItem] = useState<any>({});
  const [isEditingAditivosTitle, setIsEditingAditivosTitle] = useState(false);
  const [isExportingMaterials, setIsExportingMaterials] = useState(false);
  const [exportingProjectId, setExportingProjectId] = useState<number | null>(null);
  const [aditivosAlertConfig, setAditivosAlertConfig] = useState({ criticalStock: 0, warningStock: 10, warningDays: 30 });
  const [isEditingAditivosAlerts, setIsEditingAditivosAlerts] = useState(false);

  // Handlers for Materials
  const handleDeleteMaterial = (id: number) => {
    if (window.confirm('¿Eliminar este material?')) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'material') {
      setMaterials([...materials, { ...newItem, id: Date.now(), status: 'Estable', statusColor: 'bg-emerald-100 text-emerald-700', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', iconName: 'Box' }]);
      setIsAddingItem(null);
    } else {
      setMaterials(materials.map(m => m.id === editingMaterial.id ? editingMaterial : m));
      setEditingMaterial(null);
    }
  };

  // Handlers for Aditivos
  const handleDeleteAditivo = (id: number) => {
    if (window.confirm('¿Eliminar este ítem?')) {
      setAditivos(aditivos.filter(a => a.id !== id));
    }
  };

  const handleSaveAditivo = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'aditivo') {
      setAditivos([...aditivos, {
        ...newItem,
        id: Date.now(),
        status: 'Estable',
        statusColor: 'bg-emerald-100 text-emerald-700',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        iconName: 'Droplet',
        historialUso: []
      }]);
      setIsAddingItem(null);
    } else {
      setAditivos(aditivos.map(a => a.id === editingAditivo.id ? editingAditivo : a));
      setEditingAditivo(null);
    }
  };

  const checkAditivoAlerts = (aditivo: any) => {
    const alerts = [];
    if (aditivo.qty <= aditivosAlertConfig.criticalStock) {
      alerts.push({ type: 'critical', message: 'Falta de stock (Agotado)' });
    } else if (aditivo.qty <= aditivosAlertConfig.warningStock) {
      alerts.push({ type: 'warning', message: 'Necesidad de reposición (Stock bajo)' });
    }

    if (aditivo.fechaVencimiento) {
      const today = new Date();
      const expDate = new Date(aditivo.fechaVencimiento);
      const diffTime = Math.abs(expDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (expDate < today) {
        alerts.push({ type: 'critical', message: 'Producto vencido' });
      } else if (diffDays <= aditivosAlertConfig.warningDays) {
        alerts.push({ type: 'warning', message: `Proximidad al vencimiento (${diffDays} días)` });
      }
    }
    return alerts;
  };

  // Handlers for Projects
  const handleDeleteProject = (id: number) => {
    if (window.confirm('¿Eliminar este proyecto?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'project') {
      setProjects([...projects, { ...newItem, id: Date.now(), gradient: 'from-emerald-500 to-teal-600' }]);
      setIsAddingItem(null);
    } else {
      setProjects(projects.map(p => p.id === editingProject.id ? editingProject : p));
      setEditingProject(null);
    }
  };

  const handleExportProjectPDF = async (project: any) => {
    setExportingProjectId(project.id);

    try {
      const printContent = document.createElement('div');
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';
      printContent.style.top = '0';
      printContent.style.width = '800px';
      printContent.style.backgroundColor = '#ffffff';

      const checklistRows = (project.checklist || []).map((item: any) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #111827;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; border: 2px solid #3A5F4B; border-radius: 4px; background-color: ${item.isChecked ? '#3A5F4B' : 'transparent'};"></div>
              <span style="text-decoration: ${item.isChecked ? 'line-through' : 'none'}; color: ${item.isChecked ? '#9ca3af' : '#111827'};">${item.qty || 1}x ${item.text}</span>
            </div>
          </td>
        </tr>
      `).join('');

      printContent.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <h1 style="color: #3A5F4B; border-bottom: 2px solid #3A5F4B; padding-bottom: 10px; margin-bottom: 20px;">Reporte de Proyecto</h1>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 24px; color: #111827; margin-bottom: 8px;">${project.name}</h2>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">Ubicación: ${project.location}</p>
            <p style="color: #6b7280; font-size: 16px; margin: 4px 0 0 0;">Items asignados: ${project.itemsCount}</p>
          </div>

          <h3 style="color: #374151; font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Checklist de Productos a Pedir</h3>
          
          ${project.checklist && project.checklist.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <tbody>
                ${checklistRows}
              </tbody>
            </table>
          ` : '<p style="color: #6b7280; font-style: italic;">No hay productos en la checklist.</p>'}
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
            Generado el ${new Date().toLocaleDateString()}
          </div>
        </div>
      `;

      document.body.appendChild(printContent);

      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(printContent);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Proyecto_${project.name.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setExportingProjectId(null);
    }
  };

  // Handlers for Maquinaria
  const handleDeleteMaquinaria = (id: number) => {
    if (window.confirm('¿Eliminar esta maquinaria?')) {
      setMaquinaria(maquinaria.filter(m => m.id !== id));
    }
  };

  const handleSaveMaquinaria = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'maquinaria') {
      setMaquinaria([...maquinaria, { ...newItem, id: Date.now() }]);
      setIsAddingItem(null);
    } else {
      setMaquinaria(maquinaria.map(m => m.id === editingMaquinaria.id ? editingMaquinaria : m));
      setEditingMaquinaria(null);
    }
  };

  const handleExportMaterialsPDF = async () => {
    setIsExportingMaterials(true);

    try {
      const printContent = document.createElement('div');
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';
      printContent.style.top = '0';
      printContent.style.width = '800px';
      printContent.style.backgroundColor = '#ffffff';

      const rows = materials.map(m => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #111827; font-weight: 500;">${m.name}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${m.category}</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: bold; text-align: right;">${m.qty} ${m.unit}</td>
          <td style="padding: 12px 8px; text-align: right;">
            <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; color: #374151; text-transform: uppercase;">
              ${m.status}
            </span>
          </td>
        </tr>
      `).join('');

      printContent.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <h1 style="color: #3A5F4B; border-bottom: 2px solid #3A5F4B; padding-bottom: 10px; margin-bottom: 30px;">Reporte de Materiales Disponibles</h1>
          
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px 8px; color: #4b5563; font-size: 14px; text-transform: uppercase;">Material</th>
                <th style="padding: 12px 8px; color: #4b5563; font-size: 14px; text-transform: uppercase;">Categoría</th>
                <th style="padding: 12px 8px; color: #4b5563; font-size: 14px; text-transform: uppercase; text-align: right;">Stock</th>
                <th style="padding: 12px 8px; color: #4b5563; font-size: 14px; text-transform: uppercase; text-align: right;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
            Generado el ${new Date().toLocaleDateString()}
          </div>
        </div>
      `;

      document.body.appendChild(printContent);

      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(printContent);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Materiales_Disponibles.pdf');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setIsExportingMaterials(false);
    }
  };

  const filteredMaterials = materials.filter(m => (m.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (m.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()));
  const filteredAditivos = aditivos.filter(a => {
    const matchesSearch = (a.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (a.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFilter = activeAditivoFilter === 'Todos' || a.category === activeAditivoFilter;
    return matchesSearch && matchesFilter;
  });
  const filteredProjects = projects.filter(p => (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()));
  const filteredMaquinaria = maquinaria.filter(m => (m.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (m.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (m.user?.toLowerCase() || '').includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col font-sans pb-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="bg-white rounded-2xl p-4 shadow-sm border border-[#3A5F4B]/10 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#3A5F4B]/10 p-2 rounded-lg text-[#3A5F4B]">
              <Archive size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Inventario</h1>
          </div>
          <button className="size-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <UserCircle size={20} />
          </button>
        </div>
      </header>

      {/* Buscador Principal */}
      <div className="mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3A5F4B] transition-colors w-5 h-5" />
          <input
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all shadow-sm"
            placeholder="Buscar materiales, obras o códigos..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido Unificado */}
      <main className="space-y-8">

        {/* SECCIÓN: OBRAS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Proyectos en Curso</h2>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsAddingItem('project'); setNewItem({ name: '', location: '', itemsCount: 0, checklist: [] }); }}
                className="flex items-center gap-1 text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-3 py-1.5 rounded-lg hover:bg-[#3A5F4B]/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map(project => {
              const checklistText = (project.checklist || []).filter((i: any) => !i.isChecked).map((i: any) => `- ${i.qty || 1}x ${i.text}`).join('%0A');
              const whatsappMessage = `Hola, necesito reponer materiales o pedir presupuesto para el proyecto: ${project.name}.%0A%0AProductos a pedir:%0A${checklistText || 'Ninguno especificado'}`;

              return (
                <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden relative group hover:shadow-md hover:border-[#3A5F4B]/30 transition-all flex flex-col">

                  {/* Acciones de Proyecto (Flotantes) */}
                  <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-90">
                    <button
                      onClick={() => handleExportProjectPDF(project)}
                      disabled={exportingProjectId === project.id}
                      className={`p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-lg transition-colors ${exportingProjectId === project.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Exportar a PDF"
                    >
                      <FileText size={16} className={exportingProjectId === project.id ? 'animate-pulse' : ''} />
                    </button>
                    <button
                      onClick={() => setEditingProject(project)}
                      className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-1.5 bg-white/20 hover:bg-red-500/80 backdrop-blur-sm text-white rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={`h-24 bg-gradient-to-r ${project.gradient} relative`}>
                    <div className="absolute bottom-3 left-4 text-white pr-20">
                      <h4 className="font-bold text-lg leading-tight">{project.name}</h4>
                      <p className="text-xs opacity-90 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {project.location}
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Items asignados</span>
                      <span className="text-xs font-bold text-slate-900">{project.itemsCount} productos</span>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden mb-4">
                      <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 items-center justify-center text-[#3A5F4B]">
                        <Droplet className="w-4 h-4" />
                      </div>
                      <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 items-center justify-center text-[#3A5F4B]">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 items-center justify-center text-[#3A5F4B]">
                        <Waves className="w-4 h-4" />
                      </div>
                      <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 items-center justify-center text-[10px] font-bold text-slate-600">
                        +{project.itemsCount > 3 ? project.itemsCount - 3 : 0}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setSelectedProjectChecklist(project)}
                        className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold rounded-lg transition-colors"
                      >
                        Checklist Pedido
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setManagingStockProject(project)}
                        className="flex-1 py-2 bg-[#3A5F4B]/5 hover:bg-[#3A5F4B]/10 text-[#3A5F4B] text-sm font-bold rounded-lg transition-colors"
                      >
                        Gestionar Stock
                      </button>
                      <a
                        href={`https://wa.me/?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                        title="Solicitar por WhatsApp"
                      >
                        <MessageCircle size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm col-span-full">No se encontraron proyectos.</div>
            )}
          </div>
        </section>

        {/* SECCIÓN: MAQUINARIA */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Maquinaria</h2>
            <button
              onClick={() => { setIsAddingItem('maquinaria'); setNewItem({ name: '', image: '', user: '', time: '', location: '' }); }}
              className="flex items-center gap-1 text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-3 py-1.5 rounded-lg hover:bg-[#3A5F4B]/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaquinaria.map(maq => (
              <div key={maq.id} className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden relative group flex flex-col hover:shadow-md hover:border-[#3A5F4B]/30 transition-all">

                {/* Acciones de Maquinaria (Flotantes) */}
                <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-90">
                  <button
                    onClick={() => setEditingMaquinaria(maq)}
                    className="p-1.5 bg-white/60 hover:bg-white backdrop-blur-sm text-slate-700 rounded-lg transition-colors shadow-sm"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteMaquinaria(maq.id)}
                    className="p-1.5 bg-white/60 hover:bg-red-500 hover:text-white backdrop-blur-sm text-slate-700 rounded-lg transition-colors shadow-sm"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="h-40 w-full bg-slate-100 relative">
                  {maq.image ? (
                    <img src={maq.image} alt={maq.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Truck size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h4 className="absolute bottom-3 left-4 font-bold text-lg text-white leading-tight">{maq.name}</h4>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1"><UserCircle size={14} /> Usuario:</span>
                      <span className="font-medium text-slate-900">{maq.user || 'No asignado'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1"><Calendar size={14} /> Tiempo est.:</span>
                      <span className="font-medium text-slate-900">{maq.time || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1"><MapPin size={14} /> Ubicación:</span>
                      <span className="font-medium text-slate-900 truncate max-w-[150px]" title={maq.location}>{maq.location || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <a
                      href={`https://wa.me/?text=Hola,%20necesito%20pedir%20repuestos%20para%20la%20maquinaria:%20${encodeURIComponent(maq.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                    >
                      <Wrench size={14} />
                      Repuestos
                    </a>
                    <a
                      href={`https://wa.me/?text=Hola,%20necesito%20un%20presupuesto%20de%20renovación%20para%20la%20maquinaria:%20${encodeURIComponent(maq.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg transition-colors border border-green-200"
                    >
                      <DollarSign size={14} />
                      Renovación
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {filteredMaquinaria.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm col-span-full">No se encontró maquinaria.</div>
            )}
          </div>
        </section>

        {/* SECCIÓN: ADITIVOS */}
        <section>
          <div className="flex items-center justify-between mb-4 group">
            {isEditingAditivosTitle ? (
              <input
                type="text"
                value={aditivosTitle}
                onChange={(e) => setAditivosTitle(e.target.value)}
                onBlur={() => setIsEditingAditivosTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingAditivosTitle(false)}
                className="text-sm font-bold uppercase tracking-wider text-slate-700 bg-transparent border-b border-[#3A5F4B] focus:outline-none"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingAditivosTitle(true)}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{aditivosTitle}</h2>
                <Edit2 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            <div className="flex gap-2 relative">
              <button
                onClick={() => setIsEditingAditivosAlerts(true)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                title="Configurar Alertas"
              >
                <Wrench className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAditivoFilters(!showAditivoFilters)}
                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${activeAditivoFilter !== 'Todos' || showAditivoFilters ? 'bg-[#3A5F4B] text-white' : 'text-[#3A5F4B] bg-[#3A5F4B]/10 hover:bg-[#3A5F4B]/20'}`}
              >
                <Filter className="w-4 h-4" />
                {activeAditivoFilter !== 'Todos' ? activeAditivoFilter : 'Filtrar'}
              </button>

              {showAditivoFilters && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-2">
                  <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</div>
                  {['Todos', ...Array.from(new Set(aditivos.map(a => a.category)))].map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setActiveAditivoFilter(cat); setShowAditivoFilters(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${activeAditivoFilter === cat ? 'text-[#3A5F4B] font-bold bg-[#3A5F4B]/5' : 'text-slate-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setIsAddingItem('aditivo'); setNewItem({ name: '', category: '', qty: 0, unit: '' }); }}
                className="flex items-center gap-1 text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-3 py-1.5 rounded-lg hover:bg-[#3A5F4B]/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredAditivos.map(item => {
              const IconComponent = getIcon(item.iconName);
              const alerts = checkAditivoAlerts(item);

              // Determine visual range icon based on stock
              let RangeIcon = Activity;
              let rangeColor = 'text-emerald-500';
              if (item.qty <= aditivosAlertConfig.criticalStock) {
                rangeColor = 'text-red-500';
                RangeIcon = AlertTriangle;
              } else if (item.qty <= aditivosAlertConfig.warningStock) {
                rangeColor = 'text-amber-500';
              }

              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#3A5F4B]/10 shadow-sm flex flex-col gap-3 hover:shadow-md hover:border-[#3A5F4B]/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${item.iconBg} flex items-center justify-center relative`}>
                        <IconComponent className={`${item.iconColor} w-6 h-6`} />
                        {alerts.length > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          {item.name}
                          <RangeIcon className={`w-4 h-4 ${rangeColor}`} aria-label="Estado de Stock" />
                        </h3>
                        <p className="text-xs text-slate-500">Categoría: {item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${item.iconColor}`}>{item.qty} <span className="text-xs font-normal text-slate-400">{item.unit}</span></p>
                      <span className={`inline-block px-2 py-0.5 ${item.statusColor} text-[10px] font-bold rounded-full uppercase`}>{item.status}</span>
                    </div>
                  </div>

                  {/* Acciones de Aditivo */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => setSelectedAditivoDetail(item)}
                      className="p-1.5 text-slate-400 hover:text-[#3A5F4B] hover:bg-[#3A5F4B]/10 rounded-lg transition-colors"
                      title="Ver Detalles"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditingAditivo(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteAditivo(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredAditivos.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No se encontraron ítems.</div>
            )}
          </div>
        </section>

        {/* SECCIÓN: MATERIALES */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Materiales Disponibles</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportMaterialsPDF}
                disabled={isExportingMaterials}
                className={`flex items-center gap-1 text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-3 py-1.5 rounded-lg transition-colors ${isExportingMaterials ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3A5F4B]/20'}`}
                title="Exportar a PDF"
              >
                <FileText className={`w-4 h-4 ${isExportingMaterials ? 'animate-pulse' : ''}`} />
                PDF
              </button>
              <button
                onClick={() => alert('Abrir filtros')}
                className="flex items-center gap-1 text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-3 py-1.5 rounded-lg hover:bg-[#3A5F4B]/20 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
              <button
                onClick={() => { setIsAddingItem('material'); setNewItem({ name: '', category: '', qty: 0, unit: '' }); }}
                className="flex items-center gap-1 text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-3 py-1.5 rounded-lg hover:bg-[#3A5F4B]/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredMaterials.map(item => {
              const IconComponent = getIcon(item.iconName);
              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#3A5F4B]/10 shadow-sm flex flex-col gap-3 hover:shadow-md hover:border-[#3A5F4B]/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                        <IconComponent className={`${item.iconColor} w-6 h-6`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                        <p className="text-xs text-slate-500">Categoría: {item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${item.iconColor}`}>{item.qty} <span className="text-xs font-normal text-slate-400">{item.unit}</span></p>
                      <span className={`inline-block px-2 py-0.5 ${item.statusColor} text-[10px] font-bold rounded-full uppercase`}>{item.status}</span>
                    </div>
                  </div>

                  {/* Acciones de Material */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => setEditingMaterial(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredMaterials.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No se encontraron materiales.</div>
            )}
          </div>
        </section>

      </main>

      {/* Botón Flotante */}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-40">
        <button
          onClick={() => { setIsAddingItem('material'); setNewItem({ name: '', category: '', qty: 0, unit: '' }); }}
          className="w-14 h-14 bg-[#3A5F4B] text-white rounded-full shadow-lg shadow-[#3A5F4B]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Modales de Edición y Creación */}
      <Modal
        isOpen={!!editingMaquinaria || isAddingItem === 'maquinaria'}
        onClose={() => { setEditingMaquinaria(null); setIsAddingItem(null); }}
        title={editingMaquinaria ? "Editar Maquinaria" : "Nueva Maquinaria"}
      >
        {(editingMaquinaria || isAddingItem === 'maquinaria') && (
          <form onSubmit={handleSaveMaquinaria} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Maquinaria</label>
              <input
                type="text"
                required
                value={editingMaquinaria ? editingMaquinaria.name : newItem.name}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, name: e.target.value }) : setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL de la Imagen</label>
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={editingMaquinaria ? editingMaquinaria.image : newItem.image || ''}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, image: e.target.value }) : setNewItem({ ...newItem, image: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuario Asignado</label>
                <input
                  type="text"
                  value={editingMaquinaria ? editingMaquinaria.user : newItem.user || ''}
                  onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, user: e.target.value }) : setNewItem({ ...newItem, user: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiempo Estimado</label>
                <input
                  type="text"
                  placeholder="Ej: 2 meses"
                  value={editingMaquinaria ? editingMaquinaria.time : newItem.time || ''}
                  onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, time: e.target.value }) : setNewItem({ ...newItem, time: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación Actual</label>
              <input
                type="text"
                value={editingMaquinaria ? editingMaquinaria.location : newItem.location || ''}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, location: e.target.value }) : setNewItem({ ...newItem, location: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setEditingMaquinaria(null); setIsAddingItem(null); }}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
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
        )}
      </Modal>

      <Modal
        isOpen={!!editingMaterial || isAddingItem === 'material'}
        onClose={() => { setEditingMaterial(null); setIsAddingItem(null); }}
        title={editingMaterial ? "Editar Material" : "Nuevo Material"}
      >
        {(editingMaterial || isAddingItem === 'material') && (
          <form onSubmit={handleSaveMaterial} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={editingMaterial ? editingMaterial.name : newItem.name}
                onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, name: e.target.value }) : setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <input
                type="text"
                required
                value={editingMaterial ? editingMaterial.category : newItem.category}
                onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, category: e.target.value }) : setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  required
                  value={editingMaterial ? editingMaterial.qty : newItem.qty}
                  onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, qty: Number(e.target.value) }) : setNewItem({ ...newItem, qty: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                <input
                  type="text"
                  required
                  value={editingMaterial ? editingMaterial.unit : newItem.unit}
                  onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, unit: e.target.value }) : setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setEditingMaterial(null); setIsAddingItem(null); }}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
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
        )}
      </Modal>

      <Modal
        isOpen={!!editingAditivo || isAddingItem === 'aditivo'}
        onClose={() => { setEditingAditivo(null); setIsAddingItem(null); }}
        title={editingAditivo ? `Editar ${aditivosTitle}` : `Nuevo ${aditivosTitle}`}
      >
        {(editingAditivo || isAddingItem === 'aditivo') && (
          <form onSubmit={handleSaveAditivo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={editingAditivo ? editingAditivo.name : newItem.name}
                onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, name: e.target.value }) : setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <input
                  type="text"
                  required
                  value={editingAditivo ? editingAditivo.category : newItem.category}
                  onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, category: e.target.value }) : setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo ($)</label>
                <input
                  type="number"
                  value={editingAditivo ? editingAditivo.costo : newItem.costo || ''}
                  onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, costo: Number(e.target.value) }) : setNewItem({ ...newItem, costo: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  required
                  value={editingAditivo ? editingAditivo.qty : newItem.qty}
                  onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, qty: Number(e.target.value) }) : setNewItem({ ...newItem, qty: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                <input
                  type="text"
                  required
                  value={editingAditivo ? editingAditivo.unit : newItem.unit}
                  onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, unit: e.target.value }) : setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia Dosificación</label>
                <input
                  type="text"
                  placeholder="Ej: Mensual"
                  value={editingAditivo ? editingAditivo.frecuenciaDosificacion : newItem.frecuenciaDosificacion || ''}
                  onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, frecuenciaDosificacion: e.target.value }) : setNewItem({ ...newItem, frecuenciaDosificacion: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
                <input
                  type="date"
                  value={editingAditivo ? editingAditivo.fechaVencimiento : newItem.fechaVencimiento || ''}
                  onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, fechaVencimiento: e.target.value }) : setNewItem({ ...newItem, fechaVencimiento: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación de Almacenamiento</label>
              <input
                type="text"
                placeholder="Ej: Depósito A"
                value={editingAditivo ? editingAditivo.ubicacionAlmacenamiento : newItem.ubicacionAlmacenamiento || ''}
                onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, ubicacionAlmacenamiento: e.target.value }) : setNewItem({ ...newItem, ubicacionAlmacenamiento: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setEditingAditivo(null); setIsAddingItem(null); }}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
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
        )}
      </Modal>

      <Modal
        isOpen={!!editingProject || isAddingItem === 'project'}
        onClose={() => { setEditingProject(null); setIsAddingItem(null); }}
        title={editingProject ? "Editar Proyecto" : "Nuevo Proyecto"}
      >
        {(editingProject || isAddingItem === 'project') && (
          <form onSubmit={handleSaveProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Proyecto</label>
              <input
                type="text"
                required
                value={editingProject ? editingProject.name : newItem.name}
                onChange={e => editingProject ? setEditingProject({ ...editingProject, name: e.target.value }) : setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
              <input
                type="text"
                required
                value={editingProject ? editingProject.location : newItem.location}
                onChange={e => editingProject ? setEditingProject({ ...editingProject, location: e.target.value }) : setNewItem({ ...newItem, location: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Productos (Items)</label>
              <input
                type="number"
                required
                value={editingProject ? editingProject.itemsCount : newItem.itemsCount}
                onChange={e => editingProject ? setEditingProject({ ...editingProject, itemsCount: Number(e.target.value) }) : setNewItem({ ...newItem, itemsCount: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setEditingProject(null); setIsAddingItem(null); }}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
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
        )}
      </Modal>

      {/* Modal de Detalles de Aditivo */}
      <Modal
        isOpen={!!selectedAditivoDetail}
        onClose={() => setSelectedAditivoDetail(null)}
        title={`Detalles de ${aditivosTitle}`}
      >
        {selectedAditivoDetail && (
          <div className="space-y-6">
            {/* Alertas */}
            {checkAditivoAlerts(selectedAditivoDetail).length > 0 && (
              <div className="space-y-2">
                {checkAditivoAlerts(selectedAditivoDetail).map((alert, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg border ${alert.type === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                    <AlertTriangle size={18} />
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Info Principal */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Nombre</p>
                <p className="font-semibold text-slate-900">{selectedAditivoDetail.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Stock Actual</p>
                <p className="font-semibold text-slate-900">{selectedAditivoDetail.qty} {selectedAditivoDetail.unit}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><DollarSign size={14} /> Costo</p>
                <p className="font-semibold text-slate-900">${selectedAditivoDetail.costo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Activity size={14} /> Frecuencia</p>
                <p className="font-semibold text-slate-900">{selectedAditivoDetail.frecuenciaDosificacion || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Calendar size={14} /> Vencimiento</p>
                <p className="font-semibold text-slate-900">{selectedAditivoDetail.fechaVencimiento ? new Date(selectedAditivoDetail.fechaVencimiento).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><MapPin size={14} /> Ubicación</p>
                <p className="font-semibold text-slate-900">{selectedAditivoDetail.ubicacionAlmacenamiento || 'N/A'}</p>
              </div>
            </div>

            {/* Historial de Uso */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">Historial de Uso</h3>
                <button
                  onClick={() => alert('Agregar uso')}
                  className="text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-2 py-1 rounded hover:bg-[#3A5F4B]/20 transition-colors"
                >
                  + Registrar Uso
                </button>
              </div>

              {selectedAditivoDetail.historialUso && selectedAditivoDetail.historialUso.length > 0 ? (
                <div className="space-y-2">
                  {selectedAditivoDetail.historialUso.map((uso: any) => (
                    <div key={uso.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white">
                      <div>
                        <p className="font-medium text-sm text-slate-800">{uso.proyecto}</p>
                        <p className="text-xs text-slate-500">{new Date(uso.fecha).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#3A5F4B]">{uso.cantidadUsada} {selectedAditivoDetail.unit}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Usado</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <p className="text-sm text-slate-500">No hay registros de uso.</p>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedAditivoDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditingAditivosAlerts}
        onClose={() => setIsEditingAditivosAlerts(false)}
        title="Configurar Alertas"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Crítico (Agotado)</label>
            <input
              type="number"
              value={aditivosAlertConfig.criticalStock}
              onChange={e => setAditivosAlertConfig({ ...aditivosAlertConfig, criticalStock: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Se mostrará alerta crítica si el stock es menor o igual a este valor.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Bajo (Advertencia)</label>
            <input
              type="number"
              value={aditivosAlertConfig.warningStock}
              onChange={e => setAditivosAlertConfig({ ...aditivosAlertConfig, warningStock: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Se mostrará advertencia si el stock es menor o igual a este valor (y mayor al crítico).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Días para Vencimiento (Advertencia)</label>
            <input
              type="number"
              value={aditivosAlertConfig.warningDays}
              onChange={e => setAditivosAlertConfig({ ...aditivosAlertConfig, warningDays: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Se mostrará advertencia si faltan estos días o menos para el vencimiento.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => setIsEditingAditivosAlerts(false)}
              className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!managingStockProject}
        onClose={() => setManagingStockProject(null)}
        title={`Gestionar Stock: ${managingStockProject?.name}`}
      >
        {managingStockProject && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-700">Items Asignados</h3>
              <button
                onClick={() => {
                  setManagingStockProject({
                    ...managingStockProject,
                    assignedItems: [...(managingStockProject.assignedItems || []), { id: Date.now(), name: '', qty: 1 }]
                  });
                }}
                className="text-xs font-semibold text-[#3A5F4B] bg-[#3A5F4B]/10 px-2 py-1 rounded hover:bg-[#3A5F4B]/20 transition-colors"
              >
                + Añadir Item
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {(managingStockProject.assignedItems || []).map((item: any, index: number) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del item"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...managingStockProject.assignedItems];
                      newItems[index].name = e.target.value;
                      setManagingStockProject({ ...managingStockProject, assignedItems: newItems });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Cant."
                    value={item.qty}
                    onChange={(e) => {
                      const newItems = [...managingStockProject.assignedItems];
                      newItems[index].qty = Number(e.target.value);
                      setManagingStockProject({ ...managingStockProject, assignedItems: newItems });
                    }}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      const newItems = managingStockProject.assignedItems.filter((_: any, i: number) => i !== index);
                      setManagingStockProject({ ...managingStockProject, assignedItems: newItems });
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {(!managingStockProject.assignedItems || managingStockProject.assignedItems.length === 0) && (
                <p className="text-center text-slate-500 text-sm py-4">No hay items asignados a este proyecto.</p>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setManagingStockProject(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const totalItems = (managingStockProject.assignedItems || []).reduce((sum: number, item: any) => sum + (Number(item.qty) || 0), 0);
                  const updatedProject = { ...managingStockProject, itemsCount: totalItems };
                  setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                  setManagingStockProject(null);
                }}
                className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedProjectChecklist}
        onClose={() => setSelectedProjectChecklist(null)}
        title={`Checklist: ${selectedProjectChecklist?.name}`}
      >
        {selectedProjectChecklist && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                id="new-checklist-item"
                placeholder="Nuevo producto a pedir..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      const updatedProject = {
                        ...selectedProjectChecklist,
                        checklist: [...(selectedProjectChecklist.checklist || []), { id: Date.now(), text: input.value.trim(), qty: 1, isChecked: false }]
                      };
                      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                      setSelectedProjectChecklist(updatedProject);
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('new-checklist-item') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    const updatedProject = {
                      ...selectedProjectChecklist,
                      checklist: [...(selectedProjectChecklist.checklist || []), { id: Date.now(), text: input.value.trim(), qty: 1, isChecked: false }]
                    };
                    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                    setSelectedProjectChecklist(updatedProject);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
              >
                Añadir
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(selectedProjectChecklist.checklist || []).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => {
                        const updatedProject = {
                          ...selectedProjectChecklist,
                          checklist: selectedProjectChecklist.checklist.map((i: any) => i.id === item.id ? { ...i, isChecked: !i.isChecked } : i)
                        };
                        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                        setSelectedProjectChecklist(updatedProject);
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-[#3A5F4B] focus:ring-[#3A5F4B]"
                    />
                    <span className={`${item.isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.qty || 1}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 1;
                        const updatedProject = {
                          ...selectedProjectChecklist,
                          checklist: selectedProjectChecklist.checklist.map((i: any) => i.id === item.id ? { ...i, qty: newQty } : i)
                        };
                        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                        setSelectedProjectChecklist(updatedProject);
                      }}
                      className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#3A5F4B] outline-none text-center"
                    />
                    <button
                      onClick={() => {
                        const updatedProject = {
                          ...selectedProjectChecklist,
                          checklist: selectedProjectChecklist.checklist.filter((i: any) => i.id !== item.id)
                        };
                        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                        setSelectedProjectChecklist(updatedProject);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {(!selectedProjectChecklist.checklist || selectedProjectChecklist.checklist.length === 0) && (
                <p className="text-center text-slate-500 text-sm py-4">No hay productos en la checklist.</p>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProjectChecklist(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
