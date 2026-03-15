import React, { useState } from 'react';
import { Leaf, User, Search, CheckCircle2, MapPin, Calendar, Clock, CheckCircle, Phone, Map as MapIcon, Edit2, Trash2, FileText, Plus, X, Droplets, Activity, Grid, BarChart, MessageCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Modal } from '../components/Modal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const initialClients = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
  const [clientsData, setClientsData] = useLocalStorage('clientes_data', initialClients);
  const [anotacionesData, setAnotacionesData] = useLocalStorage<any[]>('trabajos_anotaciones', []);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
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

  const handleDeleteClient = (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      setClientsData(clientsData.filter((c: any) => c.id !== id));
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

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingClient) {
      const statusColor = newClient.status === 'EN PROCESO' ? 'text-[#3A5F4B] bg-[#3A5F4B]/10' :
        newClient.status === 'EN ESPERA' ? 'text-amber-600 bg-amber-100' :
          'text-slate-600 bg-slate-100';
      setClientsData([...clientsData, {
        ...newClient,
        id: Date.now(),
        statusColor,
        isFinished: newClient.status === 'FINALIZADO',
        icon1: 'MapPin',
        icon2: 'Calendar',
        image: newClient.image || 'https://picsum.photos/seed/client/200/200'
      }]);
      setIsAddingClient(false);
    } else {
      const statusColor = editingClient.status === 'EN PROCESO' ? 'text-[#3A5F4B] bg-[#3A5F4B]/10' :
        editingClient.status === 'EN ESPERA' ? 'text-amber-600 bg-amber-100' :
          'text-slate-600 bg-slate-100';
      setClientsData(clientsData.map((c: any) => c.id === editingClient.id ? { ...editingClient, statusColor, isFinished: editingClient.status === 'FINALIZADO' } : c));
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
                <Leaf size={24} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Mis Clientes</h1>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Vista Cuadrícula"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Vista Mapa"
                >
                  <MapIcon size={18} />
                </button>
              </div>
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

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all ${activeFilter === filter
                  ? 'bg-[#3A5F4B] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPIs Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Clientes</p>
            <p className="text-2xl font-black text-slate-800">{totalClients}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
            <User size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#3A5F4B] uppercase tracking-widest mb-1">En Proceso</p>
            <p className="text-2xl font-black text-slate-800">{activeClients}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3A5F4B]/10 flex items-center justify-center text-[#3A5F4B]">
            <Activity size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">En Espera</p>
            <p className="text-2xl font-black text-slate-800">{waitingClients}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Finalizados</p>
            <p className="text-2xl font-black text-slate-800">{finishedClients}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client: any) => {
              const Icon1 = getIcon(client.icon1);
              const Icon2 = getIcon(client.icon2);

              return (
                <div key={client.id} className={`bg-white p-4 rounded-2xl shadow-sm border border-[#3A5F4B]/10 hover:shadow-md hover:border-[#3A5F4B]/30 transition-all relative group flex flex-col ${client.isFinished ? 'opacity-90' : ''}`}>
                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => setEditingClient(client)}
                      className="p-1.5 bg-white/80 backdrop-blur-sm text-slate-600 hover:text-[#3A5F4B] rounded-lg transition-colors border border-slate-200 shadow-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-1.5 bg-white/80 backdrop-blur-sm text-slate-600 hover:text-red-500 rounded-lg transition-colors border border-slate-200 shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <div className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md mb-2 w-fit ${client.statusColor}`}>
                        {client.isFinished && <CheckCircle2 size={12} />}
                        {client.status}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 pr-16">{client.name}</h3>
                    </div>
                    <div
                      className={`size-12 rounded-lg bg-cover bg-center border border-slate-100 shrink-0 ${client.isFinished ? 'grayscale' : ''}`}
                      style={{ backgroundImage: `url('${client.image}')` }}
                    />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className={`flex items-center gap-3 text-sm ${client.isFinished ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                      <div className={`p-1.5 rounded-lg shrink-0 ${client.isFinished ? 'bg-slate-100 text-slate-400' : 'bg-[#3A5F4B]/10 text-[#3A5F4B]'}`}>
                        <Icon1 size={16} />
                      </div>
                      <span className="font-medium">{client.location}</span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm ${client.isFinished ? 'text-slate-400' : 'text-slate-600'}`}>
                      <div className={`p-1.5 rounded-lg shrink-0 ${client.isFinished ? 'bg-slate-100 text-slate-400' : 'bg-[#3A5F4B]/10 text-[#3A5F4B]'}`}>
                        <Icon2 size={16} />
                      </div>
                      <span className="font-medium">{client.dateInfo}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!client.isFinished ? (
                      <>
                        <button
                          onClick={() => window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                          className="flex-1 bg-emerald-50 text-emerald-600 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-sm transition-all hover:bg-emerald-100 border border-emerald-200"
                        >
                          <MessageCircle size={18} />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => window.location.href = `tel:${client.phone}`}
                          className="px-3 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors border border-slate-200"
                          title="Llamar"
                        >
                          <Phone size={20} />
                        </button>
                        <button
                          onClick={() => setSelectedClientNotes(client)}
                          className="px-3 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors border border-slate-200"
                          title="Anotaciones"
                        >
                          <FileText size={20} />
                        </button>
                        {(client.proyectos_riego && client.proyectos_riego.length > 0) && (
                          <button
                            onClick={() => setSelectedClientProjects(client)}
                            className="px-3 bg-[#3A5F4B]/10 text-[#3A5F4B] rounded-lg flex items-center justify-center hover:bg-[#3A5F4B]/20 transition-colors border border-[#3A5F4B]/20 relative"
                            title="Proyectos de Riego"
                          >
                            <Droplets size={20} />
                            <span className="absolute -top-2 -right-2 bg-[#F27D26] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{client.proyectos_riego.length}</span>
                          </button>
                        )}
                        <button
                          onClick={() => window.open(client.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(client.location)}`, '_blank')}
                          className="px-3 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors border border-slate-200"
                        >
                          <MapIcon size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                          className="flex-1 bg-emerald-50 text-emerald-600 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-emerald-100 transition-all border border-emerald-200"
                        >
                          <MessageCircle size={18} />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => setSelectedClientNotes(client)}
                          className="px-3 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors border border-slate-200"
                          title="Anotaciones"
                        >
                          <FileText size={18} />
                        </button>
                        {(client.proyectos_riego && client.proyectos_riego.length > 0) && (
                          <button
                            onClick={() => setSelectedClientProjects(client)}
                            className="flex-1 bg-[#3A5F4B]/10 text-[#3A5F4B] py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-[#3A5F4B]/20 transition-all border border-[#3A5F4B]/20"
                          >
                            <Droplets size={18} />
                            Proyectos ({client.proyectos_riego.length})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredClients.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500">
                No se encontraron clientes con esos filtros.
              </div>
            )}
          </div>
        ) : (
          <div className="h-[600px] w-full bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden relative z-0">
            <MapContainer center={[-34.6037, -58.3816]} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredClients.map((client: any) => (
                client.lat && client.lng && (
                  <Marker key={client.id} position={[client.lat, client.lng]}>
                    <Popup>
                      <div className="p-1">
                        <strong className="block text-sm mb-1">{client.name}</strong>
                        <p className="text-xs text-slate-600 mb-1">{client.location}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${client.statusColor}`}>{client.status}</span>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        )}
      </main>

      {/* Modal for Edit/Add Client */}
      <Modal
        isOpen={!!editingClient || isAddingClient}
        onClose={() => { setEditingClient(null); setIsAddingClient(false); }}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Información de Fecha/Proyecto</label>
              <input
                type="text"
                value={editingClient ? editingClient.dateInfo : newClient.dateInfo}
                onChange={e => editingClient ? setEditingClient({ ...editingClient, dateInfo: e.target.value }) : setNewClient({ ...newClient, dateInfo: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              />
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

      {/* Modal for Notes */}
      <Modal
        isOpen={!!selectedClientNotes}
        onClose={() => setSelectedClientNotes(null)}
        title={`Anotaciones: ${selectedClientNotes?.name}`}
      >
        {selectedClientNotes && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notas del Cliente</label>
              <textarea
                value={selectedClientNotes.notes || ''}
                onChange={(e) => {
                  const updatedClient = { ...selectedClientNotes, notes: e.target.value };
                  setSelectedClientNotes(updatedClient);
                  setClientsData(clientsData.map((c: any) => c.id === updatedClient.id ? updatedClient : c));
                }}
                placeholder="Escribe anotaciones sobre este cliente aquí..."
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700">Anotaciones Generales Vinculadas</label>
                <button
                  onClick={() => {
                    const newNota = {
                      id: Date.now(),
                      titulo: `Nota para ${selectedClientNotes.name}`,
                      categoria: 'General',
                      fecha: new Date().toLocaleDateString('es-AR'),
                      contenido: '',
                      cliente: selectedClientNotes.name
                    };
                    setAnotacionesData([...anotacionesData, newNota]);
                  }}
                  className="text-xs bg-[#3A5F4B] text-white px-2 py-1 rounded hover:bg-[#2d4a3a] transition-colors flex items-center gap-1"
                >
                  <Plus size={12} /> Nueva
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {anotacionesData.filter((nota: any) => nota.cliente === selectedClientNotes.name || nota.titulo.includes(selectedClientNotes.name) || nota.contenido.includes(selectedClientNotes.name)).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No hay anotaciones generales vinculadas a este cliente.</p>
                ) : (
                  anotacionesData.filter((nota: any) => nota.cliente === selectedClientNotes.name || nota.titulo.includes(selectedClientNotes.name) || nota.contenido.includes(selectedClientNotes.name)).map((nota: any) => (
                    <div key={nota.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-1">
                        <input
                          type="text"
                          value={nota.titulo}
                          onChange={(e) => {
                            setAnotacionesData(anotacionesData.map((n: any) => n.id === nota.id ? { ...n, titulo: e.target.value } : n));
                          }}
                          className="font-bold text-sm text-slate-800 bg-transparent border-none p-0 focus:ring-0 w-full"
                          placeholder="Título de la nota"
                        />
                        <button
                          onClick={() => setAnotacionesData(anotacionesData.filter((n: any) => n.id !== nota.id))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        value={nota.contenido}
                        onChange={(e) => {
                          setAnotacionesData(anotacionesData.map((n: any) => n.id === nota.id ? { ...n, contenido: e.target.value } : n));
                        }}
                        className="text-sm text-slate-600 bg-transparent border-none p-0 focus:ring-0 w-full resize-none h-16"
                        placeholder="Contenido de la nota..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-400">{nota.fecha}</span>
                        <span className="text-[10px] bg-[#3A5F4B]/10 text-[#3A5F4B] px-2 py-0.5 rounded-full font-medium">Tag: {selectedClientNotes.name}</span>
                      </div>
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
