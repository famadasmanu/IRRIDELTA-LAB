import React, { useState, useEffect } from 'react';
import {
  Archive, UserCircle, Search, MapPin,
  Plus, Trash2, FileText, MessageCircle,
  Edit2, Droplet, Wrench, Waves
} from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Modal } from '../components/Modal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';



const initialProjects = [
  { id: '1', name: 'Nordelta - Barrio El Golf', cliente: 'Familia Pérez', location: 'Tigre, Buenos Aires', itemsCount: 42, gradient: 'from-emerald-500 to-teal-600', checklist: [{ id: 1, text: 'Cemento Portland', isChecked: false }, { id: 2, text: 'Arena', isChecked: false }], assignedItems: [{ id: 1, name: 'Cemento', qty: 20 }, { id: 2, name: 'Arena', qty: 22 }] },
  { id: '2', name: 'Puertos del Lago', cliente: 'Consorcio Las Lomas', location: 'Escobar, Buenos Aires', itemsCount: 18, gradient: 'from-indigo-500 to-purple-500', checklist: [{ id: 1, text: 'Pintura Blanca', isChecked: true }], assignedItems: [{ id: 1, name: 'Pintura Blanca', qty: 18 }] },
];



export default function Inventario() {
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('inventario_search_query') || '';
  });

  useEffect(() => {
    localStorage.removeItem('inventario_search_query');
  }, []);

      const { data: projectsData, add: addProjectToDB, update: updateProjectInDB, remove: removeProjectFromDB } = useFirestoreCollection<any>('projects');
      const projects = projectsData.length > 0 ? projectsData : initialProjects;

      const [editingProject, setEditingProject] = useState<any>(null);
    const [managingStockProject, setManagingStockProject] = useState<any>(null);
    const [selectedProjectChecklist, setSelectedProjectChecklist] = useState<any>(null);
  const [isAddingItem, setIsAddingItem] = useState<'material' | 'aditivo' | 'project' | 'maquinaria' | null>(null);
  const [newItem, setNewItem] = useState<any>({});
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(null);
  
  // Handlers for Materials
  
  
  // Handlers for Aditivos
  
  
  
  // Handlers for Projects
  const handleDeleteProject = async (id: string) => {
    if (window.confirm('¿Eliminar este proyecto?')) {
      await removeProjectFromDB(id);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'project') {
      const projectToAdd = { ...newItem, gradient: 'from-emerald-500 to-teal-600' };
      delete projectToAdd.id; // Just in case
      await addProjectToDB(projectToAdd);
      setIsAddingItem(null);
    } else {
      const projectToUpdate = { ...editingProject };
      const id = projectToUpdate.id;
      delete projectToUpdate.id;
      await updateProjectInDB(id, projectToUpdate);
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
      const fileName = `Proyecto_${project.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      // Save to Archivo
      const newFile = {
        id: Date.now(),
        name: fileName,
        type: 'pdf',
        size: '1.5 MB',
        date: 'Justo ahora'
      };
      try {
        const currentFiles = JSON.parse(localStorage.getItem('archivo_recent_files') || '[]');
        localStorage.setItem('archivo_recent_files', JSON.stringify([newFile, ...currentFiles]));
      } catch (e) {
        console.error('Error saving to Archivo', e);
      }
      alert('Reporte PDF generado y archivado correctamente en "Archivo".');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setExportingProjectId(null);
    }
  };

  // Wait, deleting broken code.
      const filteredProjects = projects.filter(p => (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.cliente?.toLowerCase() || '').includes(searchQuery.toLowerCase()));
  
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
                onClick={() => { setIsAddingItem('project'); setNewItem({ name: '', cliente: '', location: '', itemsCount: 0, checklist: [] }); }}
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

        </main>

      {/* Modal de Creación y Edición de Proyecto */}

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
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente Asignado</label>
              <input
                type="text"
                value={editingProject ? editingProject.cliente || '' : newItem.cliente || ''}
                onChange={e => editingProject ? setEditingProject({ ...editingProject, cliente: e.target.value }) : setNewItem({ ...newItem, cliente: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                placeholder="Ej. Consorcio Las Lomas"
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
                onClick={async () => {
                  const totalItems = (managingStockProject.assignedItems || []).reduce((sum: number, item: any) => sum + (Number(item.qty) || 0), 0);
                  const updatedProject = { ...managingStockProject, itemsCount: totalItems };
                  const id = updatedProject.id;
                  delete updatedProject.id;
                  await updateProjectInDB(id, updatedProject);
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
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      const updatedProject = {
                        ...selectedProjectChecklist,
                        checklist: [...(selectedProjectChecklist.checklist || []), { id: Date.now(), text: input.value.trim(), qty: 1, isChecked: false }]
                      };
                      const id = updatedProject.id;
                      const projectToUpdate = { ...updatedProject };
                      delete projectToUpdate.id;
                      await updateProjectInDB(id, projectToUpdate);
                      setSelectedProjectChecklist(updatedProject);
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                onClick={async () => {
                  const input = document.getElementById('new-checklist-item') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    const updatedProject = {
                      ...selectedProjectChecklist,
                      checklist: [...(selectedProjectChecklist.checklist || []), { id: Date.now(), text: input.value.trim(), qty: 1, isChecked: false }]
                    };
                    const id = updatedProject.id;
                    const projectToUpdate = { ...updatedProject };
                    delete projectToUpdate.id;
                    await updateProjectInDB(id, projectToUpdate);
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
                      onChange={async () => {
                        const updatedProject = {
                          ...selectedProjectChecklist,
                          checklist: selectedProjectChecklist.checklist.map((i: any) => i.id === item.id ? { ...i, isChecked: !i.isChecked } : i)
                        };
                        const id = updatedProject.id;
                        const projectToUpdate = { ...updatedProject };
                        delete projectToUpdate.id;
                        await updateProjectInDB(id, projectToUpdate);
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
                      onChange={async (e) => {
                        const newQty = parseInt(e.target.value) || 1;
                        const updatedProject = {
                          ...selectedProjectChecklist,
                          checklist: selectedProjectChecklist.checklist.map((i: any) => i.id === item.id ? { ...i, qty: newQty } : i)
                        };
                        const id = updatedProject.id;
                        const projectToUpdate = { ...updatedProject };
                        delete projectToUpdate.id;
                        await updateProjectInDB(id, projectToUpdate);
                        setSelectedProjectChecklist(updatedProject);
                      }}
                      className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-[#3A5F4B] outline-none text-center"
                    />
                    <button
                      onClick={async () => {
                        const updatedProject = {
                          ...selectedProjectChecklist,
                          checklist: selectedProjectChecklist.checklist.filter((i: any) => i.id !== item.id)
                        };
                        const id = updatedProject.id;
                        const projectToUpdate = { ...updatedProject };
                        delete projectToUpdate.id;
                        await updateProjectInDB(id, projectToUpdate);
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
