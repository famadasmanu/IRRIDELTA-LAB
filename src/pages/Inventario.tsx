import React, { useState, useEffect } from 'react';
import {
  Archive, UserCircle, Search, MapPin,
  Plus, Trash2, FileText, MessageCircle,
  Edit2, Droplet, Wrench, Waves, Box, Filter, Droplets, Plug, Activity, AlertTriangle, Image as ImageIcon, UploadCloud, ShoppingCart
} from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Modal } from '../components/Modal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { MaquinariaTab } from './inventario/MaquinariaTab';
import { AditivosTab } from './inventario/AditivosTab';
import { GeneralesTab } from './inventario/GeneralesTab';

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
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('inventario_search_query') || '';
  });
  const [userRole] = useState(() => {
    try {
      const item = window.localStorage.getItem('user_role');
      return item ? JSON.parse(item) : 'admin';
    } catch {
      return 'admin';
    }
  });
  const isInstalador = userRole === 'instalador';

  useEffect(() => {
    localStorage.removeItem('inventario_search_query');
  }, []);

      const { data: clientesData } = useFirestoreCollection<any>('clientes');
      const { data: trabajosData, update: updateTrabajoInDB, remove: removeTrabajoFromDB, add: addTrabajoToDB } = useFirestoreCollection<any>('trabajos_portfolio');
      
      // Map Trabajos Portfolio to the local 'projects' structure expected by Inventario
      const projects = trabajosData
        .filter((t: any) => t.estado !== 'Completado' && t.estado !== 'Archivado')
        .map((t: any) => ({
          ...t,
          name: t.titulo || t.name,
          location: t.ubicacion || t.location,
          imagenUrl: t.img || t.imagenUrl
        }));
      
      const addProjectToDB = async (item: any) => {
        return addTrabajoToDB({ 
          ...item, 
          titulo: item.name, 
          ubicacion: item.location, 
          img: item.imagenUrl, 
          estado: 'Planificación' 
        });
      };
      
      const updateProjectInDB = async (id: string, item: any) => {
        return updateTrabajoInDB(id, { 
          ...item, 
          titulo: item.name, 
          ubicacion: item.location, 
          img: item.imagenUrl 
        });
      };
      
      const removeProjectFromDB = removeTrabajoFromDB;

      const { data: maquinarias, add: addMaquinaria, update: updateMaquinaria, remove: removeMaquinaria } = useFirestoreCollection<any>('inventario_maquinas');
      const { data: aditivos, add: addAditivo, update: updateAditivo, remove: removeAditivo } = useFirestoreCollection<any>('inventario_aditivos');
      const { data: materiales, add: addMaterial, update: updateMaterial, remove: removeMaterial } = useFirestoreCollection<any>('inventario_generales');

      const [editingProject, setEditingProject] = useState<any>(null);
      const [editingMaquinaria, setEditingMaquinaria] = useState<any>(null);
      const [editingAditivo, setEditingAditivo] = useState<any>(null);
      const [editingMaterial, setEditingMaterial] = useState<any>(null);
    const [managingStockProject, setManagingStockProject] = useState<any>(null);
    const [selectedProjectChecklist, setSelectedProjectChecklist] = useState<any>(null);
  const [isAddingItem, setIsAddingItem] = useState<'material' | 'aditivo' | 'project' | 'maquinaria' | null>(null);
  const [newItem, setNewItem] = useState<any>({});
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(null);
  const [isExportingMaterials, setIsExportingMaterials] = useState(false);
  const [showMaterialFilters, setShowMaterialFilters] = useState(false);
  
  // Pagination states
  const [visibleProjects, setVisibleProjects] = useState(10);
  
  // Checklist de Pedido Global
  const [pedidoItems, setPedidoItems] = useState<any[]>([]);
  const [isPedidoModalOpen, setIsPedidoModalOpen] = useState(false);
  const [pedidoMessage, setPedidoMessage] = useState('Hola Argent Software, necesito presupuesto/reposición para los siguientes ítems:');

  const handleAddToPedido = (item: any) => {
    setIsPedidoModalOpen(true);
    setPedidoItems(prev => {
      if (prev.find(p => p.id === item.id)) return prev;
      return [...prev, item];
    });
  };
  const [activeMaterialFilter, setActiveMaterialFilter] = useState<string>('Todos');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [activeCategory, setActiveCategory] = useState<'proyectos' | 'maquinarias' | 'aditivos' | 'materiales' | null>('proyectos');
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('inventory_category_images') || '{}');
    } catch {
      return {};
    }
  });

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      
      const storageRef = ref(storage, `inventario/categories/${Date.now()}_img.jpg`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      const newImages = { ...categoryImages, [categoryKey]: url };
      setCategoryImages(newImages);
      localStorage.setItem('inventory_category_images', JSON.stringify(newImages));
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Error al subir la imagen de la plantilla.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const storageRef = ref(storage, `inventario/projects/${Date.now()}_img.jpg`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      if (editingProject) {
        setEditingProject({ ...editingProject, imagenUrl: url });
      } else {
        setNewItem({ ...newItem, imagenUrl: url });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen.');
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Handlers for Maquinarias
  const handleSaveMaquinaria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'maquinaria') {
      await addMaquinaria(newItem);
      setIsAddingItem(null);
    } else if (editingMaquinaria) {
      const id = editingMaquinaria.id;
      const upd = { ...editingMaquinaria };
      delete upd.id;
      await updateMaquinaria(id, upd);
      setEditingMaquinaria(null);
    }
  };
  const handleDeleteMaquinaria = async (id: string) => {
    if (window.confirm('¿Eliminar esta maquinaria?')) await removeMaquinaria(id);
  };

  // Handlers for Materiales
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'material') {
      await addMaterial({ 
        ...newItem, 
        status: 'Estable', 
        statusColor: 'bg-emerald-100 text-emerald-700', 
        iconBg: 'bg-emerald-50', 
        iconColor: 'text-emerald-600', 
        iconName: 'Box' 
      });
      setIsAddingItem(null);
    } else if (editingMaterial) {
      const id = editingMaterial.id;
      const upd = { ...editingMaterial };
      delete upd.id;
      await updateMaterial(id, upd);
      setEditingMaterial(null);
    }
  };
  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('¿Eliminar este material?')) await removeMaterial(id);
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

      const rows = materiales.map((m: any) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #111827; font-weight: 500;">${m.name}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${m.category}</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: bold; text-align: right;">${m.qty} ${m.unit}</td>
          <td style="padding: 12px 8px; text-align: right;">
            <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; color: #374151; text-transform: uppercase;">
              ${m.status || 'Estable'}
            </span>
          </td>
        </tr>
      `).join('');

      printContent.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 30px;">Reporte de Materiales Disponibles</h1>
          
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
      const canvas = await html2canvas(printContent, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(printContent);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const generatedName = 'Materiales_Disponibles.pdf';
      pdf.save(generatedName);

      // Add to recent files locally just for UX
      const currentFiles = JSON.parse(localStorage.getItem('archivo_recent_files') || '[]');
      localStorage.setItem('archivo_recent_files', JSON.stringify([{
          id: Date.now(), name: generatedName, type: 'pdf', size: '1.2 MB', date: 'Justo ahora'
      }, ...currentFiles]));

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setIsExportingMaterials(false);
    }
  };

  // Handlers for Aditivos
  const handleSaveAditivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingItem === 'aditivo') {
      await addAditivo(newItem);
      setIsAddingItem(null);
    } else if (editingAditivo) {
      const id = editingAditivo.id;
      const upd = { ...editingAditivo };
      delete upd.id;
      await updateAditivo(id, upd);
      setEditingAditivo(null);
    }
  };
  const handleDeleteAditivo = async (id: string) => {
    if (window.confirm('¿Eliminar este aditivo?')) await removeAditivo(id);
  };
  const handleDeleteProject = async (id: string) => {
    if (window.confirm('¿Eliminar este proyecto?')) {
      await removeProjectFromDB(id);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentItem = isAddingItem === 'project' ? { ...newItem } : { ...editingProject };
    
    // Check if new obra needed
    if (currentItem.obraId === 'new_obra' && currentItem.newObraName) {
      const selectedTrabajo = trabajosData.find((t: any) => t.id === currentItem.trabajoId);
      if (selectedTrabajo) {
         const newObraId = Date.now().toString();
         const newObra = { id: newObraId, nombre: currentItem.newObraName, notas: [], gastos: [] };
         const updatedTrabajosPactados = [...(selectedTrabajo.trabajosPactados || []), newObra];
         await updateTrabajoInDB(selectedTrabajo.id, { trabajosPactados: updatedTrabajosPactados });
         
         currentItem.obraId = newObraId;
         currentItem.obraName = currentItem.newObraName;
         currentItem.name = `Inventario - ${currentItem.newObraName}`;
      }
    }
    delete currentItem.newObraName; // cleanup

    if (isAddingItem === 'project') {
      const projectToAdd = { ...currentItem, gradient: 'from-emerald-500 to-teal-600' };
      delete projectToAdd.id; // Just in case
      await addProjectToDB(projectToAdd);
      setIsAddingItem(null);
    } else {
      const projectToUpdate = { ...currentItem };
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
              <div style="width: 16px; height: 16px; border: 2px solid #059669; border-radius: 4px; background-color: ${item.isChecked ? '#059669' : 'transparent'};"></div>
              <span style="text-decoration: ${item.isChecked ? 'line-through' : 'none'}; color: ${item.isChecked ? '#9ca3af' : '#111827'};">${item.qty || 1}x ${item.text}</span>
            </div>
          </td>
        </tr>
      `).join('');

      printContent.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 20px;">Reporte de Proyecto</h1>
          
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

  const filteredMaterials = materiales.filter((m: any) => {
    const matchesSearch = (m.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (m.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFilter = activeMaterialFilter === 'Todos' || m.category === activeMaterialFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredProjects = projects.filter((p: any) => (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.cliente?.toLowerCase() || '').includes(searchQuery.toLowerCase()));
  
  return (
    <div className="flex flex-col font-sans pb-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="glass-card rounded-2xl p-4 mb-6 relative">
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 p-2 rounded-lg text-accent">
              <Archive size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-tx-primary">Inventario</h1>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            {pedidoItems.length > 0 ? (
              <button 
                onClick={() => setIsPedidoModalOpen(true)}
                className="flex items-center flex-1 justify-center gap-2 bg-[#25D366]/10 text-[#25D366] px-4 py-2.5 rounded-xl border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all font-bold text-sm shadow-sm"
              >
                <ShoppingCart size={18} />
                <span>{pedidoItems.length} Elementos en Pedido</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsPedidoModalOpen(true)}
                className="flex items-center flex-1 justify-center gap-2 bg-main text-tx-secondary px-4 py-2.5 rounded-xl border border-bd-lines hover:bg-slate-200 transition-all font-bold text-sm shadow-sm"
              >
                <ShoppingCart size={18} />
                <span>Pedido Vacío</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Buscador Principal */}
      <div className="mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-secondary group-focus-within:text-accent transition-colors w-5 h-5" />
          <input
            className="w-full pl-11 pr-4 py-3 glass-card rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-sm text-tx-primary dark:text-tx-primary"
            placeholder="Buscar materiales, obras o códigos..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido Unificado */}
      <main className="space-y-8">

                {/* TABS DE NAVEGACION (Reemplaza las tarjetas grandes) */}
        {!searchQuery && (
          <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar mb-6 pb-2 border-b border-bd-lines">
            <button
              onClick={() => setActiveCategory('proyectos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeCategory === 'proyectos' || !activeCategory
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-tx-secondary hover:bg-card/50 border border-transparent hover:border-bd-lines'
              }`}
            >
              <Archive size={18} />
              Proyectos en Curso ({projects.length})
            </button>
            {!isInstalador && (
              <button
                onClick={() => setActiveCategory('maquinarias')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeCategory === 'maquinarias'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm'
                    : 'text-tx-secondary hover:bg-card/50 border border-transparent hover:border-bd-lines'
                }`}
              >
                <Wrench size={18} />
                Maquinarias ({maquinarias.length})
              </button>
            )}
            {!isInstalador && (
              <button
                onClick={() => setActiveCategory('aditivos')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeCategory === 'aditivos'
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30 shadow-sm'
                    : 'text-tx-secondary hover:bg-card/50 border border-transparent hover:border-bd-lines'
                }`}
              >
                <Droplet size={18} />
                Aditivos ({aditivos.length})
              </button>
            )}
            {!isInstalador && (
              <button
                onClick={() => setActiveCategory('materiales')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeCategory === 'materiales'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-tx-secondary hover:bg-card/50 border border-transparent hover:border-bd-lines'
                }`}
              >
                <Box size={18} />
                Materiales ({materiales.length})
              </button>
            )}
          </div>
        )}

        {/* SECCIÓN: OBRAS */}
        {(activeCategory === 'proyectos' || (!activeCategory && searchQuery)) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-tx-secondary">Proyectos en Curso</h2>
            <div className="flex gap-2">
              {!isInstalador && (
                <button
                  onClick={() => { 
                    let presetCliente = '';
                    let presetClienteId = '';
                    const foundClient = clientesData?.find((c: any) => c.name === searchQuery);
                    if (foundClient) {
                      presetCliente = foundClient.name;
                      presetClienteId = foundClient.id;
                    }
                    setIsAddingItem('project'); 
                    setNewItem({ name: '', cliente: presetCliente, clienteId: presetClienteId, location: '', itemsCount: 0, checklist: [] }); 
                  }}
                  className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.slice(0, visibleProjects).map(project => {
              const checklistText = (Array.isArray(project.checklist) ? project.checklist : []).filter((i: any) => !i.isChecked).map((i: any) => `- ${i.qty || 1}x ${i.text}`).join('%0A');
              const whatsappMessage = `Hola equipo de Argent Software, necesito encargar los siguientes materiales y/o pedir presupuesto para el proyecto: ${project.name}.%0A%0AProductos a pedir:%0A${checklistText || 'Ninguno especificado'}`;

              return (
                <div key={project.id} className="glass-card rounded-2xl overflow-hidden relative group transition-all flex flex-col hover:border-accent">
                  
                  {/* Decorative Left Border connected to the Project accent */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent z-10"></div>

                  {/* Acciones de Proyecto (Flotantes) */}
                  {!isInstalador && (
                    <div className="absolute top-3 right-3 flex gap-1 z-20">
                      <button
                        onClick={() => handleExportProjectPDF(project)}
                        disabled={exportingProjectId === project.id}
                        className={`p-1.5 bg-card/50 dark:bg-card/50 hover:bg-card/80 dark:hover:bg-slate-700/80 backdrop-blur-sm text-tx-secondary dark:text-tx-primary hover:text-tx-primary dark:hover:text-white rounded-lg transition-colors ${exportingProjectId === project.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Exportar a PDF"
                      >
                        <FileText size={16} className={exportingProjectId === project.id ? 'animate-pulse' : ''} />
                      </button>
                      <button
                        onClick={() => setEditingProject(project)}
                        className="p-1.5 bg-card/50 dark:bg-card/50 hover:bg-card/80 dark:hover:bg-slate-700/80 backdrop-blur-sm text-tx-secondary dark:text-tx-primary hover:text-tx-primary dark:hover:text-white rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1.5 bg-card/50 dark:bg-card/50 hover:bg-red-50 dark:hover:bg-red-500/80 backdrop-blur-sm text-tx-secondary dark:text-tx-primary hover:text-red-500 dark:hover:text-white rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  <div className={`h-28 bg-main dark:bg-card relative overflow-hidden bg-cover bg-center`} style={{ backgroundImage: project.imagenUrl ? `url(${project.imagenUrl})` : undefined }}>
                     <div className="absolute inset-0 bg-black/40 dark:bg-black/60 group-hover:bg-black/30 dark:group-hover:bg-black/40 transition-colors"></div>
                     <div className="absolute bottom-3 left-6 text-white pr-20 z-10">
                       <h4 className="font-bold text-lg leading-tight text-white mb-1">{project.name}</h4>
                       <div className="flex flex-col gap-0.5">
                         <p className="text-xs font-semibold text-slate-200 dark:text-tx-primary flex items-center gap-1.5">
                           <UserCircle className="w-3.5 h-3.5 text-accent" /> {project.cliente || 'Sin cliente'}
                         </p>
                         <p className="text-xs font-medium text-slate-300 dark:text-tx-secondary flex items-center gap-1.5">
                           <MapPin className="w-3.5 h-3.5 text-tx-secondary dark:text-tx-secondary" /> {project.location || 'Sin ubicación'}
                         </p>
                       </div>
                     </div>
                   </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-tx-secondary dark:text-tx-secondary uppercase tracking-widest">Items asignados</span>
                        <span className="text-xs font-black text-tx-primary dark:text-tx-primary bg-main dark:bg-slate-700/50 px-2 py-1 rounded-md">{project.assignedItems?.length || 0} ítems</span>
                      </div>
                      <div className="flex -space-x-2 overflow-hidden mb-5">
                        <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-main dark:bg-slate-700 items-center justify-center text-accent">
                          <Droplet className="w-4 h-4" />
                        </div>
                        <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-main dark:bg-slate-700 items-center justify-center text-accent">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-main dark:bg-slate-700 items-center justify-center text-accent">
                          <Waves className="w-4 h-4" />
                        </div>
                        <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 bg-main dark:bg-slate-700 items-center justify-center text-[10px] font-bold text-tx-secondary dark:text-tx-secondary">
                          +{(project.assignedItems?.length || 0) > 3 ? (project.assignedItems?.length || 0) - 3 : 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                      <button
                        onClick={() => setSelectedProjectChecklist(project)}
                        className="w-full py-2 bg-main dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600/50 text-tx-primary dark:text-tx-primary text-sm font-bold rounded-xl transition-colors"
                      >
                        Checklist Pedido
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setManagingStockProject(project)}
                          className="flex-1 py-2 bg-accent text-white hover:bg-emerald-500 rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(58,95,75,0.3)] hover:-translate-y-0.5 flex justify-center items-center"
                        >
                          Gestionar Stock
                        </button>
                        <a
                          href={`https://wa.me/?text=${whatsappMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors"
                          title="Enviar pedido a Argent Software por WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
           
           {/* Load More Button */}
           {visibleProjects < filteredProjects.length && (
             <div className="flex justify-center mt-6">
               <button
                 onClick={() => setVisibleProjects(prev => prev + 10)}
                 className="px-6 py-2.5 bg-main text-tx-secondary font-bold rounded-xl border border-bd-lines hover:bg-slate-200 transition-colors shadow-sm"
               >
                 Cargar Más ({filteredProjects.length - visibleProjects} restantes)
               </button>
             </div>
           )}
 
           {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-tx-secondary text-sm col-span-full">No se encontraron proyectos.</div>
            )}
        </section>
        )}

                {/* SECCIÓN: MAQUINARIAS */}
        {(activeCategory === 'maquinarias' || (!activeCategory && searchQuery)) && (
          <MaquinariaTab searchQuery={searchQuery} onAddToPedido={handleAddToPedido} />
        )}

        {/* SECCIÓN: ADITIVOS */}
        {(activeCategory === 'aditivos' || (!activeCategory && searchQuery)) && (
          <AditivosTab searchQuery={searchQuery} onAddToPedido={handleAddToPedido} />
        )}

        {/* SECCIÓN: MATERIALES */}
        {(activeCategory === 'materiales' || (!activeCategory && searchQuery)) && (
          <GeneralesTab searchQuery={searchQuery} onAddToPedido={handleAddToPedido} />
        )}
</main>

      {/* Modal de Creación y Edición de Proyecto */}

      <Modal
        isOpen={!!editingProject || isAddingItem === 'project'}
        onClose={() => { setEditingProject(null); setIsAddingItem(null); }}
        title={editingProject ? "Editar Inventario de Obra" : "Nuevo Inventario de Obra"}
        className="max-h-[85vh] md:max-h-[75vh]"
      >
        {(editingProject || isAddingItem === 'project') && (
          <form onSubmit={handleSaveProject} className="space-y-4 px-1 pb-4">
            {/* FOTO UPLOAD */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Plantilla Visual (Imagen de Portada)</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-main border-2 border-bd-lines overflow-hidden flex items-center justify-center shrink-0">
                  {(editingProject?.imagenUrl || newItem?.imagenUrl) ? (
                    <img src={editingProject ? editingProject.imagenUrl : newItem.imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-tx-secondary opacity-50" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer bg-card border border-bd-lines hover:border-accent text-tx-primary font-bold text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-main">
                    <UploadCloud size={18} className="text-accent" />
                    {isUploadingImage ? 'Cargando Archivo...' : 'Seleccionar Imagen'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                  </label>
                  <p className="text-xs text-tx-secondary mt-2 font-medium">Se utilizará como portada en la cuadrícula principal.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Nombre / Título de Obra</label>
              <input
                type="text"
                required
                value={editingProject ? (editingProject.titulo || editingProject.name) : newItem.titulo || newItem.name}
                onChange={e => editingProject ? setEditingProject({ ...editingProject, titulo: e.target.value, name: e.target.value }) : setNewItem({ ...newItem, titulo: e.target.value, name: e.target.value })}
                className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card text-sm font-medium text-tx-primary transition-all hover:bg-main"
                placeholder="Ej: Inventario - Nivelación de terreno"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Cliente Asignado</label>
              <select
                value={editingProject ? editingProject.clienteId || '' : newItem.clienteId || ''}
                onChange={e => {
                  const selectedClient = clientesData.find((c: any) => c.id === e.target.value);
                  const clientName = selectedClient ? selectedClient.name : '';
                  if (editingProject) {
                    setEditingProject({ ...editingProject, clienteId: e.target.value, cliente: clientName, trabajoId: '', trabajoName: '', obraId: '', obraName: '' });
                  } else {
                    setNewItem({ ...newItem, clienteId: e.target.value, cliente: clientName, trabajoId: '', trabajoName: '', obraId: '', obraName: '' });
                  }
                }}
                className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card text-sm font-medium text-tx-primary transition-all hover:bg-main cursor-pointer"
              >
                <option value="">Seleccione un cliente...</option>
                {clientesData.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Proyecto</label>
              <select
                value={editingProject ? editingProject.trabajoId || '' : newItem.trabajoId || ''}
                onChange={e => {
                  const selectedTrabajo = trabajosData.find((t: any) => t.id === e.target.value);
                  const trabajoName = selectedTrabajo ? selectedTrabajo.titulo : '';
                  const location = selectedTrabajo ? selectedTrabajo.ubicacion : '';
                  if (editingProject) {
                    setEditingProject({ ...editingProject, trabajoId: e.target.value, trabajoName, location: location || editingProject.location, obraId: '', obraName: '' });
                  } else {
                    setNewItem({ ...newItem, trabajoId: e.target.value, trabajoName, location: location || newItem.location, obraId: '', obraName: '' });
                  }
                }}
                className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card text-sm font-medium text-tx-primary transition-all hover:bg-main cursor-pointer"
              >
                <option value="">
                  {(!editingProject && !newItem.cliente) ? 'Seleccione un cliente primero...' : 'Seleccione un proyecto...'}
                </option>
                {trabajosData
                  .filter((t: any) => {
                    const currentClienteName = editingProject ? editingProject.cliente : newItem.cliente;
                    return currentClienteName && t.cliente === currentClienteName;
                  })
                  .map((t: any) => (
                    <option key={t.id} value={t.id}>{t.titulo} ({t.estado})</option>
                  ))
                }
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Obra (Trabajo Pactado)</label>
              <select
                value={editingProject ? editingProject.obraId || '' : newItem.obraId || ''}
                onChange={e => {
                  const val = e.target.value;
                  const currentTrabajoId = editingProject ? editingProject.trabajoId : newItem.trabajoId;
                  const selectedTrabajo = trabajosData.find((t: any) => t.id === currentTrabajoId);
                  const selectedObra = selectedTrabajo?.trabajosPactados?.find((o: any) => o.id === val);
                  
                  const obraName = selectedObra ? selectedObra.nombre : '';
                  const defaultName = val === 'new_obra' ? '' : `Inventario - ${obraName || 'Nueva Obra'}`;

                  if (editingProject) {
                    setEditingProject({ ...editingProject, obraId: val, obraName, titulo: editingProject.titulo || defaultName });
                  } else {
                    setNewItem({ ...newItem, obraId: val, obraName, titulo: newItem.titulo || defaultName });
                  }
                }}
                className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card mb-2 text-sm font-medium text-tx-primary transition-all hover:bg-main cursor-pointer"
              >
                <option value="">Seleccione una obra...</option>
                {(() => {
                  const currentTrabajoId = editingProject ? editingProject.trabajoId : newItem.trabajoId;
                  const selectedTrabajo = trabajosData.find((t: any) => t.id === currentTrabajoId);
                  return (selectedTrabajo?.trabajosPactados || []).map((o: any) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ));
                })()}
                {(editingProject?.trabajoId || newItem.trabajoId) && (
                  <option value="new_obra" className="font-bold text-accent">+ Crear Nueva Obra</option>
                )}
              </select>

              {(editingProject?.obraId === 'new_obra' || newItem.obraId === 'new_obra') && (
                 <input 
                   type="text" 
                   required
                   placeholder="Nombre de la nueva obra..."
                   value={editingProject ? editingProject.newObraName || '' : newItem.newObraName || ''}
                   onChange={e => {
                      const name = e.target.value;
                      if (editingProject) {
                         setEditingProject({ ...editingProject, newObraName: name, name: `Inventario - ${name}` });
                      } else {
                         setNewItem({ ...newItem, newObraName: name, name: `Inventario - ${name}` });
                      }
                   }}
                   className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card text-sm font-medium text-tx-primary transition-all hover:bg-main"
                 />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Plantilla de Inventario (Opcional)</label>
              <select
                onChange={e => {
                  const templateType = e.target.value;
                  let templateItems: any[] = [];
                  if (templateType === 'jardineria') {
                    templateItems = [
                      { id: Date.now()+1, text: 'Tierra Negra', qty: 10, isChecked: false },
                      { id: Date.now()+2, text: 'Fertilizante', qty: 2, isChecked: false },
                      { id: Date.now()+3, text: 'Herramientas Básicas', qty: 1, isChecked: false }
                    ];
                  } else if (templateType === 'riego') {
                    templateItems = [
                      { id: Date.now()+1, text: 'Caños de PVC', qty: 20, isChecked: false },
                      { id: Date.now()+2, text: 'Aspersores', qty: 10, isChecked: false },
                      { id: Date.now()+3, text: 'Bomba de Agua', qty: 1, isChecked: false },
                      { id: Date.now()+4, text: 'Controlador Automático', qty: 1, isChecked: false }
                    ];
                  }
                  
                  if (editingProject) {
                     setEditingProject({ ...editingProject, checklist: templateItems.length > 0 ? templateItems : (editingProject.checklist || []) });
                  } else {
                     setNewItem({ ...newItem, checklist: templateItems.length > 0 ? templateItems : (newItem.checklist || []) });
                  }
                }}
                className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card text-sm font-medium text-tx-primary transition-all hover:bg-main cursor-pointer"
              >
                <option value="">Sin plantilla (Vacío)</option>
                <option value="jardineria">Plantilla Jardinería Básica</option>
                <option value="riego">Plantilla Sistema de Riego</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Ubicación</label>
              <input
                type="text"
                required
                value={editingProject ? editingProject.location : newItem.location}
                onChange={e => editingProject ? setEditingProject({ ...editingProject, location: e.target.value }) : setNewItem({ ...newItem, location: e.target.value })}
                className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card text-sm font-medium text-tx-primary transition-all hover:bg-main"
              />
            </div>
            <div className="hidden">
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Cantidad de Productos (Items)</label>
              <input
                type="number"
                value={editingProject ? editingProject.itemsCount : newItem.itemsCount}
                onChange={e => editingProject ? setEditingProject({ ...editingProject, itemsCount: Number(e.target.value) }) : setNewItem({ ...newItem, itemsCount: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card text-sm font-medium text-tx-primary transition-all hover:bg-main"
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setEditingProject(null); setIsAddingItem(null); }}
                className="px-4 py-2 text-tx-secondary font-medium hover:bg-main rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-colors"
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
              <h3 className="text-sm font-bold text-tx-primary">Items Asignados</h3>
              <button
                onClick={() => {
                  setManagingStockProject({
                    ...managingStockProject,
                    assignedItems: [...(managingStockProject.assignedItems || []), { id: Date.now(), name: '', qty: 1 }]
                  });
                }}
                className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded hover:opacity-90/20 transition-colors"
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
                    className="flex-1 px-3 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
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
                    className="w-20 px-3 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      const newItems = managingStockProject.assignedItems.filter((_: any, i: number) => i !== index);
                      setManagingStockProject({ ...managingStockProject, assignedItems: newItems });
                    }}
                    className="p-2 text-tx-secondary hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {(!managingStockProject.assignedItems || managingStockProject.assignedItems.length === 0) && (
                <p className="text-center text-tx-secondary text-sm py-4">No hay items asignados a este proyecto.</p>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-bd-lines">
              <button
                onClick={() => setManagingStockProject(null)}
                className="px-4 py-2 text-tx-secondary font-medium hover:bg-main rounded-lg transition-colors"
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
                className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-colors"
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
                className="flex-1 px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
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
                className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:opacity-90 transition-colors"
              >
                Añadir
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(selectedProjectChecklist.checklist || []).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-main rounded-lg border border-bd-lines">
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
                      className="w-5 h-5 rounded border-bd-lines text-accent focus:ring-accent"
                    />
                    <span className={`${item.isChecked ? 'line-through text-tx-secondary' : 'text-tx-primary'}`}>{item.text}</span>
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
                      className="w-16 px-2 py-1 text-sm border border-bd-lines rounded-md focus:ring-1 focus:ring-accent outline-none text-center"
                    />
                    <button
                      onClick={() => {
                        handleAddToPedido({
                          id: `check_${item.id}`,
                          name: item.text,
                          nombre: item.text,
                          cantidadPedido: item.qty || 1,
                          cantidad: item.qty || 1,
                          clienteNombre: `Obra: ${selectedProjectChecklist?.name || 'Desconocida'}`
                        });
                      }}
                      className="p-1.5 text-tx-secondary hover:text-accent transition-colors"
                      title="Añadir ítem al carrito (Pedido)"
                    >
                      <ShoppingCart size={16} />
                    </button>
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
                      className="p-1.5 text-tx-secondary hover:text-red-500 transition-colors"
                      title="Eliminar de la checklist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {(!selectedProjectChecklist.checklist || selectedProjectChecklist.checklist.length === 0) && (
                <p className="text-center text-tx-secondary text-sm py-4">No hay productos en la checklist.</p>
              )}
            </div>

            <div className="pt-4 flex justify-between items-center gap-3 border-t border-bd-lines">
              <button
                onClick={() => {
                  const unchecked = selectedProjectChecklist.checklist?.filter((i: any) => !i.isChecked) || [];
                  if (unchecked.length === 0) {
                     alert("No hay elementos pendientes en la checklist para pedir.");
                     return;
                  }
                  
                  const newOrders = unchecked.map((item: any) => ({
                    id: `check_${item.id}`,
                    name: item.text,
                    nombre: item.text,
                    cantidadPedido: item.qty || 1,
                    cantidad: item.qty || 1,
                    clienteNombre: `Obra: ${selectedProjectChecklist?.name || 'Desconocida'}`
                  }));
                  
                  setPedidoItems(prev => {
                     const updated = [...prev];
                     for (const order of newOrders) {
                        const existing = updated.find(p => p.id === order.id);
                        if (existing) {
                           existing.cantidadPedido = (existing.cantidadPedido || 1) + order.cantidadPedido;
                        } else {
                           updated.push(order);
                        }
                     }
                     return updated;
                  });
                  setSelectedProjectChecklist(null);
                  setIsPedidoModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 rounded-lg hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                title="Suma automáticamente lo que no está tachado al Pedido Global"
              >
                <ShoppingCart size={18} />
                Llenar automáticamente al Carrito
              </button>
              <button
                onClick={() => setSelectedProjectChecklist(null)}
                className="px-4 py-2 bg-main text-tx-primary font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL MAQUINARIA */}
      <Modal
        isOpen={!!editingMaquinaria || isAddingItem === 'maquinaria'}
        onClose={() => { setEditingMaquinaria(null); setIsAddingItem(null); }}
        title={editingMaquinaria ? "Editar Maquinaria" : "Nueva Maquinaria"}
      >
        <form onSubmit={handleSaveMaquinaria} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Nombre / Tipo</label>
            <input
              type="text"
              required
              value={editingMaquinaria ? editingMaquinaria.name : newItem.name}
              onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, name: e.target.value }) : setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              placeholder="Ej: Cortadora de césped 4x4"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Marca</label>
              <input
                type="text"
                value={editingMaquinaria ? editingMaquinaria.marca : newItem.marca}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, marca: e.target.value }) : setNewItem({ ...newItem, marca: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Modelo</label>
              <input
                type="text"
                value={editingMaquinaria ? editingMaquinaria.modelo : newItem.modelo}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, modelo: e.target.value }) : setNewItem({ ...newItem, modelo: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Cliente Asignado</label>
              <select
                value={editingMaquinaria ? editingMaquinaria.clienteId : newItem.clienteId || ''}
                onChange={e => {
                  const client = clientesData.find((c:any) => c.id === e.target.value);
                  const newVals = { clienteId: e.target.value, clienteNombre: client?.name || '' };
                  if (editingMaquinaria) setEditingMaquinaria({ ...editingMaquinaria, ...newVals });
                  else setNewItem({ ...newItem, ...newVals });
                }}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="">Bodega Central (Sin asignar)</option>
                {clientesData?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Categoría General</label>
              <select
                value={editingMaquinaria ? editingMaquinaria.categoria : newItem.categoria || 'Maquinaria'}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, categoria: e.target.value }) : setNewItem({ ...newItem, categoria: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="Maquinaria">Maquinaria</option>
                <option value="Insumos">Insumos</option>
                <option value="Aditivos">Aditivos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Estado</label>
              <select
                value={editingMaquinaria ? editingMaquinaria.estado : newItem.estado}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, estado: e.target.value }) : setNewItem({ ...newItem, estado: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="Operativo">Operativo</option>
                <option value="En Reparación">En Reparación</option>
                <option value="Roto">Roto (Requiere Reposición)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Usuario / Operario</label>
              <input
                type="text"
                value={editingMaquinaria ? editingMaquinaria.operario : newItem.operario}
                onChange={e => editingMaquinaria ? setEditingMaquinaria({ ...editingMaquinaria, operario: e.target.value }) : setNewItem({ ...newItem, operario: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                placeholder="Quién la usa"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-bd-lines">
            <button type="button" onClick={() => { setEditingMaquinaria(null); setIsAddingItem(null); }} className="px-4 py-2 text-tx-secondary bg-main rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-accent hover:opacity-90 rounded-lg">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* MODAL ADITIVOS */}
      <Modal
        isOpen={!!editingAditivo || isAddingItem === 'aditivo'}
        onClose={() => { setEditingAditivo(null); setIsAddingItem(null); }}
        title={editingAditivo ? "Editar Aditivo" : "Nuevo Aditivo"}
      >
        <form onSubmit={handleSaveAditivo} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Nombre (Fertilizante, Cloro, etc.)</label>
            <input
              type="text"
              required
              value={editingAditivo ? editingAditivo.name : newItem.name}
              onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, name: e.target.value }) : setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Cantidad Actual</label>
              <input
                type="number"
                step="0.1"
                required
                value={editingAditivo ? editingAditivo.cantidad : newItem.cantidad}
                onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, cantidad: Number(e.target.value) }) : setNewItem({ ...newItem, cantidad: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Unidad</label>
              <select
                value={editingAditivo ? editingAditivo.unidad : newItem.unidad}
                onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, unidad: e.target.value }) : setNewItem({ ...newItem, unidad: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="L">Litros (L)</option>
                <option value="Kg">Kilos (Kg)</option>
                <option value="G">Gramos (g)</option>
                <option value="Un">Unidades</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Cliente Asignado</label>
              <select
                value={editingAditivo ? editingAditivo.clienteId : newItem.clienteId || ''}
                onChange={e => {
                  const client = clientesData.find((c:any) => c.id === e.target.value);
                  const newVals = { clienteId: e.target.value, clienteNombre: client?.name || '' };
                  if (editingAditivo) setEditingAditivo({ ...editingAditivo, ...newVals });
                  else setNewItem({ ...newItem, ...newVals });
                }}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="">Bodega Central (Sin asignar)</option>
                {clientesData?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Categoría General</label>
              <select
                value={editingAditivo ? editingAditivo.categoria : newItem.categoria || 'Aditivos'}
                onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, categoria: e.target.value }) : setNewItem({ ...newItem, categoria: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="Maquinaria">Maquinaria</option>
                <option value="Insumos">Insumos</option>
                <option value="Aditivos">Aditivos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-tx-primary mb-1 text-red-600">Fecha de Vencimiento</label>
              <input
                type="date"
                required
                value={editingAditivo ? editingAditivo.vencimiento : newItem.vencimiento}
                onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, vencimiento: e.target.value }) : setNewItem({ ...newItem, vencimiento: e.target.value })}
                className="w-full px-4 py-2 border border-red-200 bg-red-50 text-red-900 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tx-primary mb-1" title="Días antes del vencimiento para ser alertado">Alerta de Rotación (días antes)</label>
              <input
                type="number"
                required
                value={editingAditivo ? editingAditivo.diasRotacion : newItem.diasRotacion}
                onChange={e => editingAditivo ? setEditingAditivo({ ...editingAditivo, diasRotacion: Number(e.target.value) }) : setNewItem({ ...newItem, diasRotacion: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-amber-200 bg-amber-50 text-amber-900 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                placeholder="30"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-bd-lines">
            <button type="button" onClick={() => { setEditingAditivo(null); setIsAddingItem(null); }} className="px-4 py-2 text-tx-secondary bg-main rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-accent hover:opacity-90 rounded-lg">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* MODAL MATERIALES */}
      <Modal
        isOpen={!!editingMaterial || isAddingItem === 'material'}
        onClose={() => { setEditingMaterial(null); setIsAddingItem(null); }}
        title={editingMaterial ? "Editar Material" : "Nuevo Material"}
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Nombre</label>
            <input
              type="text"
              required
              value={editingMaterial ? editingMaterial.name : newItem.name}
              onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, name: e.target.value }) : setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Categoría</label>
              <input
                type="text"
                required
                value={editingMaterial ? editingMaterial.category : newItem.category}
                onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, category: e.target.value }) : setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                placeholder="Ej: Fontanería, Riego, Eléctrico"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Cliente Asignado</label>
              <select
                value={editingMaterial ? editingMaterial.clienteId : newItem.clienteId || ''}
                onChange={e => {
                  const client = clientesData.find((c:any) => c.id === e.target.value);
                  const newVals = { clienteId: e.target.value, clienteNombre: client?.name || '' };
                  if (editingMaterial) setEditingMaterial({ ...editingMaterial, ...newVals });
                  else setNewItem({ ...newItem, ...newVals });
                }}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="">Bodega Central (Sin asignar)</option>
                {clientesData?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Cantidad</label>
              <input
                type="number"
                required
                value={editingMaterial ? editingMaterial.qty : newItem.qty}
                onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, qty: Number(e.target.value) }) : setNewItem({ ...newItem, qty: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Unidad</label>
              <input
                type="text"
                required
                value={editingMaterial ? editingMaterial.unit : newItem.unit}
                onChange={e => editingMaterial ? setEditingMaterial({ ...editingMaterial, unit: e.target.value }) : setNewItem({ ...newItem, unit: e.target.value })}
                className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                placeholder="Ej: un, mts, lts"
              />
            </div>
          </div>
          {editingMaterial && (
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Estado Visual</label>
                   <select
                     value={editingMaterial.status}
                     onChange={e => setEditingMaterial({ ...editingMaterial, status: e.target.value })}
                     className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                   >
                     <option value="Estable">Estable</option>
                     <option value="Bajo">Bajo</option>
                     <option value="Crítico">Crítico</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-tx-secondary mb-1.5 ml-1">Ícono</label>
                   <select
                     value={editingMaterial.iconName || 'Box'}
                     onChange={e => setEditingMaterial({ ...editingMaterial, iconName: e.target.value })}
                     className="w-full px-4 py-2 border border-bd-lines rounded-lg focus:ring-2 focus:ring-accent/20 outline-none"
                   >
                     <option value="Box">Caja (Básico)</option>
                     <option value="Droplet">Gota / Líquidos</option>
                     <option value="Droplets">Aspersores / Riego</option>
                     <option value="Waves">Caños / Agua</option>
                     <option value="Plug">Eléctrico / Conexiones</option>
                   </select>
                </div>
             </div>
          )}
          <div className="pt-4 flex justify-end gap-3 border-t border-bd-lines">
            <button type="button" onClick={() => { setEditingMaterial(null); setIsAddingItem(null); }} className="px-4 py-2 text-tx-secondary bg-main rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-accent hover:opacity-90 rounded-lg">Guardar</button>
          </div>
        </form>
      </Modal>



      <Modal isOpen={isPedidoModalOpen} onClose={() => setIsPedidoModalOpen(false)} title="Checklist de Pedido / Reposición (WhatsApp)">
        <div className="space-y-4">
          <div className="p-4 bg-main dark:bg-main rounded-xl border border-bd-lines dark:border-bd-lines">
            <label className="block text-xs font-bold text-tx-secondary uppercase mb-2">Mensaje Inicial (Configurable)</label>
            <textarea 
              value={pedidoMessage}
              onChange={e => setPedidoMessage(e.target.value)}
              className="w-full bg-card dark:bg-card border border-bd-lines dark:border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#25D366] outline-none text-tx-primary dark:text-slate-200"
              rows={2}
            />
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {pedidoItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card dark:bg-main rounded-xl border border-bd-lines dark:border-bd-lines">
                 <div className="flex-1 pr-2 truncate">
                   <span className="font-bold text-tx-primary dark:text-tx-primary block truncate">{item.nombre}</span>
                   <span className="text-[10px] text-tx-secondary font-bold uppercase tracking-wider">
                     Stock: {item.cantidad || 0} {item.unidad || ''} | {item.clienteNombre || 'Central'}
                   </span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="flex items-center bg-main dark:bg-card rounded-lg p-1 border border-bd-lines dark:border-bd-lines">
                     <button 
                       onClick={() => setPedidoItems(prev => prev.map(p => p.id === item.id ? { ...p, cantidadPedido: Math.max(1, (p.cantidadPedido || 1) - 1) } : p))}
                       className="w-6 h-6 flex items-center justify-center text-tx-secondary hover:text-tx-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                     >
                       -
                     </button>
                     <span className="text-sm font-black w-8 text-center text-tx-primary dark:text-tx-primary">{item.cantidadPedido || 1}</span>
                     <button 
                       onClick={() => setPedidoItems(prev => prev.map(p => p.id === item.id ? { ...p, cantidadPedido: (p.cantidadPedido || 1) + 1 } : p))}
                       className="w-6 h-6 flex items-center justify-center text-tx-secondary hover:text-tx-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                     >
                       +
                     </button>
                   </div>
                   <button onClick={() => setPedidoItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors">
                     <Trash2 size={16} />
                   </button>
                 </div>
              </div>
            ))}
            {pedidoItems.length === 0 && (
              <p className="text-center text-tx-secondary text-sm py-4 font-bold">La lista está vacía.</p>
            )}
          </div>
          
          <a
            href={pedidoItems.length > 0 ? `https://wa.me/?text=${encodeURIComponent(
              pedidoMessage + '\n\n' + pedidoItems.map(i => `- ${i.cantidadPedido || 1}x ${i.nombre} (Stock actual: ${i.cantidad || 0} ${i.unidad || ''} | Ubicación: ${i.clienteNombre || 'Central'})`).join('\n')
            )}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              if (pedidoItems.length === 0) {
                e.preventDefault();
                alert('No hay ítems en el pedido para enviar.');
              }
            }}
            className="w-full py-3 mt-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} /> Enviar Pedido a WhatsApp
          </a>
        </div>
      </Modal>

    </div>
  );
}
