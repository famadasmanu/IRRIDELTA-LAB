import React, { useState, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import * as pdfjsLib from 'pdfjs-dist';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { Leaf, User, Search, CheckCircle2, MapPin, Calendar, Clock, CheckCircle, Phone, Map as MapIcon, Edit2, Trash2, FileText, Plus, Droplets, Activity, Grid, MessageCircle, Image as ImageIcon, Wrench, X, Archive, Package, Calculator, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useCompanyConfig } from '../hooks/useCompanyConfig';
import { Modal } from '../components/Modal';
import { PresupuestoFormalModal } from '../components/PresupuestoFormalModal';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { jsPDF } from 'jspdf';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDTrhgjJJBKfB8vG5RmuyymqY3pnORX-xI";

function MapController({ clients, selectedClient }: { clients: any[], selectedClient?: any }) {
  const map = useMap();
  React.useEffect(() => {
    if (!map) return;
    if (selectedClient && selectedClient.lat && selectedClient.lng) {
      map.panTo({ lat: selectedClient.lat, lng: selectedClient.lng });
      map.setZoom(16);
    } else {
      const clientsWithCoords = clients.filter(c => c.lat && c.lng);
      if (clientsWithCoords.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        clientsWithCoords.forEach(c => bounds.extend({ lat: c.lat, lng: c.lng }));
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }
  }, [clients, selectedClient, map]);
  return null;
}

function PickerMapController({ pos }: { pos: {lat: number, lng: number} | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (map && pos) {
      map.panTo(pos);
      map.setZoom(16);
    }
  }, [pos, map]);
  return null;
}

const getIcon = (name: string) => {
  switch (name) {
    case 'MapPin': return MapPin;
    case 'Calendar': return Calendar;
    case 'Clock': return Clock;
    case 'CheckCircle': return CheckCircle;
    default: return MapPin;
  }
};

export default function Clientes() {
  const [companyData] = useCompanyConfig();
  const { data: clientsRaw, add: addClientToDB, update: updateClientInDB, remove: removeClientFromDB } = useFirestoreCollection<any>('clientes');
  const clientsData = clientsRaw;

  const { data: anotacionesData, add: addAnotacionToDB, update: updateAnotacionInDB, remove: removeAnotacionFromDB } = useFirestoreCollection<any>('trabajos_anotaciones');
  const { data: portfolioData, add: addTrabajoToDB } = useFirestoreCollection<any>('trabajos_portfolio');
  const navigate = useNavigate();
  const [userRole] = useState(() => {
    try {
      const item = window.localStorage.getItem('user_role');
      return item ? JSON.parse(item) : 'admin';
    } catch {
      return 'admin';
    }
  });
  const isInstalador = userRole === 'instalador';

  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientMap, setSelectedClientMap] = useState<any>(null);
  const filters = ['Todos', 'En Proceso', 'En Espera', 'Finalizados'];

  const [editingClient, setEditingClient] = useState<any>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState<any>({});
  const [selectedClientNotes, setSelectedClientNotes] = useState<any>(null);
  const [selectedClientProjects, setSelectedClientProjects] = useState<any>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isPresupuestoModalOpen, setIsPresupuestoModalOpen] = useState(false);
  const [presupuestoInitialItems, setPresupuestoInitialItems] = useState<any[] | null>(null);
  const [isReadingPDF, setIsReadingPDF] = useState(false);
  const fileInpuRef = useRef<HTMLInputElement>(null);
  const fileInputPropioRef = useRef<HTMLInputElement>(null);
  const [activeCotizacionTab, setActiveCotizacionTab] = useState<'irridelta' | 'propio'>('irridelta');

  const mapGeminiResponseToItems = (jsonString: string) => {
    try {
      const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed.map((it: any) => ({
          id: Math.random().toString(),
          desc: it.descripcion || it.desc || it.name || "Item Extraído",
          cant: Number(it.cantidad || it.cant || it.qty || 1),
          costo: Number(it.precio || it.costo || it.price || 0)
        }));
      }
    } catch (e) {
      console.error("No se pudo parsear el resultado de la IA", e);
    }
    return null;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImportarPDF = async (e: React.ChangeEvent<HTMLInputElement>, clientData: any, type: 'irridelta' | 'propio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingPDF(true);
    try {
      const folder = type === 'irridelta' ? 'cotizaciones_irridelta' : 'cotizaciones_propias';
      const storageRef = ref(storage, `${folder}/${clientData.id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          console.error("Error uploading PDF", error);
          alert("❌ Error subiendo el archivo: " + error.message);
          setIsReadingPDF(false);
          const refToReset = type === 'irridelta' ? fileInpuRef : fileInputPropioRef;
          if (refToReset.current) refToReset.current.value = '';
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          let extractedItems: any[] = [];

          try {
            const apiKey = companyData.geminiApiKey;

            if (!apiKey || apiKey.trim().length < 10 || !apiKey.trim().startsWith("AIzaSy")) {
              alert("⚠️ Llave inválida.\n\nPor favor configura tu verdadera Google Gemini API Key (que debe empezar con 'AIzaSy...') en:\nConfiguración -> Empresa -> Integraciones IA.");
              setIsReadingPDF(false);
              return;
            }

            if (apiKey && apiKey.trim().length > 10) {
              alert("Iniciando escaneo con Google IA...");
              const base64Data = await fileToBase64(file);
              const prompt = "Analiza visualmente el presupuesto adjunto. Extrae detalladamente todos los materiales de la tabla de ítems. Devuelve EXCLUSIVAMENTE un bloque JSON puro, sin markdown ni comillas escapadas, que sea un Array de objetos donde cada uno tenga: 'descripcion' (string del material), 'cantidad' (numero) y 'precio' (numero).";

              const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: "application/pdf", data: base64Data } },
                      { text: prompt }
                    ]
                  }]
                })
              });

              const data = await response.json();
              if (data.candidates && data.candidates[0]) {
                const outputText = data.candidates[0].content.parts[0].text;
                const parsed = mapGeminiResponseToItems(outputText);
                if (parsed && parsed.length > 0) {
                  extractedItems = parsed;
                  alert("✅ ¡IA finalizada! Se extrajeron " + extractedItems.length + " ítems exactos de tu presupuesto.");
                } else {
                  alert("La IA procesó el documento pero no encontró la tabla.");
                }
              } else {
                if (data.error) {
                  alert("Error de API Key inválida o problema de Google: " + data.error.message);
                  window.localStorage.removeItem('gemini_api_key');
                }
              }
            }
          } catch (error: any) {
            console.error("Fallo la IA documental:", error);
            alert("Hubo un fallo de conexión con el OCR / Inteligencia Artificial:\n" + error.message);
          }

          if (extractedItems.length === 0) {
            extractedItems = [];
          }

          const totalCalculado = extractedItems.reduce((acc, curr) => acc + (curr.cant * curr.costo), 0);

          const nuevoPedido = {
            id: Math.random().toString(),
            fecha: new Date().toISOString().split('T')[0],
            estado: 'Esperando Aprobación' as const,
            items: extractedItems,
            costoTotal: totalCalculado,
            pdfUrl: downloadURL,
            pdfName: file.name
          };

          const fieldToUpdate = type === 'irridelta' ? 'pedidos_irridelta' : 'pedidos_propios';
          const updated = [...(clientData[fieldToUpdate] || []), nuevoPedido];
          updateClientInDB(clientData.id, { [fieldToUpdate]: updated });
          if (selectedClientNotes && selectedClientNotes.id === clientData.id) {
            setSelectedClientNotes({ ...clientData, [fieldToUpdate]: updated });
          }
          setIsReadingPDF(false);
          const refToReset = type === 'irridelta' ? fileInpuRef : fileInputPropioRef;
          if (refToReset.current) refToReset.current.value = '';
          alert("✅ PDF importado y alojado correctamente.");
        }
      );
    } catch (error) {
      console.error("Error al leer PDF", error);
      alert("❌ Hubo un error procesando el documento.");
      setIsReadingPDF(false);
      const refToReset = type === 'irridelta' ? fileInpuRef : fileInputPropioRef;
      if (refToReset.current) refToReset.current.value = '';
    }
  };

  const filteredClients = clientsData.filter((client: any) => {
    const matchesFilter =
      activeFilter === 'Todos' ||
      (activeFilter === 'En Proceso' && client.status === 'EN PROCESO') ||
      (activeFilter === 'En Espera' && client.status === 'EN ESPERA') ||
      (activeFilter === 'Finalizados' && client.status === 'FINALIZADO');

    const matchesSearch =
      (client.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (client.location?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
      await removeClientFromDB(id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isAddingClient) {
          setNewClient({ ...newClient, image: reader.result as string });
        } else if (editingClient) {
          setEditingClient({ ...editingClient, image: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingClient) {
      const statusColor = newClient.status === 'EN PROCESO' ? 'text-accent bg-accent/10' :
        newClient.status === 'EN ESPERA' ? 'text-amber-600 bg-amber-100' :
          'text-tx-secondary bg-main';

      const clientToAdd = {
        ...newClient,
        statusColor,
        isFinished: newClient.status === 'FINALIZADO',
        icon1: 'MapPin',
        icon2: 'Calendar',
        image: newClient.image || 'https://picsum.photos/seed/client/200/200'
      };

      await addClientToDB(clientToAdd);
      setIsAddingClient(false);
    } else {
      const statusColor = editingClient.status === 'EN PROCESO' ? 'text-accent bg-accent/10' :
        editingClient.status === 'EN ESPERA' ? 'text-amber-600 bg-amber-100' :
          'text-tx-secondary bg-main';

      const id = editingClient.id;
      const clientToUpdate: any = { ...editingClient, statusColor, isFinished: editingClient.status === 'FINALIZADO' };
      if (editingClient.status === 'FINALIZADO' && !editingClient.fechaFinalizacion) {
          clientToUpdate.fechaFinalizacion = new Date().toISOString().split('T')[0];
      }
      delete clientToUpdate.id;

      await updateClientInDB(id, clientToUpdate);
      setEditingClient(null);
    }
  };

  const totalClients = clientsData.length;
  const activeClients = clientsData.filter((c: any) => c.status === 'EN PROCESO').length;
  const waitingClients = clientsData.filter((c: any) => c.status === 'EN ESPERA').length;
  const finishedClients = clientsData.filter((c: any) => c.status === 'FINALIZADO').length;

  return (
    <div className="flex flex-col font-sans pb-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <header className="bg-card rounded-2xl p-4 shadow-sm border border-bd-lines mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] border border-white/20 flex items-center justify-center">
                <User size={24} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-tx-primary">Cuentas & Proyectos</h1>
            </div>
            <div className="flex gap-2">
              {!isInstalador && (
                <button
                  onClick={() => { setIsAddingClient(true); setNewClient({ name: '', location: '', status: 'EN PROCESO', phone: '', dateInfo: '', lat: -34.6037, lng: -58.3816 }); }}
                  className="flex items-center gap-1 text-sm font-bold text-white bg-accent px-4 py-2 rounded-full hover:opacity-90 transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  Nuevo
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group mt-2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-tx-secondary group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              className="block w-full pl-12 pr-4 py-3.5 bg-main border-none rounded-xl text-sm placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none text-tx-primary font-medium shadow-inner"
              placeholder="Buscar por nombre o dirección..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col md:flex-row gap-4 h-[650px] mb-8">
        {/* Vista Emergente de los demás (Lista Minimalista) */}
        <div className="w-full md:w-80 bg-card rounded-2xl shadow-sm border border-bd-lines overflow-hidden flex flex-col shrink-0 h-[400px] md:h-full relative z-10">
          <div className="p-4 border-b border-bd-lines bg-main/50 flex justify-between items-center backdrop-blur-md">
            <h2 className="font-bold text-tx-primary dark:text-white text-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] border border-white/20 flex items-center justify-center">
                <User size={16} />
              </div>
              Directorio de Cuentas
            </h2>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-md border border-emerald-500/20">{totalClients}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredClients.map((client: any) => {
              const isActive = selectedClientMap?.id === client.id;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientMap(client)}
                  className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden ${isActive
                    ? 'border-accent/40 bg-accent/5 shadow-[0_8px_30px_rgba(37,211,102,0.15)]'
                    : 'border-transparent hover:border-accent/30 bg-main/50 hover:bg-card hover:shadow-[0_8px_30px_rgba(37,211,102,0.15)] hover:-translate-y-0.5'
                    }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-accent to-[#15803d] shadow-[2px_0_15px_rgba(37,211,102,0.5)] transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                  <div className="flex justify-between items-center mb-1 gap-2 pl-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className="size-10 rounded-full bg-cover bg-center border border-bd-lines shrink-0 shadow-sm"
                        style={{ backgroundImage: `url('${client.image}')` }}
                      />
                      <h3 className={`font-black text-lg tracking-tight line-clamp-1 transition-colors ${isActive ? 'text-accent' : 'text-tx-primary group-hover:text-accent'}`}>{client.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-tx-secondary line-clamp-1 flex items-center gap-1.5 mt-2 pl-2"><MapPin size={12} />{client.location}</p>
                </div>
              )
            })}
            {filteredClients.length === 0 && (
              <div className="text-center py-10 text-tx-secondary text-sm">
                No se encontraron cuentas.
              </div>
            )}
          </div>
        </div>

        {/* Mapa y Tarjeta Emergente de Cliente Seleccionado */}
        <div className="flex-1 bg-main rounded-2xl shadow-sm border border-bd-lines overflow-hidden relative z-0 min-h-[400px]">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map 
               defaultCenter={{lat: -34.6037, lng: -58.3816}} 
               defaultZoom={10} 
               gestureHandling={'greedy'}
               disableDefaultUI={false}
            >
              <MapController clients={filteredClients} selectedClient={selectedClientMap} />
              
              {filteredClients.map((client: any) => {
                // Crear objeto de ícono para Marker tradicional si hay imagen redonda
                const markerIcon = client.image ? {
                  url: client.image,
                  scaledSize: window?.google?.maps?.Size ? new window.google.maps.Size(44, 44) : null,
                } : undefined;

                return client.lat && client.lng && (
                  <Marker
                    key={client.id}
                    position={{lat: client.lat, lng: client.lng}}
                    onClick={() => setSelectedClientMap(client)}
                    title={client.name}
                    icon={markerIcon}
                  />
                );
              })}
            </Map>
          </APIProvider>

          {/* Tarjeta Emergente del Cliente Seleccionado (Over the map) */}
          {selectedClientMap && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-bd-lines z-[1000] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="p-5 relative">
                <button
                  onClick={() => setSelectedClientMap(null)}
                  className="absolute top-4 right-4 p-1 text-tx-secondary hover:text-tx-secondary hover:bg-main rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex gap-4 items-start mb-4 pr-6">
                  <div
                    className={`size-14 rounded-xl bg-cover bg-center border border-bd-lines shrink-0 ${selectedClientMap.isFinished ? 'grayscale' : ''}`}
                    style={{ backgroundImage: `url('${selectedClientMap.image}')` }}
                  />
                  <div>
                    <h3 className="text-lg font-black text-tx-primary leading-tight mb-1">{selectedClientMap.name}</h3>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-tx-secondary">
                    <MapPin size={14} className="text-accent" />
                    <span>{selectedClientMap.location}</span>
                  </div>
                  {selectedClientMap.fechaInicioPactada && (
                    <div className="flex items-center gap-2 text-xs text-tx-secondary">
                      <Calendar size={14} className="text-accent" />
                      <span>Inicio Pactado: <strong className="font-semibold text-tx-primary">{selectedClientMap.fechaInicioPactada.split('-').reverse().join('/')}</strong></span>
                    </div>
                  )}
                  {selectedClientMap.fechaInicioReal && (
                    <div className="flex items-center gap-2 text-xs text-tx-secondary">
                      <Clock size={14} className="text-accent" />
                      <span>Inicio Real: <strong className="font-semibold text-tx-primary">{selectedClientMap.fechaInicioReal.split('-').reverse().join('/')}</strong></span>
                    </div>
                  )}
                  {(!selectedClientMap.fechaInicioPactada && !selectedClientMap.fechaInicioReal && selectedClientMap.dateInfo) && (
                    <div className="flex items-center gap-2 text-xs text-tx-secondary">
                      <Calendar size={14} className="text-accent" />
                      <span>{selectedClientMap.dateInfo}</span>
                    </div>
                  )}
                </div>

                {/* 1. BOTÓN B2B Argent Software */}
                {!isInstalador && (
                  <button
                    onClick={() => setSelectedClientNotes(selectedClientMap)}
                    className="w-full mb-4 flex items-center justify-center gap-2 py-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-sm font-black hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.1)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.2)] active:scale-[0.98]"
                    title="Gestionar Adjuntos y Presupuestos"
                  >
                    <Package size={18} />
                    ADJUNTOS Y COTIZACIONES
                  </button>
                )}

                {/* 2. BOTON PROTAGONICO GESTOR DE OBRAS (SOLO SI NO ESTA EN ESPERA) */}
                {!isInstalador && selectedClientMap.status !== 'EN ESPERA' && (
                  <button
                    onClick={() => navigate('/trabajos')}
                    className="w-full mb-3 flex items-center justify-center gap-2 text-sm font-black text-white bg-accent py-3.5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] transition-all active:scale-[0.98] border border-white/10"
                  >
                    <Wrench size={18} />
                    Abrir Gestor de Obras
                  </button>
                )}

                {/* 3. BOTÓN PRESUPUESTO PDF (SOLO SI NO ESTA EN ESPERA) */}
                {!isInstalador && selectedClientMap.status !== 'EN ESPERA' && (
                  <button
                    onClick={() => { setIsPresupuestoModalOpen(true); }}
                    className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-main border border-bd-lines text-tx-primary rounded-xl text-xs font-bold hover:bg-card hover:border-accent/40 transition-all group shadow-inner"
                    title="Generar Presupuesto Formal (PDF)"
                  >
                    <FileText size={16} className="text-tx-secondary group-hover:text-accent transition-colors" />
                    GENERAR PRESUPUESTO PDF
                  </button>
                )}


                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${selectedClientMap.lat},${selectedClientMap.lng}`, '_blank')}
                    className="flex flex-col items-center justify-center py-2.5 bg-main border border-bd-lines text-tx-secondary rounded-xl text-[10px] font-bold hover:bg-card hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-inner group"
                    title="Google Maps"
                  >
                    <MapPin size={18} className="mb-1.5 opacity-70 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    Maps
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/${selectedClientMap.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                    className="flex flex-col items-center justify-center py-2.5 bg-main border border-bd-lines text-tx-secondary rounded-xl text-[10px] font-bold hover:bg-card hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-inner group"
                    title="WhatsApp"
                  >
                    <MessageCircle size={18} className="mb-1.5 opacity-70 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    Chat
                  </button>
                  <button
                    onClick={() => setSelectedClientNotes(selectedClientMap)}
                    className="flex flex-col items-center justify-center py-2.5 bg-main border border-bd-lines text-tx-secondary rounded-xl text-[10px] font-bold hover:bg-card hover:text-tx-primary hover:border-white/20 transition-all shadow-inner group"
                    title="Anotaciones"
                  >
                    <Clock size={18} className="mb-1.5 opacity-70 group-hover:opacity-100" />
                    Historial
                  </button>
                  {!isInstalador && (
                    <button
                      onClick={() => { setEditingClient(selectedClientMap); }}
                      className="flex flex-col items-center justify-center py-2.5 bg-main border border-bd-lines text-tx-secondary rounded-xl text-[10px] font-bold hover:bg-card hover:text-tx-primary hover:border-white/20 transition-all shadow-inner group"
                      title="Editar"
                    >
                      <Edit2 size={18} className="mb-1.5 opacity-70 group-hover:opacity-100" />
                      Editar
                    </button>
                  )}
                  {!isInstalador && (
                    <button
                      onClick={() => { setSelectedClientMap(null); handleDeleteClient(selectedClientMap.id); }}
                      className="flex flex-col items-center justify-center py-2.5 bg-main border border-bd-lines text-tx-secondary rounded-xl text-[10px] font-bold hover:bg-card hover:text-red-500 hover:border-red-500/30 transition-all shadow-inner group"
                      title="Eliminar"
                    >
                      <Trash2 size={18} className="mb-1.5 opacity-70 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      Borrar
                    </button>
                  )}
                  <div className="col-span-1"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={!!editingClient || isAddingClient}
        onClose={() => { setEditingClient(null); setIsAddingClient(false); }}
        title={editingClient ? 'Editar Cuenta' : 'Nueva Cuenta'}
      >
        {(editingClient || isAddingClient) && (
          <form onSubmit={handleSaveClient} className="space-y-4">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div
                className="size-24 rounded-full bg-main border-2 border-dashed border-bd-lines flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => document.getElementById('client-image-upload')?.click()}
              >
                {(editingClient?.image || newClient?.image) ? (
                  <img src={editingClient ? editingClient.image : newClient.image} alt="Client" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-tx-secondary" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Cambiar</span>
                </div>
              </div>
              <input
                id="client-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tx-secondary mb-1">Nombre</label>
              <input
                type="text"
                required
                value={editingClient ? editingClient.name : newClient.name}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, name: e.target.value }) : setNewClient({ ...newClient, name: e.target.value })}
                className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl text-tx-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tx-secondary mb-1">Estado</label>
              <select
                value={editingClient ? editingClient.status : newClient.status}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, status: e.target.value }) : setNewClient({ ...newClient, status: e.target.value })}
                className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl text-tx-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
              >
                <option value="EN PROCESO">En Proceso</option>
                <option value="EN ESPERA">En Espera</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-tx-secondary mb-1">Ubicación</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={editingClient ? editingClient.location : newClient.location}
                  onChange={e => editingClient ? setEditingClient({ ...editingClient, location: e.target.value }) : setNewClient({ ...newClient, location: e.target.value })}
                  className="flex-1 px-4 py-2 bg-main border border-bd-lines rounded-xl text-tx-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                  placeholder="Ej: Belgrano 3375, Benavidez"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const locText = editingClient ? editingClient.location : newClient.location;
                    if (locText) {
                      try {
                        let searchTerm = locText;
                        if (!searchTerm.toLowerCase().includes('argentina') && !searchTerm.toLowerCase().includes('buenos aires') && !searchTerm.toLowerCase().includes('caba')) {
                          searchTerm += ", Provincia de Buenos Aires, Argentina";
                        } else if (!searchTerm.toLowerCase().includes('argentina')) {
                          searchTerm += ", Argentina";
                        }

                        // Búsqueda Inteligente usando Google Maps Geocoding API con la LLave Global
                        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchTerm)}&key=${GOOGLE_MAPS_API_KEY}`);
                        const data = await res.json();
                        
                        if (data.status === 'OK' && data.results && data.results.length > 0) {
                           const location = data.results[0].geometry.location;
                           const lat = location.lat;
                           const lng = location.lng;
                           
                           if (editingClient) setEditingClient({ ...editingClient, lat, lng });
                           else setNewClient({ ...newClient, lat, lng });
                        } else {
                           console.warn("Google Maps no encontró la ubicación exacta. Fallback activado.");
                        }
                      } catch(e) {
                         console.error("Geocoding failed", e);
                      }
                    }
                    setIsMapPickerOpen(true);
                  }}
                  className="px-4 py-2 bg-accent/10 hover:bg-accent/20 border-accent/30 border text-accent font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
                  title="Buscar esta dirección en Google Maps"
                >
                  <Search size={18} />
                  <span>🔎 Buscar en Mapa</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-tx-secondary mb-1">Teléfono</label>
              <input
                type="tel"
                value={editingClient ? editingClient.phone : newClient.phone}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, phone: e.target.value }) : setNewClient({ ...newClient, phone: e.target.value })}
                className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl text-tx-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-tx-secondary mb-1">Día de Inicio Pactado</label>
                <input
                  type="date"
                  value={editingClient ? editingClient.fechaInicioPactada : newClient.fechaInicioPactada}
                  onChange={e => editingClient ? setEditingClient({ ...editingClient, fechaInicioPactada: e.target.value }) : setNewClient({ ...newClient, fechaInicioPactada: e.target.value })}
                  className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl text-tx-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-tx-secondary mb-1">Inicio Real</label>
                <input
                  type="date"
                  value={editingClient ? editingClient.fechaInicioReal : newClient.fechaInicioReal}
                  onChange={e => editingClient ? setEditingClient({ ...editingClient, fechaInicioReal: e.target.value }) : setNewClient({ ...newClient, fechaInicioReal: e.target.value })}
                  className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl text-tx-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-bd-lines">
              <button
                type="button"
                onClick={() => { setEditingClient(null); setIsAddingClient(false); }}
                className="px-4 py-2 bg-card text-tx-secondary font-semibold border border-bd-lines rounded-xl hover:bg-main transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-white font-semibold rounded-xl hover:opacity-90 shadow-md shadow-accent/20 transition-all"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        title="Ajustar Ubicación"
      >
        <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-400 font-medium">
          <p>📍 Si la ubicación automática no es exacta, <strong>haz clic en cualquier parte del mapa</strong> para colocar el marcador manualmente.</p>
        </div>
        <div className="h-[400px] w-full bg-main rounded-xl overflow-hidden relative border border-bd-lines">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map 
               defaultCenter={{lat: -34.6037, lng: -58.3816}} 
               defaultZoom={11} 
               gestureHandling={'greedy'}
               onClick={(e) => {
                  if (!e.detail.latLng) return;
                  const latLng = e.detail.latLng;
                  if (editingClient) {
                    setEditingClient({ ...editingClient, lat: latLng.lat, lng: latLng.lng });
                  } else {
                    setNewClient({ ...newClient, lat: latLng.lat, lng: latLng.lng });
                  }
               }}
            >
              {(() => {
                const pos = editingClient ? (editingClient.lat ? {lat: editingClient.lat, lng: editingClient.lng} : null) : (newClient.lat ? {lat: newClient.lat, lng: newClient.lng} : null);
                const currentImage = editingClient?.image || newClient?.image;
                const activeIcon = currentImage ? {
                  url: currentImage,
                  scaledSize: window?.google?.maps?.Size ? new window.google.maps.Size(44, 44) : null,
                } : undefined;

                return (
                  <>
                    <PickerMapController pos={pos} />
                    {pos && <Marker position={pos} icon={activeIcon} />}
                  </>
                );
              })()}
            </Map>
          </APIProvider>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={() => setIsMapPickerOpen(false)} className="px-4 py-2 bg-accent text-white font-semibold rounded-xl hover:opacity-90 shadow-md shadow-accent/20 transition-all">Confirmar</button>
        </div>
      </Modal>


      <Modal
        isOpen={!!selectedClientNotes}
        onClose={() => setSelectedClientNotes(null)}
        title={`Adjuntos y Cotizaciones: ${selectedClientNotes?.name}`}
      >
        {selectedClientNotes && (
          <div className="space-y-4">
            <div className="flex bg-main rounded-xl p-1 shadow-sm border border-bd-lines mb-4">
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCotizacionTab === 'irridelta' ? 'bg-accent text-white shadow-sm' : 'text-tx-secondary hover:text-tx-primary'}`}
                onClick={() => setActiveCotizacionTab('irridelta')}
              >
                Presupuestos de Argent Software
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCotizacionTab === 'propio' ? 'bg-accent text-white shadow-sm' : 'text-tx-secondary hover:text-tx-primary'}`}
                onClick={() => setActiveCotizacionTab('propio')}
              >
                Presupuestos Propios
              </button>
            </div>

            <div className="pt-2">
              <div className="mb-4 flex flex-col gap-2">
                <div>
                  <label className="block text-sm font-bold text-tx-primary flex items-center gap-2">
                    <Package size={18} className="text-accent" />
                    {activeCotizacionTab === 'irridelta' ? 'Proveedor: Argent Software' : 'Presupuestos Emitidos (Propios)'}
                  </label>
                  <p className="text-xs text-tx-secondary mt-0.5">
                    {activeCotizacionTab === 'irridelta'
                      ? 'Etapa 1: Adjunta aquí los presupuestos proveídos por Argent Software.'
                      : 'Etapa 1: Adjunta los presupuestos y cotizaciones que le pasas a este cliente.'}
                  </p>
                </div>
                <div className="flex justify-start">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    ref={activeCotizacionTab === 'irridelta' ? fileInpuRef : fileInputPropioRef}
                    onChange={(e) => handleImportarPDF(e, selectedClientNotes, activeCotizacionTab)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                        const refToClick = activeCotizacionTab === 'irridelta' ? fileInpuRef : fileInputPropioRef;
                      if (refToClick.current) {
                        refToClick.current.click();
                      }
                    }}
                    disabled={isReadingPDF}
                    className="text-xs bg-amber-500 text-white py-2 px-4 rounded-xl shadow-[0_2px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.5)] transition-all font-bold hover:-translate-y-0.5 whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus size={16} className={isReadingPDF ? "animate-spin" : ""} />
                    {isReadingPDF ? "LEYENDO PDF CON IA..." : "Importar Presupuesto con IA"}
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {(() => {
                  const itemsList = activeCotizacionTab === 'irridelta' ? selectedClientNotes.pedidos_irridelta : selectedClientNotes.pedidos_propios;
                  if (!itemsList || itemsList.length === 0) {
                    return (
                      <div className="text-center py-8 bg-main rounded-xl border border-bd-lines border-dashed">
                        <FileText size={32} className="mx-auto text-tx-secondary mb-3 opacity-50" />
                        <p className="text-sm text-tx-secondary italic px-4">Aún no hay cotizaciones cargadas.</p>
                      </div>
                    );
                  }
                  
                  return itemsList.map((pedido: any, pIndex: number) => {
                    const fieldString = activeCotizacionTab === 'irridelta' ? 'pedidos_irridelta' : 'pedidos_propios';
                    return (
                      <div key={pedido.id} className="bg-main p-4 rounded-xl border border-bd-lines flex flex-col gap-3 relative shadow-sm">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={pedido.pdfName || `Archivo Importado el ${pedido.fecha || ''}`}
                              onChange={(e) => {
                                const updated = [...selectedClientNotes[fieldString]];
                                updated[pIndex].pdfName = e.target.value;
                                updateClientInDB(selectedClientNotes.id, { [fieldString]: updated });
                                setSelectedClientNotes({ ...selectedClientNotes, [fieldString]: updated });
                              }}
                              className="w-full text-sm font-bold bg-transparent text-tx-primary border-b border-transparent focus:border-accent outline-none placeholder-slate-500 transition-colors py-1"
                              placeholder="Nombre del Adjunto"
                            />
                            <span className="text-[10px] text-tx-secondary uppercase tracking-wider block mt-1">
                              Importado el {pedido.fecha || ''}
                            </span>
                          </div>

                          <button
                            className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
                            title="Eliminar archivo"
                            onClick={async () => {
                              if (confirm('¿Eliminar archivo importado?')) {
                                const updated = selectedClientNotes[fieldString].filter((_: any, i: number) => i !== pIndex);
                                updateClientInDB(selectedClientNotes.id, { [fieldString]: updated });
                                setSelectedClientNotes({ ...selectedClientNotes, [fieldString]: updated });
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Botón Ver PDF y Notas */}
                        <div className="space-y-3 mt-2 border-t border-bd-lines pt-3">
                          {pedido.pdfUrl && (
                            <button
                              onClick={() => window.open(pedido.pdfUrl, '_blank')}
                              className="w-full py-2.5 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <FileText size={16} /> Abrir Remito / Cotización PDF
                            </button>
                          )}

                          {pedido.items && pedido.items.length > 0 && activeCotizacionTab === 'irridelta' && (
                            <button
                              onClick={() => {
                                const today = new Date().toLocaleDateString();
                                let wsText = `Hola Argent Software! 👋\nTe escribo para revisar el presupuesto adjunto del cliente *${selectedClientNotes.name}* (Ref: ${pedido.pdfName || today}):\n\n`;
                                pedido.items.forEach((it: any, index: number) => {
                                  wsText += `${index + 1}. ${it.desc} -> ${it.cant} unidades\n`;
                                });
                                window.open(`https://wa.me/?text=${encodeURIComponent(wsText)}`, '_blank');
                              }}
                              className="w-full py-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle size={16} /> Enviar Texto a Argent Software (WhatsApp)
                            </button>
                          )}

                          {pedido.items && pedido.items.length > 0 && activeCotizacionTab === 'propio' && (
                            <button
                              onClick={() => {
                                const today = new Date().toLocaleDateString();
                                let wsText = `Hola ${selectedClientNotes.name}! 👋\nTe adjunto/escribo respecto al presupuesto (Ref: ${pedido.pdfName || today}):\n\n`;
                                pedido.items.forEach((it: any, index: number) => {
                                  wsText += `${index + 1}. ${it.desc} -> ${it.cant} unidades\n`;
                                });
                                window.open(`https://wa.me/${selectedClientNotes.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(wsText)}`, '_blank');
                              }}
                              className="w-full py-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <MessageCircle size={16} /> Enviar Texto a Cliente (WhatsApp)
                            </button>
                          )}

                          {pedido.items && (
                            <button
                              onClick={() => {
                                const doc = new jsPDF();
                                doc.setFontSize(20);
                                doc.text(`Lectura de Insumos - ${selectedClientNotes.name}`, 14, 22);
                                
                                doc.setFontSize(12);
                                doc.text(`Referencia: ${pedido.pdfName || 'Presupuesto Importado'}`, 14, 30);
                                doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 38);
                                
                                doc.setFontSize(14);
                                doc.text('Ítem', 14, 50);
                                doc.text('Cant', 100, 50);
                                doc.text('Unitario ($)', 130, 50);
                                doc.text('Total ($)', 170, 50);
                                
                                doc.setFontSize(10);
                                let y = 60;
                                
                                pedido.items.forEach((it: any) => {
                                  const cant = Number(it.cant || 1);
                                  const costo = Number(it.costo || 0);
                                  const desc = (it.desc || '---').substring(0, 45); // Trim long strings
                                  
                                  doc.text(desc, 14, y);
                                  doc.text(cant.toString(), 100, y);
                                  doc.text(costo.toLocaleString('es-AR'), 130, y);
                                  doc.text((cant * costo).toLocaleString('es-AR'), 170, y);
                                  
                                  y += 10;
                                  if (y > 280) {
                                      doc.addPage();
                                      y = 20;
                                  }
                                });
                                
                                doc.save(`Insumos_${selectedClientNotes.name.replace(/\s+/g, '_')}.pdf`);
                              }}
                              className="w-full py-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <FileText size={16} /> Exportar Lectura a PDF
                            </button>
                          )}

                          {selectedClientNotes.status === 'EN ESPERA' && (
                            <button
                              onClick={async () => {
                                updateClientInDB(selectedClientNotes.id, {
                                  status: 'EN PROCESO',
                                  statusColor: 'text-accent bg-accent/10'
                                });
                                const updated = { ...selectedClientNotes, status: 'EN PROCESO', statusColor: 'text-accent bg-accent/10' };
                                setSelectedClientNotes(updated);
                                if (selectedClientMap && selectedClientMap.id === selectedClientNotes.id) {
                                  setSelectedClientMap(updated);
                                }
                              }}
                              className="w-full py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.6)] hover:-translate-y-0.5"
                            >
                              <CheckCircle size={16} /> Aprobar para Obra
                            </button>
                          )}

                          {pedido.items && (
                            <button
                              onClick={async () => {
                                const name = pedido.pdfName || `Presupuesto ${pedido.fecha}`;
                                await addTrabajoToDB({
                                  titulo: `OBRA: ${name}`,
                                  clienteId: selectedClientNotes.id,
                                  cliente: selectedClientNotes.name,
                                  estado: 'Planificación',
                                  ubicacion: selectedClientNotes.location || 'Sin ubicación',
                                  categoria: 'Jardinería',
                                  rentabilidad: 50,
                                  gastosDetalle: pedido.items.map((it: any) => ({
                                    id: Math.random().toString(),
                                    descripcion: it.desc || "Item Extraído",
                                    cantidad: Number(it.cant || 1),
                                    precioUnitario: Number(it.costo || 0),
                                    categoria: '',
                                    marca: ''
                                  })),
                                  checklist: pedido.items.map((it: any) => ({
                                    id: Math.random(),
                                    text: it.desc || "Item Extraído",
                                    qty: it.cant || 1,
                                    isChecked: false
                                  })),
                                  itemsCount: pedido.items.length
                                });
                                navigate('/trabajos');
                              }}
                              className="w-full py-2.5 bg-accent text-white hover:bg-emerald-400 border border-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5"
                            >
                              <Archive size={16} /> Volcar Proyecto a Trabajos
                            </button>
                          )}
                        </div>
                        
                        <details className="group mt-2 border-t border-bd-lines pt-2">
                          <summary className="list-none flex items-center gap-2 text-[10px] font-bold text-tx-secondary uppercase tracking-wider cursor-pointer hover:text-accent transition-colors select-none">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            Ver / Editar Notas del Adjunto
                          </summary>
                          <div className="mt-2 bg-card rounded-xl border border-bd-lines border-dashed overflow-hidden focus-within:border-accent transition-colors">
                            <textarea
                              className="w-full text-xs bg-transparent border-none p-3 text-tx-primary outline-none resize-none custom-scrollbar"
                              rows={3}
                              value={pedido.notas || ''}
                              placeholder="Añade observaciones generales para este presupuesto aquí..."
                              onChange={(e) => {
                                const updated = [...selectedClientNotes[fieldString]];
                                updated[pIndex].notas = e.target.value;
                                updateClientInDB(selectedClientNotes.id, { [fieldString]: updated });
                                setSelectedClientNotes({ ...selectedClientNotes, [fieldString]: updated });
                              }}
                            />
                          </div>
                        </details>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-bd-lines mt-2">
              <button
                onClick={() => setSelectedClientNotes(null)}
                className="px-4 py-2 bg-card border border-bd-lines text-tx-secondary font-semibold rounded-xl hover:bg-main transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Modal for Projects */}
      <Modal
        isOpen={!!selectedClientProjects}
        onClose={() => setSelectedClientProjects(null)}
        title={`Proyectos de Riego: ${selectedClientProjects?.name}`}
      >
        {selectedClientProjects && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {!selectedClientProjects.proyectos_riego || selectedClientProjects.proyectos_riego.length === 0 ? (
                <p className="text-sm text-tx-secondary italic">No hay proyectos de riego asociados a este cliente.</p>
              ) : (
                selectedClientProjects.proyectos_riego.map((proyecto: any) => (
                  <div key={proyecto.id} className="bg-main p-4 rounded-xl border border-bd-lines hover:border-accent/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-tx-primary text-base">{proyecto.nombre}</h4>
                        <p className="text-xs text-tx-secondary flex items-center gap-1 mt-0.5"><Calendar size={12} /> {proyecto.fecha}</p>
                      </div>
                      <span className="bg-accent/10 text-accent px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-accent/20">
                        <Activity size={14} /> {proyecto.perdida}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-card p-2 rounded-lg border border-bd-lines shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-tx-secondary uppercase">Caudal Obj.</span>
                        <span className="text-sm font-semibold text-tx-primary">{proyecto.caudal}</span>
                      </div>
                      <div className="bg-card p-2 rounded-lg border border-bd-lines shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-tx-secondary uppercase">Tubería Principal</span>
                        <span className="text-sm font-semibold text-tx-primary">{proyecto.material}</span>
                      </div>
                      <div className="bg-card p-2 rounded-lg border border-bd-lines shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-tx-secondary uppercase">Distancia Trazada</span>
                        <span className="text-sm font-semibold text-tx-primary">{proyecto.distancia}</span>
                      </div>
                      <div className="bg-card p-2 rounded-lg border border-bd-lines shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-tx-secondary uppercase">Nodos (Accesorios)</span>
                        <span className="text-sm font-semibold text-tx-primary">{proyecto.nodes} un.</span>
                      </div>
                    </div>

                    {proyecto.recomendacion && (
                      <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 mt-2">
                        <p className="text-xs text-blue-500 font-medium flex gap-2 items-start">
                          <Droplets size={14} className="mt-0.5 shrink-0" />
                          <span>{proyecto.recomendacion}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 flex justify-between items-center gap-3 border-t border-bd-lines">
              <p className="text-xs text-tx-secondary italic">Los proyectos se generan desde la Calculadora Hidráulica.</p>
              <button
                onClick={() => setSelectedClientProjects(null)}
                className="px-4 py-2 bg-card border border-bd-lines text-tx-secondary font-semibold rounded-xl hover:bg-main transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Presupuesto Formal Modal */}
      {(selectedClientMap || selectedClientNotes) && (
        <PresupuestoFormalModal
          isOpen={isPresupuestoModalOpen}
          onClose={() => { setIsPresupuestoModalOpen(false); setPresupuestoInitialItems(null); }}
          client={selectedClientMap || selectedClientNotes}
          initialItems={presupuestoInitialItems || undefined}
        />
      )}

    </div>
  );
}
