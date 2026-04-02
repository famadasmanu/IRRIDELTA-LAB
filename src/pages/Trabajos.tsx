import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Plus, Image as ImageIcon, FileText, Trash2, MoreVertical, Edit2, ArrowLeft, TrendingUp, DollarSign, Clock as ClockIcon, Activity, Save, Download, Check, Map as MapIcon, X, Tag, User, Link as LinkIcon, Package, Folder, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/Modal';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useCompanyConfig } from '../hooks/useCompanyConfig';
import { useDataMining } from '../hooks/useDataMining';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrdenesTab } from './trabajos/OrdenesTab';


const createCustomIcon = (imgUrl: string) => {
    return L.divIcon({
        className: 'custom-pin',
        html: `<div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 3px solid #059669; box-shadow: 0 4px 10px rgba(0,0,0,0.3); background-color: white;"><img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`,
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


export default function Trabajos() {
    const [companyData] = useCompanyConfig();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { trackPresupuesto } = useDataMining();
    
    React.useEffect(() => {
        if (searchParams.get('action') === 'new') {
             // Delay modal opening slightly to ensure state is ready
             setTimeout(() => setIsModalOpen(true), 100);
        }
    }, [searchParams]);

    const [activeDetailTab, setActiveDetailTab] = useState<'pactados' | 'inventario' | 'ordenes'>('pactados');
    const [currentDate, setCurrentDate] = useState(new Date());
    const { data: portfolioRaw, add: addPortfolioToDB, remove: removePortfolioFromDB, update: updatePortfolioInDB } = useFirestoreCollection<any>('trabajos_portfolio');
    const portfolioData = portfolioRaw;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newImg, setNewImg] = useState('');
    const [newUbicacion, setNewUbicacion] = useState('');
    const [newCliente, setNewCliente] = useState('');
    const [newLat, setNewLat] = useState<number | null>(null);
    const [newLng, setNewLng] = useState<number | null>(null);
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

    const [optionsItem, setOptionsItem] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editImg, setEditImg] = useState('');
    const [editUbicacion, setEditUbicacion] = useState('');
    const [editCliente, setEditCliente] = useState('');
    const [editLat, setEditLat] = useState<number | null>(null);
    const [editLng, setEditLng] = useState<number | null>(null);

    const [selectedTrabajo, setSelectedTrabajo] = useState<any>(null);
    const [metricsForm, setMetricsForm] = useState<{ gastos: number | string, rentabilidad: number | string, gastoDistancia: number | string, fechaInicio: string, estado: string }>({ gastos: '', rentabilidad: '', gastoDistancia: '', fechaInicio: '', estado: 'En Proceso' });
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
    const { data: invData, add: addInv, update: updateInv } = useFirestoreCollection<any>('inventario_generales');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

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
            rentabilidad: 50,
            tiempoDias: 0,
            gastoDistancia: 0,
            trabajosPactados: [],
            insumosUsados: [],
            lat,
            lng
        });

        setNewTitle('');
        setNewImg('');
        setNewUbicacion('');
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        await removePortfolioFromDB(id);
        setOptionsItem(null);
    };

    const handleEditClick = (item: any) => {
        setEditingItem(item);
        setEditTitle(item.titulo);
        setEditImg(item.img);
        setEditUbicacion(item.ubicacion || '');
        setEditCliente(item.cliente || '');
        setEditLat(item.lat || null);
        setEditLng(item.lng || null);
        setOptionsItem(null);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTitle.trim() || !editingItem) return;

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

        setEditingItem(null);
    };

    const handleOpenDetails = (trabajo: any) => {
        setSelectedTrabajo(trabajo);
        setMetricsForm({
            gastos: trabajo.gastos || '',
            rentabilidad: trabajo.rentabilidad !== undefined && trabajo.rentabilidad !== '' ? trabajo.rentabilidad : 50,
            gastoDistancia: trabajo.gastoDistancia || '',
            fechaInicio: trabajo.fechaInicio || new Date().toISOString().split('T')[0],
            estado: trabajo.estado || 'En Proceso'
        });
        setGastosDetalle(trabajo.gastosDetalle || []);
    };

    const gastosToUse = gastosDetalle.length > 0
        ? gastosDetalle.reduce((acc, item) => acc + ((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)), 0)
        : Number(metricsForm.gastos) || 0;

    const handleSaveMetrics = async () => {
        if (!selectedTrabajo) return;

        const id = selectedTrabajo.id;

        const currentChecklist = selectedTrabajo.checklist || [];
        const existingChecklistNames = new Set(currentChecklist.map((i: any) => i.text?.toLowerCase().trim()));
        const newChecklistItems = gastosDetalle.filter(g => !existingChecklistNames.has((g.descripcion || '').toLowerCase().trim())).map(g => ({
            id: Date.now() + Math.random(),
            text: g.descripcion,
            qty: g.cantidad || 1,
            isChecked: false
        }));

        const currentAssigned = selectedTrabajo.assignedItems || [];
        const existingAssignedNames = new Set(currentAssigned.map((i: any) => i.name?.toLowerCase().trim()));
        const newAssignedItems = gastosDetalle.filter(g => !existingAssignedNames.has((g.descripcion || '').toLowerCase().trim())).map(g => ({
            id: Date.now() + Math.random(),
            name: g.descripcion,
            qty: g.cantidad || 1
        }));

        const updateData: any = {
            gastos: gastosToUse,
            rentabilidad: Number(metricsForm.rentabilidad) || 0,
            gastoDistancia: Number(metricsForm.gastoDistancia) || 0,
            fechaInicio: metricsForm.fechaInicio,
            estado: metricsForm.estado,
            gastosDetalle: gastosDetalle,
            checklist: [...currentChecklist, ...newChecklistItems],
            assignedItems: [...currentAssigned, ...newAssignedItems]
        };

        if (metricsForm.estado === 'Completado' && !selectedTrabajo.fechaFinalizacion) {
            updateData.fechaFinalizacion = new Date().toISOString().split('T')[0];
        }

        await updatePortfolioInDB(id, updateData);

        setSelectedTrabajo({ ...selectedTrabajo, ...updateData });
        
        // Tracking Invisible B2B: Intención de Presupuesto
        if (gastosDetalle.length > 0) {
            trackPresupuesto(gastosDetalle, selectedTrabajo.ubicacion || 'General');
        }

        displayToast('Métricas e Inventario vinculados y guardados');
    };

    const handleSyncStockToGlobal = async () => {
        if (!selectedTrabajo) {
            alert("No hay trabajo seleccionado.");
            return;
        }
        
        if (gastosDetalle.length === 0) {
            alert("No hay insumos en el desglose para sincronizar.");
            return;
        }

        const clienteObj = clientesData.find((c: any) => c.name === selectedTrabajo.cliente);
        const refClienteId = clienteObj ? clienteObj.id : 'sin-asignar';
        const excludedCategories = ['Mano de Obra', 'Logística', 'Combustible'];
        
        let syncedCount = 0;
        
        // Push items that are NOT in the assigned checklist to the selected project's Items Asignados FIRST
        const currentAssigned = selectedTrabajo.assignedItems || [];
        const existingAssignedNames = new Set(currentAssigned.map((i: any) => i.name?.toLowerCase().trim()));
        const newAssignedItems = gastosDetalle.filter(g => !existingAssignedNames.has((g.descripcion || '').toLowerCase().trim())).map(g => ({
            id: Date.now() + Math.random(),
            name: g.descripcion || 'Item',
            qty: g.cantidad || 1
        }));
        const updatedAssigned = [...currentAssigned, ...newAssignedItems];
        await updatePortfolioInDB(selectedTrabajo.id, { assignedItems: updatedAssigned });
        setSelectedTrabajo({ ...selectedTrabajo, assignedItems: updatedAssigned });

        // Push unique items to inventario_generales
        for (const gasto of gastosDetalle) {
            const cat = gasto.categoria || '';
            if (excludedCategories.includes(cat)) continue;
            
            const matchIng = invData.find((inv: any) => (inv.clienteNombre || '') === (selectedTrabajo.cliente || '') && (inv.nombre || '').toLowerCase().trim() === (gasto.descripcion || '').toLowerCase().trim());
            
            // "no sumamos cantidades individuales sino items": 
            // Esto significa que si el item ya fue creado en el inventario para este proyecto, NO actualizamos las cantidades sumando a ciegas.
            // Solamente creamos el ítem como "lote" si no existía registrado aún para este cliente.
            if (!matchIng) {
                try {
                    await addInv({
                        nombre: gasto.descripcion || 'Item Extr.',
                        cantidad: Number(gasto.cantidad) || 1,
                        unidad: 'Unid',
                        clienteId: refClienteId,
                        clienteNombre: selectedTrabajo.cliente || 'Sin Cliente',
                        categoriaGeneral: cat || 'Insumos',
                        imagenUrl: ''
                    });
                    syncedCount++;
                } catch (e) {
                     console.error("Error adding to inventory:", e);
                }
            }
        }
        
        if (syncedCount > 0) {
            displayToast(`¡Sincronización completa! ${syncedCount} insumos fueron enviados al inventario del cliente.`);
        } else {
            displayToast(`Los insumos ya se encontraban registrados en el inventario del cliente.`);
        }
    };

    const cargarPlantillaJardineria = () => {
        setGastosDetalle([
            { id: Date.now().toString() + '1', descripcion: 'Tierra Negra / Sustrato', cantidad: 1, precioUnitario: 0, marca: 'Otra', categoria: 'Materiales' },
            { id: Date.now().toString() + '2', descripcion: 'Plantas y Árboles', cantidad: 1, precioUnitario: 0, marca: 'Otra', categoria: 'Insumos Vegetales' },
            { id: Date.now().toString() + '3', descripcion: 'Sistema de Riego (Materiales)', cantidad: 1, precioUnitario: 0, marca: 'Rainbird', categoria: 'Materiales Generales' },
            { id: Date.now().toString() + '4', descripcion: 'Mano de Obra', cantidad: 1, precioUnitario: 0, marca: 'Personal', categoria: 'Mano de Obra' },
            { id: Date.now().toString() + '5', descripcion: 'Flete y Logística', cantidad: 1, precioUnitario: 0, marca: 'Personal', categoria: 'Logística' },
            { id: Date.now().toString() + '6', descripcion: 'Costo del Combustible', cantidad: 1, precioUnitario: 0, verificadoTrackeo: false, marca: 'Personal', categoria: 'Logística' },
        ]);
    };

    const handleAddGasto = () => {
        setGastosDetalle([...gastosDetalle, { id: Date.now().toString(), descripcion: '', cantidad: 1, precioUnitario: 0, verificadoTrackeo: false, marca: '', categoria: '' }]);
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

    const pdfImportRef = React.useRef<HTMLInputElement>(null);
    const [isImportingPDF, setIsImportingPDF] = useState(false);

    const handleImportarCostosPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const apiKey = companyData.geminiApiKey;

            if (!apiKey || apiKey.trim().length < 10 || !apiKey.trim().startsWith("AIzaSy")) {
                alert("⚠️ Llave inválida.\n\nPor favor configura tu verdadera Google Gemini API Key (que debe empezar con 'AIzaSy...') en:\nConfiguración -> Empresa -> Integraciones IA.");
                setIsImportingPDF(false);
                return;
            }

            if (apiKey && apiKey.trim().length > 10) {
                setIsImportingPDF(true);
                alert("Iniciando escaneo del PDF con Google IA...");
                
                const fileToBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(f);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                });
                
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
                    try {
                        const cleanJson = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
                        const parsed = JSON.parse(cleanJson);
                        if (Array.isArray(parsed)) {
                            const newGastos = parsed.map((it: any) => ({
                                id: Math.random().toString(),
                                descripcion: it.descripcion || it.desc || it.name || "Item Extraído",
                                cantidad: Number(it.cantidad || it.cant || it.qty || 1),
                                precioUnitario: Number(it.precio || it.costo || it.price || 0),
                                categoria: '',
                                marca: ''
                            }));
                            if (newGastos.length > 0) {
                                const newChecklist = parsed.map((it: any) => ({
                                    id: Math.random(),
                                    text: it.descripcion || it.desc || it.name || "Item Extraído",
                                    qty: Number(it.cantidad || it.cant || it.qty || 1),
                                    isChecked: false
                                }));

                                setGastosDetalle(prev => {
                                    const updated = [...prev, ...newGastos];
                                    if (selectedTrabajo) {
                                        const updatedChecklist = [...(selectedTrabajo.checklist || []), ...newChecklist];
                                        updatePortfolioInDB(selectedTrabajo.id, { 
                                            gastosDetalle: updated,
                                            checklist: updatedChecklist
                                        }).catch(console.error);
                                        setSelectedTrabajo({
                                            ...selectedTrabajo,
                                            gastosDetalle: updated,
                                            checklist: updatedChecklist
                                        });
                                    }
                                    return updated;
                                });
                                alert("✅ ¡IA finalizada! Se añadieron " + newGastos.length + " ítems exactos al desglose y al checklist de pedido.");
                            } else {
                                alert("La IA procesó el documento pero no encontró la tabla correctamente.");
                            }
                        }
                    } catch (e) {
                         console.error("No se pudo parsear json", e);
                         alert("El modelo no devolvió un JSON válido.");
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
        } finally {
            setIsImportingPDF(false);
            if (pdfImportRef.current) pdfImportRef.current.value = '';
        }
    };

    const filteredPortfolio = portfolioData.filter((item: any) => {
        const matchesSearch = (item.titulo?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (item.ubicacion?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (item.cliente?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter ? item.categoria === selectedFilter || item.estado === selectedFilter : true;
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
                <header className="bg-card rounded-2xl p-4 shadow-sm border border-bd-lines mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent/10 p-2 rounded-xl text-accent">
                                <ImageIcon size={24} />
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Trabajos & Proyectos</h1>
                        </div>
                        <button className="size-10 flex items-center justify-center rounded-full bg-main text-tx-secondary">
                            <User size={20} />
                        </button>
                    </div>
                </header>
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedTrabajo(null)}
                                className="p-2 hover:bg-main rounded-full transition-colors shrink-0"
                            >
                                <ArrowLeft size={24} className="text-tx-secondary" />
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">{selectedTrabajo.titulo}</h1>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-tx-secondary">
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
                                setActiveDetailTab('inventario');
                                document.getElementById('detalles-tabs')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full sm:w-auto bg-accent/10 text-accent px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-accent/20 transition-colors shadow-sm ml-0 sm:ml-4 border border-accent/20"
                        >
                            <Package size={20} />
                            <span>Ver Inventario de Obra</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card p-6 rounded-2xl shadow-sm border border-bd-lines">
                                <h2 className="text-lg font-bold text-tx-primary mb-4 flex items-center gap-2">
                                    <Activity size={20} className="text-accent" />
                                    Análisis de Rendimiento
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-main p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 text-tx-secondary mb-2">
                                            <DollarSign size={16} />
                                            <span className="text-sm font-medium">Gastos Totales</span>
                                        </div>
                                        <div className="text-xl font-bold text-tx-primary">${gastosToUse.toLocaleString('es-AR')}</div>
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
                                    <h3 className="text-sm font-bold text-tx-primary uppercase tracking-wider">Relación Tiempo / Rentabilidad</h3>
                                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                        <div
                                            className="bg-accent h-full transition-all duration-500"
                                            style={{ width: `${Math.min(selectedTrabajo.rentabilidad || 0, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-tx-secondary font-medium">
                                        <span>0%</span>
                                        <span>Objetivo: 40%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Desglose de Gastos */}
                            <div className="bg-card p-6 rounded-2xl shadow-sm border border-bd-lines mt-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-lg font-bold text-tx-primary flex items-center gap-2">
                                        <FileText size={20} className="text-accent" />
                                        Desglose de Gastos
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <input type="file" ref={pdfImportRef} onChange={handleImportarCostosPDF} accept=".pdf" className="hidden" />
                                        <button onClick={() => pdfImportRef.current?.click()} disabled={isImportingPDF} className="text-xs bg-indigo-500/10 text-indigo-600 px-3 py-2 rounded-xl font-bold hover:bg-indigo-500/20 transition-colors flex items-center gap-1">
                                            <FileText size={14} /> {isImportingPDF ? 'Leyendo...' : 'Importar PDF'}
                                        </button>
                                        <button onClick={handleSyncStockToGlobal} disabled={gastosDetalle.length === 0} className="text-xs bg-emerald-500/10 text-emerald-600 px-3 py-2 rounded-xl font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                                            <Package size={14} /> Sumar al Inventario
                                        </button>
                                        <button onClick={cargarPlantillaJardineria} className="text-xs bg-accent/10 text-accent px-3 py-2 rounded-xl font-bold hover:bg-accent/20 transition-colors">
                                            Plantilla Jardinería
                                        </button>
                                        <button onClick={handleExportPDF} disabled={isExporting} className="text-xs bg-gray-800 text-white px-3 py-2 rounded-xl font-bold hover:bg-gray-700 transition-colors flex items-center gap-1">
                                            <Download size={14} /> {isExporting ? 'Exportando...' : 'Exportar PDF'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {gastosDetalle.map((gasto) => (
                                        <div key={gasto.id} className="flex flex-col gap-2 bg-main p-3 rounded-xl border border-bd-lines">
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start sm:items-center">
                                                <div className="col-span-1 border-r sm:border-r-0 border-bd-lines pr-2 sm:pr-0 self-center hidden sm:flex">
                                                    <Tag size={18} className="text-accent" />
                                                </div>
                                                <div className="sm:col-span-4 w-full">
                                                    <input
                                                        type="text"
                                                        value={gasto.descripcion}
                                                        onChange={(e) => handleUpdateGasto(gasto.id, 'descripcion', e.target.value)}
                                                        placeholder="Descripción del ítem"
                                                        className="w-full px-3 py-1.5 text-sm border border-bd-lines rounded-md focus:outline-none focus:border-accent bg-card"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-24">
                                                    <input
                                                        type="number"
                                                        value={gasto.cantidad}
                                                        onChange={(e) => handleUpdateGasto(gasto.id, 'cantidad', e.target.value === '' ? '' : Number(e.target.value))}
                                                        placeholder="Cant."
                                                        className="w-full px-3 py-1.5 text-sm border border-bd-lines rounded-md focus:outline-none focus:border-accent bg-card"
                                                    />
                                                </div>
                                                <div className="sm:col-span-3 w-full relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-secondary text-sm">$</span>
                                                    <input
                                                        type="number"
                                                        value={gasto.precioUnitario}
                                                        onChange={(e) => handleUpdateGasto(gasto.id, 'precioUnitario', e.target.value === '' ? '' : Number(e.target.value))}
                                                        placeholder="Precio Unit."
                                                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-bd-lines rounded-md focus:outline-none focus:border-accent bg-card"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2 w-full text-right font-bold text-tx-primary text-sm flex items-center justify-end">
                                                    ${((Number(gasto.cantidad) || 0) * (Number(gasto.precioUnitario) || 0)).toLocaleString('es-AR')}
                                                </div>
                                                <div className="sm:col-span-1 w-full flex items-center justify-end">
                                                    <button onClick={() => handleRemoveGasto(gasto.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shadow-sm bg-card border border-bd-lines">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Data Tracking Fields */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 pt-2 border-t border-bd-lines">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-tx-secondary uppercase tracking-wider font-bold ml-1">Para Data Mining: Categoría</label>
                                                    <select
                                                        value={gasto.categoria || ''}
                                                        onChange={(e) => handleUpdateGasto(gasto.id, 'categoria', e.target.value)}
                                                        className="w-full px-3 py-1.5 text-xs border border-bd-lines rounded-md focus:outline-none focus:border-accent bg-card text-tx-primary"
                                                    >
                                                        <option value="">-- Seleccionar --</option>
                                                        <option value="Aspersores">Aspersores</option>
                                                        <option value="Tuberías">Tuberías</option>
                                                        <option value="Válvulas">Válvulas</option>
                                                        <option value="Programadores">Programadores</option>
                                                        <option value="Bombas">Bombas</option>
                                                        <option value="Conexiones y Pvc">Conexiones y PVC</option>
                                                        <option value="Sensores y Clima">Sensores y Estaciones</option>
                                                        <option value="Mano de Obra">Mano de Obra</option>
                                                        <option value="Logística">Logística / Transporte</option>
                                                        <option value="Materiales Generales">Materiales Generales</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-tx-secondary uppercase tracking-wider font-bold ml-1">Marca Utilizada</label>
                                                    <select
                                                        value={gasto.marca || ''}
                                                        onChange={(e) => handleUpdateGasto(gasto.id, 'marca', e.target.value)}
                                                        className="w-full px-3 py-1.5 text-xs border border-bd-lines rounded-md focus:outline-none focus:border-accent bg-card text-tx-primary"
                                                    >
                                                        <option value="">-- No aplica / Múltiple --</option>
                                                        <option value="Hunter">Hunter</option>
                                                        <option value="Rainbird">Rainbird</option>
                                                        <option value="Toro">Toro</option>
                                                        <option value="KRain">K-Rain</option>
                                                        <option value="Nelson">Nelson</option>
                                                        <option value="Azud">Azud</option>
                                                        <option value="NaanDanJain">NaanDanJain</option>
                                                        <option value="Netafim">Netafim</option>
                                                        <option value="Motorarg">Motorarg</option>
                                                        <option value="Rowa">Rowa</option>
                                                        <option value="Grundfos">Grundfos</option>
                                                        <option value="Kabel">Kabel</option>
                                                        <option value="Otra">Otra Marca</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {(gasto.descripcion?.toLowerCase() || '').includes('combustible') && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        id={`trackeo-${gasto.id}`}
                                                        checked={gasto.verificadoTrackeo || false}
                                                        onChange={(e) => handleUpdateGasto(gasto.id, 'verificadoTrackeo', e.target.checked)}
                                                        className="rounded text-accent focus:ring-accent"
                                                    />
                                                    <label htmlFor={`trackeo-${gasto.id}`} className="text-xs text-tx-secondary cursor-pointer">
                                                        Verificado según trackeo de combustible
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button onClick={handleAddGasto} className="w-full py-2 border-2 border-dashed border-bd-lines rounded-xl text-tx-secondary font-medium hover:border-accent/50 hover:text-accent transition-colors flex items-center justify-center gap-2 text-sm">
                                        <Plus size={16} /> Agregar Ítem
                                    </button>
                                </div>

                                {gastosDetalle.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                        <div className="text-right">
                                            <span className="text-sm text-tx-secondary mr-4">Total Desglose:</span>
                                            <span className="text-xl font-bold text-accent">${gastosToUse.toLocaleString('es-AR')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-card p-6 rounded-2xl shadow-sm border border-bd-lines">
                                <h2 className="text-lg font-bold text-tx-primary mb-4">Configurar Métricas</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-tx-primary mb-1">Estado del Trabajo</label>
                                        <select
                                            value={metricsForm.estado}
                                            onChange={e => setMetricsForm({ ...metricsForm, estado: e.target.value })}
                                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-tx-primary font-bold"
                                        >
                                            <option value="Planificación">En Planificación</option>
                                            <option value="En Proceso">En Proceso</option>
                                            <option value="Pausado">Pausado</option>
                                            <option value="Completado" className="text-green-600 font-bold">Completado (Alimenta Data Mining)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-tx-primary mb-1">Gastos Totales ($)</label>
                                        <input
                                            type="number"
                                            value={gastosDetalle.length > 0 ? gastosToUse : metricsForm.gastos}
                                            onChange={e => setMetricsForm({ ...metricsForm, gastos: e.target.value === '' ? '' : Number(e.target.value) })}
                                            disabled={gastosDetalle.length > 0}
                                            className={cn("w-full px-4 py-2 border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none", gastosDetalle.length > 0 && "bg-gray-100 text-tx-secondary")}
                                        />
                                        {gastosDetalle.length > 0 && <p className="text-xs text-tx-secondary mt-1">Calculado automáticamente desde el desglose.</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-tx-primary mb-1">Rentabilidad Estimada (%)</label>
                                        <input
                                            type="number"
                                            value={metricsForm.rentabilidad}
                                            onChange={e => setMetricsForm({ ...metricsForm, rentabilidad: e.target.value === '' ? '' : Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-tx-primary mb-1">Gasto de Distancia ($)</label>
                                        <input
                                            type="number"
                                            value={metricsForm.gastoDistancia}
                                            onChange={e => setMetricsForm({ ...metricsForm, gastoDistancia: e.target.value === '' ? '' : Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-tx-primary mb-1">Fecha de Inicio</label>
                                        <input
                                            type="date"
                                            value={metricsForm.fechaInicio}
                                            onChange={e => setMetricsForm({ ...metricsForm, fechaInicio: e.target.value })}
                                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveMetrics}
                                        className="w-full flex items-center justify-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-colors mt-4"
                                    >
                                        <Save size={18} /> Guardar Métricas
                                    </button>
                                </div>
                            </div>

                            
                        </div>
                    </div>





                        {/* Detalles Tabs */}
                    <div id="detalles-tabs" className="bg-card p-6 rounded-2xl shadow-sm border border-bd-lines mt-6">
                        <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar pb-1 mb-6">
                            <button
                                onClick={() => setActiveDetailTab('pactados')}
                                className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeDetailTab === 'pactados' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
                            >
                                Trabajos Pactados
                            </button>
                            <button
                                onClick={() => setActiveDetailTab('ordenes')}
                                className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeDetailTab === 'ordenes' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
                            >
                                Órdenes / Visitas
                            </button>
                            <button
                                onClick={() => setActiveDetailTab('inventario')}
                                className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeDetailTab === 'inventario' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
                            >
                                Inventario en Obra
                            </button>
                        </div>
                        
                        {activeDetailTab === 'ordenes' && (
                            <OrdenesTab 
                                selectedTrabajo={selectedTrabajo} 
                                updatePortfolioInDB={updatePortfolioInDB} 
                                setSelectedTrabajo={setSelectedTrabajo} 
                            />
                        )}

                        {activeDetailTab === 'pactados' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-tx-primary">Trabajos Pactados con el Cliente</h2>
                                    <button onClick={() => setIsTrabajoPactadoModalOpen(true)} className="text-sm bg-accent/10 text-accent px-3 py-2 rounded-xl font-bold hover:bg-accent/20 transition-colors flex items-center gap-1">
                                        <Plus size={16} /> Agregar Trabajo
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedTrabajo.trabajosPactados && selectedTrabajo.trabajosPactados.length > 0 ? (
                                        selectedTrabajo.trabajosPactados.map((pactado: any) => (
                                            <div key={pactado.id} className="bg-main rounded-xl border border-bd-lines overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenPactadoDetail(pactado)}>
                                                <div className="h-32 relative">
                                                    <img src={pactado.foto} alt={pactado.nombre} className="w-full h-full object-cover" />
                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveTrabajoPactado(pactado.id); }} className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-xl hover:bg-red-600 transition-colors backdrop-blur-sm">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <h3 className="font-bold text-tx-primary mb-2">{pactado.nombre}</h3>
                                                    <div className="flex flex-wrap gap-1 mt-auto">
                                                        {pactado.tags && pactado.tags.map((tag: string, idx: number) => (
                                                            <span key={idx} className="text-[10px] font-medium bg-gray-200 text-tx-primary px-2 py-0.5 rounded-full">#{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-8 text-tx-secondary">No hay trabajos pactados registrados.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'inventario' && (
                            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <h2 className="text-lg font-bold text-tx-primary pb-2 border-b border-bd-lines border-dashed">Inventario y Checklist de la Obra</h2>
                                
                                <div className="max-w-3xl gap-6">
                                    {/* Checklist de Productos a Pedir */}
                                    <div className="bg-main border border-bd-lines rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-tx-primary uppercase tracking-wider flex justify-between items-center mb-4">
                                            <span>Checklist de Pedido</span>
                                            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs">{selectedTrabajo.checklist?.length || 0} ítems</span>
                                        </h3>
                                        <div className="flex gap-2 mb-3">
                                            <input type="text" id="inline-checklist-input" placeholder="Nuevo producto a pedir (presiona Enter)..." className="flex-1 px-3 py-2 border border-bd-lines rounded-xl text-sm bg-card focus:border-accent outline-none focus:ring-2 focus:ring-accent/20" onKeyDown={(e) => {
                                                if(e.key === 'Enter') {
                                                    const val = e.currentTarget.value.trim();
                                                    if(val) {
                                                        const newChecklist = [...(selectedTrabajo.checklist || []), { id: Date.now(), text: val, qty: 1, isChecked: false }];
                                                        updatePortfolioInDB(selectedTrabajo.id, { checklist: newChecklist });
                                                        setSelectedTrabajo({...selectedTrabajo, checklist: newChecklist});
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }} />
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
                                            {(selectedTrabajo.checklist || []).map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-bd-lines">
                                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                        <input type="checkbox" checked={item.isChecked} onChange={() => {
                                                            const newChecklist = selectedTrabajo.checklist.map((i: any) => i.id === item.id ? { ...i, isChecked: !i.isChecked } : i);
                                                            updatePortfolioInDB(selectedTrabajo.id, { checklist: newChecklist });
                                                            setSelectedTrabajo({...selectedTrabajo, checklist: newChecklist});
                                                        }} className="w-5 h-5 rounded text-accent focus:ring-accent" />
                                                        <span className={cn("text-sm transition-all", item.isChecked ? "line-through text-tx-secondary opacity-50" : "text-tx-primary font-medium")}>{item.text}</span>
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" min="1" value={item.qty || 1} onChange={(e) => {
                                                            const newQty = parseInt(e.target.value) || 1;
                                                            const newChecklist = selectedTrabajo.checklist.map((i: any) => i.id === item.id ? { ...i, qty: newQty } : i);
                                                            updatePortfolioInDB(selectedTrabajo.id, { checklist: newChecklist });
                                                            setSelectedTrabajo({...selectedTrabajo, checklist: newChecklist});
                                                        }} className="w-16 px-2 py-1.5 text-xs font-bold border border-bd-lines rounded-lg bg-main text-center focus:border-accent outline-none" />
                                                        <button onClick={() => {
                                                            const newChecklist = selectedTrabajo.checklist.filter((i: any) => i.id !== item.id);
                                                            updatePortfolioInDB(selectedTrabajo.id, { checklist: newChecklist });
                                                            setSelectedTrabajo({...selectedTrabajo, checklist: newChecklist});
                                                        }} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedTrabajo.checklist || selectedTrabajo.checklist.length === 0) && (
                                                <div className="text-center bg-gray-50/50 py-6 rounded-xl border border-dashed border-gray-200">
                                                  <FileText size={24} className="mx-auto text-gray-300 mb-2"/>
                                                  <p className="text-tx-secondary text-xs">No hay productos en la checklist.</p>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => {
                                            const checklistText = (selectedTrabajo.checklist || []).filter((i: any) => !i.isChecked).map((i: any) => `- ${i.qty || 1}x ${i.text}`).join('%0A');
                                            const whatsappMessage = `Hola, necesito encargar los siguientes materiales y/o pedir presupuesto para el proyecto: ${selectedTrabajo.titulo}.%0A%0AProductos a pedir:%0A${checklistText || 'Ninguno especificado'}`;
                                            window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
                                        }} className="w-full mt-4 py-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20">
                                            Compartir Pedido por WhatsApp
                                        </button>
                                    </div>


                                </div>
                            </div>
                        )}

                                            </div>
{/* Hidden PDF Template */}
                    <div id="pdf-presupuesto-content" style={{ display: 'none', width: '800px', padding: '50px', backgroundColor: '#ffffff', color: '#1f2937', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {/* Encabezado */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            <div>
                                {companyData?.logo ? (
                                    <img src={companyData.logo} alt="Logo" style={{ maxHeight: '60px', marginBottom: '15px' }} />
                                ) : (
                                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#059669', margin: 0, letterSpacing: '-0.5px' }}>{companyData?.nombre || 'Argen Software'}</h2>
                                )}
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>{companyData?.direccion || 'Buenos Aires, Argentina'}</p>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>CUIT: {companyData?.cuit || '---'} | Mail: admin@argen.com</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#e5e7eb', margin: '0 0 10px 0', letterSpacing: '2px', textTransform: 'uppercase' }}>Presupuesto</h1>
                                <div style={{ backgroundColor: '#059669', color: 'white', padding: '6px 16px', borderRadius: '6px', display: 'inline-block', fontSize: '14px', fontWeight: 'bold' }}>
                                    Nº {Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
                                </div>
                            </div>
                        </div>

                        {/* Info Cliente */}
                        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold', margin: '0 0 6px 0', letterSpacing: '1px' }}>Facturar a</p>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: '0 0 4px 0' }}>{selectedTrabajo.cliente}</p>
                                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>📍 {selectedTrabajo.ubicacion}</p>
                            </div>
                            <div style={{ flex: 1, borderLeft: '1px solid #e5e7eb', paddingLeft: '30px' }}>
                                <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold', margin: '0 0 6px 0', letterSpacing: '1px' }}>Detalle de Obra</p>
                                <p style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 6px 0' }}><strong>Proyecto:</strong> {selectedTrabajo.titulo}</p>
                                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</p>
                            </div>
                        </div>

                        {/* Tabla */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Descripción</th>
                                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cant.</th>
                                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #e5e7eb', textAlign: 'right', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Precio U.</th>
                                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #e5e7eb', textAlign: 'right', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gastosDetalle.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', color: '#1f2937', fontSize: '14px', fontWeight: '500' }}>{item.descripcion}</td>
                                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>{item.cantidad}</td>
                                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>${item.precioUnitario.toLocaleString('es-AR')}</td>
                                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>${((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)).toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                                {gastosDetalle.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', borderBottom: '1px solid #f3f4f6' }}>
                                            No hay ítems registrados en el presupuesto actual.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Totales */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                            <div style={{ width: '320px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#6b7280', fontSize: '14px' }}>
                                    <span>Subtotal neto</span>
                                    <span>${gastosToUse.toLocaleString('es-AR')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#6b7280', fontSize: '14px' }}>
                                    <span>Impuestos (0%)</span>
                                    <span>$0</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '2px solid #e2e8f0', color: '#0f172a', fontSize: '22px', fontWeight: '900' }}>
                                    <span>Total Final</span>
                                    <span style={{ color: '#059669' }}>${gastosToUse.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: '80px', borderTop: '1px solid #e5e7eb', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase' }}>Condiciones Legales</p>
                                <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>
                                    Documento generado automáticamente. Validez del presupuesto: 15 días a partir de la fecha.
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '20px', height: '20px', backgroundColor: '#059669', borderRadius: '4px', opacity: 0.8 }}></div>
                                <span style={{ color: '#1f2937', fontSize: '13px', fontWeight: '800', letterSpacing: '-0.2px' }}>{companyData?.nombre || 'Argen Software'}</span>
                            </div>
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
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
                    <div className="bg-green-500 rounded-full p-1">
                        <Check size={16} className="text-white" />
                    </div>
                    <span className="font-medium">{toastMessage}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">Trabajos</h1>
                    <button
                        onClick={() => { setIsModalOpen(true); }}
                        className="bg-accent text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-colors w-full sm:w-auto justify-center"
                    >
                        <Plus size={20} />
                        <span>Nuevo Trabajo</span>
                    </button>
            </div>

            {/* General Toolbar (Search & Filters) */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative group w-full md:w-2/3 lg:w-1/2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors w-5 h-5" />
                        <input
                            className="w-full pl-11 pr-4 py-3 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-sm text-sm"
                            placeholder={"Buscar trabajos, clientes o ubicaciones..."}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {(
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center justify-center gap-2 border px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm w-full md:w-auto",
                                showFilters ? "bg-accent text-white border-transparent" : "bg-card border-bd-lines text-tx-secondary hover:bg-slate-50"
                            )}
                        >
                            <Filter size={18} />
                            Filtros
                        </button>
                    )}
                </div>

                {/* Filtros Desplegables */}
                {showFilters && (
                    <div className="flex flex-wrap gap-2 p-4 bg-card rounded-xl border border-bd-lines shadow-sm animate-in fade-in slide-in-from-top-2">
                        <button
                            onClick={() => setSelectedFilter(null)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                selectedFilter === null ? "bg-slate-800 text-white border-transparent" : "bg-transparent text-tx-secondary border-bd-lines hover:bg-slate-50"
                            )}
                        >
                            Todos
                        </button>
                        {true && (
                            <>
                                <span className="text-sm text-slate-300 flex items-center px-1">|</span>
                                {['Diseño', 'Instalación', 'Mantenimiento', 'Obra'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedFilter(cat)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                            selectedFilter === cat ? "bg-accent text-white border-transparent" : "bg-transparent text-tx-secondary border-bd-lines hover:bg-slate-50"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                                <span className="text-sm text-slate-300 flex items-center px-1">|</span>
                                {['Planificación', 'En Proceso', 'Activo', 'Completado'].map(estado => (
                                    <button
                                        key={estado}
                                        onClick={() => setSelectedFilter(estado)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                            selectedFilter === estado ? "bg-accent text-white border-transparent" : "bg-transparent text-tx-secondary border-bd-lines hover:bg-slate-50"
                                        )}
                                    >
                                        {estado}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
            {/* Content */}
            {true && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPortfolio.map(item => (
                        <div key={item.id} onClick={() => handleOpenDetails(item)} className="bg-card rounded-2xl shadow-sm border border-bd-lines overflow-hidden hover:shadow-md hover:border-accent/30 transition-all group cursor-pointer flex flex-col">
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={item.img}
                                    alt={item.titulo}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-tx-primary">
                                        {item.categoria}
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOptionsItem(item); }}
                                            className="bg-card/90 backdrop-blur-sm p-1 rounded text-tx-secondary hover:text-tx-primary hover:bg-card transition-colors"
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-tx-primary text-lg mb-1 truncate">{item.titulo}</h3>
                                <p className="text-sm text-tx-secondary mb-3 flex items-center gap-1">
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
                                    <span className="text-xs text-tx-secondary flex items-center gap-1">
                                        <Calendar size={12} /> {item.fecha}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}\n\n            <Modal
                isOpen={isMapPickerOpen}
                onClose={() => setIsMapPickerOpen(false)}
                title="Marcar Ubicación"
            >
                <div className="space-y-4">
                    <p className="text-sm text-tx-secondary">Haz clic en el mapa para marcar la ubicación exacta del trabajo.</p>
                    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-bd-lines">
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
                            className="px-4 py-2 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-colors"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nuevo Trabajo"
            >
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Título</label>
                        <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                            placeholder="Ej: Medidas Deck"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Cliente (Tag Inteligente)</label>
                        <select
                            value={newCliente}
                            onChange={e => {
                                setNewCliente(e.target.value);
                                const selectedClient = clientesData.find((c: any) => c.name === e.target.value);
                                if (selectedClient && selectedClient.location) {
                                    setNewUbicacion(selectedClient.location);
                                }
                            }}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card"
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientesData.map((client: any) => (
                                <option key={client.id} value={client.name}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Ubicación GPS (Editable)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newUbicacion}
                                onChange={e => setNewUbicacion(e.target.value)}
                                className="flex-1 px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                placeholder="Ej: Nordelta, San Isidro..."
                            />
                            <button
                                type="button"
                                onClick={() => setIsMapPickerOpen(true)}
                                className="px-3 py-2 bg-main text-tx-secondary rounded-xl hover:bg-card transition-colors border border-bd-lines flex items-center justify-center"
                                title="Marcar en mapa"
                            >
                                <MapPin size={20} />
                            </button>
                        </div>
                        {newLat && newLng && (
                            <p className="text-xs text-tx-secondary mt-1">Coordenadas: {newLat.toFixed(4)}, {newLng.toFixed(4)}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Foto del Trabajo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(e, setNewImg)}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                        />
                        {newImg && (
                            <div className="mt-2 h-32 rounded-xl overflow-hidden border border-bd-lines">
                                <img src={newImg} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 bg-card border border-bd-lines text-tx-secondary font-semibold rounded-xl hover:bg-main hover:text-tx-primary transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-colors"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title="Editar Trabajo"
            >
                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Título</label>
                        <input
                            type="text"
                            required
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Cliente (Tag Inteligente)</label>
                        <select
                            value={editCliente}
                            onChange={e => {
                                setEditCliente(e.target.value);
                                const selectedClient = clientesData.find((c: any) => c.name === e.target.value);
                                if (selectedClient && selectedClient.location) {
                                    setEditUbicacion(selectedClient.location);
                                }
                            }}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none bg-card"
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientesData.map((client: any) => (
                                <option key={client.id} value={client.name}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Ubicación GPS (Editable)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editUbicacion}
                                onChange={e => setEditUbicacion(e.target.value)}
                                className="flex-1 px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                placeholder="Ej: Nordelta, San Isidro..."
                            />
                            <button
                                type="button"
                                onClick={() => setIsMapPickerOpen(true)}
                                className="px-3 py-2 bg-main text-tx-secondary rounded-xl hover:bg-card transition-colors border border-bd-lines flex items-center justify-center"
                                title="Marcar en mapa"
                            >
                                <MapPin size={20} />
                            </button>
                        </div>
                        {editLat && editLng && (
                            <p className="text-xs text-tx-secondary mt-1">Coordenadas: {editLat.toFixed(4)}, {editLng.toFixed(4)}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Foto del Trabajo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(e, setEditImg)}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                        />
                        {editImg && (
                            <div className="mt-2 h-32 rounded-xl overflow-hidden border border-bd-lines">
                                <img src={editImg} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-4 py-2 bg-card border border-bd-lines text-tx-secondary font-semibold rounded-xl hover:bg-main hover:text-tx-primary transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-colors"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!optionsItem}
                onClose={() => setOptionsItem(null)}
                title="Opciones del Trabajo"
            >
                <div className="space-y-3">
                    <button
                        onClick={() => handleEditClick(optionsItem)}
                        className="w-full flex items-center gap-3 p-4 bg-main rounded-xl hover:bg-main transition-colors font-medium text-tx-primary"
                    >
                        <Edit2 size={20} className="text-tx-secondary" /> Editar Trabajo
                    </button>
                    <button
                        onClick={() => handleDelete(optionsItem?.id)}
                        className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors font-medium text-red-600"
                    >
                        <Trash2 size={20} /> Eliminar Trabajo
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
                        <label className="block text-sm font-medium text-tx-primary mb-1">Nombre del Trabajo</label>
                        <input
                            type="text"
                            required
                            value={newPactadoNombre}
                            onChange={e => setNewPactadoNombre(e.target.value)}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                            placeholder="Ej: Nivelación de terreno"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Foto (Opcional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(e, setNewPactadoFoto)}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                        />
                        {newPactadoFoto && (
                            <div className="mt-2 h-32 rounded-xl overflow-hidden border border-bd-lines">
                                <img src={newPactadoFoto} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-tx-primary mb-1">Tags Sugeridos (separados por coma)</label>
                        <input
                            type="text"
                            value={newPactadoTags}
                            onChange={e => setNewPactadoTags(e.target.value)}
                            className="w-full px-4 py-2 bg-main border border-bd-lines rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                            placeholder="Ej: tierra, maquinaria, riego"
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsTrabajoPactadoModalOpen(false)}
                            className="px-4 py-2 bg-card border border-bd-lines text-tx-secondary font-semibold rounded-xl hover:bg-main hover:text-tx-primary transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-accent text-white font-medium rounded-xl hover:opacity-90 transition-colors"
                        >
                            Agregar Trabajo
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Pactado Detail Modal */}
            {isPactadoDetailModalOpen && selectedPactado && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in-95">
                        <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-bd-lines p-4 sm:p-6 flex justify-between items-center z-10">
                            <h3 className="font-bold text-tx-primary text-lg">{selectedPactado.nombre}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportPactadoPDF}
                                    disabled={isExporting}
                                    className="p-2 text-tx-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
                                    title="Exportar PDF"
                                >
                                    <Download size={20} className={isExporting ? "animate-pulse" : ""} />
                                </button>
                                <button onClick={() => setIsPactadoDetailModalOpen(false)} className="p-2 text-tx-secondary hover:text-tx-secondary hover:bg-main rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-8 overflow-y-auto flex-1">
                            {/* Archivos */}
                            <div>
                                <h4 className="font-bold text-tx-primary mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-accent" /> Archivos Correspondientes
                                </h4>
                                <div className="space-y-3 mb-4">
                                    {selectedPactado.archivos && selectedPactado.archivos.length > 0 ? (
                                        selectedPactado.archivos.map((archivo: any) => (
                                            <div key={archivo.id} className="flex items-center justify-between bg-main p-3 rounded-xl border border-bd-lines">
                                                <span className="text-sm font-medium text-tx-primary">{archivo.nombre}</span>
                                                {archivo.url && (
                                                    <a href={archivo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                                                        Ver Archivo
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-tx-secondary">No hay archivos adjuntos.</p>
                                    )}
                                </div>
                                <form onSubmit={handleAddPactadoArchivo} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nombre del archivo"
                                        value={newPactadoArchivoNombre}
                                        onChange={e => setNewPactadoArchivoNombre(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-main border border-bd-lines rounded-xl focus:outline-none focus:border-accent"
                                        required
                                    />
                                    <input
                                        type="url"
                                        placeholder="URL (opcional)"
                                        value={newPactadoArchivoUrl}
                                        onChange={e => setNewPactadoArchivoUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-main border border-bd-lines rounded-xl focus:outline-none focus:border-accent"
                                    />
                                    <button type="submit" className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">
                                        Agregar
                                    </button>
                                </form>
                            </div>

                            {/* Historial de Sucesos */}
                            <div>
                                <h4 className="font-bold text-tx-primary mb-4 flex items-center gap-2">
                                    <ClockIcon size={18} className="text-accent" /> Historial de Sucesos
                                </h4>
                                <div className="space-y-3 mb-4">
                                    {selectedPactado.historial && selectedPactado.historial.length > 0 ? (
                                        selectedPactado.historial.map((suceso: any) => (
                                            <div key={suceso.id} className="bg-main p-3 rounded-xl border border-bd-lines">
                                                <span className="text-xs text-tx-secondary font-medium block mb-1">{suceso.fecha}</span>
                                                <p className="text-sm text-tx-primary">{suceso.descripcion}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-tx-secondary">No hay sucesos registrados.</p>
                                    )}
                                </div>
                                <form onSubmit={handleAddPactadoHistorial} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="¿Qué se hizo?"
                                        value={newPactadoHistorial}
                                        onChange={e => setNewPactadoHistorial(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-main border border-bd-lines rounded-xl focus:outline-none focus:border-accent"
                                        required
                                    />
                                    <button type="submit" className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">
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
