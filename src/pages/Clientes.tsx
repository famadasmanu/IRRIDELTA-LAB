import React, { useState } from 'react';
import { Leaf, User, Search, CheckCircle2, MapPin, Calendar, Clock, CheckCircle, Phone, Map as MapIcon, Edit2, Trash2, FileText, Plus, Droplets, Activity, Grid, MessageCircle, Image as ImageIcon, Wrench, X, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Modal } from '../components/Modal';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const customMarkerIcon = (imageUrl: string) => L.divIcon({
  className: 'custom-avatar-marker',
  html: `<div style="width: 44px; height: 44px; border-radius: 50%; border: 3px solid #3A5F4B; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-image: url('${imageUrl}'); background-size: cover; background-position: center; background-color: white;"></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -26]
});

function MapController({ clients }: { clients: any[] }) {
  const map = useMap();
  React.useEffect(() => {
    const clientsWithCoords = clients.filter(c => c.lat && c.lng);
    if (clientsWithCoords.length > 0) {
      const bounds = L.latLngBounds(clientsWithCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [clients, map]);
  return null;
}

const initialClients = [
  {
    id: '1',
    status: 'EN PROCESO',
    statusColor: 'text-[#3A5F4B] bg-[#3A5F4B]/10',
    name: 'Consorcio Los Olivos',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjBUBApGq-y8rwPOsvoxKboPby5zB-xRLu0B67SJNBfW7Jq8JdVTdPYA3Ly67F9rb1Z_J8M1Z0des38OBLFOxgkJVLCfEpzeDmpvjVQlXC8h2Oik9Rs4hfxj8MVmYjSjMau13gEkccS81z8j0l6q0dncuLu2WuFLgoXRzNt-R48O0sCkyRoMpvQizfy2lrvDIfDtA8ElGZMBH0P2psLZHgMevnQ0SCM6e_FubHJ0G5Bi2Riu7whFysz-d2jnakYFXVhXFgqaUmZZ4',
    location: 'Av. Las Palmas 450, San Isidro',
    lat: -34.4251,
    lng: -58.5262,
    dateInfo: 'Instalación de riego • Finaliza en 3 días',
    icon1: 'MapPin',
    icon2: 'Calendar',
    isFinished: false,
    phone: '+541145678901',
    mapUrl: 'https://maps.google.com/?q=Av.+Las+Palmas+450,+San+Isidro',
    notes: 'Cliente muy detallista, llamar antes de ir.'
  },
  {
    id: '2',
    status: 'EN ESPERA',
    statusColor: 'text-amber-600 bg-amber-100',
    name: 'Residencial Alvear',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9UqMr2SEbPagX5U-VOwaXWSIzQ-VqCGksejN9MgLyqgSV9Ri837TMYjvIMBSv74J0STXeFk6dMcWKopbUaVmnz853eXTvf8sqJq0TPi7MlQbAom8gDguwbUUO0boSvRStxK0ug8JUZ7TxoTKSYvrXoIKZ4LjzlYBbfuN-SG1_jkSeRlY22_H7A9IN3Y3xrHC6WaaTX1gWWDztCB-UH55jBv22waNyqgBiqefh2kQlNYbUUkocnDxbpR0lbP8eSlnSKn9SaXdtYy4',
    location: 'Calle 4 No. 122, Nordelta',
    lat: -34.4036,
    lng: -58.6430,
    dateInfo: 'Pendiente de materiales de riego',
    icon1: 'MapPin',
    icon2: 'Clock',
    isFinished: false,
    phone: '+541123456789',
    mapUrl: 'https://maps.google.com/?q=Calle+4+No.+122,+Nordelta',
    notes: ''
  },
  {
    id: '3',
    status: 'FINALIZADO',
    statusColor: 'text-slate-600 bg-slate-100',
    name: "Casa de Campo 'El Refugio'",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAi60a9tANZcF70OaIVJ8RGP50kakuLn8kkPeo2rUt_3VhmCeSv5mZFN5SZoCeIntjfcMY48CbV3rxsj5-BZIULU5DIUTfmx489hje5c7c5u5YmJCdLkTVB09fiSgNLFciY1RJ5DZk5WTmhBfeuz5aP89J6LM7eHI0tvhQgQXotfU3b1o1okEqrLnzLsMMrINndr0Ztycx1K56DnjbY20IBCU7le-oeTlMdaE3d5JjG82M6eeEdv_2yabYzD6XR5EKuI0lCwjbWhOA',
    location: 'Ruta 6 km 45, Luján',
    lat: -34.5703,
    lng: -59.1050,
    dateInfo: 'Proyecto completado el 12 Oct',
    icon1: 'MapPin',
    icon2: 'CheckCircle',
    isFinished: true,
    phone: '+541198765432',
    mapUrl: 'https://maps.google.com/?q=Ruta+6+km+45,+Luján',
    notes: 'Mantenimiento mensual programado.'
  }
];

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
  const { data: clientsRaw, add: addClientToDB, update: updateClientInDB, remove: removeClientFromDB } = useFirestoreCollection<any>('clientes');
  const clientsData = clientsRaw.length > 0 ? clientsRaw : initialClients;
  
  const { data: anotacionesData, add: addAnotacionToDB, update: updateAnotacionInDB, remove: removeAnotacionFromDB } = useFirestoreCollection<any>('trabajos_anotaciones');
  const { data: portfolioData } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: inventarioProjects } = useFirestoreCollection<any>('projects');
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientMap, setSelectedClientMap] = useState<any>(null);
  const filters = ['Todos', 'En Proceso', 'En Espera', 'Finalizados'];

  const [editingClient, setEditingClient] = useState<any>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState<any>({});
  const [selectedClientNotes, setSelectedClientNotes] = useState<any>(null);
  const [selectedClientProjects, setSelectedClientProjects] = useState<any>(null);

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
      const statusColor = newClient.status === 'EN PROCESO' ? 'text-[#3A5F4B] bg-[#3A5F4B]/10' :
        newClient.status === 'EN ESPERA' ? 'text-amber-600 bg-amber-100' :
          'text-slate-600 bg-slate-100';
      
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
      const statusColor = editingClient.status === 'EN PROCESO' ? 'text-[#3A5F4B] bg-[#3A5F4B]/10' :
        editingClient.status === 'EN ESPERA' ? 'text-amber-600 bg-amber-100' :
          'text-slate-600 bg-slate-100';
          
      const id = editingClient.id;
      const clientToUpdate = { ...editingClient, statusColor, isFinished: editingClient.status === 'FINALIZADO' };
      delete clientToUpdate.id;
      
      await updateClientInDB(id, clientToUpdate);
      setEditingClient(null);
    }
  };

  const totalClients = clientsData.length;
  const activeClients = clientsData.filter((c:any) => c.status === 'EN PROCESO').length;
  const waitingClients = clientsData.filter((c:any) => c.status === 'EN ESPERA').length;
  const finishedClients = clientsData.filter((c:any) => c.status === 'FINALIZADO').length;

  return (
    <div className="flex flex-col font-sans pb-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <header className="bg-white rounded-2xl p-4 shadow-sm border border-[#3A5F4B]/10 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#3A5F4B]/10 p-2 rounded-lg text-[#3A5F4B]">
                <User size={24} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Cuentas & Proyectos</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsAddingClient(true); setNewClient({ name: '', location: '', status: 'EN PROCESO', phone: '', dateInfo: '', lat: -34.6037, lng: -58.3816 }); }}
                className="flex items-center gap-1 text-sm font-bold text-white bg-[#3A5F4B] px-4 py-2 rounded-full hover:bg-[#2d4a3a] transition-colors shadow-sm"
              >
                <Plus size={18} />
                Nuevo
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-[#3A5F4B] transition-colors" />
            </div>
            <input
              className="block w-full pl-10 pr-3 py-3 bg-slate-50 border-none rounded-xl text-sm placeholder-slate-500 focus:ring-2 focus:ring-[#3A5F4B]/20 transition-all outline-none"
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
        <div className="w-full md:w-80 bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden flex flex-col shrink-0 h-[400px] md:h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <User size={16} className="text-[#3A5F4B]" />
              Directorio de Cuentas
            </h2>
            <span className="bg-[#3A5F4B]/10 text-[#3A5F4B] text-[10px] font-black px-2 py-0.5 rounded-md">{totalClients}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredClients.map((client: any) => (
              <div 
                key={client.id}
                onClick={() => setSelectedClientMap(client)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedClientMap?.id === client.id ? 'border-[#3A5F4B] bg-[#3A5F4B]/5' : 'border-slate-100 hover:border-slate-300 bg-white shadow-sm'}`}
              >
                <div className="flex justify-between items-center mb-1 gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="size-6 rounded-full bg-cover bg-center border border-slate-200 shrink-0"
                      style={{ backgroundImage: `url('${client.image}')` }}
                    />
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{client.name}</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1 mt-2"><MapPin size={12}/>{client.location}</p>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-sm">
                No se encontraron cuentas.
              </div>
            )}
          </div>
        </div>

        {/* Mapa y Tarjeta Emergente de Cliente Seleccionado */}
        <div className="flex-1 bg-slate-50 rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden relative z-0 min-h-[400px]">
          <MapContainer center={[-34.6037, -58.3816]} zoom={10} style={{ height: '100%', width: '100%' }}>
            <MapController clients={filteredClients} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredClients.map((client: any) => (
              client.lat && client.lng && (
                <Marker 
                  key={client.id} 
                  position={[client.lat, client.lng]}
                  icon={customMarkerIcon(client.image)}
                  eventHandlers={{ click: () => setSelectedClientMap(client) }}
                >
                  <Popup>
                    <strong className="text-sm block text-center">{client.name}</strong>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>

          {/* Tarjeta Emergente del Cliente Seleccionado (Over the map) */}
          {selectedClientMap && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 z-[1000] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
              <div className="p-5 relative">
                <button 
                  onClick={() => setSelectedClientMap(null)}
                  className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex gap-4 items-start mb-4 pr-6">
                  <div
                    className={`size-14 rounded-xl bg-cover bg-center border border-slate-200 shrink-0 ${selectedClientMap.isFinished ? 'grayscale' : ''}`}
                    style={{ backgroundImage: `url('${selectedClientMap.image}')` }}
                  />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{selectedClientMap.name}</h3>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin size={14} className="text-[#3A5F4B]" />
                    <span>{selectedClientMap.location}</span>
                  </div>
                  {selectedClientMap.fechaInicioPactada && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar size={14} className="text-[#3A5F4B]" />
                      <span>Inicio Pactado: <strong className="font-semibold text-slate-800">{selectedClientMap.fechaInicioPactada.split('-').reverse().join('/')}</strong></span>
                    </div>
                  )}
                  {selectedClientMap.fechaInicioReal && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock size={14} className="text-[#3A5F4B]" />
                      <span>Inicio Real: <strong className="font-semibold text-slate-800">{selectedClientMap.fechaInicioReal.split('-').reverse().join('/')}</strong></span>
                    </div>
                  )}
                  {(!selectedClientMap.fechaInicioPactada && !selectedClientMap.fechaInicioReal && selectedClientMap.dateInfo) && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar size={14} className="text-[#3A5F4B]" />
                      <span>{selectedClientMap.dateInfo}</span>
                    </div>
                  )}
                </div>

                {/* BOTON PROTAGONICO GESTOR DE OBRAS */}
                <button
                  onClick={() => navigate('/trabajos')}
                  className="w-full mb-4 flex items-center justify-center gap-2 text-sm font-black text-white bg-gradient-to-r from-[#3A5F4B] to-[#2d4a3a] py-3 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <Wrench size={18} />
                  Abrir Gestor de Obras
                </button>

                <div className="grid grid-cols-5 gap-2 border-t border-slate-100 pt-3 mt-2">
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${selectedClientMap.lat},${selectedClientMap.lng}`, '_blank')}
                    className="flex flex-col items-center justify-center py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors"
                    title="Google Maps"
                  >
                    <MapIcon size={16} className="mb-1" />
                    Maps
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/${selectedClientMap.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                    className="flex flex-col items-center justify-center py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle size={16} className="mb-1" />
                    Chat
                  </button>
                  <button
                    onClick={() => setSelectedClientNotes(selectedClientMap)}
                    className="flex flex-col items-center justify-center py-2 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors"
                    title="Anotaciones"
                  >
                    <FileText size={16} className="mb-1" />
                    Historial
                  </button>
                  <button
                    onClick={() => { setEditingClient(selectedClientMap); }}
                    className="flex flex-col items-center justify-center py-2 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} className="mb-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => { setSelectedClientMap(null); handleDeleteClient(selectedClientMap.id); }}
                    className="flex flex-col items-center justify-center py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} className="mb-1" />
                    Borrar
                  </button>
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
                className="size-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => document.getElementById('client-image-upload')?.click()}
              >
                {(editingClient?.image || newClient?.image) ? (
                  <img src={editingClient ? editingClient.image : newClient.image} alt="Client" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-slate-400" />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={editingClient ? editingClient.name : newClient.name}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, name: e.target.value }) : setNewClient({ ...newClient, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                value={editingClient ? editingClient.status : newClient.status}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, status: e.target.value }) : setNewClient({ ...newClient, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              >
                <option value="EN PROCESO">En Proceso</option>
                <option value="EN ESPERA">En Espera</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
              <input
                type="text"
                required
                value={editingClient ? editingClient.location : newClient.location}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, location: e.target.value }) : setNewClient({ ...newClient, location: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={editingClient ? editingClient.phone : newClient.phone}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, phone: e.target.value }) : setNewClient({ ...newClient, phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Día de Inicio Pactado</label>
                <input
                  type="date"
                  value={editingClient ? editingClient.fechaInicioPactada : newClient.fechaInicioPactada}
                  onChange={e => editingClient ? setEditingClient({ ...editingClient, fechaInicioPactada: e.target.value }) : setNewClient({ ...newClient, fechaInicioPactada: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inicio Real</label>
                <input
                  type="date"
                  value={editingClient ? editingClient.fechaInicioReal : newClient.fechaInicioReal}
                  onChange={e => editingClient ? setEditingClient({ ...editingClient, fechaInicioReal: e.target.value }) : setNewClient({ ...newClient, fechaInicioReal: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setEditingClient(null); setIsAddingClient(false); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
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
        isOpen={!!selectedClientNotes}
        onClose={() => setSelectedClientNotes(null)}
        title={`Gestión de Vínculos y Anotaciones: ${selectedClientNotes?.name}`}
      >
        {selectedClientNotes && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notas del Cliente</label>
              <textarea
                value={selectedClientNotes.notes || ''}
                onChange={async (e) => {
                  const updatedClient = { ...selectedClientNotes, notes: e.target.value };
                  setSelectedClientNotes(updatedClient);
                  // Update remotely
                  const id = updatedClient.id;
                  const clientToUpdate = { ...updatedClient };
                  delete clientToUpdate.id;
                  await updateClientInDB(id, clientToUpdate);
                }}
                placeholder="Escribe anotaciones sobre este cliente aquí..."
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700">Anotaciones y Trabajos Vinculados al Cliente</label>
                <button
                  onClick={async () => {
                    const newNota = {
                      titulo: `Nota para ${selectedClientNotes.name}`,
                      categoria: 'General',
                      fecha: new Date().toLocaleDateString('es-AR'),
                      contenido: '',
                      cliente: selectedClientNotes.name
                    };
                    await addAnotacionToDB(newNota);
                  }}
                  className="text-xs bg-[#3A5F4B] text-white px-2 py-1 rounded hover:bg-[#2d4a3a] transition-colors flex items-center gap-1"
                >
                  <Plus size={12} /> Nueva
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {anotacionesData.filter((nota: any) => nota.cliente === selectedClientNotes.name || nota.titulo.includes(selectedClientNotes.name) || nota.contenido.includes(selectedClientNotes.name) || (nota.tags && nota.tags.some((tag: any) => tag.name.includes(selectedClientNotes.name)))).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No hay anotaciones o vinculaciones para este cliente aún.</p>
                ) : (
                  anotacionesData.filter((nota: any) => nota.cliente === selectedClientNotes.name || nota.titulo.includes(selectedClientNotes.name) || nota.contenido.includes(selectedClientNotes.name) || (nota.tags && nota.tags.some((tag: any) => tag.name.includes(selectedClientNotes.name)))).map((nota: any) => (
                    <div key={nota.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-1">
                        <input
                          type="text"
                          value={nota.titulo}
                          onChange={async (e) => {
                             await updateAnotacionInDB(nota.id, { titulo: e.target.value });
                          }}
                          className="font-bold text-sm text-slate-800 bg-transparent border-none p-0 focus:ring-0 w-full"
                          placeholder="Título de la nota"
                        />
                        <button
                          onClick={async () => await removeAnotacionFromDB(nota.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        value={nota.contenido}
                        onChange={async (e) => {
                          await updateAnotacionInDB(nota.id, { contenido: e.target.value });
                        }}
                        className="text-sm text-slate-600 bg-transparent border-none p-0 focus:ring-0 w-full resize-none h-16"
                        placeholder="Contenido de la nota..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-400">{nota.fecha}</span>
                        <span className="text-[10px] bg-[#3A5F4B]/10 text-[#3A5F4B] px-2 py-0.5 rounded-full font-medium">Origen: {nota.categoria}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User size={18} className="text-[#3A5F4B]" />
                  Obras y Trabajos (Portfolio Activo)
                </label>
                <p className="text-xs text-slate-500">Historial extraído automáticamente desde la terminal de Trabajos.</p>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {portfolioData.filter((trabajo: any) => trabajo.cliente === selectedClientNotes.name).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No hay trabajos ni proyectos de obra documentados para este cliente.</p>
                ) : (
                  portfolioData.filter((trabajo: any) => trabajo.cliente === selectedClientNotes.name).map((trabajo: any) => (
                    <div key={trabajo.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="h-12 w-16 bg-slate-100 rounded border border-slate-200 overflow-hidden shrink-0">
                        {trabajo.img ? (
                          <img src={trabajo.img} alt={trabajo.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={16} /></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{trabajo.titulo}</h4>
                        <div className="flex gap-2 items-center mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              trabajo.estado === 'Completado' ? 'bg-green-100 text-green-700' :
                              trabajo.estado === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {trabajo.estado}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {trabajo.ubicacion}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="mb-3 flex justify-between items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Archive size={18} className="text-[#3A5F4B]" />
                    Listados de Materiales (Inventario y Cómputos)
                  </label>
                  <p className="text-xs text-slate-500">Listas de compras y checklists de obra vinculados a este cliente.</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem('inventario_search_query', selectedClientNotes.name);
                    navigate('/inventario');
                  }}
                  className="text-xs bg-[#3A5F4B] text-white py-1.5 px-3 mb-1 rounded-lg hover:bg-[#2d4a3a] transition-colors font-bold shadow-sm whitespace-nowrap"
                >
                  Nuevo Listado
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {inventarioProjects.filter((p: any) => p.clienteId === selectedClientNotes.id || p.cliente === selectedClientNotes.name).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No hay listas de materiales ni cómputos de inventario para este cliente.</p>
                ) : (
                  inventarioProjects.filter((p: any) => p.clienteId === selectedClientNotes.id || p.cliente === selectedClientNotes.name).map((p: any) => (
                    <div key={p.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
                       <div>
                         <h4 className="font-bold text-sm text-slate-800 line-clamp-1 flex items-center gap-2">
                           {p.name}
                           <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                             {p.itemsCount} items
                           </span>
                         </h4>
                         {p.trabajoName && <span className="text-xs text-[#3A5F4B] mt-0.5 block flex items-center gap-1"><Wrench size={10} /> Vinculado a: {p.trabajoName}</span>}
                       </div>
                       <button onClick={() => {
                          localStorage.setItem('inventario_search_query', p.name);
                          navigate('/inventario');
                       }} className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors whitespace-nowrap">Ver / Editar</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedClientNotes(null)}
                className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
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
                <p className="text-sm text-slate-500 italic">No hay proyectos de riego asociados a este cliente.</p>
              ) : (
                selectedClientProjects.proyectos_riego.map((proyecto: any) => (
                  <div key={proyecto.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-[#3A5F4B]/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{proyecto.nombre}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Calendar size={12} /> {proyecto.fecha}</p>
                      </div>
                      <span className="bg-[#3A5F4B]/10 text-[#3A5F4B] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-[#3A5F4B]/20">
                        <Activity size={14} /> {proyecto.perdida}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Caudal Obj.</span>
                        <span className="text-sm font-semibold text-slate-700">{proyecto.caudal}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tubería Principal</span>
                        <span className="text-sm font-semibold text-slate-700">{proyecto.material}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Distancia Trazada</span>
                        <span className="text-sm font-semibold text-slate-700">{proyecto.distancia}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nodos (Accesorios)</span>
                        <span className="text-sm font-semibold text-slate-700">{proyecto.nodes} un.</span>
                      </div>
                    </div>

                    {proyecto.recomendacion && (
                      <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 mt-2">
                        <p className="text-xs text-blue-800 font-medium flex gap-2 items-start">
                          <Droplets size={14} className="mt-0.5 shrink-0" />
                          <span>{proyecto.recomendacion}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 flex justify-between items-center gap-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 italic">Los proyectos se generan desde la Calculadora Hidráulica.</p>
              <button
                onClick={() => setSelectedClientProjects(null)}
                className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
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
