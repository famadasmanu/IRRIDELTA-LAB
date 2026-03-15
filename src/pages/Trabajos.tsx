import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Plus, Image as ImageIcon, FileText, Trash2, MoreVertical, Edit2, ArrowLeft, TrendingUp, DollarSign, Clock as ClockIcon, Activity, Save, Download, Check, Map as MapIcon, X, Tag, User, Link as LinkIcon, Package, Folder, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/Modal';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const initialPortfolioData = [
  {
    id: '1', titulo: 'Jardín Frontal Nordelta', categoria: 'Diseño', estado: 'Completado', cliente: 'Familia Pérez',
    fecha: 'Oct 2023', fechaInicio: '2023-10-01', img: 'https://picsum.photos/seed/jardin1/400/300', ubicacion: 'Nordelta',
    gastos: 450000, rentabilidad: 35, tiempoDias: 60, gastoDistancia: 15000, lat: -34.4066, lng: -58.6503,
    trabajosPactados: [
      { id: 1, nombre: 'Nivelación de terreno', foto: 'https://picsum.photos/seed/nivelacion/100/100', tags: ['tierra', 'maquinaria'] }
    ],
    insumosUsados: [
      { id: 1, nombre: 'Tierra Negra', cantidad: 50, unidad: 'Bolsas' },
      { id: 2, nombre: 'Fertilizante', cantidad: 5, unidad: 'Litros' }
    ]
  },
  {
    id: '2', titulo: 'Sistema de Riego San Isidro', categoria: 'Instalación', estado: 'En Proceso', cliente: 'Consorcio Las Lomas',
    fecha: 'Nov 2023', fechaInicio: '2023-11-15', img: 'https://picsum.photos/seed/riego/400/300', ubicacion: 'San Isidro',
    gastos: 120000, rentabilidad: 40, tiempoDias: 30, gastoDistancia: 8000, lat: -34.4714, lng: -58.5261,
    trabajosPactados: [], insumosUsados: []
  },
  {
    id: '3', titulo: 'Mantenimiento Mensual', categoria: 'Mantenimiento', estado: 'Activo', cliente: 'Club El Pilar',
    fecha: 'Continuo', fechaInicio: '2023-01-01', img: 'https://picsum.photos/seed/mantenimiento/400/300', ubicacion: 'Pilar',
    gastos: 50000, rentabilidad: 60, tiempoDias: 365, gastoDistancia: 25000, lat: -34.4587, lng: -58.9142,
    trabajosPactados: [], insumosUsados: []
  },
  {
    id: '4', titulo: 'Piscina y Deck', categoria: 'Obra', estado: 'Planificación', cliente: 'Estudio M&A',
    fecha: 'Dic 2023', fechaInicio: '2023-12-01', img: 'https://picsum.photos/seed/deck/400/300', ubicacion: 'CABA',
    gastos: 0, rentabilidad: 0, tiempoDias: 0, gastoDistancia: 0, lat: -34.6037, lng: -58.3816,
    trabajosPactados: [], insumosUsados: []
  },
];

const createCustomIcon = (imgUrl: string) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 3px solid #3A5F4B; box-shadow: 0 4px 10px rgba(0,0,0,0.3); background-color: white;"><img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

const redDotIcon = L.divIcon({
  className: 'custom-red-dot',
  html: `<div style="width: 16px; height: 16px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});

function MapUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, 14);
    }
  }, [center, map]);
  return null;
}

function LocationPicker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

const initialAnotacionesData = [
  { id: '1', titulo: 'Especificaciones Bomba Riego', categoria: 'Técnico', fecha: '15 Nov 2023', contenido: 'Bomba sumergible 1.5HP. Presión de trabajo 3.5 bar. Caudal 4000 l/h. Requiere tablero con guardamotor.', tags: [{ id: '1', name: 'Bomba', icon: 'Wrench', link: '' }] },
  { id: '2', titulo: 'Medidas Deck Nordelta', categoria: 'Mediciones', fecha: '12 Nov 2023', contenido: 'Largo total: 12.5m. Ancho: 4.2m. Altura sobre nivel: 0.45m. Madera: Lapacho 1" x 4".', tags: [{ id: '2', name: 'Nordelta', icon: 'MapPin', link: '/clientes' }] },
  { id: '3', titulo: 'Mezcla Sustrato', categoria: 'Botánica', fecha: '05 Nov 2023', contenido: 'Proporción ideal para maceteros: 40% tierra negra, 30% compost, 20% perlita, 10% turba.', tags: [] },
];

export default function Trabajos() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'anotaciones' | 'mapa' | 'calendario'>('portfolio');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: portfolioRaw, add: addPortfolioToDB, remove: removePortfolioFromDB, update: updatePortfolioInDB } = useFirestoreCollection<any>('trabajos_portfolio');
  const portfolioData = portfolioRaw.length > 0 ? portfolioRaw : initialPortfolioData;
  const { data: anotacionesRaw, add: addAnotacionToDB, remove: removeAnotacionFromDB, update: updateAnotacionInDB } = useFirestoreCollection<any>('trabajos_anotaciones');
  const anotacionesData = anotacionesRaw.length > 0 ? anotacionesRaw : initialAnotacionesData;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImg, setNewImg] = useState('');
  const [newUbicacion, setNewUbicacion] = useState('');
  const [newCliente, setNewCliente] = useState('');
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);
  const [newTags, setNewTags] = useState<{ id: string, name: string, icon: string, link: string }[]>([]);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const [optionsItem, setOptionsItem] = useState<any>(null);
  const [optionsType, setOptionsType] = useState<'portfolio' | 'anotaciones' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'portfolio' | 'anotaciones' | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImg, setEditImg] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editUbicacion, setEditUbicacion] = useState('');
  const [editCliente, setEditCliente] = useState('');
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);
  const [editTags, setEditTags] = useState<{ id: string, name: string, icon: string, link: string }[]>([]);

  const [selectedTrabajo, setSelectedTrabajo] = useState<any>(null);
  const [metricsForm, setMetricsForm] = useState<{ gastos: number | string, rentabilidad: number | string, gastoDistancia: number | string, fechaInicio: string }>({ gastos: '', rentabilidad: '', gastoDistancia: '', fechaInicio: '' });
  const [gastosDetalle, setGastosDetalle] = useState<any[]>([]);

  // States for Trabajos Pactados
  const [isTrabajoPactadoModalOpen, setIsTrabajoPactadoModalOpen] = useState(false);
  const [newPactadoNombre, setNewPactadoNombre] = useState('');
  const [newPactadoFoto, setNewPactadoFoto] = useState('');
  const [newPactadoTags, setNewPactadoTags] = useState('');

  const [selectedPactado, setSelectedPactado] = useState<any>(null);
  const [isPactadoDetailModalOpen, setIsPactadoDetailModalOpen] = useState(false);
  const [newPactadoArchivoNombre, setNewPactadoArchivoNombre] = useState('');
  const [newPactadoArchivoUrl, setNewPactadoArchivoUrl] = useState('');
  const [newPactadoHistorial, setNewPactadoHistorial] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const { data: clientesData } = useFirestoreCollection<any>('clientes');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'User': return User;
      case 'FileText': return FileText;
      case 'Link': return LinkIcon;
      case 'Tag': return Tag;
      case 'Folder': return Folder;
      case 'MapPin': return MapPin;
      case 'Calendar': return Calendar;
      case 'CheckCircle': return Check;
      default: return Tag;
    }
  };

  const renderTagEditor = (tags: any[], setTags: any) => {
    const addTag = () => setTags([...tags, { id: Date.now().toString(), name: 'Nuevo Tag', icon: 'Tag', link: '' }]);
    const updateTag = (id: string, field: string, value: string) => setTags(tags.map((t: any) => t.id === id ? { ...t, [field]: value } : t));
    const removeTag = (id: string) => setTags(tags.filter((t: any) => t.id !== id));

    return (
      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Tags Inteligentes</label>
          <button type="button" onClick={addTag} className="text-xs text-[#3A5F4B] font-bold flex items-center gap-1 hover:bg-[#3A5F4B]/10 px-2 py-1 rounded">
            <Plus size={14} /> Agregar Tag
          </button>
        </div>
        {tags.map(tag => (
          <div key={tag.id} className="flex flex-col gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div className="flex gap-2 items-center">
              <select
                value={tag.icon}
                onChange={e => updateTag(tag.id, 'icon', e.target.value)}
                className="p-1.5 border border-gray-300 rounded text-sm bg-white"
              >
                <option value="Tag">Etiqueta</option>
                <option value="User">Cliente</option>
                <option value="Folder">Carpeta</option>
                <option value="FileText">Archivo</option>
                <option value="MapPin">Ubicación</option>
                <option value="Link">Enlace</option>
              </select>
              <input
                type="text"
                value={tag.name}
                onChange={e => updateTag(tag.id, 'name', e.target.value)}
                placeholder="Nombre"
                className="flex-1 p-1.5 border border-gray-300 rounded text-sm"
              />
              <button type="button" onClick={() => removeTag(tag.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                <Trash2 size={16} />
              </button>
            </div>
            <input
              type="text"
              value={tag.link || ''}
              onChange={e => updateTag(tag.id, 'link', e.target.value)}
              placeholder="Enlace (opcional)"
              className="w-full p-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
        ))}
      </div>
    );
  };

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImgState: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const geocodeLocation = async (address: string): Promise<{ lat: number, lng: number } | null> => {
    if (!address || address === 'Sin ubicación') return null;
    try {
      const query = address.toLowerCase().includes('argentina') ? address : `${address}, Argentina`;
      let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: { 'Accept-Language': 'es' }
      });
      let data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { lat, lng: lon };
        }
      }

      // Fallback a Photon API (más tolerante a errores)
      response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
      const photonData = await response.json();
      if (photonData && photonData.features && photonData.features.length > 0) {
        const [lon, lat] = photonData.features[0].geometry.coordinates;
        if (lat != null && lon != null) {
          return { lat, lng: lon };
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return null;
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      // 1. Primera búsqueda con Nominatim
      let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=1`, {
        headers: { 'Accept-Language': 'es' }
      });
      let data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          setMapCenter([lat, lon]);
          setIsSearchingMap(false);
          return;
        }
      }

      // 2. Fallback a Photon API (suele ser mucho mejor para direcciones informales)
      response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(mapSearchQuery)}&limit=1`);
      const photonData = await response.json();
      if (photonData && photonData.features && photonData.features.length > 0) {
        const [lon, lat] = photonData.features[0].geometry.coordinates;
        if (lat != null && lon != null) {
          setMapCenter([lat, lon]);
          setIsSearchingMap(false);
          return;
        }
      }

      // 3. Si no encuentra resultados y no especificó el país, intentamos agregando Argentina
      if (!mapSearchQuery.toLowerCase().includes('argentina')) {
        const queryWithCountry = mapSearchQuery + ', Argentina';

        // Intentar Nominatim con país
        response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCountry)}&limit=1`, {
          headers: { 'Accept-Language': 'es' }
        });
        data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            setMapCenter([lat, lon]);
            setIsSearchingMap(false);
            return;
          }
        }

        // Intentar Photon con país
        response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(queryWithCountry)}&limit=1`);
        const photonData2 = await response.json();
        if (photonData2 && photonData2.features && photonData2.features.length > 0) {
          const [lon, lat] = photonData2.features[0].geometry.coordinates;
          if (lat != null && lon != null) {
            setMapCenter([lat, lon]);
            setIsSearchingMap(false);
            return;
          }
        }
      }

      displayToast('No se encontró la dirección. Intente agregar la ciudad o provincia.');
    } catch (error) {
      console.error("Geocoding error:", error);
      displayToast('Error al buscar la dirección');
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (activeTab === 'portfolio') {
      let lat = newLat !== null ? newLat : -34.6037 + (Math.random() - 0.5) * 0.1;
      let lng = newLng !== null ? newLng : -58.3816 + (Math.random() - 0.5) * 0.1;

      if (newUbicacion && newLat === null && newLng === null) {
        const coords = await geocodeLocation(newUbicacion);
        if (coords && coords.lat != null && coords.lng != null) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      await addPortfolioToDB({
        titulo: newTitle,
        categoria: 'Nuevo',
        estado: 'Planificación',
        cliente: newCliente || 'Sin asignar',
        fecha: 'Hoy',
        fechaInicio: new Date().toISOString().split('T')[0],
        img: newImg || `https://picsum.photos/seed/${Date.now()}/400/300`,
        ubicacion: newUbicacion || 'Sin ubicación',
        gastos: 0,
        rentabilidad: 0,
        tiempoDias: 0,
        gastoDistancia: 0,
        trabajosPactados: [],
        insumosUsados: [],
        lat,
        lng
      });
    } else {
      await addAnotacionToDB({
        titulo: newTitle,
        categoria: 'General',
        fecha: 'Hoy',
        contenido: newContent,
        tags: newTags
      });
    }

    setNewTitle('');
    setNewContent('');
    setNewImg('');
    setNewUbicacion('');
    setNewTags([]);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, type: 'portfolio' | 'anotaciones') => {
    if (type === 'portfolio') {
      await removePortfolioFromDB(id);
    } else {
      await removeAnotacionFromDB(id);
    }
    setOptionsItem(null);
  };

  const handleEditClick = (item: any, type: 'portfolio' | 'anotaciones') => {
    setEditingItem(item);
    setEditType(type);
    setEditTitle(item.titulo);
    if (type === 'portfolio') {
      setEditImg(item.img);
      setEditUbicacion(item.ubicacion || '');
      setEditCliente(item.cliente || '');
      setEditLat(item.lat || null);
      setEditLng(item.lng || null);
    } else {
      setEditContent(item.contenido);
      setEditTags(item.tags || []);
    }
    setOptionsItem(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingItem || !editType) return;

    if (editType === 'portfolio') {
      let lat = editLat !== null ? editLat : editingItem.lat;
      let lng = editLng !== null ? editLng : editingItem.lng;

      if (editUbicacion !== editingItem.ubicacion && editLat === editingItem.lat && editLng === editingItem.lng) {
        const coords = await geocodeLocation(editUbicacion);
        if (coords && coords.lat != null && coords.lng != null) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }

      const id = editingItem.id;
      const dataToUpdate = {
        titulo: editTitle,
        img: editImg || editingItem.img,
        ubicacion: editUbicacion,
        cliente: editCliente,
        lat,
        lng
      };
      
      await updatePortfolioInDB(id, dataToUpdate);
    } else {
      const id = editingItem.id;
      await updateAnotacionInDB(id, { titulo: editTitle, contenido: editContent, tags: editTags });
    }

    setEditingItem(null);
    setEditType(null);
    setEditTags([]);
  };

  const handleOpenDetails = (trabajo: any) => {
    setSelectedTrabajo(trabajo);
    setMetricsForm({
      gastos: trabajo.gastos || '',
      rentabilidad: trabajo.rentabilidad || '',
      gastoDistancia: trabajo.gastoDistancia || '',
      fechaInicio: trabajo.fechaInicio || new Date().toISOString().split('T')[0]
    });
    setGastosDetalle(trabajo.gastosDetalle || []);
  };

  const gastosToUse = gastosDetalle.length > 0
    ? gastosDetalle.reduce((acc, item) => acc + ((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)), 0)
    : Number(metricsForm.gastos) || 0;

  const handleSaveMetrics = async () => {
    if (!selectedTrabajo) return;
    
    const id = selectedTrabajo.id;
    const updateData = {
        gastos: gastosToUse,
        rentabilidad: Number(metricsForm.rentabilidad) || 0,
        gastoDistancia: Number(metricsForm.gastoDistancia) || 0,
        fechaInicio: metricsForm.fechaInicio,
        gastosDetalle: gastosDetalle
    };
    await updatePortfolioInDB(id, updateData);
    
    setSelectedTrabajo({ ...selectedTrabajo, ...updateData });
    displayToast('Métricas y gastos guardados');
  };

  const cargarPlantillaJardineria = () => {
    setGastosDetalle([
      { id: Date.now().toString() + '1', descripcion: 'Tierra Negra / Sustrato', cantidad: 1, precioUnitario: 0 },
      { id: Date.now().toString() + '2', descripcion: 'Plantas y Árboles', cantidad: 1, precioUnitario: 0 },
      { id: Date.now().toString() + '3', descripcion: 'Sistema de Riego (Materiales)', cantidad: 1, precioUnitario: 0 },
      { id: Date.now().toString() + '4', descripcion: 'Mano de Obra', cantidad: 1, precioUnitario: 0 },
      { id: Date.now().toString() + '5', descripcion: 'Flete y Logística', cantidad: 1, precioUnitario: 0 },
      { id: Date.now().toString() + '6', descripcion: 'Costo del Combustible', cantidad: 1, precioUnitario: 0, verificadoTrackeo: false },
    ]);
  };

  const handleAddGasto = () => {
    setGastosDetalle([...gastosDetalle, { id: Date.now().toString(), descripcion: '', cantidad: 1, precioUnitario: 0, verificadoTrackeo: false }]);
  };

  const handleUpdateGasto = (id: string, field: string, value: any) => {
    setGastosDetalle(gastosDetalle.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleRemoveGasto = (id: string) => {
    setGastosDetalle(gastosDetalle.filter(g => g.id !== id));
  };

  const handleAddTrabajoPactado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrabajo || !newPactadoNombre.trim()) return;

    const tagsArray = newPactadoTags.split(',').map(t => t.trim()).filter(t => t);
    const newPactado = {
      id: Date.now().toString(),
      nombre: newPactadoNombre,
      foto: newPactadoFoto || `https://picsum.photos/seed/${Date.now()}/100/100`,
      tags: tagsArray
    };

    const updatedPactados = [...(selectedTrabajo.trabajosPactados || []), newPactado];
    await updatePortfolioInDB(selectedTrabajo.id, { trabajosPactados: updatedPactados });
    setSelectedTrabajo({ ...selectedTrabajo, trabajosPactados: updatedPactados });

    setNewPactadoNombre('');
    setNewPactadoFoto('');
    setNewPactadoTags('');
    setIsTrabajoPactadoModalOpen(false);
    displayToast('Trabajo pactado agregado');
  };

  const handleRemoveTrabajoPactado = async (pactadoId: string) => {
    if (!selectedTrabajo) return;
    
    const updatedPactados = (selectedTrabajo.trabajosPactados || []).filter((p: any) => p.id !== pactadoId);
    await updatePortfolioInDB(selectedTrabajo.id, { trabajosPactados: updatedPactados });
    setSelectedTrabajo({ ...selectedTrabajo, trabajosPactados: updatedPactados });
  };

  const handleOpenPactadoDetail = (pactado: any) => {
    setSelectedPactado(pactado);
    setIsPactadoDetailModalOpen(true);
  };

  const handleAddPactadoArchivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrabajo || !selectedPactado) return;

    const newArchivo = {
      id: Date.now().toString(),
      nombre: newPactadoArchivoNombre,
      url: newPactadoArchivoUrl
    };

    const updatedPactado = {
      ...selectedPactado,
      archivos: [...(selectedPactado.archivos || []), newArchivo]
    };

    const updatedPactados = (selectedTrabajo.trabajosPactados || []).map((p: any) => p.id === selectedPactado.id ? updatedPactado : p);
    await updatePortfolioInDB(selectedTrabajo.id, { trabajosPactados: updatedPactados });
    
    setSelectedTrabajo({ ...selectedTrabajo, trabajosPactados: updatedPactados });
    setSelectedPactado(updatedPactado);

    setNewPactadoArchivoNombre('');
    setNewPactadoArchivoUrl('');
    displayToast('Archivo agregado');
  };

  const handleAddPactadoHistorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrabajo || !selectedPactado) return;

    const newHistorial = {
      id: Date.now().toString(),
      fecha: new Date().toLocaleDateString('es-AR'),
      descripcion: newPactadoHistorial
    };

    const updatedPactado = {
      ...selectedPactado,
      historial: [...(selectedPactado.historial || []), newHistorial]
    };

    const updatedPactados = (selectedTrabajo.trabajosPactados || []).map((p: any) => p.id === selectedPactado.id ? updatedPactado : p);
    await updatePortfolioInDB(selectedTrabajo.id, { trabajosPactados: updatedPactados });
    
    setSelectedTrabajo({ ...selectedTrabajo, trabajosPactados: updatedPactados });
    setSelectedPactado(updatedPactado);

    setNewPactadoHistorial('');
    displayToast('Suceso agregado al historial');
  };

  const handleExportPactadoPDF = async () => {
    if (!selectedPactado) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`Trabajo Pactado: ${selectedPactado.nombre}`, 20, 20);

      doc.setFontSize(12);
      doc.text(`Tags: ${(selectedPactado.tags || []).join(', ')}`, 20, 30);

      doc.setFontSize(16);
      doc.text('Historial de Sucesos:', 20, 50);

      let y = 60;
      doc.setFontSize(12);
      if (selectedPactado.historial && selectedPactado.historial.length > 0) {
        selectedPactado.historial.forEach((h: any) => {
          doc.text(`- ${h.fecha}: ${h.descripcion}`, 20, y);
          y += 10;
        });
      } else {
        doc.text('No hay historial registrado.', 20, y);
      }

      doc.save(`Trabajo_Pactado_${selectedPactado.nombre.replace(/\s+/g, '_')}.pdf`);
      displayToast('PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      displayToast('Error al exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('pdf-presupuesto-content');
      if (!element) return;

      element.style.display = 'block';

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const fileName = `Presupuesto_${selectedTrabajo.titulo.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      const newFile = {
        id: Date.now().toString(),
        name: fileName,
        type: 'pdf',
        size: '1.2 MB',
        date: 'Justo ahora'
      };
      const currentFiles = JSON.parse(localStorage.getItem('archivo_recent_files') || '[]');
      localStorage.setItem('archivo_recent_files', JSON.stringify([newFile, ...currentFiles]));

      displayToast('PDF exportado y guardado en Archivo');
    } catch (error) {
      console.error('Error generating PDF:', error);
      displayToast('Error al generar el PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPortfolio = portfolioData.filter((item: any) => {
    const matchesSearch = (item.titulo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.ubicacion?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.cliente?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter ? item.categoria === selectedFilter || item.estado === selectedFilter : true;
    return matchesSearch && matchesFilter;
  });

  const filteredAnotaciones = anotacionesData.filter((item: any) => {
    const matchesSearch = (item.titulo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.contenido?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter ? item.categoria === selectedFilter : true;
    return matchesSearch && matchesFilter;
  });

  if (selectedTrabajo) {
    const tiempoTranscurrido = () => {
      if (!selectedTrabajo.fechaInicio) return 0;
      const inicio = new Date(selectedTrabajo.fechaInicio);
      const hoy = new Date();
      const diffTime = Math.abs(hoy.getTime() - inicio.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const diasTranscurridos = tiempoTranscurrido();

    return (
      <>
        <header className="bg-white rounded-2xl p-4 shadow-sm border border-[#3A5F4B]/10 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#3A5F4B]/10 p-2 rounded-lg text-[#3A5F4B]">
                <ImageIcon size={24} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Trabajos & Proyectos</h1>
            </div>
            <button className="size-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <User size={20} />
            </button>
          </div>
        </header>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedTrabajo(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{selectedTrabajo.titulo}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {selectedTrabajo.ubicacion}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{selectedTrabajo.cliente}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    selectedTrabajo.estado === 'Completado' ? "bg-green-100 text-green-700" :
                      selectedTrabajo.estado === 'En Proceso' ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                  )}>
                    {selectedTrabajo.estado}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                localStorage.setItem('inventario_search_query', selectedTrabajo.cliente || selectedTrabajo.titulo);
                navigate('/inventario');
              }}
              className="w-full sm:w-auto bg-[#3A5F4B]/10 text-[#3A5F4B] px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-[#3A5F4B]/20 transition-colors shadow-sm ml-0 sm:ml-4 border border-[#3A5F4B]/20"
            >
              <Package size={20} />
              <span>Ver Inventario Asignado</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-[#3A5F4B]" />
                  Análisis de Rendimiento
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <DollarSign size={16} />
                      <span className="text-sm font-medium">Gastos Totales</span>
                    </div>
                    <div className="text-xl font-bold text-gray-800">${gastosToUse.toLocaleString('es-AR')}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <TrendingUp size={16} />
                      <span className="text-sm font-medium">Rentabilidad</span>
                    </div>
                    <div className="text-xl font-bold text-green-700">{selectedTrabajo.rentabilidad || 0}%</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">Gasto Distancia</span>
                    </div>
                    <div className="text-xl font-bold text-orange-700">${(selectedTrabajo.gastoDistancia || 0).toLocaleString('es-AR')}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <ClockIcon size={16} />
                      <span className="text-sm font-medium">Tiempo Transcurrido</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700">{diasTranscurridos} días</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Relación Tiempo / Rentabilidad</h3>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#3A5F4B] h-full transition-all duration-500"
                      style={{ width: `${Math.min(selectedTrabajo.rentabilidad || 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>0%</span>
                    <span>Objetivo: 40%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Desglose de Gastos */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText size={20} className="text-[#3A5F4B]" />
                    Desglose de Gastos
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={cargarPlantillaJardineria} className="text-xs bg-[#3A5F4B]/10 text-[#3A5F4B] px-3 py-2 rounded-lg font-bold hover:bg-[#3A5F4B]/20 transition-colors">
                      Plantilla Jardinería
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="text-xs bg-gray-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors flex items-center gap-1">
                      <Download size={14} /> {isExporting ? 'Exportando...' : 'Exportar PDF'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {gastosDetalle.map((gasto) => (
                    <div key={gasto.id} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-[#3A5F4B]/10">
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            value={gasto.descripcion}
                            onChange={(e) => handleUpdateGasto(gasto.id, 'descripcion', e.target.value)}
                            placeholder="Descripción del ítem"
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#3A5F4B] bg-white"
                          />
                        </div>
                        <div className="w-full sm:w-24">
                          <input
                            type="number"
                            value={gasto.cantidad}
                            onChange={(e) => handleUpdateGasto(gasto.id, 'cantidad', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Cant."
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#3A5F4B] bg-white"
                          />
                        </div>
                        <div className="w-full sm:w-32 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            value={gasto.precioUnitario}
                            onChange={(e) => handleUpdateGasto(gasto.id, 'precioUnitario', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Precio Unit."
                            className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#3A5F4B] bg-white"
                          />
                        </div>
                        <div className="w-full sm:w-24 text-right font-bold text-gray-700 text-sm">
                          ${((Number(gasto.cantidad) || 0) * (Number(gasto.precioUnitario) || 0)).toLocaleString('es-AR')}
                        </div>
                        <button onClick={() => handleRemoveGasto(gasto.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {(gasto.descripcion?.toLowerCase() || '').includes('combustible') && (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            id={`trackeo-${gasto.id}`}
                            checked={gasto.verificadoTrackeo || false}
                            onChange={(e) => handleUpdateGasto(gasto.id, 'verificadoTrackeo', e.target.checked)}
                            className="rounded text-[#3A5F4B] focus:ring-[#3A5F4B]"
                          />
                          <label htmlFor={`trackeo-${gasto.id}`} className="text-xs text-gray-600 cursor-pointer">
                            Verificado según trackeo de combustible
                          </label>
                        </div>
                      )}
                    </div>
                  ))}

                  <button onClick={handleAddGasto} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium hover:border-[#3A5F4B]/50 hover:text-[#3A5F4B] transition-colors flex items-center justify-center gap-2 text-sm">
                    <Plus size={16} /> Agregar Ítem
                  </button>
                </div>

                {gastosDetalle.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <div className="text-right">
                      <span className="text-sm text-gray-500 mr-4">Total Desglose:</span>
                      <span className="text-xl font-bold text-[#3A5F4B]">${gastosToUse.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Configurar Métricas</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gastos Totales ($)</label>
                    <input
                      type="number"
                      value={gastosDetalle.length > 0 ? gastosToUse : metricsForm.gastos}
                      onChange={e => setMetricsForm({ ...metricsForm, gastos: e.target.value === '' ? '' : Number(e.target.value) })}
                      disabled={gastosDetalle.length > 0}
                      className={cn("w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none", gastosDetalle.length > 0 && "bg-gray-100 text-gray-500")}
                    />
                    {gastosDetalle.length > 0 && <p className="text-xs text-gray-500 mt-1">Calculado automáticamente desde el desglose.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rentabilidad Estimada (%)</label>
                    <input
                      type="number"
                      value={metricsForm.rentabilidad}
                      onChange={e => setMetricsForm({ ...metricsForm, rentabilidad: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gasto de Distancia ($)</label>
                    <input
                      type="number"
                      value={metricsForm.gastoDistancia}
                      onChange={e => setMetricsForm({ ...metricsForm, gastoDistancia: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={metricsForm.fechaInicio}
                      onChange={e => setMetricsForm({ ...metricsForm, fechaInicio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveMetrics}
                    className="w-full flex items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2d4a3a] transition-colors mt-4"
                  >
                    <Save size={18} /> Guardar Métricas
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden">
                <img src={selectedTrabajo.img} alt={selectedTrabajo.titulo} className="w-full h-48 object-cover" />
              </div>
            </div>
          </div>

          {/* Trabajos Pactados */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Trabajos Pactados con el Cliente</h2>
              <button
                onClick={() => setIsTrabajoPactadoModalOpen(true)}
                className="text-sm bg-[#3A5F4B]/10 text-[#3A5F4B] px-3 py-2 rounded-lg font-bold hover:bg-[#3A5F4B]/20 transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> Agregar Trabajo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTrabajo.trabajosPactados && selectedTrabajo.trabajosPactados.length > 0 ? (
                selectedTrabajo.trabajosPactados.map((pactado: any) => (
                  <div key={pactado.id} className="bg-gray-50 rounded-xl border border-[#3A5F4B]/10 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenPactadoDetail(pactado)}>
                    <div className="h-32 relative">
                      <img src={pactado.foto} alt={pactado.nombre} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveTrabajoPactado(pactado.id); }}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors backdrop-blur-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-800 mb-2">{pactado.nombre}</h3>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {pactado.tags && pactado.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No hay trabajos pactados registrados.
                </div>
              )}
            </div>
          </div>

          {/* Hidden PDF Template */}
          <div id="pdf-presupuesto-content" style={{ display: 'none', width: '800px', padding: '40px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '2px solid #3A5F4B', paddingBottom: '10px', marginBottom: '20px', color: '#1f2937' }}>
              Presupuesto de Obra: {selectedTrabajo.titulo}
            </h1>
            <div style={{ marginBottom: '30px', color: '#4b5563', fontSize: '14px' }}>
              <p style={{ marginBottom: '5px' }}><strong style={{ color: '#1f2937' }}>Cliente:</strong> {selectedTrabajo.cliente}</p>
              <p style={{ marginBottom: '5px' }}><strong style={{ color: '#1f2937' }}>Ubicación:</strong> {selectedTrabajo.ubicacion}</p>
              <p style={{ marginBottom: '5px' }}><strong style={{ color: '#1f2937' }}>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left', color: '#374151' }}>Descripción</th>
                  <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#374151' }}>Cant.</th>
                  <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#374151' }}>Precio Unit.</th>
                  <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#374151' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {gastosDetalle.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#4b5563' }}>{item.descripcion}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563' }}>{item.cantidad}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#4b5563' }}>${item.precioUnitario.toLocaleString('es-AR')}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#1f2937', fontWeight: '500' }}>${((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)).toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold', color: '#1f2937' }}>Total Gastos:</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold', color: '#3A5F4B', fontSize: '16px' }}>${gastosToUse.toLocaleString('es-AR')}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', textAlign: 'center' }}>
              Documento generado automáticamente por el sistema de gestión.
            </div>
          </div>
        </div>
      </>
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Trabajos</h1>
        {activeTab !== 'mapa' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#3A5F4B] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2d4a3a] transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            <span>{activeTab === 'portfolio' ? 'Nuevo Trabajo' : 'Nueva Anotación'}</span>
          </button>
        )}
      </div>

      {/* Buscador y Título de Sección */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3A5F4B] transition-colors w-5 h-5" />
          <input
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none transition-all shadow-sm"
            placeholder={activeTab === 'portfolio' ? "Buscar trabajos, clientes o ubicaciones..." : "Buscar en anotaciones y bitácora..."}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-2 md:pb-0 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              activeTab === 'portfolio' ? "bg-[#3A5F4B] text-white shadow-md shadow-[#3A5F4B]/20" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            Portfolio & Seguimiento
          </button>
          <button
            onClick={() => setActiveTab('anotaciones')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              activeTab === 'anotaciones' ? "bg-[#3A5F4B] text-white shadow-md shadow-[#3A5F4B]/20" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            Anotaciones / Bitácora
          </button>
          <button
            onClick={() => setActiveTab('calendario')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              activeTab === 'calendario' ? "bg-[#3A5F4B] text-white shadow-md shadow-[#3A5F4B]/20" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            Calendario
          </button>
          <button
            onClick={() => setActiveTab('mapa')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              activeTab === 'mapa' ? "bg-[#3A5F4B] text-white shadow-md shadow-[#3A5F4B]/20" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            Vista Mapa
          </button>
        </div>
      </div>
      {/* Toolbar y Filtros */}
      {activeTab !== 'mapa' && activeTab !== 'calendario' && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center justify-center gap-2 border px-4 py-2 rounded-xl font-bold text-sm transition-all",
                showFilters ? "bg-[#3A5F4B] text-white shadow-md shadow-[#3A5F4B]/20 border-transparent" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {/* Filtros Desplegables */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-[#3A5F4B]/10 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => setSelectedFilter(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  selectedFilter === null ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                )}
              >
                Todos
              </button>
              {activeTab === 'portfolio' ? (
                <>
                  <span className="text-sm text-gray-400 py-1.5 px-2">|</span>
                  {['Diseño', 'Instalación', 'Mantenimiento', 'Obra'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        selectedFilter === cat ? "bg-[#3A5F4B] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                  <span className="text-sm text-gray-400 py-1.5 px-2">|</span>
                  {['Planificación', 'En Proceso', 'Activo', 'Completado'].map(estado => (
                    <button
                      key={estado}
                      onClick={() => setSelectedFilter(estado)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        selectedFilter === estado ? "bg-[#3A5F4B] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {estado}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-400 py-1.5 px-2">|</span>
                  {Array.from(new Set(anotacionesData.map(a => a.categoria))).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        selectedFilter === cat ? "bg-[#3A5F4B] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {activeTab === 'portfolio' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPortfolio.map(item => (
            <div key={item.id} onClick={() => handleOpenDetails(item)} className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden hover:shadow-md hover:border-[#3A5F4B]/30 transition-all group cursor-pointer flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img
                  src={item.img}
                  alt={item.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-800">
                    {item.categoria}
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOptionsItem(item); setOptionsType('portfolio'); }}
                      className="bg-white/90 backdrop-blur-sm p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{item.titulo}</h3>
                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                  <MapPin size={14} /> {item.ubicacion || 'Sin ubicación'} • {item.cliente}
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    item.estado === 'Completado' ? "bg-green-100 text-green-700" :
                      item.estado === 'En Proceso' ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                  )}>
                    {item.estado}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} /> {item.fecha}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'calendario' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
            <div className="flex items-center gap-3">
              <a 
                href="https://calendar.google.com/calendar/r" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-[#1a2234] text-white hover:bg-[#202b3c] px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Calendar size={16} />
                Sincronizar Calendar
              </a>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-600 shadow-sm">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 hover:bg-white rounded-lg transition-colors text-sm font-semibold text-gray-700 shadow-sm">
                  Hoy
                </button>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-600 shadow-sm">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
            {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) }).map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayJobs = portfolioData.filter(job => job.fechaInicio === dateStr);
              return (
                <div key={date.toString()} className={cn("min-h-[100px] bg-white p-2 relative transition-colors hover:bg-gray-50", !isSameMonth(date, currentDate) && "text-gray-400 bg-gray-50", isToday(date) && "bg-blue-50/30")}>
                  <div className={cn("text-sm font-semibold mb-1 flex items-center justify-center w-6 h-6 rounded-full", isToday(date) ? "bg-[#3A5F4B] text-white" : "")}>
                    {format(date, 'd')}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {dayJobs.map((job: any) => (
                      <div key={job.id} onClick={() => handleOpenDetails(job)} className={cn("text-xs px-1.5 py-1 rounded truncate cursor-pointer font-medium hover:opacity-80 transition-opacity", job.estado === 'Completado' ? "bg-green-100 text-green-700" : job.estado === 'En Proceso' ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700")} title={job.titulo}>
                        {job.titulo}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'mapa' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden h-[600px] relative z-0">
          <div className="absolute top-4 left-4 z-[400] bg-white rounded-lg shadow-md p-3 w-[calc(100%-2rem)] max-w-sm">
            <div className="mb-2 text-xs text-gray-500 font-medium">
              Ingrese: Calle, Número, Ciudad, Provincia, País
            </div>
            <form onSubmit={handleMapSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ej: Av. Libertador 1000, Buenos Aires, Argentina"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingMap}
                className="px-4 py-2 bg-[#3A5F4B] text-white rounded-lg hover:bg-[#2d4a3a] transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSearchingMap ? '...' : 'Buscar'}
              </button>
            </form>
          </div>
          <MapContainer
            center={[-34.5000, -58.5000]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <MapUpdater center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapCenter && (
              <Marker position={mapCenter} icon={redDotIcon}>
                <Popup>
                  <div className="text-sm font-medium text-gray-800">Ubicación buscada</div>
                </Popup>
              </Marker>
            )}
            {portfolioData.map(item => {
              const lat = item.lat != null ? item.lat : -34.6037;
              const lng = item.lng != null ? item.lng : -58.3816;
              return (
                <Marker
                  key={item.id}
                  position={[lat, lng]}
                  icon={createCustomIcon(item.img)}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px]">
                      <img src={item.img} alt={item.titulo} className="w-full h-32 object-cover rounded-lg mb-3" />
                      <h3 className="font-bold text-gray-800 text-sm mb-1">{item.titulo}</h3>
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <MapPin size={12} /> {item.ubicacion || 'Sin ubicación'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          item.estado === 'Completado' ? "bg-green-100 text-green-700" :
                            item.estado === 'En Proceso' ? "bg-blue-100 text-blue-700" :
                              "bg-yellow-100 text-yellow-700"
                        )}>
                          {item.estado}
                        </span>
                        <button
                          onClick={() => handleOpenDetails(item)}
                          className="text-xs font-bold text-[#3A5F4B] hover:underline"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnotaciones.map((nota: any) => {
            const isExpanded = expandedNoteId === nota.id;
            return (
              <div
                key={nota.id}
                className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 p-5 hover:shadow-md hover:border-[#3A5F4B]/30 transition-all relative overflow-hidden cursor-pointer"
                onClick={() => setExpandedNoteId(isExpanded ? null : nota.id)}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#3A5F4B]" />
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                    {nota.categoria}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} /> {nota.fecha}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOptionsItem(nota); setOptionsType('anotaciones'); }}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{nota.titulo}</h3>
                <div className={cn(
                  "text-sm text-gray-600 leading-relaxed transition-all duration-300",
                  !isExpanded && "line-clamp-3"
                )}>
                  {nota.contenido}
                </div>
                {nota.tags && nota.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                    {nota.tags.map((tag: any) => {
                      const TagIcon = getIconComponent(tag.icon);
                      const TagContent = (
                        <span className="inline-flex items-center gap-1 bg-[#3A5F4B]/10 text-[#3A5F4B] text-xs font-bold px-2 py-1 rounded-md hover:bg-[#3A5F4B]/20 transition-colors cursor-pointer">
                          <TagIcon size={12} />
                          {tag.name}
                        </span>
                      );

                      return tag.link ? (
                        <a key={tag.id} href={tag.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                          {TagContent}
                        </a>
                      ) : (
                        <span key={tag.id} onClick={e => e.stopPropagation()}>
                          {TagContent}
                        </span>
                      );
                    })}
                  </div>
                )}
                {!isExpanded && nota.contenido.length > 100 && (
                  <div className="text-xs font-bold text-[#3A5F4B] mt-2">Ver más...</div>
                )}
              </div>
            );
          })}
          {filteredAnotaciones.length === 0 && (
            <div className="text-center py-10 text-gray-500 col-span-full">
              No se encontraron anotaciones.
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        title="Marcar Ubicación"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Haz clic en el mapa para marcar la ubicación exacta del trabajo.</p>
          <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200">
            <MapContainer
              center={[-34.5000, -58.5000]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker
                position={isModalOpen ? (newLat && newLng ? [newLat, newLng] : null) : (editLat && editLng ? [editLat, editLng] : null)}
                setPosition={(pos) => {
                  if (isModalOpen) {
                    setNewLat(pos[0]);
                    setNewLng(pos[1]);
                  } else {
                    setEditLat(pos[0]);
                    setEditLng(pos[1]);
                  }
                }}
              />
            </MapContainer>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsMapPickerOpen(false)}
              className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'portfolio' ? "Nuevo Trabajo" : "Nueva Anotación"}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              placeholder="Ej: Medidas Deck"
            />
          </div>
          {activeTab === 'portfolio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Tag Inteligente)</label>
                <select
                  value={newCliente}
                  onChange={e => {
                    setNewCliente(e.target.value);
                    const selectedClient = clientesData.find((c: any) => c.name === e.target.value);
                    if (selectedClient && selectedClient.location) {
                      setNewUbicacion(selectedClient.location);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none bg-white"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesData.map((client: any) => (
                    <option key={client.id} value={client.name}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación GPS (Editable)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUbicacion}
                    onChange={e => setNewUbicacion(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                    placeholder="Ej: Nordelta, San Isidro..."
                  />
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
                    title="Marcar en mapa"
                  >
                    <MapPin size={20} />
                  </button>
                </div>
                {newLat && newLng && (
                  <p className="text-xs text-slate-500 mt-1">Coordenadas: {newLat.toFixed(4)}, {newLng.toFixed(4)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Trabajo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageUpload(e, setNewImg)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3A5F4B]/10 file:text-[#3A5F4B] hover:file:bg-[#3A5F4B]/20"
                />
                {newImg && (
                  <div className="mt-2 h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img src={newImg} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </>
          )}
          {activeTab === 'anotaciones' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
              <textarea
                required
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none resize-none"
                placeholder="Escribe los detalles aquí..."
              />
              {renderTagEditor(newTags, setNewTags)}
            </div>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={editType === 'portfolio' ? "Editar Trabajo" : "Editar Anotación"}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
            />
          </div>
          {editType === 'portfolio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Tag Inteligente)</label>
                <select
                  value={editCliente}
                  onChange={e => {
                    setEditCliente(e.target.value);
                    const selectedClient = clientesData.find((c: any) => c.name === e.target.value);
                    if (selectedClient && selectedClient.location) {
                      setEditUbicacion(selectedClient.location);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none bg-white"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesData.map((client: any) => (
                    <option key={client.id} value={client.name}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación GPS (Editable)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editUbicacion}
                    onChange={e => setEditUbicacion(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
                    placeholder="Ej: Nordelta, San Isidro..."
                  />
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
                    title="Marcar en mapa"
                  >
                    <MapPin size={20} />
                  </button>
                </div>
                {editLat && editLng && (
                  <p className="text-xs text-slate-500 mt-1">Coordenadas: {editLat.toFixed(4)}, {editLng.toFixed(4)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Trabajo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageUpload(e, setEditImg)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3A5F4B]/10 file:text-[#3A5F4B] hover:file:bg-[#3A5F4B]/20"
                />
                {editImg && (
                  <div className="mt-2 h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img src={editImg} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </>
          )}
          {editType === 'anotaciones' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
              <textarea
                required
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none resize-none"
              />
              {renderTagEditor(editTags, setEditTags)}
            </div>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
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
        isOpen={!!optionsItem}
        onClose={() => setOptionsItem(null)}
        title={optionsType === 'portfolio' ? "Opciones del Trabajo" : "Opciones de la Anotación"}
      >
        <div className="space-y-3">
          <button
            onClick={() => handleEditClick(optionsItem, optionsType!)}
            className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
          >
            <Edit2 size={20} className="text-gray-500" /> Editar {optionsType === 'portfolio' ? 'Trabajo' : 'Anotación'}
          </button>
          <button
            onClick={() => handleDelete(optionsItem?.id, optionsType!)}
            className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors font-medium text-red-600"
          >
            <Trash2 size={20} /> Eliminar {optionsType === 'portfolio' ? 'Trabajo' : 'Anotación'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isTrabajoPactadoModalOpen}
        onClose={() => setIsTrabajoPactadoModalOpen(false)}
        title="Agregar Trabajo Pactado"
      >
        <form onSubmit={handleAddTrabajoPactado} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Trabajo</label>
            <input
              type="text"
              required
              value={newPactadoNombre}
              onChange={e => setNewPactadoNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              placeholder="Ej: Nivelación de terreno"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto (Opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => handleImageUpload(e, setNewPactadoFoto)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3A5F4B]/10 file:text-[#3A5F4B] hover:file:bg-[#3A5F4B]/20"
            />
            {newPactadoFoto && (
              <div className="mt-2 h-32 rounded-lg overflow-hidden border border-gray-200">
                <img src={newPactadoFoto} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags Sugeridos (separados por coma)</label>
            <input
              type="text"
              value={newPactadoTags}
              onChange={e => setNewPactadoTags(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3A5F4B]/20 focus:border-[#3A5F4B] outline-none"
              placeholder="Ej: tierra, maquinaria, riego"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsTrabajoPactadoModalOpen(false)}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors"
            >
              Agregar Trabajo
            </button>
          </div>
        </form>
      </Modal>

      {/* Pactado Detail Modal */}
      {isPactadoDetailModalOpen && selectedPactado && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95">
            <div className="sticky top-0 bg-white border-b border-[#3A5F4B]/10 p-4 flex justify-between items-center z-10">
              <h3 className="font-bold text-gray-900 text-lg">{selectedPactado.nombre}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPactadoPDF}
                  disabled={isExporting}
                  className="p-2 text-gray-500 hover:text-[#3A5F4B] hover:bg-[#3A5F4B]/10 rounded-lg transition-colors"
                  title="Exportar PDF"
                >
                  <Download size={20} className={isExporting ? "animate-pulse" : ""} />
                </button>
                <button onClick={() => setIsPactadoDetailModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Archivos */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-[#3A5F4B]" /> Archivos Correspondientes
                </h4>
                <div className="space-y-3 mb-4">
                  {selectedPactado.archivos && selectedPactado.archivos.length > 0 ? (
                    selectedPactado.archivos.map((archivo: any) => (
                      <div key={archivo.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-[#3A5F4B]/10">
                        <span className="text-sm font-medium text-gray-700">{archivo.nombre}</span>
                        {archivo.url && (
                          <a href={archivo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3A5F4B] hover:underline">
                            Ver Archivo
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay archivos adjuntos.</p>
                  )}
                </div>
                <form onSubmit={handleAddPactadoArchivo} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del archivo"
                    value={newPactadoArchivoNombre}
                    onChange={e => setNewPactadoArchivoNombre(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#3A5F4B]"
                    required
                  />
                  <input
                    type="url"
                    placeholder="URL (opcional)"
                    value={newPactadoArchivoUrl}
                    onChange={e => setNewPactadoArchivoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#3A5F4B]"
                  />
                  <button type="submit" className="bg-[#3A5F4B] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d4a3a]">
                    Agregar
                  </button>
                </form>
              </div>

              {/* Historial de Sucesos */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ClockIcon size={18} className="text-[#3A5F4B]" /> Historial de Sucesos
                </h4>
                <div className="space-y-3 mb-4">
                  {selectedPactado.historial && selectedPactado.historial.length > 0 ? (
                    selectedPactado.historial.map((suceso: any) => (
                      <div key={suceso.id} className="bg-gray-50 p-3 rounded-xl border border-[#3A5F4B]/10">
                        <span className="text-xs text-gray-500 font-medium block mb-1">{suceso.fecha}</span>
                        <p className="text-sm text-gray-700">{suceso.descripcion}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay sucesos registrados.</p>
                  )}
                </div>
                <form onSubmit={handleAddPactadoHistorial} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="¿Qué se hizo?"
                    value={newPactadoHistorial}
                    onChange={e => setNewPactadoHistorial(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#3A5F4B]"
                    required
                  />
                  <button type="submit" className="bg-[#3A5F4B] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d4a3a]">
                    Registrar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
