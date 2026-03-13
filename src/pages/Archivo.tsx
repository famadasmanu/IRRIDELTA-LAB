import React, { useState, useRef, useEffect } from 'react';
import {
  Folder, File, Search, MoreVertical, UploadCloud, FileText,
  Image as ImageIcon, FileSpreadsheet, Check, Trash2, Edit2,
  FolderOpen, ShieldCheck, AlertTriangle, ChevronRight, Download,
  Share2, CheckCircle, XCircle, Eye, ArrowLeft, Users,
  Briefcase, Calendar, Clock, SplitSquareHorizontal, Layers, Activity,
  Percent, ArrowRight, Zap, Target, ShoppingCart
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Modal } from '../components/Modal';
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';
import { PDFComparator } from '../components/PDFComparator';

// --- Archivos Generales Data ---
const initialFolders = [
  {
    id: 1, name: 'Planos Obra Nordelta', files: 12, size: '45 MB', date: '10 Nov 2023',
    subfolders: [
      { id: 101, name: 'Arquitectura', files: 5, size: '20 MB', date: '10 Nov 2023' },
      { id: 102, name: 'Instalaciones', files: 7, size: '25 MB', date: '09 Nov 2023' }
    ]
  },
  {
    id: 2, name: 'Contratos 2023', files: 8, size: '12 MB', date: '05 Nov 2023',
    subfolders: [
      { id: 201, name: 'Proveedores', files: 3, size: '5 MB', date: '05 Nov 2023' },
      { id: 202, name: 'Clientes', files: 5, size: '7 MB', date: '04 Nov 2023' }
    ]
  },
  {
    id: 3, name: 'Renders Paisajismo', files: 24, size: '156 MB', date: '28 Oct 2023',
    subfolders: []
  },
];

const initialRecentFiles = [
  { id: 1, name: 'Presupuesto_Familia_Perez_v2.pdf', type: 'pdf', size: '2.4 MB', date: 'Hoy, 10:30', action: 'Editado', tags: ['presupuesto', 'perez'] },
  { id: 2, name: 'Plano_Riego_San_Isidro.dwg', type: 'cad', size: '15.1 MB', date: 'Ayer, 16:45', action: 'Visualizado', tags: ['plano', 'riego', 'san isidro'] },
  { id: 3, name: 'Lista_Precios_Noviembre.xlsx', type: 'excel', size: '1.2 MB', date: '12 Nov 2023', action: 'Creado', tags: ['precios', 'noviembre'] },
];

// --- Documentación Data ---
type DocViewState = 'folders' | 'personal' | 'preview';

type PersonalDoc = {
  id: string;
  name: string;
  role: string;
  artStatus: 'vigente' | 'vencida' | 'pendiente';
  artExpiry: string;
  insuranceStatus: 'vigente' | 'vencida' | 'pendiente';
  insuranceExpiry: string;
};

const personalDocs: PersonalDoc[] = [
  {
    id: '1',
    name: 'Carlos Rodriguez',
    role: 'Foreman',
    artStatus: 'vigente',
    artExpiry: '15 Dic 2024',
    insuranceStatus: 'vigente',
    insuranceExpiry: '15 Dic 2024'
  },
  {
    id: '2',
    name: 'Miguel Torres',
    role: 'Operador de Maquinaria',
    artStatus: 'vencida',
    artExpiry: '01 Oct 2023',
    insuranceStatus: 'vigente',
    insuranceExpiry: '20 Nov 2024'
  },
  {
    id: '3',
    name: 'David Chen',
    role: 'Jardinero',
    artStatus: 'vigente',
    artExpiry: '28 Feb 2025',
    insuranceStatus: 'pendiente',
    insuranceExpiry: 'En trámite'
  }
];

export default function Archivo() {
  const location = useLocation();
  const [mainTab, setMainTab] = useState<'archivos' | 'documentacion' | 'comparador'>('archivos');

  useEffect(() => {
    if (location.state?.targetTab === 'comparador') {
      setMainTab('comparador');
    }
  }, [location]);

  // --- Archivos Generales State ---
  const [folders, setFolders] = useLocalStorage('archivo_folders', initialFolders);
  const [recentFiles, setRecentFiles] = useLocalStorage('archivo_recent_files', initialRecentFiles);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [optionsItem, setOptionsItem] = useState<any>(null);
  const [optionsType, setOptionsType] = useState<'folder' | 'subfolder' | 'file' | 'personalDoc' | null>(null);

  const [editingFile, setEditingFile] = useState<any>(null);
  const [editType, setEditType] = useState<'folder' | 'subfolder' | 'file' | null>(null);
  const [editName, setEditName] = useState('');
  const [editingTagsFile, setEditingTagsFile] = useState<any>(null);
  const [editTags, setEditTags] = useState('');

  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [fileViewer, setFileViewer] = useState<any>(null);

  // --- Documentación State ---
  const [docView, setDocView] = useState<DocViewState>('folders');
  const [selectedDoc, setSelectedDoc] = useState<PersonalDoc | null>(null);
  const [personalDocsState, setPersonalDocsState] = useLocalStorage('archivo_personal_docs', personalDocs);
  const [editingPersonalDoc, setEditingPersonalDoc] = useState<PersonalDoc | null>(null);
  const [editDocArtStatus, setEditDocArtStatus] = useState<'vigente' | 'vencida' | 'pendiente'>('vigente');
  const [editDocArtExpiry, setEditDocArtExpiry] = useState('');
  const [editDocInsStatus, setEditDocInsStatus] = useState<'vigente' | 'vencida' | 'pendiente'>('vigente');
  const [editDocInsExpiry, setEditDocInsExpiry] = useState('');

  // Old Comparador State and offline loading effect removed.

  // --- Handlers ---
  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getUploadButtonText = () => {
    if (mainTab === 'archivos') return 'Subir Archivo';
    if (mainTab === 'documentacion' && docView === 'folders') return 'Subir Documento Legal';
    if (mainTab === 'documentacion' && docView === 'personal') return 'Subir Póliza / ART';
    if (mainTab === 'comparador') return 'Subir PDF del Cliente';
    return 'Subir Archivo';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mainTab === 'archivos' || mainTab === 'comparador') {
      const newFile = {
        id: Date.now(),
        name: file.name,
        type: file.name.split('.').pop()?.toLowerCase() || 'file',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        date: 'Justo ahora',
        action: 'Descargar',
        tags: []
      };
      setRecentFiles([newFile, ...recentFiles]);
      displayToast('Archivo subido exitosamente');

      // Uploading logic handled in PDFComparator for the 'comparador' tab using new files now.
    } else {
      displayToast(`${file.name} subido exitosamente a Documentación`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: number, type: 'folder' | 'subfolder' | 'file') => {
    if (type === 'folder') setFolders(folders.filter((f: any) => f.id !== id));
    if (type === 'subfolder' && currentFolderId) {
      setFolders(folders.map((f: any) => {
        if (f.id === currentFolderId) {
          return { ...f, subfolders: f.subfolders.filter((sf: any) => sf.id !== id) };
        }
        return f;
      }));
    }
    if (type === 'file') setRecentFiles(recentFiles.filter((f: any) => f.id !== id));
    setOptionsItem(null);
  };

  const handleEditClick = (item: any, type: 'folder' | 'subfolder' | 'file') => {
    setEditingFile(item);
    setEditType(type);
    setEditName(item.name);
    setOptionsItem(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingFile || !editType) return;

    if (editType === 'folder') {
      setFolders(folders.map((f: any) => f.id === editingFile.id ? { ...f, name: editName } : f));
    } else if (editType === 'subfolder' && currentFolderId) {
      setFolders(folders.map((f: any) => {
        if (f.id === currentFolderId) {
          return { ...f, subfolders: f.subfolders.map((sf: any) => sf.id === editingFile.id ? { ...sf, name: editName } : sf) };
        }
        return f;
      }));
    } else {
      setRecentFiles(recentFiles.map((f: any) => f.id === editingFile.id ? { ...f, name: editName } : f));
    }

    setEditingFile(null);
    setEditType(null);
    displayToast(editType === 'file' ? 'Archivo actualizado' : 'Carpeta actualizada');
  };

  const handleSaveTags = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTagsFile) return;

    const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t);
    setRecentFiles(recentFiles.map((f: any) => f.id === editingTagsFile.id ? { ...f, tags: tagsArray } : f));

    setEditingTagsFile(null);
    displayToast('Tags actualizados');
  };

  const handleEditPersonalDocClick = (doc: PersonalDoc) => {
    setEditingPersonalDoc(doc);
    setEditDocArtStatus(doc.artStatus);
    setEditDocArtExpiry(doc.artExpiry);
    setEditDocInsStatus(doc.insuranceStatus);
    setEditDocInsExpiry(doc.insuranceExpiry);
    setOptionsItem(null);
  };

  const handleSavePersonalDocEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersonalDoc) return;

    const updatedDocs = personalDocsState.map((d: PersonalDoc) =>
      d.id === editingPersonalDoc.id ? {
        ...d,
        artStatus: editDocArtStatus,
        artExpiry: editDocArtExpiry,
        insuranceStatus: editDocInsStatus,
        insuranceExpiry: editDocInsExpiry
      } : d
    );

    setPersonalDocsState(updatedDocs);

    // If we are currently previewing this document, update the preview as well
    if (selectedDoc && selectedDoc.id === editingPersonalDoc.id) {
      setSelectedDoc(updatedDocs.find((d: PersonalDoc) => d.id === editingPersonalDoc.id) || null);
    }

    setEditingPersonalDoc(null);
    displayToast('Configuración de documentación actualizada');
  };

  const handleShare = (name: string) => {
    displayToast(`Compartiendo certificados de ${name} por WhatsApp...`);
  };

  const handleShareAll = () => {
    displayToast('Compartiendo certificados de todo el equipo...');
  };

  // --- Render Preview View (Documentación) ---
  if (mainTab === 'documentacion' && docView === 'preview' && selectedDoc) {
    return (
      <div className="flex flex-col min-h-[80vh] bg-transparent -m-4 sm:-m-6 p-4 sm:p-6">
        <div className="sticky top-0 z-10 bg-[#f9fafbf2] backdrop-blur-sm border-b border-gray-200 pb-3 mb-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setDocView('personal')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 text-gray-700 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Previsualización</p>
              <h1 className="text-lg font-bold text-gray-900">Certificado ART - {selectedDoc.name}</h1>
            </div>
            <button onClick={() => handleShare(selectedDoc.name)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 text-[#3A5F4B] transition-colors">
              <Share2 size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
          <div className="w-full aspect-[1/1.4] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Certificado de Cobertura ART</h3>
            <p className="text-gray-500 mb-6">Documento PDF generado por la aseguradora.</p>

            <div className="w-full max-w-sm bg-gray-50 rounded-lg p-4 text-left space-y-3 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Empleado:</span>
                <span className="text-sm font-bold text-gray-900">{selectedDoc.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">CUIL:</span>
                <span className="text-sm font-medium text-gray-900">20-12345678-9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Vigencia hasta:</span>
                <span className={cn("text-sm font-bold", selectedDoc.artStatus === 'vencida' ? 'text-red-600' : 'text-green-600')}>
                  {selectedDoc.artExpiry}
                </span>
              </div>
            </div>

            <button
              onClick={() => displayToast('Descargando PDF...')}
              className="mt-8 flex items-center gap-2 bg-[#3A5F4B] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2d4a3a] transition-colors shadow-sm"
            >
              <Download size={20} />
              Descargar Archivo Original
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
            <div className="bg-green-500 rounded-full p-1">
              <Check size={16} className="text-white" />
            </div>
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
          <div className="bg-green-500 rounded-full p-1">
            <Check size={16} className="text-white" />
          </div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Archivo y Documentación</h1>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#3A5F4B] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2d4a3a] transition-colors w-full sm:w-auto justify-center"
        >
          <UploadCloud size={20} />
          <span>{getUploadButtonText()}</span>
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex p-1 bg-[#3A5F4B]/10 rounded-lg w-full sm:w-[600px] overflow-x-auto">
        <button
          onClick={() => setMainTab('archivos')}
          className={cn("flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all whitespace-nowrap",
            mainTab === 'archivos' ? "bg-white text-[#3A5F4B] shadow-sm ring-1 ring-black/5" : "text-gray-600 hover:text-[#3A5F4B]"
          )}
        >
          Archivos Generales
        </button>
        <button
          onClick={() => setMainTab('documentacion')}
          className={cn("flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all whitespace-nowrap",
            mainTab === 'documentacion' ? "bg-white text-[#3A5F4B] shadow-sm ring-1 ring-black/5" : "text-gray-600 hover:text-[#3A5F4B]"
          )}
        >
          Documentación de Obra
        </button>
        <button
          onClick={() => setMainTab('comparador')}
          className={cn("flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all whitespace-nowrap flex justify-center items-center gap-2",
            mainTab === 'comparador' ? "bg-white text-[#F27D26] shadow-sm ring-1 ring-black/5" : "text-gray-600 hover:text-[#F27D26]"
          )}
        >
          <SplitSquareHorizontal size={16} /> Comparador B2B
        </button>
      </div>

      {mainTab === 'archivos' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar documentos, carpetas o planos por nombre o tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] shadow-sm"
            />
          </div>

          {currentFolderId ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={16} /> Volver a Carpetas Principales
                </button>
                <span className="text-gray-400">/</span>
                <h2 className="text-lg font-semibold text-gray-800">
                  {folders.find((f: any) => f.id === currentFolderId)?.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {folders.find((f: any) => f.id === currentFolderId)?.subfolders
                  ?.filter((sf: any) => sf.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((subfolder: any) => (
                    <div key={subfolder.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#3A5F4B]/10 hover:shadow-md hover:border-[#3A5F4B]/30 transition-all cursor-pointer flex items-start gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FolderOpen size={24} className="fill-current opacity-20" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{subfolder.name}</h3>
                        <p className="text-xs text-gray-500">{subfolder.files} archivos • {subfolder.size}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOptionsItem(subfolder); setOptionsType('subfolder'); }}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  ))}
                {folders.find((f: any) => f.id === currentFolderId)?.subfolders?.filter((sf: any) => sf.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-gray-500 text-sm col-span-full">No hay subcarpetas que coincidan con la búsqueda.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Carpetas Principales</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {folders
                  .filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((folder: any) => (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-[#3A5F4B]/10 hover:shadow-md hover:border-[#3A5F4B]/30 transition-all cursor-pointer flex items-start gap-4"
                    >
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Folder size={24} className="fill-current opacity-20" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{folder.name}</h3>
                        <p className="text-xs text-gray-500">{folder.subfolders?.length || 0} subcarpetas • {folder.size}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOptionsItem(folder); setOptionsType('folder'); }}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  ))}
                {folders.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-gray-500 text-sm col-span-full">No hay carpetas que coincidan con la búsqueda.</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden">
            <div className="p-5 border-b border-[#3A5F4B]/10">
              <h2 className="text-lg font-semibold text-gray-800">Archivos Recientes</h2>
            </div>
            <div className="divide-y divide-[#3A5F4B]/10">
              {recentFiles
                .filter((f: any) =>
                  f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (f.tags && f.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
                )
                .map((file: any) => (
                  <div
                    key={file.id}
                    onClick={() => setFileViewer(file)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer gap-4 sm:gap-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                        {file.type === 'pdf' ? <FileText size={20} className="text-red-500" /> :
                          (file.type === 'xlsx' || file.type === 'xls' || file.type === 'excel') ? <FileSpreadsheet size={20} className="text-green-600" /> :
                            (file.type === 'jpg' || file.type === 'png' || file.type === 'jpeg') ? <ImageIcon size={20} className="text-purple-500" /> :
                              <File size={20} className="text-blue-500" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm md:text-base">{file.name}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-gray-500">{file.size} • {file.date}</p>
                          {file.action && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {file.action}
                            </span>
                          )}
                          {file.tags && file.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOptionsItem(file); setOptionsType('file'); }}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              {recentFiles.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.tags && f.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))).length === 0 && (
                <p className="text-gray-500 text-sm p-5 text-center">No hay archivos que coincidan con la búsqueda.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'documentacion' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] text-base transition-all"
              placeholder="Buscar documentos legales, permisos, o contenido interior..."
              type="text"
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
            />
          </div>

          {/* Sugerencias de búsqueda */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 py-1">Sugerencias:</span>
            {['Contrato', 'ART', 'Póliza', 'Nordelta', 'Vencimiento'].map(tag => (
              <button
                key={tag}
                onClick={() => setDocSearchQuery(tag)}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Sub-Tabs for Documentación */}
          <div className="flex p-1 bg-gray-100 rounded-lg w-full sm:w-[400px]">
            <button
              onClick={() => setDocView('folders')}
              className={cn("flex-1 py-1.5 px-3 rounded text-sm font-semibold transition-all",
                docView === 'folders' ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Carpetas Legales
            </button>
            <button
              onClick={() => setDocView('personal')}
              className={cn("flex-1 py-1.5 px-3 rounded text-sm font-semibold transition-all",
                docView === 'personal' ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700"
              )}
            >
              ART y Seguros
            </button>
          </div>

          {docView === 'folders' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Folder 1 */}
                <div
                  onClick={() => setDocView('personal')}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-[#3A5F4B]/10 hover:border-[#3A5F4B]/30 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                      <ShieldCheck size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-bold">
                      <AlertTriangle size={14} />
                      1 Vencido
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Seguros y ART</h3>
                  <p className="text-sm text-gray-500 mb-4">Pólizas, certificados de cobertura, cláusulas de no repetición.</p>
                  <div className="flex items-center justify-between text-sm border-t border-[#3A5F4B]/10 pt-3 mt-4">
                    <span className="text-gray-500">12 archivos</span>
                    <span className="text-[#3A5F4B] font-semibold flex items-center gap-1">Ver detalles <ChevronRight size={16} /></span>
                  </div>
                </div>

                {/* Folder 2 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#3A5F4B]/10 hover:border-[#3A5F4B]/30 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <FolderOpen size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-bold">
                      <CheckCircle size={14} />
                      Al día
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Planos y Diseños</h3>
                  <p className="text-sm text-gray-500 mb-4">Planos arquitectónicos, paisajismo, instalaciones eléctricas.</p>
                  <div className="flex items-center justify-between text-sm border-t border-[#3A5F4B]/10 pt-3 mt-4">
                    <span className="text-gray-500">8 archivos</span>
                    <span className="text-[#3A5F4B] font-semibold flex items-center gap-1">Abrir carpeta <ChevronRight size={16} /></span>
                  </div>
                </div>

                {/* Folder 3 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#3A5F4B]/10 hover:border-[#3A5F4B]/30 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-bold">
                      <CheckCircle size={14} />
                      Al día
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Permisos Municipales</h3>
                  <p className="text-sm text-gray-500 mb-4">Habilitaciones, permisos de obra, estudios de impacto.</p>
                  <div className="flex items-center justify-between text-sm border-t border-[#3A5F4B]/10 pt-3 mt-4">
                    <span className="text-gray-500">3 archivos</span>
                    <span className="text-[#3A5F4B] font-semibold flex items-center gap-1">Abrir carpeta <ChevronRight size={16} /></span>
                  </div>
                </div>

                {/* Folder 4 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#3A5F4B]/10 hover:border-[#3A5F4B]/30 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                      <Briefcase size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-bold">
                      <Clock size={14} />
                      1 Pendiente
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Contratos</h3>
                  <p className="text-sm text-gray-500 mb-4">Contratos con clientes, subcontratistas y proveedores.</p>
                  <div className="flex items-center justify-between text-sm border-t border-[#3A5F4B]/10 pt-3 mt-4">
                    <span className="text-gray-500">5 archivos</span>
                    <span className="text-[#3A5F4B] font-semibold flex items-center gap-1">Abrir carpeta <ChevronRight size={16} /></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {docView === 'personal' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h2 className="text-lg font-bold text-gray-900">Estado de Cobertura por Empleado</h2>
                <button
                  onClick={handleShareAll}
                  className="flex items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#2d4a3a] transition-colors shadow-sm"
                >
                  <Share2 size={18} />
                  Compartir Todos (WhatsApp)
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden">
                <div className="divide-y divide-[#3A5F4B]/10">
                  {personalDocsState
                    .filter((doc: PersonalDoc) =>
                      doc.name.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
                      doc.role.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
                      doc.artStatus.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
                      doc.insuranceStatus.toLowerCase().includes(docSearchQuery.toLowerCase())
                    )
                    .map((doc: PersonalDoc) => (
                      <div key={doc.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-500 font-bold text-lg shrink-0">
                              {doc.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{doc.name}</h3>
                              <p className="text-sm text-gray-500">{doc.role}</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ART</span>
                              <div className="flex items-center gap-2">
                                {doc.artStatus === 'vigente' ? (
                                  <CheckCircle size={16} className="text-green-500" />
                                ) : doc.artStatus === 'vencida' ? (
                                  <XCircle size={16} className="text-red-500" />
                                ) : (
                                  <Clock size={16} className="text-yellow-500" />
                                )}
                                <span className={cn("text-sm font-bold",
                                  doc.artStatus === 'vigente' ? "text-green-700" :
                                    doc.artStatus === 'vencida' ? "text-red-700" : "text-yellow-700"
                                )}>
                                  {doc.artExpiry}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Seguro Vida</span>
                              <div className="flex items-center gap-2">
                                {doc.insuranceStatus === 'vigente' ? (
                                  <CheckCircle size={16} className="text-green-500" />
                                ) : doc.insuranceStatus === 'vencida' ? (
                                  <XCircle size={16} className="text-red-500" />
                                ) : (
                                  <Clock size={16} className="text-yellow-500" />
                                )}
                                <span className={cn("text-sm font-bold",
                                  doc.insuranceStatus === 'vigente' ? "text-green-700" :
                                    doc.insuranceStatus === 'vencida' ? "text-red-700" : "text-yellow-700"
                                )}>
                                  {doc.insuranceExpiry}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                              <button
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setDocView('preview');
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
                              >
                                <Eye size={16} /> Ver PDF
                              </button>
                              <button
                                onClick={() => handleShare(doc.name)}
                                className="flex items-center justify-center p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                title="Compartir por WhatsApp"
                              >
                                <Share2 size={18} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOptionsItem(doc); setOptionsType('personalDoc' as any); }}
                                className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Configurar Documentación"
                              >
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mainTab === 'comparador' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <PDFComparator recentFiles={recentFiles} setRecentFiles={setRecentFiles} displayToast={displayToast} />
        </div>
      )}


      {/* Modals for Archivos Generales */}
      <Modal
        isOpen={!!optionsItem}
        onClose={() => setOptionsItem(null)}
        title={optionsType === 'folder' ? "Opciones de Carpeta" : optionsType === 'subfolder' ? "Opciones de Subcarpeta" : optionsType === 'personalDoc' ? "Opciones de Documentación" : "Opciones de Archivo"}
      >
        <div className="space-y-3">
          {optionsType === 'personalDoc' ? (
            <button
              onClick={() => handleEditPersonalDocClick(optionsItem)}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
            >
              <Edit2 size={20} className="text-gray-500" /> Configurar Documentación
            </button>
          ) : (
            <>
              <button
                onClick={() => handleEditClick(optionsItem, optionsType!)}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
              >
                <Edit2 size={20} className="text-gray-500" /> Renombrar
              </button>
              {optionsType === 'file' && (
                <button
                  onClick={() => {
                    setEditingTagsFile(optionsItem);
                    setEditTags(optionsItem.tags ? optionsItem.tags.join(', ') : '');
                    setOptionsItem(null);
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
                >
                  <Search size={20} className="text-gray-500" /> Configurar Tags
                </button>
              )}
              <button
                onClick={() => handleDelete(optionsItem?.id, optionsType!)}
                className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors font-medium text-red-600"
              >
                <Trash2 size={20} /> Eliminar
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!editingPersonalDoc}
        onClose={() => setEditingPersonalDoc(null)}
        title="Configurar Documentación"
      >
        <form onSubmit={handleSavePersonalDocEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado ART</label>
              <select
                value={editDocArtStatus}
                onChange={e => setEditDocArtStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none bg-white"
              >
                <option value="vigente">Vigente</option>
                <option value="vencida">Vencida</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento ART</label>
              <input
                type="text"
                value={editDocArtExpiry}
                onChange={e => setEditDocArtExpiry(e.target.value)}
                placeholder="Ej: 15 Dic 2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado Seguro</label>
              <select
                value={editDocInsStatus}
                onChange={e => setEditDocInsStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none bg-white"
              >
                <option value="vigente">Vigente</option>
                <option value="vencida">Vencida</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento Seguro</label>
              <input
                type="text"
                value={editDocInsExpiry}
                onChange={e => setEditDocInsExpiry(e.target.value)}
                placeholder="Ej: 20 Nov 2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingPersonalDoc(null)}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editingFile}
        onClose={() => setEditingFile(null)}
        title={editType === 'folder' ? "Renombrar Carpeta" : "Renombrar Archivo"}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingFile(null)}
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
      <Modal
        isOpen={!!editingTagsFile}
        onClose={() => setEditingTagsFile(null)}
        title="Configurar Tags Inteligentes"
      >
        <form onSubmit={handleSaveTags} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="ej: presupuesto, perez, 2023"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">Los tags ayudan a encontrar el archivo más fácilmente usando el buscador.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingTagsFile(null)}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
            >
              Guardar Tags
            </button>
          </div>
        </form>
      </Modal>

      {/* File Viewer Modal */}
      <Modal
        isOpen={!!fileViewer}
        onClose={() => setFileViewer(null)}
        title={`Visualizando: ${fileViewer?.name}`}
      >
        {fileViewer && (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200 min-h-[300px]">
            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
              {fileViewer.type === 'pdf' ? <FileText size={40} className="text-red-500" /> :
                (fileViewer.type === 'xlsx' || fileViewer.type === 'xls' || fileViewer.type === 'excel') ? <FileSpreadsheet size={40} className="text-green-600" /> :
                  (fileViewer.type === 'jpg' || fileViewer.type === 'png' || fileViewer.type === 'jpeg') ? <ImageIcon size={40} className="text-purple-500" /> :
                    (fileViewer.type === 'cad' || fileViewer.type === 'dwg') ? <Briefcase size={40} className="text-indigo-500" /> :
                      <File size={40} className="text-blue-500" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{fileViewer.name}</h3>
            <p className="text-gray-500 mb-6 text-center">
              Tipo: {fileViewer.type.toUpperCase()} • Tamaño: {fileViewer.size}
            </p>

            <div className="w-full max-w-sm bg-white rounded-lg p-4 text-left space-y-3 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-600 text-center italic">
                La previsualización de archivos {fileViewer.type.toUpperCase()} está simulada en esta versión.
              </p>
            </div>

            <button
              onClick={() => displayToast(`Descargando ${fileViewer.name}...`)}
              className="mt-6 flex items-center gap-2 bg-[#3A5F4B] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2d4a3a] transition-colors shadow-sm"
            >
              <Download size={18} />
              Descargar Archivo
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
