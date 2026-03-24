import React, { useState, useRef, useMemo } from 'react';
import {
  Folder, File, Search, MoreVertical, UploadCloud, FileText,
  Image as ImageIcon, FileSpreadsheet, Check, Trash2, Edit2,
  FolderOpen, ShieldCheck, AlertTriangle, ChevronRight, Download,
  Share2, CheckCircle, XCircle, Eye, ArrowLeft, ArrowRight,
  HardDrive, Users, Briefcase, Plus, X, Maximize2, ExternalLink, Clock,
  Map, FileSignature, Landmark, Star, Bookmark
} from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Modal } from '../components/Modal';
import { cn } from '../lib/utils';

// --- Types ---

type ArchivoNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  url?: string;
  fileType?: string;
  size?: number;
  uploadDate?: number;
  parentId: string;
  storagePath?: string;
  isPillar?: boolean;
};

type PersonalDoc = {
  id: string;
  name: string;
  role: string;
  artExpiry: string; // YYYY-MM-DD
  insuranceExpiry: string; // YYYY-MM-DD
};

export default function Archivo() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'drive' | 'personal'>('drive');
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [searchQuery, setSearchQuery] = useState('');

  // Collections
  const { data: nodesRaw, add: addNode, update: updateNode, remove: removeNode } = useFirestoreCollection<ArchivoNode>('archivo_nodos');
  const { data: personalDocsRaw, add: addPersonalDoc, update: updatePersonalDoc, remove: removePersonalDoc } = useFirestoreCollection<PersonalDoc>('archivo_personal_docs');

  // UI State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals & Selection
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [optionsNode, setOptionsNode] = useState<ArchivoNode | null>(null);
  
  // Modals for Personal
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false);
  const [personalForm, setPersonalForm] = useState<Partial<PersonalDoc>>({});
  
  // File Previewer
  const [previewNode, setPreviewNode] = useState<ArchivoNode | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAlertStatus = (expiryDate: string) => {
    if (!expiryDate) return { color: 'text-gray-500', bg: 'bg-gray-100', text: 'Sin fecha', icon: Clock, status: 'sin fecha' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate + 'T00:00:00');
    
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: `Vencido hace ${Math.abs(diffDays)}d`, icon: XCircle, status: 'vencida' };
    if (diffDays <= 7) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: `Vence en ${diffDays}d`, icon: AlertTriangle, status: 'alerta' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: `Vigente`, icon: CheckCircle, status: 'vigente' };
  };

  // --- Data Derived ---
  const customPillars = useMemo(() => {
    return nodesRaw.filter(n => n.type === 'folder' && n.isPillar).sort((a,b) => a.name.localeCompare(b.name));
  }, [nodesRaw]);

  const currentNodes = useMemo(() => {
    let filtered = nodesRaw;
    if (searchQuery) {
      // If searching, show all matching anywhere
      filtered = filtered.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
      // Otherwise only show current folder
      filtered = filtered.filter(n => n.parentId === currentFolderId);
    }
    // Sort: Folders first, then names
    return filtered.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [nodesRaw, currentFolderId, searchQuery]);

  const breadcrumbsInfo = useMemo(() => {
    const coords = [];
    let current = currentFolderId;
    let baseRoot = 'root';
    
    while (current && current !== 'root') {
      const parentNode = nodesRaw.find(n => n.id === current);
      if (parentNode) {
        if (parentNode.isPillar) {
           baseRoot = parentNode.id;
           break;
        } else {
           coords.unshift({ id: parentNode.id, name: parentNode.name });
           current = parentNode.parentId;
        }
      } else {
        break;
      }
    }
    
    return { coords, baseRoot };
  }, [currentFolderId, nodesRaw]);

  const getPillarIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('plano') || n.includes('diseño')) return Map;
    if (n.includes('permis') || n.includes('municipal')) return Landmark;
    if (n.includes('contrat') || n.includes('legal')) return FileSignature;
    if (n.includes('inform') || n.includes('consumo')) return FileSpreadsheet;
    return Bookmark;
  };

  const getBaseRootInfo = (id: string) => {
     if (id === 'root') return { name: 'Central de Archivos', icon: HardDrive };
     const node = nodesRaw.find(n => n.id === id);
     const name = node?.name || 'Carpeta Anclada';
     return { name, icon: getPillarIcon(name) };
  };

  // --- Handlers ---
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    await addNode({
      name: newFolderName.trim(),
      type: 'folder',
      parentId: currentFolderId,
    } as any);
    
    setNewFolderName('');
    setIsFolderModalOpen(false);
    displayToast('Carpeta creada inteligentemente');
  };

  const handleSeedDefaults = async () => {
    const defaults = ['Planos y Diseños', 'Permisos Municipales', 'Contratos y Legales', 'Informes de Consumo'];
    for (const name of defaults) {
      await addNode({
        name,
        type: 'folder',
        parentId: 'root',
        isPillar: true
      } as any);
    }
    displayToast('Estructura principal generada');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const storagePath = `archivos/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error:", error);
        displayToast('Error al subir el archivo');
        setUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        
        await addNode({
          name: file.name,
          type: 'file',
          url: downloadURL,
          storagePath: storagePath,
          fileType: fileExtension,
          size: file.size,
          uploadDate: Date.now(),
          parentId: currentFolderId
        } as any);

        displayToast('Archivo subido al Hub centralizado');
        setUploading(false);
        setUploadProgress(0);
      }
    );

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteNode = async (node: ArchivoNode) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${node.name}"?`)) return;
    
    if (node.type === 'file' && node.storagePath) {
      try {
        const fileRef = ref(storage, node.storagePath);
        await deleteObject(fileRef);
      } catch (err) {
        console.error("Could not delete from storage, might be already deleted or lacks permissions", err);
      }
    }
    await removeNode(node.id);
    setOptionsNode(null);
    displayToast('Elemento eliminado permanentemente');
  };

  const handleSavePersonalDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalForm.name) return;

    if (personalForm.id) {
      await updatePersonalDoc(personalForm.id, personalForm as PersonalDoc);
      displayToast('Registro de personal actualizado');
    } else {
      await addPersonalDoc(personalForm as any);
      displayToast('Personal registrado en la matriz');
    }
    setIsPersonalModalOpen(false);
  };

  const handleShareLink = (url: string, name: string) => {
    const text = `¡Hola! Aquí tienes el enlace directo para descargar "${name}": ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[85vh] bg-[#f8fbf9] dark:bg-[#0f172a] -m-4 sm:-m-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-accent text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-accent/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-[100] border border-white/10 glass">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Uploading Overlay */}
      {uploading && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-2xl flex flex-col gap-2 z-[100] w-80 border border-accent/20">
          <div className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-tx-primary">
            <span className="flex items-center gap-2"><UploadCloud size={16} className="text-accent animate-bounce" /> Subiendo a la Nube...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-accent to-emerald-400 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* PREVIEWER OVERLAY (El Visor Nativo sin descargas) */}
      {previewNode && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/40 text-white border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <FileText size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{previewNode.name}</h3>
                <p className="text-xs text-white/50">{previewNode.size ? formatSize(previewNode.size) : '---'} • IrriDelta Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => previewNode.url && handleDownload(previewNode.url)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors" title="Descargar">
                <Download size={18} />
              </button>
              <button onClick={() => previewNode.url && handleShareLink(previewNode.url, previewNode.name)} className="p-2.5 bg-[#128C7E]/80 hover:bg-[#128C7E] rounded-xl transition-colors" title="Compartir Web">
                <Share2 size={18} />
              </button>
              <button onClick={() => setPreviewNode(null)} className="p-2.5 bg-red-500/80 hover:bg-red-500 rounded-xl transition-colors ml-2">
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
            {['pdf'].includes(previewNode.fileType || '') ? (
              <iframe src={`${previewNode.url}#toolbar=0`} className="w-full h-full max-w-6xl rounded-2xl bg-white shadow-2xl" />
            ) : ['jpg', 'jpeg', 'png', 'webp'].includes(previewNode.fileType || '') ? (
              <img src={previewNode.url} alt={previewNode.name} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            ) : (
              <div className="text-center text-white p-8 bg-white/5 rounded-3xl border border-white/10 max-w-sm">
                <FileSpreadsheet size={64} className="mx-auto text-emerald-400 mb-4 opacity-80" />
                <h2 className="text-xl font-bold mb-2">No hay vista previa disponible</h2>
                <p className="text-white/60 text-sm mb-6">El formato {previewNode.fileType?.toUpperCase()} requiere ser descargado para visualizarse.</p>
                <button onClick={() => previewNode.url && handleDownload(previewNode.url)} className="bg-accent px-6 py-3 rounded-xl font-bold hover:bg-[#2c4a3b] w-full flex justify-center items-center gap-2">
                  <Download size={18} /> Descargar Archivo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar Navigation (Panel Izquierdo estilo Drive) */}
      <div className="w-full md:w-64 bg-white dark:bg-[#1e293b] border-r border-accent/10 dark:border-bd-lines p-4 sm:p-6 flex flex-col gap-6 shrink-0 z-10 transition-all">
        <h1 className="text-2xl font-black text-slate-800 dark:text-tx-primary tracking-tight">Hub<span className="text-accent">Operativo</span></h1>
        
        {/* Upload Button */}
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        <button
          onClick={() => {
            if (activeTab === 'personal') setIsPersonalModalOpen(true);
            else fileInputRef.current?.click();
          }}
          className="bg-gradient-to-br from-accent to-emerald-600 hover:to-emerald-500 text-white px-4 py-3.5 rounded-2xl flex items-center gap-3 justify-center shadow-lg shadow-accent/30 transition-all hover:-translate-y-1 font-bold group"
        >
          {activeTab === 'personal' ? <Plus size={20} className="group-hover:rotate-90 transition-transform" /> : <UploadCloud size={20} className="group-hover:-translate-y-1 transition-transform" />}
          <span>{activeTab === 'personal' ? 'Nuevo Personal' : 'Subir Archivo'}</span>
        </button>

        <nav className="flex flex-col gap-2 mt-4">
          <button 
            onClick={() => { setActiveTab('drive'); setCurrentFolderId('root'); setSearchQuery(''); }}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm", 
              activeTab === 'drive' && currentFolderId === 'root' ? "bg-emerald-50 text-accent dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <HardDrive size={18} /> Central de Archivos
          </button>

          {customPillars.map(pillar => {
            const PillarIcon = getPillarIcon(pillar.name);
            return (
              <button 
                key={pillar.id}
                onClick={() => { setActiveTab('drive'); setCurrentFolderId(pillar.id); setSearchQuery(''); }}
                className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm", 
                  activeTab === 'drive' && currentFolderId === pillar.id ? "bg-emerald-50 text-accent dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <PillarIcon size={18} /> {pillar.name}
              </button>
            );
          })}
          
          <button 
            onClick={() => { setActiveTab('personal'); setSearchQuery(''); }}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm", 
              activeTab === 'personal' ? "bg-emerald-50 text-accent dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <ShieldCheck size={18} /> Seguros y ART <div className="ml-auto w-2 h-2 rounded-full bg-amber-500"></div>
          </button>
        </nav>

        {activeTab === 'drive' && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Carpetas Rápidas</h3>
            <button onClick={() => setIsFolderModalOpen(true)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-accent transition-colors p-2 font-medium w-full">
              <FolderOpen size={16} /> Crear Carpeta...
            </button>
            {customPillars.length === 0 && (
              <button 
                onClick={handleSeedDefaults} 
                className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors p-2.5 rounded-xl w-full mt-2"
              >
                <Star size={14} /> Módulos Sugeridos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-8">
        
        {/* Superior Searchbar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'drive' ? "Buscar en todo el Hub..." : "Buscar personal por nombre..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-slate-800 dark:text-tx-primary font-medium focus:ring-2 focus:ring-accent/50 transition-shadow outline-none"
            />
          </div>
        </div>

        {/* DRIVE TAB */}
        {activeTab === 'drive' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex-1">
            {/* Breadcrumb Navbar */}
            {!searchQuery && (
              <div className="flex items-center gap-2 mb-6 text-sm font-bold text-slate-600 dark:text-slate-300 overflow-x-auto pb-2">
                {(() => {
                  const rootInfo = getBaseRootInfo(breadcrumbsInfo.baseRoot);
                  const CurrentIcon = rootInfo.icon;
                  return (
                    <button onClick={() => setCurrentFolderId(breadcrumbsInfo.baseRoot)} className="hover:text-accent flex items-center gap-1 shrink-0 p-1">
                      <CurrentIcon size={16} className="text-slate-400" /> {rootInfo.name}
                    </button>
                  );
                })()}
                {breadcrumbsInfo.coords.map((crumb) => (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                    <button onClick={() => setCurrentFolderId(crumb.id)} className="hover:text-accent shrink-0 p-1">
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {searchQuery && (
              <h2 className="text-lg font-bold text-slate-800 dark:text-tx-primary mb-6">Resultados para "{searchQuery}"</h2>
            )}

            {/* Grid Múltiple */}
            {currentNodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentNodes.map((node) => {
                  const isFolder = node.type === 'folder';
                  return (
                    <div 
                      key={node.id} 
                      onClick={() => isFolder ? setCurrentFolderId(node.id) : setPreviewNode(node)}
                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-accent/5 dark:border-slate-700 hover:shadow-md hover:border-accent/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                          isFolder ? "bg-blue-50 text-blue-500" : 
                          node.fileType === 'pdf' ? "bg-rose-50 text-rose-500" :
                          ['jpg','png','jpeg'].includes(node.fileType||'') ? "bg-purple-50 text-purple-500" : "bg-emerald-50 text-emerald-500"
                        )}>
                          {isFolder ? <Folder size={24} className="fill-current opacity-80" /> : 
                           node.fileType === 'pdf' ? <FileText size={24} /> :
                           ['jpg','png','jpeg'].includes(node.fileType||'') ? <ImageIcon size={24} /> : <File size={24} />}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOptionsNode(node); }}
                          className="p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-tx-primary text-[15px] leading-tight line-clamp-2" title={node.name}>{node.name}</h3>
                        {!isFolder && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">{node.fileType}</span>
                            <span className="text-xs text-slate-400 font-medium">{formatSize(node.size || 0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 h-full max-h-[500px]">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  {searchQuery ? <Search size={40} className="text-slate-300" /> : <FolderOpen size={40} className="text-slate-300" />}
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-tx-primary mb-2">Está bastante vacío por aquí</h3>
                <p className="text-slate-500 max-w-sm mb-6">
                  {searchQuery ? 'No hay resultados que coincidan con tu búsqueda actual.' : 'Arrastra un archivo o pulsa en "Subir Archivo" para empezar a nutrir tu centro de control.'}
                </p>
                {!searchQuery && (
                  <button onClick={() => fileInputRef.current?.click()} className="text-accent font-bold text-sm bg-emerald-50 px-5 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">
                     Seleccionar archivo ahora
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PERSONAL/ART TAB (Módulo Activo de Riesgo) */}
        {activeTab === 'personal' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 flex-1">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-tx-primary tracking-tight">Vigilancia Documental</h2>
                <p className="text-sm text-slate-500 mt-1">Detecta vencimientos de seguros automáticamente antes de accesar a obra.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalDocsRaw.filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())).map((doc) => {
                const artAlert = getAlertStatus(doc.artExpiry);
                const insAlert = getAlertStatus(doc.insuranceExpiry);
                
                return (
                  <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-xl font-black text-slate-500 shrink-0 uppercase shadow-sm">
                            {doc.name.substring(0,2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-tx-primary leading-tight">{doc.name}</h3>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{doc.role}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setPersonalForm(doc); setIsPersonalModalOpen(true); }}
                          className="text-slate-300 hover:text-emerald-600 transition-colors p-2"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* ART Row */}
                        <div className={cn("flex flex-col p-3 rounded-xl border border-transparent transition-colors", artAlert.bg, artAlert.border)}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-500 uppercase">Cláusula ART</span>
                            <span className={cn("text-xs font-black px-2 py-0.5 rounded-full bg-white shadow-sm flex items-center gap-1", artAlert.color)}>
                              <artAlert.icon size={12} /> {artAlert.status.toUpperCase()}
                            </span>
                          </div>
                          <p className={cn("text-sm font-bold", artAlert.color)}>{artAlert.text} • {doc.artExpiry || '--'}</p>
                        </div>

                        {/* Seguro de Vida Row */}
                        <div className={cn("flex flex-col p-3 rounded-xl border border-transparent transition-colors", insAlert.bg, insAlert.border)}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-500 uppercase">Seguro Vida / Salud</span>
                            <span className={cn("text-xs font-black px-2 py-0.5 rounded-full bg-white shadow-sm flex items-center gap-1", insAlert.color)}>
                              <insAlert.icon size={12} /> {insAlert.status.toUpperCase()}
                            </span>
                          </div>
                          <p className={cn("text-sm font-bold", insAlert.color)}>{insAlert.text} • {doc.insuranceExpiry || '--'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {personalDocsRaw.length === 0 && !searchQuery && (
              <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-300">
                <ShieldCheck size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Registra a tu primer Operario</h3>
                <p className="text-slate-500 mb-6">Manten el control de sus vencimientos para evitar multas o ingresos denegados en barrios cerrados.</p>
                <button onClick={() => setIsPersonalModalOpen(true)} className="bg-accent text-white px-6 py-3 rounded-xl font-bold">Crear Ficha Técnica</button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODALS --- */}
      
      {/* Folder Creation */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Nueva Carpeta">
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Carpeta</label>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent/50 outline-none"
              placeholder="Ej: Planos Lote 42..."
            />
          </div>
          <button type="submit" disabled={!newFolderName.trim()} className="w-full bg-accent text-white font-bold py-3.5 rounded-xl disabled:opacity-50">
            Crear Instancia
          </button>
        </form>
      </Modal>

      {/* Personal Form */}
      <Modal isOpen={isPersonalModalOpen} onClose={() => setIsPersonalModalOpen(false)} title={personalForm.id ? "Actualizar Matriz del Personal" : "Alta de Personal"}>
        <form onSubmit={handleSavePersonalDoc} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
              <input type="text" required value={personalForm.name || ''} onChange={e => setPersonalForm({...personalForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-accent font-bold text-slate-800" placeholder="Juan Perez"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol Asignado</label>
              <input type="text" required value={personalForm.role || ''} onChange={e => setPersonalForm({...personalForm, role: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-accent font-semibold text-slate-700" placeholder="Ej: Operador de Zanjeo"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vto. ART</label>
              <input type="date" value={personalForm.artExpiry || ''} onChange={e => setPersonalForm({...personalForm, artExpiry: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-slate-700 font-medium"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vto. Seguro Vida</label>
              <input type="date" value={personalForm.insuranceExpiry || ''} onChange={e => setPersonalForm({...personalForm, insuranceExpiry: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none text-slate-700 font-medium"/>
            </div>
          </div>
          <button type="submit" disabled={!personalForm.name || !personalForm.role} className="w-full bg-accent text-white font-bold py-3.5 rounded-xl disabled:opacity-50 mt-6 shadow-lg shadow-accent/20">
            {personalForm.id ? 'Guardar Cambios' : 'Registrar Operario'}
          </button>
        </form>
      </Modal>

      {/* Node Options Modal */}
      <Modal isOpen={!!optionsNode} onClose={() => setOptionsNode(null)} title="Opciones">
        <div className="space-y-2">
          {optionsNode?.type === 'folder' && (
             <button onClick={async () => {
                await updateNode(optionsNode.id, { isPillar: !optionsNode.isPillar } as any);
                setOptionsNode(null);
                displayToast(optionsNode.isPillar ? 'Desanclado del menú lateral' : 'Anclado como acceso directo');
             }} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-yellow-50 rounded-xl font-bold text-slate-700 hover:text-yellow-700 transition-colors">
               <Star size={20} className={optionsNode.isPillar ? "text-slate-400" : "text-yellow-500"} /> 
               {optionsNode.isPillar ? 'Quitar del Menú Lateral' : 'Fijar en el Menú Lateral'}
             </button>
          )}
          {optionsNode?.type === 'file' && optionsNode.url && (
            <>
              <button onClick={() => { handleDownload(optionsNode.url!); setOptionsNode(null); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition-colors">
                <Download size={20} className="text-emerald-600" /> Descargar Código/Original
              </button>
              <button onClick={() => { handleShareLink(optionsNode.url!, optionsNode.name); setOptionsNode(null); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition-colors">
                <Share2 size={20} className="text-[#128C7E]" /> Compartir por WhatsApp
              </button>
            </>
          )}
          <button onClick={() => handleDeleteNode(optionsNode!)} className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-red-600 transition-colors border border-red-100 mt-4">
            <Trash2 size={20} /> Eliminar Permanentemente
          </button>
        </div>
      </Modal>

    </div>
  );
}
