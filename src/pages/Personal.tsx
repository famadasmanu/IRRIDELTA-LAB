import React, { useState } from 'react';
import {
  MapPin, Calendar, User,
  Search, Phone, MessageCircle, Clock, Users, Briefcase,
  ArrowLeft, CheckCircle, Check, ChevronDown, Filter,
  TreePine, AlertTriangle, Locate, MoreVertical, X,
  Truck, Plus, Edit2, Camera,
  Wrench, Droplets, Activity, FileText, Timer, CalendarDays,
  BatteryWarning, UploadCloud, Save, Leaf, Sun, ArrowRight, Download, Trash2,
  DollarSign, Fuel, Paperclip, CheckSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';


type PersonalMember = {
  id: string;
  name: string;
  role: string;
  category: 'interno' | 'externo';
  status: 'activo' | 'descanso' | 'inactivo';
  location?: string;
  schedule?: string;
  initials: string;
  presencialidad?: string;
  adelantos?: string;
  seguro?: string;
  obraAsignada?: string;
  attendanceAlert?: number; // percentage threshold for alert
  attendanceData?: { date: string; present: boolean }[];
  dailyTasks?: { id: string; text: string; completed: boolean }[];
  consumptionReports?: { id: string; date: string; materialId: string; materialName: string; qty: number; project: string; notes: string; status: 'Pendiente' | 'Aprobado' | 'Rechazado' }[];
  salary?: string;
  fuelSpent?: string;
  minutes?: { id: string; code: string; date: string }[];
  metricsHistory?: { id: string; month: string; year: number; salary: number; fuel: number; attendance: number }[];
};

export type VehicleHistory = {
  id: number;
  date: string;
  type: string;
  description: string;
  cost: string;
};

export type Vehicle = {
  id: number;
  name: string;
  patente: string;
  status: string;
  driver: string;
  image: string;
  metric: string;
  metricIcon: string;
  horometro: number;
  odometroPorObra: number;
  fuelLevel: number;
  nextService: number;
  history: VehicleHistory[];
};

export type Delivery = {
  id: number;
  origen: string;
  destino: string;
  material: string;
  status: string;
  eta: string;
  vehicleId: number;
  image: string;
};

export type CorrectiveIssue = {
  id: number;
  title: string;
  reportedBy: string;
  date: string;
  status: string;
  vehicleId: number;
  icon: string;
};

export type UpcomingService = {
  id: number;
  title: string;
  vehicleId: number;
  status: string;
  detail: string;
  icon: string;
};

// Removed old initial hardcoded data blocks
export default function Personal() {
  const navigate = useNavigate();
  const [view, setView] = useState<'equipo' | 'vehiculos'>('equipo');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'todos' | 'interno' | 'externo'>('todos');
  // Firestore Collections
  const { data: personalRaw, add: addPersonal, update: updatePersonal, remove: removePersonal } = useFirestoreCollection<PersonalMember>('personalData');
  const personalData = personalRaw;
  const setPersonalData = (updater: any) => {};

  const { data: vehiclesRaw, add: addVehicle, update: updateVehicle, remove: removeVehicle } = useFirestoreCollection<Vehicle>('personal_vehicles');
  const vehicles = vehiclesRaw;
  const setVehicles = (updater: any) => {};

  const { data: deliveriesRaw, add: addDelivery, update: updateDelivery, remove: removeDelivery } = useFirestoreCollection<Delivery>('personal_deliveries');
  const deliveries = deliveriesRaw;
  const setDeliveries = (updater: any) => {};

  const { data: correctiveIssuesRaw, add: addCorrectiveIssue, update: updateCorrectiveIssue, remove: removeCorrectiveIssue } = useFirestoreCollection<CorrectiveIssue>('corrective_issues');
  const correctiveIssues = correctiveIssuesRaw;
  const setCorrectiveIssues = (updater: any) => {};

  const { data: upcomingServicesRaw, add: addUpcomingService, update: updateUpcomingService, remove: removeUpcomingService } = useFirestoreCollection<UpcomingService>('upcoming_services');
  const upcomingServices = upcomingServicesRaw;
  const setUpcomingServices = (updater: any) => {};

  const { data: materialesData, update: updateMaterial } = useFirestoreCollection<any>('inventario_generales');
  const { data: projectsData, update: updateProject } = useFirestoreCollection<any>('projects');
  const { data: trabajosData } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: ordenesData, add: addOrden, update: updateOrden, remove: removeOrden } = useFirestoreCollection<any>('trabajos_ordenes');

  const [selectedMember, setSelectedMember] = useState<PersonalMember | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editingItemType, setEditingItemType] = useState<'vehicle' | 'delivery' | 'service' | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<Vehicle | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCorrectiveModalOpen, setIsCorrectiveModalOpen] = useState(false);
  const [isChangeUserModalOpen, setIsChangeUserModalOpen] = useState(false);
  const [newCorrectiveIssue, setNewCorrectiveIssue] = useState({ title: '', reportedBy: '', vehicleId: 1, icon: 'Wrench' });
  const [newService, setNewService] = useState<Partial<UpcomingService>>({ title: '', vehicleId: 1, status: 'programado', icon: 'Wrench', detail: '' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editRole, setEditRole] = useState('');
  const [editCategory, setEditCategory] = useState<'interno' | 'externo'>('interno');
  const [editEmployeeStatus, setEditEmployeeStatus] = useState<'activo' | 'descanso' | 'inactivo'>('activo');
  const [editEmployeeLocation, setEditEmployeeLocation] = useState('');
  const [employeeTab, setEmployeeTab] = useState<'ficha' | 'rh' | 'ordenes'>('ficha');
  const [isEmployeeOrderModalOpen, setIsEmployeeOrderModalOpen] = useState(false);
  const [newEmployeeOrder, setNewEmployeeOrder] = useState({ id: '', title: '', location: '', category: 'Mantenimiento de Piletas', description: '', tools: '', scheduledDate: new Date().toISOString().split('T')[0] });
  const [selectedOrderTab, setSelectedOrderTab] = useState<'activas' | 'completadas'>('activas');

  const handleSaveEmployeeOrder = () => {
    if (!newEmployeeOrder.title) return;
    
    if (newEmployeeOrder.id) {
       updateOrden(newEmployeeOrder.id, {
          title: newEmployeeOrder.title,
          location: newEmployeeOrder.location || 'Base Marinas',
          category: newEmployeeOrder.category || 'Mantenimiento General',
          description: newEmployeeOrder.description || '',
          tools: newEmployeeOrder.tools || '',
          scheduledDate: newEmployeeOrder.scheduledDate || new Date().toISOString().split('T')[0],
       });
    } else {
       addOrden({
         title: newEmployeeOrder.title,
         location: newEmployeeOrder.location || 'Base Marinas',
         category: newEmployeeOrder.category || 'Mantenimiento General',
         description: newEmployeeOrder.description || '',
         tools: newEmployeeOrder.tools || '',
         scheduledDate: newEmployeeOrder.scheduledDate || new Date().toISOString().split('T')[0],
         status: 'en_curso',
         date: new Date().toISOString(),
         monthGroup: new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
         empleado: selectedEmployeeDetail?.name || 'Desconocido',
       });
    }
    
    setNewEmployeeOrder({ id: '', title: '', location: '', category: 'Mantenimiento de Piletas', description: '', tools: '', scheduledDate: new Date().toISOString().split('T')[0] });
    setIsEmployeeOrderModalOpen(false);
  };
  
  const handleEditEmployeeOrder = (orden: any) => {
     setNewEmployeeOrder({
        id: orden.id, 
        title: orden.title, 
        location: orden.location, 
        category: orden.category || 'Mantenimiento General',
        description: orden.description || '',
        tools: orden.tools || '',
        scheduledDate: orden.scheduledDate || new Date(orden.date || Date.now()).toISOString().split('T')[0]
     });
     setIsEmployeeOrderModalOpen(true);
  };
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({ month: 'Enero', year: new Date().getFullYear(), salary: '', fuel: '', attendance: '' });

  const [newMinuteCode, setNewMinuteCode] = useState('');

  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [newMember, setNewMember] = useState<Partial<PersonalMember>>({
    name: '',
    role: '',
    category: 'interno',
    status: 'activo',
    location: '',
  });

  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    name: '',
    status: 'activo',
    patente: '',
    metric: '0 km',
    metricIcon: 'Activity',
    image: '',
  });

  const handleAddVehicleFunc = async () => {
    if (!newVehicle.name || !newVehicle.patente) {
      showToast('Nombre y patente requeridos.');
      return;
    }
    try {
      await addVehicle({
        name: newVehicle.name,
        status: newVehicle.status as any,
        patente: newVehicle.patente,
        metric: newVehicle.metric || '0 km',
        metricIcon: newVehicle.metricIcon || 'Activity',
        image: newVehicle.image || '',
        driver: newVehicle.driver || 'No Asignado',
        horometro: newVehicle.horometro || 0,
        odometroPorObra: newVehicle.odometroPorObra || 0,
        fuelLevel: newVehicle.fuelLevel || 100,
        nextService: newVehicle.nextService || 10000,
        history: [],
        documentsStatus: 'al dia'
      } as Omit<Vehicle, 'id'>);
      setIsNewVehicleModalOpen(false);
      setNewVehicle({ name: '', status: 'activo', patente: '', metric: '0 km', metricIcon: 'Activity', image: '' });
      showToast('Vehículo añadido a la flota');
    } catch (e: any) {
      showToast('Error al añadir vehículo');
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role) {
      showToast('Nombre y rol son requeridos.');
      return;
    }
    try {
      await addPersonal({
        name: newMember.name,
        role: newMember.role,
        category: newMember.category as any,
        status: newMember.status as any,
        location: newMember.location || '',
        initials: newMember.name.substring(0, 1).toUpperCase(),
        presencialidad: '100%',
        adelantos: '$0',
        attendanceAlert: 90,
      });
      setIsNewMemberModalOpen(false);
      setNewMember({ name: '', role: '', category: 'interno', status: 'activo', location: '' });
      showToast('Empleado agregado a la base de datos');
    } catch (e: any) {
      showToast('Error al crear empleado');
    }
  };

  const [editPresencialidad, setEditPresencialidad] = useState('');
  const [editAdelantos, setEditAdelantos] = useState('');
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<PersonalMember | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editLocationValue, setEditLocationValue] = useState('');
  const [isEditingAdelantos, setIsEditingAdelantos] = useState(false);
  const [editAdelantosValue, setEditAdelantosValue] = useState('');
  const [isEditingSeguro, setIsEditingSeguro] = useState(false);
  const [editSeguroValue, setEditSeguroValue] = useState('');
  const [isEditingObraAsignada, setIsEditingObraAsignada] = useState(false);
  const [editObraAsignadaValue, setEditObraAsignadaValue] = useState('');
  const [isEditingPresencialidad, setIsEditingPresencialidad] = useState(false);
  const [editPresencialidadValue, setEditPresencialidadValue] = useState('');
  const [editAttendanceAlert, setEditAttendanceAlert] = useState<number>(90);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [isReportingConsumption, setIsReportingConsumption] = useState(false);
  const [newConsumption, setNewConsumption] = useState({ materialId: '', qty: 1, notes: '', project: 'unset' });
  
  const [isExporting, setIsExporting] = useState(false);



  // Función updateZoneRadius eliminada permanentemente por advertencia de falta de uso

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setEditingItemType('vehicle');
    setEditingItemId(vehicle.id);
    setEditName(vehicle.name);
    setEditImage(vehicle.image || '');
    setEditStatus(vehicle.status || 'activo');
    setIsEditModalOpen(true);
  };

  // Función handleOpenEditDelivery eliminada por advertencia de falta de uso

  const handleOpenEditService = (service: UpcomingService) => {
    setEditingItemType('service');
    setEditingItemId(service.id);
    setEditName(service.title);
    setEditStatus(service.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEditItem = () => {
    if (editingItemType === 'vehicle' && editingItemId) {
      const updatedVehicle = vehicles.find(v => v.id === editingItemId);
      if (updatedVehicle) updateVehicle(editingItemId.toString(), { ...updatedVehicle, name: editName, image: editImage, status: editStatus });
      showToast('Vehículo actualizado');
    } else if (editingItemType === 'delivery' && editingItemId) {
      const updatedDelivery = deliveries.find(d => d.id === editingItemId);
      if (updatedDelivery) updateDelivery(editingItemId.toString(), { ...updatedDelivery, material: editName, image: editImage });
      showToast('Entrega actualizada');
    } else if (editingItemType === 'service' && editingItemId) {
      const updatedService = upcomingServices.find(s => s.id === editingItemId);
      if (updatedService) updateUpcomingService(editingItemId.toString(), { ...updatedService, title: editName, status: editStatus });
      showToast('Service actualizado');
    }
    setIsEditModalOpen(false);
  };

  const handleSaveCorrectiveIssue = () => {
    if (!newCorrectiveIssue.title || !newCorrectiveIssue.reportedBy) {
      showToast('Por favor completa todos los campos');
      return;
    }
    const newIssue = {
        title: newCorrectiveIssue.title,
        reportedBy: newCorrectiveIssue.reportedBy,
        date: 'Hoy',
        status: 'pendiente',
        vehicleId: newCorrectiveIssue.vehicleId,
        icon: newCorrectiveIssue.icon
    } as Omit<CorrectiveIssue, 'id'>;
    addCorrectiveIssue(newIssue);
    setIsCorrectiveModalOpen(false);
    setNewCorrectiveIssue({ title: '', reportedBy: '', vehicleId: 1, icon: 'Wrench' });
    showToast('Mantenimiento correctivo reportado');
  };

  const handleSaveNewService = () => {
    if (!newService.title || !newService.vehicleId) {
      showToast('Por favor completa todos los campos del service');
      return;
    }
    const servicePayload = {
        title: newService.title,
        vehicleId: newService.vehicleId,
        status: newService.status || 'programado',
        detail: newService.detail || 'Service de rutina',
        icon: newService.icon || 'Wrench'
    } as Omit<UpcomingService, 'id'>;
    addUpcomingService(servicePayload);
    setIsServiceModalOpen(false);
    setNewService({ title: '', vehicleId: 1, status: 'programado', icon: 'Wrench', detail: '' });
    showToast('Service programado y guardado');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteMember = async () => {
    if (selectedMember) {
      try {
        await removePersonal(selectedMember.id);
        setIsOptionsModalOpen(false);
        setIsEmployeeDetailModalOpen(false);
        showToast('Empleado eliminado permanentemente');
      } catch (e: any) {
        showToast('Error al eliminar empleado');
      }
    }
  };

  const handleOpenOptions = (member: PersonalMember) => {
    setSelectedMember(member);
    setIsOptionsModalOpen(true);
  };

  const handleOpenEdit = (memberToEdit?: PersonalMember) => {
    const member = memberToEdit || selectedMember;
    if (member) {
      setSelectedMember(member);
      setEditingItemType(null);
      setEditName(member.name);
      setEditRole(member.role);
      setEditCategory(member.category);
      setEditEmployeeStatus(member.status);
      setEditEmployeeLocation(member.location || '');
      setEditPresencialidad(member.presencialidad || '');
      setEditAdelantos(member.adelantos || '');
      setIsOptionsModalOpen(false);
      setIsEmployeeDetailModalOpen(false);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (editingItemType) {
        handleSaveEditItem();
        return;
      }
      if (selectedMember) {
        const payload = { 
          name: editName.trim() || '', 
          role: editRole.trim() || '',
          category: editCategory,
          status: editEmployeeStatus,
          location: editEmployeeLocation,
          presencialidad: editPresencialidad || '', 
          adelantos: editAdelantos || '' 
        };
        await updatePersonal(selectedMember.id, payload as any);
        
        if (selectedEmployeeDetail && selectedEmployeeDetail.id === selectedMember.id) {
          setSelectedEmployeeDetail({ 
            ...selectedEmployeeDetail, 
            ...payload
          });
        }
        setIsEditModalOpen(false);
        showToast('Datos actualizados correctamente');
      }
    } catch (e: any) {
      showToast('Error al guardar: ' + (e.message || String(e)));
      console.error(e);
    }
  };

  const handleOpenEmployeeDetail = (member: PersonalMember) => {
    setSelectedEmployeeDetail(member);
    setEditLocationValue(member.location || '');
    setEditAttendanceAlert(member.attendanceAlert || 90);
    setEmployeeTab('ficha');
    setIsEmployeeDetailModalOpen(true);
  };

  const handleSaveEmployeeDetail = () => {
    if (selectedEmployeeDetail) {
      const updatedMember = {
        ...selectedEmployeeDetail,
        ...(isEditingAdelantos && { adelantos: editAdelantosValue }),
        ...(isEditingSeguro && { seguro: editSeguroValue }),
        ...(isEditingObraAsignada && { obraAsignada: editObraAsignadaValue })
      };
      updatePersonal(updatedMember.id, updatedMember);
      setSelectedEmployeeDetail(updatedMember);
      setIsEditingLocation(false);
      setIsEditingAdelantos(false);
      setIsEditingPresencialidad(false);
      setIsEditingSeguro(false);
      setIsEditingObraAsignada(false);
      showToast('Datos actualizados');
    }
  };

  const handleAddMinute = () => {
    if (!selectedEmployeeDetail || !newMinuteCode.trim()) return;
    const newMinute = { id: Date.now().toString(), code: newMinuteCode.trim(), date: new Date().toISOString() };
    const updatedMinutes = [...(selectedEmployeeDetail.minutes || []), newMinute];
    const updatedMember = { ...selectedEmployeeDetail, minutes: updatedMinutes };
    updatePersonal(updatedMember.id, updatedMember);
    setSelectedEmployeeDetail(updatedMember);
    setNewMinuteCode('');
  };

  const handleAddMetric = () => {
    if (!selectedEmployeeDetail) return;
    if (!newMetric.salary || !newMetric.fuel || !newMetric.attendance) {
      showToast('Por favor, completa todos los campos de la métrica.');
      return;
    }
    const newHistoryEntry = {
      id: Date.now().toString(),
      month: newMetric.month,
      year: newMetric.year,
      salary: Number(newMetric.salary),
      fuel: Number(newMetric.fuel),
      attendance: Number(newMetric.attendance)
    };
    const updatedHistory = [...(selectedEmployeeDetail.metricsHistory || []), newHistoryEntry];
    const updatedMember = { ...selectedEmployeeDetail, metricsHistory: updatedHistory };
    updatePersonal(updatedMember.id, updatedMember);
    setSelectedEmployeeDetail(updatedMember);
    setIsAddingMetric(false);
    setNewMetric({ month: 'Enero', year: new Date().getFullYear(), salary: '', fuel: '', attendance: '' });
  };

  const handleRemoveMetric = (metricId: string) => {
    if (!selectedEmployeeDetail) return;
    const updatedHistory = (selectedEmployeeDetail.metricsHistory || []).filter(m => m.id !== metricId);
    const updatedMember = { ...selectedEmployeeDetail, metricsHistory: updatedHistory };
    updatePersonal(updatedMember.id, updatedMember);
    setSelectedEmployeeDetail(updatedMember);
  };

  const handleRemoveMinute = (minuteId: string) => {
    if (!selectedEmployeeDetail) return;
    const updatedMinutes = (selectedEmployeeDetail.minutes || []).filter(m => m.id !== minuteId);
    const updatedMember = { ...selectedEmployeeDetail, minutes: updatedMinutes };
    updatePersonal(updatedMember.id, updatedMember);
    setSelectedEmployeeDetail(updatedMember);
  };
  const handleToggleTask = (taskId: string) => {
    if (!selectedEmployeeDetail) return;
    const updatedTasks = (selectedEmployeeDetail.dailyTasks || []).map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updatedMember = { ...selectedEmployeeDetail, dailyTasks: updatedTasks };
    updatePersonal(updatedMember.id, updatedMember);
    setSelectedEmployeeDetail(updatedMember);
  };

  const handleAddTask = () => {
    if (!selectedEmployeeDetail || !newTaskTitle.trim()) return;
    const newTask = { id: Date.now().toString(), text: newTaskTitle.trim(), completed: false };
    const updatedTasks = [...(selectedEmployeeDetail.dailyTasks || []), newTask];
    const updatedMember = { ...selectedEmployeeDetail, dailyTasks: updatedTasks };
    updatePersonal(updatedMember.id, updatedMember);
    setSelectedEmployeeDetail(updatedMember);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedEmployeeDetail) return;
    const updatedTasks = (selectedEmployeeDetail.dailyTasks || []).filter(t => t.id !== taskId);
    const updatedMember = { ...selectedEmployeeDetail, dailyTasks: updatedTasks };
    updatePersonal(updatedMember.id, updatedMember);
    setSelectedEmployeeDetail(updatedMember);
  };

  const handleReportConsumption = async () => {
    if (!selectedEmployeeDetail || !newConsumption.materialId || newConsumption.qty <= 0) {
      showToast('Completa los campos obligatorios.');
      return;
    }

    if (newConsumption.project === 'unset') {
      showToast('Por favor selecciona el origen del consumo (General u Obra).');
      return;
    }

    let materialName = '';
    let selectedProject: any = null;

    const [typePrefix, actualId] = newConsumption.materialId.split('_');
    const isGral = typePrefix === 'gral';

    selectedProject = projectsData?.find(p => p.id === newConsumption.project);
    if (!selectedProject) return;
    
    let assignedItem: any = null;
    if (isGral) {
      assignedItem = materialesData?.find((i: any) => String(i.id) === String(actualId));
    } else {
      assignedItem = selectedProject.assignedItems?.find((i: any) => String(i.id) === String(actualId));
    }

    if (!assignedItem) {
      showToast(isGral ? 'Insumo general no encontrado.' : 'Insumo no encontrado en el proyecto.');
      return;
    }
    
    const currentStock = isGral ? (assignedItem.cantidad || assignedItem.qty) : (assignedItem.qty || assignedItem.cantidad);
    if (Number(currentStock) < Number(newConsumption.qty)) {
      showToast(isGral ? 'No hay suficiente stock en Inventario General.' : 'No hay suficiente stock en el proyecto.');
      return;
    }
    materialName = assignedItem.name || assignedItem.nombre;

    try {
      showToast('Aprobando e imputando inventario...');
      
      const newReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        materialId: actualId,
        materialName: materialName,
        qty: Number(newConsumption.qty),
        project: isGral ? `Inventario Gral. (${selectedProject.cliente})` : selectedProject.name,
        notes: newConsumption.notes,
        status: 'Aprobado' as 'Aprobado'
      };
      
      const updatedReports = [newReport, ...(selectedEmployeeDetail.consumptionReports || [])];
      const updatedMember = { ...selectedEmployeeDetail, consumptionReports: updatedReports };
      
      updatePersonal(updatedMember.id, updatedMember);
      setSelectedEmployeeDetail(updatedMember);

      if (isGral) {
         await updateMaterial(actualId, { cantidad: Number(currentStock) - Number(newConsumption.qty) });
      } else {
         const newAssignedItems = selectedProject.assignedItems.map((i: any) => 
            String(i.id) === String(actualId) ? { ...i, qty: Number(currentStock) - Number(newConsumption.qty) } : i
         );
         const newItemsCount = newAssignedItems.reduce((acc: number, item: any) => acc + Number(item.qty || item.cantidad || 0), 0);
         await updateProject(selectedProject.id, { assignedItems: newAssignedItems, itemsCount: newItemsCount });
      }
      
      showToast('Consumo registrado e inventario descontado.');
      setIsReportingConsumption(false);
      setNewConsumption({ materialId: '', qty: 1, notes: '', project: 'unset' });
    } catch (e: any) {
      showToast('Error al imputar inventario.');
    }
  };

  const handleReportFaltante = async () => {
    if (!selectedEmployeeDetail || !newConsumption.notes || newConsumption.project === 'unset') {
      showToast('Escribe los materiales que faltan y asegúrate de haber seleccionado una Obra real.');
      return;
    }

    const selectedProject: any = projectsData?.find(p => p.id === newConsumption.project);
    if (!selectedProject) return;

    try {
      const missingItemText = newConsumption.notes.trim();
      const newChecklist = [...(selectedProject.checklist || []), { id: Date.now(), text: `[Faltante Reportado] ${missingItemText}`, qty: Number(newConsumption.qty) || 1, isChecked: false }];
      await updateProject(selectedProject.id, { checklist: newChecklist });
      showToast('Faltante reportado e indexado en la checklist de la Obra.');
      setNewConsumption({ materialId: '', qty: 1, notes: '', project: 'unset' });
    } catch (error) {
      showToast('Error al reportar faltante.');
    }
  };


  const handleExportEmployeePDF = async () => {
    if (!selectedEmployeeDetail) return;

    setIsExporting(true);
    showToast('Generando PDF...');

    try {
      const printContent = document.createElement('div');
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';
      printContent.style.top = '0';
      printContent.style.width = '800px';
      printContent.style.backgroundColor = '#ffffff';

      printContent.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 30px;">Ficha de Empleado</h1>
          
          <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 40px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #4b5563; border: 2px solid #e5e7eb;">
              ${selectedEmployeeDetail.initials}
            </div>
            <div>
              <h2 style="margin: 0 0 5px 0; font-size: 28px; color: #111827;">${selectedEmployeeDetail.name}</h2>
              <p style="margin: 0; color: #059669; font-size: 18px; font-weight: 500;">${selectedEmployeeDetail.role}</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Estado</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #111827; text-transform: capitalize;">${selectedEmployeeDetail.status}</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Ubicación / Horario</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #111827;">${selectedEmployeeDetail.location || selectedEmployeeDetail.schedule || 'N/A'}</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Presencialidad</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #111827;">${selectedEmployeeDetail.presencialidad || 'No registrada'}</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Adelantos</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #111827;">${selectedEmployeeDetail.adelantos || '$0'}</p>
            </div>
          </div>

          ${selectedEmployeeDetail.dailyTasks?.length ? `
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Minuta / Tareas Diarias</h3>
          <ul style="list-style: none; padding: 0; margin-bottom: 30px;">
            ${selectedEmployeeDetail.dailyTasks.map(t => `
              <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: ${t.completed ? '#9ca3af' : '#111827'}; text-decoration: ${t.completed ? 'line-through' : 'none'};">
                <strong style="color: #059669;">${t.completed ? '✓' : '•'}</strong> ${t.text}
              </li>
            `).join('')}
          </ul>
          ` : ''}

          ${selectedEmployeeDetail.consumptionReports?.length ? `
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Reporte de Consumos</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Fecha</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Insumo</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Cantidad</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Obra/Proyecto</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Notas</th>
              </tr>
            </thead>
            <tbody>
              ${selectedEmployeeDetail.consumptionReports.map(rep => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">${new Date(rep.date).toLocaleDateString()}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: bold;">${rep.materialName}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${rep.qty}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">${rep.project}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px; font-style: italic;">${rep.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
          
          <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
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
      const fileName = `Ficha_${selectedEmployeeDetail.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      showToast('PDF exportado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error al generar el PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHRPDF = async () => {
    if (!selectedEmployeeDetail) return;

    setIsExporting(true);
    showToast('Generando comparativo de RRHH...');

    try {
      const printContent = document.createElement('div');
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';
      printContent.style.top = '0';
      printContent.style.width = '800px';
      printContent.style.backgroundColor = '#ffffff';

      printContent.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
          <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 30px;">Comportamiento e Historial - RRHH</h1>
          
          <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 40px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #4b5563; border: 2px solid #e5e7eb;">
              ${selectedEmployeeDetail.initials}
            </div>
            <div>
              <h2 style="margin: 0 0 5px 0; font-size: 28px; color: #111827;">${selectedEmployeeDetail.name}</h2>
              <p style="margin: 0; color: #059669; font-size: 18px; font-weight: 500;">${selectedEmployeeDetail.role}</p>
            </div>
          </div>
          
          ${selectedEmployeeDetail.metricsHistory && selectedEmployeeDetail.metricsHistory.length ? `
          <h3 style="color: #374151; font-size: 18px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Métricas Mensuales</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Período</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Salario</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Combustible</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 14px;">Presencialidad</th>
              </tr>
            </thead>
            <tbody>
              ${selectedEmployeeDetail.metricsHistory.slice().sort((a,b)=>a.year===b.year ? ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].indexOf(a.month) - ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].indexOf(b.month) : a.year-b.year).reverse().map((m: any) => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: bold;">${m.month} ${m.year}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">$${m.salary.toLocaleString('es-CL')}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">$${m.fuel.toLocaleString('es-CL')}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: ${m.attendance >= 90 ? '#047857' : m.attendance >= 70 ? '#b45309' : '#b91c1c'}; font-size: 14px; font-weight: bold;">${m.attendance}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<p style="color: #6b7280; font-style: italic;">No hay historial de métricas cargado.</p>'}
          
          <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
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
      const fileName = `Historial_RRHH_${selectedEmployeeDetail.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      showToast('PDF exportado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error al generar el PDF');
    } finally {
      setIsExporting(false);
    }
  };



  return (
    <div className="space-y-6">
      <header className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-bd-lines mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 p-2 sm:p-3 rounded-xl text-accent">
              {view === 'vehiculos' ? <Truck size={24} /> : <User size={24} />}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-tx-primary">
                {view === 'vehiculos' ? 'Gestión de Flota' : 'Gestión de Personal'}
              </h1>
              <p className="text-sm text-tx-secondary mt-1">Administración centralizada de recursos y equipo.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {view === 'vehiculos' ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setIsServiceModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#F27D26] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors text-sm shadow-md shadow-[#F27D26]/20">
                  <Plus size={18} /> Nuevo Service
                </button>
                <button onClick={() => setIsNewVehicleModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl font-bold hover:bg-accent/90 transition-colors text-sm shadow-md shadow-accent/20">
                  <Plus size={18} /> Nuevo
                </button>
              </div>
            ) : view === 'equipo' ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setIsNewMemberModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl font-bold hover:bg-accent/90 transition-colors text-sm shadow-md shadow-accent/20">
                  <Plus size={18} /> Nuevo Miembro
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setView('equipo')}
          className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", view === 'equipo' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
        >
          Empleados
        </button>
        <button
          onClick={() => setView('vehiculos')}
          className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", view === 'vehiculos' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
        >
          Vehículos de trabajo
        </button>


      </div>



      {view === 'equipo' && (
        <>
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-tx-secondary" size={20} />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-3 border border-bd-lines rounded-xl bg-card text-tx-primary placeholder-tx-secondary shadow-sm focus:ring-2 focus:ring-accent/20 focus:border-accent text-base transition-all outline-none"
                placeholder="Buscar miembro del equipo..."
                type="text"
              />
            </div>
            {/* Filtros de Tipo de Personal */}
            <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setActiveCategoryFilter('todos')}
                className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap", activeCategoryFilter === 'todos' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveCategoryFilter('interno')}
                className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2", activeCategoryFilter === 'interno' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
              >
                <User size={16} /> Operarios (Internos)
              </button>
              <button
                onClick={() => setActiveCategoryFilter('externo')}
                className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2", activeCategoryFilter === 'externo' ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card text-tx-secondary hover:bg-main border border-bd-lines")}
              >
                <Briefcase size={16} /> Profesionales (Externos)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {personalData.filter((m: PersonalMember) => activeCategoryFilter === 'todos' || m.category === activeCategoryFilter).map((member: PersonalMember) => (
              <div key={member.id} className={cn("glass-card p-4 md:p-5 flex flex-col justify-between transition-all gap-4", member.status === 'inactivo' && "opacity-60")}>
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-main border-2 border-bd-lines dark:border-emerald-500/10 flex items-center justify-center text-gray-500 dark:text-tx-secondary font-bold text-xl">{member.initials}</div>
                    <span className={cn("absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900",
                      member.status === 'activo' ? "bg-green-500" :
                        member.status === 'descanso' ? "bg-yellow-500" : "bg-gray-400"
                    )}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-tx-primary truncate">{member.name}</h3>
                          {member.category === 'externo' && (
                            <span className="bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">Externo</span>
                          )}
                        </div>
                        <p className="text-sm text-accent dark:text-emerald-400 font-medium mt-0.5">{member.role}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(member); }}
                          className="text-gray-400 dark:text-tx-secondary/70 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-500/10 transition-colors"
                          title="Editar Perfil"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(window.confirm('¿Seguro que deseas eliminar definitivamente a este empleado?')) {
                              removePersonal(member.id).then(() => showToast('Empleado borrado permanentemente'));
                            }
                          }}
                          className="text-gray-400 dark:text-tx-secondary/70 hover:text-red-500 p-1.5 rounded-full hover:bg-red-500/10 transition-colors"
                          title="Eliminar Empleado"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2 mb-1">
                      <div className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-500/20 flex items-center gap-1.5 uppercase tracking-wide">
                        <AlertTriangle size={12} /> Venc. ART/Seguro: Próximo
                      </div>
                    </div>

                  </div>
                </div>
                
                {/* Botones de acción directos */}
                <div className="pt-4 border-t border-bd-lines mt-auto w-full flex flex-col gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEmployeeDetail(member); }} 
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/20 transition-all text-sm border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-[0.98]"
                  >
                    <Briefcase size={16} className="shrink-0" /> Ver Expediente
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedEmployeeDetail(member); setEmployeeTab('ordenes'); setIsEmployeeDetailModalOpen(true); }} 
                    className="w-full min-h-[36px] flex items-center justify-center gap-2 bg-main text-tx-secondary hover:text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-xs border border-bd-lines active:scale-[0.98]"
                  >
                    <CheckSquare size={14} className="shrink-0" /> Órdenes Diarias
                  </button>
                </div>
              </div>
            ))}
          </div>


        </>
      )}

      {view === 'vehiculos' && (
        <div className="space-y-6">
          {/* Flota de Vehículos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-tx-primary">Vehículos de la Flota</h2>
              <button className="text-sm font-semibold text-accent dark:text-emerald-400 hover:underline">Ver todos</button>
            </div>

            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {vehicles.map((v: Vehicle) => (
                <div key={v.id} className="snap-center shrink-0 w-[240px] bg-card dark:bg-card rounded-2xl shadow-sm border border-bd-lines dark:border-bd-lines flex flex-col overflow-hidden cursor-pointer hover:shadow-md hover:border-accent/30 transition-all relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditVehicle(v);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-card/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-accent hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                  >
                    <MoreVertical size={16} />
                  </button>
                  <div
                    className="h-32 w-full bg-main/50 dark:bg-slate-800 bg-cover bg-center"
                    style={{ backgroundImage: `url('${v.image || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=500'}')` }}
                    onClick={() => setSelectedVehicleDetail(v)}
                  ></div>
                  <div className="p-4 flex-1 flex flex-col" onClick={() => setSelectedVehicleDetail(v)}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-tx-primary truncate pr-2">{v.name}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                        v.status === 'activo' ? "bg-green-100 text-green-700" :
                          v.status === 'taller' ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                      )}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-tx-secondary mb-3">{v.patente}</p>
                    <div className="mt-auto flex items-center text-xs text-gray-500 dark:text-tx-secondary gap-1">
                      {v.metricIcon === 'Activity' ? <Activity size={14} /> : <Clock size={14} />}
                      <span>{v.metric}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Services Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-tx-primary mb-4">Próximos Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingServices.map((service: UpcomingService) => {
                const vehicle = vehicles.find((v: Vehicle) => v.id === service.vehicleId);
                return (
                  <div key={service.id} className="flex items-center bg-card dark:bg-card p-4 rounded-2xl shadow-sm border border-bd-lines dark:border-bd-lines relative overflow-hidden group hover:shadow-md hover:border-accent/30 transition-all">
                    <button
                      onClick={() => handleOpenEditService(service)}
                      className="absolute top-2 right-2 p-1.5 bg-card/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-accent hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                      service.status === 'urgente' ? "bg-red-500" :
                        service.status === 'pronto' ? "bg-yellow-400" : "bg-accent"
                    )}></div>
                    <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mr-4 shrink-0",
                      service.status === 'urgente' ? "bg-red-50 text-red-600" :
                        service.status === 'pronto' ? "bg-yellow-50 text-yellow-600" : "bg-accent/10 text-accent"
                    )}>
                      {service.icon === 'Droplets' ? <Droplets size={24} /> :
                        service.icon === 'Wrench' ? <Wrench size={24} /> : <Truck size={24} />}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-tx-primary text-sm truncate">{service.title}</h4>
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full",
                          service.status === 'urgente' ? "text-red-600 bg-red-50" :
                            service.status === 'pronto' ? "text-yellow-600 bg-yellow-50" : "text-accent bg-accent/10"
                        )}>
                          {service.status === 'urgente' ? 'Urgente' : service.status === 'pronto' ? 'Pronto' : 'Programado'}
                        </span>
                      </div>
                      {vehicle && <p className="text-xs text-gray-500 dark:text-tx-secondary mb-1">{vehicle.name} • {vehicle.patente}</p>}
                      <p className={cn("text-xs font-semibold flex items-center gap-1",
                        service.status === 'urgente' ? "text-gray-700" :
                          service.status === 'pronto' ? "text-gray-600" : "text-gray-600"
                      )}>
                        {service.status === 'urgente' && <AlertTriangle size={14} className="text-red-500" />}
                        {service.status === 'pronto' && <Timer size={14} />}
                        {service.status === 'programado' && <CalendarDays size={14} />}
                        {service.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Corrective Maintenance Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-tx-primary">Mantenimientos Correctivos</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsCorrectiveModalOpen(true)} className="p-1.5 rounded text-accent hover:opacity-90/10 transition" title="Nuevo Reporte">
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-section">
              {correctiveIssues.map((issue: CorrectiveIssue) => {
                const vehicle = vehicles.find((v: Vehicle) => v.id === issue.vehicleId);
                return (
                  <div key={issue.id} className={cn("bg-card dark:bg-card p-4 rounded-2xl shadow-sm border border-bd-lines dark:border-bd-lines hover:shadow-md hover:border-accent/30 transition-all", issue.status === 'resuelto' && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        {issue.icon === 'Wrench' ? <Wrench size={16} /> : <BatteryWarning size={16} />}
                      </div>
                      <div className="flex-1">
                        <h4 className={cn("font-bold text-gray-900 dark:text-tx-primary text-sm", issue.status === 'resuelto' && "line-through")}>{issue.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-tx-secondary mt-1">Reportado por: {issue.reportedBy} • {issue.date}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded",
                        issue.status === 'pendiente' ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"
                      )}>
                        {issue.status}
                      </span>
                    </div>
                    {vehicle && (
                      <div className="mt-3 pl-11 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          {vehicle.image ? (
                            <div className="h-6 w-6 rounded-full bg-cover bg-center border border-gray-200 dark:border-bd-lines shadow-sm" style={{ backgroundImage: `url('${vehicle.image}')` }}></div>
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-main border border-gray-200 dark:border-bd-lines shadow-sm flex items-center justify-center">
                              <Truck size={10} className="text-gray-400 dark:text-tx-secondary" />
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-900 dark:text-tx-primary">{vehicle.name}</span>
                          <span className="text-xs text-gray-400 dark:text-tx-secondary">•</span>
                          <span className="text-xs text-gray-500 dark:text-tx-secondary">{vehicle.patente}</span>
                        </div>
                        {issue.status === 'pendiente' && (
                          <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast('Cotización formal enviada al administrador');
                              }}
                              className="text-xs font-bold text-[#F27D26] bg-[#F27D26]/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#F27D26]/20 transition-colors"
                            >
                              <FileText size={14} /> Solicitar Cotización de Repuesto
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCorrectiveIssue(issue.id.toString(), { ...issue, status: 'resuelto' });
                                showToast('Mantenimiento marcado como resuelto');
                              }}
                              className="text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90/20 transition-colors"
                            >
                              <CheckCircle size={14} /> Marcar Resuelto
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Options Modal */}
      {isOptionsModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 border border-bd-lines">
            <div className="p-4 border-b border-bd-lines flex justify-between items-center bg-main shrink-0">
              <h3 className="font-bold text-tx-primary text-base truncate pr-2">Opciones: {selectedMember.name}</h3>
              <button onClick={() => setIsOptionsModalOpen(false)} className="text-tx-secondary hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2">
              <button
                onClick={() => { setIsOptionsModalOpen(false); handleOpenEmployeeDetail(selectedMember); }}
                className="w-full text-left px-4 py-3.5 text-sm font-bold text-tx-primary hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-bd-lines"
              >
                <Briefcase size={18} className="text-emerald-400" />
                Ver Expediente / Ficha
              </button>
              <button
                onClick={() => handleOpenEdit()}
                className="w-full text-left px-4 py-3.5 text-sm font-bold text-tx-primary hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-bd-lines"
              >
                <Edit2 size={18} className="text-blue-400" />
                Editar Perfil del Empleado
              </button>
              <button
                onClick={handleDeleteMember}
                className="w-full text-left px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-red-500/20"
              >
                <Trash2 size={18} className="text-red-500" />
                Dar de Baja Definitiva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card dark:bg-card border border-transparent dark:border-bd-lines rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 dark:border-bd-lines flex justify-between items-center bg-gray-50/50 dark:bg-main/50">
              <h3 className="font-bold text-gray-900 dark:text-tx-primary">
                {editingItemType === 'vehicle' ? 'Editar Vehículo' :
                  editingItemType === 'delivery' ? 'Editar Entrega' :
                    editingItemType === 'service' ? 'Editar Service' :
                      'Editar Perfil del Empleado'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 dark:text-tx-secondary hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">
                  {editingItemType === 'vehicle' ? 'Nombre del Vehículo' :
                    editingItemType === 'delivery' ? 'Material / Carga' :
                      editingItemType === 'service' ? 'Título del Service' :
                        'Nombre Completo'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                  placeholder="Nombre"
                  autoFocus
                />
              </div>

              {!editingItemType && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Rol / Puesto</label>
                    <input type="text" value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Ubicación / Sector</label>
                    <input type="text" value={editEmployeeLocation} onChange={e => setEditEmployeeLocation(e.target.value)} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Categoría</label>
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium outline-none">
                        <option value="interno">Interno</option>
                        <option value="externo">Externo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Estado</label>
                      <select value={editEmployeeStatus} onChange={e => setEditEmployeeStatus(e.target.value as any)} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium outline-none">
                        <option value="activo">Activo</option>
                        <option value="descanso">Descanso</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">
                      Presencialidad
                    </label>
                    <input
                      type="text"
                      value={editPresencialidad}
                      onChange={(e) => setEditPresencialidad(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                      placeholder="Ej. 100%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">
                      Adelantos
                    </label>
                    <input
                      type="text"
                      value={editAdelantos}
                      onChange={(e) => setEditAdelantos(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                      placeholder="Ej. $5,000"
                    />
                  </div>
                </>
              )}

              {(editingItemType === 'vehicle' || editingItemType === 'delivery') && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Foto (Opcional)</label>
                  <div className="flex items-center gap-4">
                    {editImage ? (
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200">
                        <img src={editImage} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          onClick={() => setEditImage('')}
                          className="absolute top-1 right-1 p-1 bg-card/80 rounded-full text-red-500 hover:bg-card"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <Camera size={20} className="text-gray-400" />
                        <span className="text-[10px] font-medium text-gray-500">Subir</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {editingItemType === 'vehicle' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Estado</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                  >
                    <option value="activo">Activo</option>
                    <option value="taller">Taller</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-main px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-tx-primary hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-xl bg-accent dark:bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 dark:hover:bg-emerald-500 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicleDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95 border border-bd-lines">
            <div className="sticky top-0 bg-card z-10 p-4 border-b border-bd-lines flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-tx-primary">{selectedVehicleDetail.name}</h3>
                <p className="text-sm text-tx-secondary font-mono mt-0.5">Patente / ID: {selectedVehicleDetail.patente}</p>
              </div>
              <button onClick={() => setSelectedVehicleDetail(null)} className="text-tx-secondary hover:text-tx-primary p-2 rounded-full hover:bg-main transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-main/50 dark:bg-main/30 rounded-2xl p-4 border border-bd-lines dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-main">
                  <div className="flex items-center gap-2 text-tx-secondary mb-2">
                    <Activity size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Odómetro Total</span>
                  </div>
                  <div className="text-2xl font-bold text-tx-primary">{selectedVehicleDetail.horometro || 0} <span className="text-sm font-medium text-tx-secondary">{selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</span></div>
                </div>
                <div className="bg-main/50 dark:bg-main/30 rounded-2xl p-4 border border-bd-lines dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-main">
                  <div className="flex items-center gap-2 text-tx-secondary mb-2">
                    <MapPin size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Odóm. Obra</span>
                  </div>
                  <div className="text-2xl font-bold text-tx-primary">{selectedVehicleDetail.odometroPorObra || 0} <span className="text-sm font-medium text-tx-secondary">{selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</span></div>
                  <div className="text-xs text-accent dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium"><Locate size={10} /> GPS Tracked</div>
                </div>
                <div className="bg-main/50 dark:bg-main/30 rounded-2xl p-4 border border-bd-lines dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-main">
                  <div className="flex items-center gap-2 text-tx-secondary mb-2">
                    <Droplets size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Combustible</span>
                  </div>
                  <div className="flex flex-col gap-2 justify-center h-full pb-2">
                    <div className="text-2xl font-bold text-tx-primary">{selectedVehicleDetail.fuelLevel || 0}%</div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 flex-1 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", (selectedVehicleDetail.fuelLevel || 0) > 20 ? "bg-accent shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]")} style={{ width: `${selectedVehicleDetail.fuelLevel || 0}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="bg-main/50 dark:bg-main/30 rounded-2xl p-4 border border-bd-lines dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-main">
                  <div className="flex items-center gap-2 text-tx-secondary mb-2">
                    <Wrench size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Próx. Service</span>
                  </div>
                  <div className="text-2xl font-bold text-accent dark:text-emerald-400">{(selectedVehicleDetail.nextService || 0) - (selectedVehicleDetail.horometro || 0)} <span className="text-sm font-medium text-tx-secondary">{selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</span></div>
                  <div className="text-xs text-tx-secondary mt-1">a los {selectedVehicleDetail.nextService || 0} {selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</div>
                </div>
                <div className="bg-main/50 dark:bg-main/30 rounded-2xl p-4 border border-bd-lines dark:border-white/5 shadow-sm backdrop-blur-sm transition-all hover:bg-main">
                  <div className="flex items-center gap-2 text-tx-secondary mb-2">
                    <User size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Operario</span>
                  </div>
                  <div className="text-sm font-bold text-tx-primary truncate mt-1 bg-card dark:bg-card px-2 py-1.5 rounded-lg border border-bd-lines text-center">{selectedVehicleDetail.driver || 'Sin asignar'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Hola, reporto una falla técnica en el vehículo ${selectedVehicleDetail.name} (Patente: ${selectedVehicleDetail.patente}).`);
                    window.open(`https://wa.me/?text=${message}`, '_blank');
                  }}
                  className="flex-1 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <AlertTriangle size={18} /> Reportar Falla por WhatsApp
                </button>
                <button
                  onClick={() => {
                    setIsChangeUserModalOpen(true);
                  }}
                  className="flex-1 py-3 px-4 bg-accent/10 hover:bg-accent/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-accent dark:text-emerald-400 font-bold rounded-xl border border-accent/20 dark:border-emerald-500/20 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <User size={18} /> Cambiar Usuario
                </button>
              </div>

              {/* History */}
              <div>
                <h4 className="text-lg font-bold text-tx-primary mb-4 flex items-center gap-2">
                  <FileText className="text-accent" size={20} /> Historial de Reparaciones
                </h4>
                <div className="bg-main/50 border border-bd-lines rounded-xl shadow-sm overflow-hidden">
                  {selectedVehicleDetail.history && selectedVehicleDetail.history.length > 0 ? (
                    <div className="divide-y divide-bd-lines">
                      {selectedVehicleDetail.history.map((record: VehicleHistory) => (
                        <div key={record.id} className="p-4 hover:bg-main transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent">
                              {record.type}
                            </span>
                            <span className="text-sm font-medium text-tx-secondary">{record.date}</span>
                          </div>
                          <p className="text-tx-primary font-medium mt-2">{record.description}</p>
                          <p className="text-sm text-tx-secondary mt-1 font-mono">Costo: {record.cost}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-tx-secondary font-medium">
                      No hay registros de reparaciones.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change User Modal */}
      {isChangeUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card dark:bg-card border border-transparent dark:border-bd-lines rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 dark:border-bd-lines flex justify-between items-center bg-gray-50/50 dark:bg-main/50">
              <h3 className="font-bold text-gray-900 dark:text-tx-primary">Seleccionar Operario</h3>
              <button onClick={() => setIsChangeUserModalOpen(false)} className="text-gray-400 dark:text-tx-secondary hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {personalData.map((person: PersonalMember) => (
                <button
                  key={person.id}
                  onClick={() => {
                    if (!selectedVehicleDetail) return;
                    const updatedV = { ...selectedVehicleDetail, driver: person.name };
                    updateVehicle(selectedVehicleDetail.id.toString(), updatedV);
                    setSelectedVehicleDetail(updatedV);
                    setIsChangeUserModalOpen(false);
                    showToast('Usuario actualizado');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent dark:border-transparent hover:border-gray-100 dark:hover:border-slate-700 text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-accent/10 dark:bg-emerald-500/10 text-accent dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {person.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-tx-primary text-sm">{person.name}</p>
                    <p className="text-xs text-gray-500 dark:text-tx-secondary">{person.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card dark:bg-card border border-transparent dark:border-bd-lines rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95">
            <div className="sticky top-0 bg-card dark:bg-card z-10 p-4 border-b border-gray-100 dark:border-bd-lines flex items-center justify-between">
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-900 dark:text-tx-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-gray-900 dark:text-tx-primary text-lg font-bold leading-tight flex-1 text-center pr-10">Registro de Service</h2>
            </div>

            <div className="p-4 flex flex-col gap-6">
              {/* Section: Service Type */}
              <div className="flex flex-col gap-3">
                <h3 className="text-gray-900 dark:text-tx-primary text-base font-bold">Tipo de Servicio</h3>
                <div className="flex gap-3">
                  <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-accent text-white font-medium transition-all shadow-sm shadow-accent/20">
                    <Wrench size={20} />
                    Preventivo
                  </button>
                  <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-main text-gray-500 dark:text-tx-secondary font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                    <AlertTriangle size={20} />
                    Correctivo
                  </button>
                </div>
              </div>

              {/* Section: Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2 col-span-2">
                  <span className="text-gray-700 dark:text-tx-primary text-sm font-medium">Título del Service</span>
                  <div className="relative">
                    <Wrench size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-tx-secondary" />
                    <input value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} className="w-full pl-11 pr-4 h-14 rounded-xl border-gray-200 dark:border-bd-lines bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-tx-primary placeholder:text-gray-400 dark:placeholder:text-tx-secondary focus:border-accent focus:ring-accent" placeholder="Ej. Cambio de Aceite 50k" type="text" />
                  </div>
                </label>
                <label className="flex flex-col gap-2 col-span-2">
                  <span className="text-gray-700 dark:text-tx-primary text-sm font-medium">Vehículo</span>
                  <select value={newService.vehicleId} onChange={e => setNewService({...newService, vehicleId: Number(e.target.value)})} className="w-full h-14 rounded-xl border-gray-200 dark:border-bd-lines bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-tx-primary px-4 focus:border-accent focus:ring-accent">
                    {vehicles.map((v: Vehicle) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.patente})</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Section: Checklist */}
              <div className="flex flex-col gap-3">
                <h3 className="text-gray-900 dark:text-tx-primary text-base font-bold">Checklist Realizado</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-bd-lines bg-gray-50/50 dark:bg-main/50 hover:border-accent/30 cursor-pointer transition-colors group">
                    <input defaultChecked className="w-5 h-5 rounded text-accent focus:ring-accent border-gray-300 dark:border-slate-600 bg-card dark:bg-card mr-3" type="checkbox" />
                    <span className="text-gray-700 dark:text-tx-primary text-sm font-medium group-hover:text-accent transition-colors">Aceite y Filtro</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-bd-lines bg-gray-50/50 dark:bg-main/50 hover:border-accent/30 cursor-pointer transition-colors group">
                    <input className="w-5 h-5 rounded text-accent focus:ring-accent border-gray-300 dark:border-slate-600 bg-card dark:bg-card mr-3" type="checkbox" />
                    <span className="text-gray-700 dark:text-tx-primary text-sm font-medium group-hover:text-accent transition-colors">Frenos</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-bd-lines bg-gray-50/50 dark:bg-main/50 hover:border-accent/30 cursor-pointer transition-colors group">
                    <input className="w-5 h-5 rounded text-accent focus:ring-accent border-gray-300 dark:border-slate-600 bg-card dark:bg-card mr-3" type="checkbox" />
                    <span className="text-gray-700 dark:text-tx-primary text-sm font-medium group-hover:text-accent transition-colors">Luces</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-bd-lines bg-gray-50/50 dark:bg-main/50 hover:border-accent/30 cursor-pointer transition-colors group">
                    <input className="w-5 h-5 rounded text-accent focus:ring-accent border-gray-300 dark:border-slate-600 bg-card dark:bg-card mr-3" type="checkbox" />
                    <span className="text-gray-700 dark:text-tx-primary text-sm font-medium group-hover:text-accent transition-colors">Neumáticos</span>
                  </label>
                </div>
              </div>

              {/* Section: Document Upload */}
              <div className="flex flex-col gap-3">
                <h3 className="text-gray-900 dark:text-tx-primary text-base font-bold">Comprobante</h3>
                <div className="relative group cursor-pointer">
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-accent/30 dark:border-emerald-500/30 bg-accent/5 dark:bg-emerald-500/5 flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90/10 dark:hover:bg-emerald-500/10">
                    <div className="h-10 w-10 rounded-full bg-accent/10 dark:bg-emerald-500/20 flex items-center justify-center text-accent dark:text-emerald-400">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-accent dark:text-emerald-400 text-sm font-medium">Subir Factura o Recibo</p>
                  </div>
                </div>
              </div>

              {/* Section: Reminder */}
              <div className="flex flex-col gap-3 pb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900 dark:text-tx-primary text-base font-bold">Próximo Service</h3>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                      <div className="relative w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent dark:peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-main/50 rounded-xl border border-gray-100 dark:border-bd-lines flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 dark:text-tx-secondary mb-1 block">Por Fecha</label>
                      <div className="flex items-center h-10 w-full bg-card dark:bg-card rounded-lg px-3 border border-gray-200 dark:border-bd-lines text-gray-700 dark:text-tx-primary text-sm">
                        <CalendarDays size={16} className="mr-2 text-accent dark:text-emerald-500" />
                        12 Oct, 2024
                      </div>
                    </div>
                    <div className="w-[1px] h-10 bg-gray-200 dark:bg-slate-700"></div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 dark:text-tx-secondary mb-1 block">Por Km</label>
                      <div className="flex items-center h-10 w-full bg-card dark:bg-card rounded-lg px-3 border border-gray-200 dark:border-bd-lines text-gray-700 dark:text-tx-primary text-sm">
                        <Activity size={16} className="mr-2 text-accent dark:text-emerald-500" />
                        55,000
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="sticky bottom-0 pb-4 pt-2 bg-card dark:bg-card">
                <button
                  onClick={handleSaveNewService}
                  className="w-full h-14 bg-accent dark:bg-emerald-600 hover:bg-[#2e4c3c] dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-accent/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                >
                  <Save size={20} />
                  Programar Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corrective Maintenance Modal */}
      {isCorrectiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card dark:bg-card border border-transparent dark:border-bd-lines rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 dark:border-bd-lines flex justify-between items-center bg-gray-50/50 dark:bg-main/50">
              <h3 className="font-bold text-gray-900 dark:text-tx-primary">Reportar Falla Técnica</h3>
              <button onClick={() => setIsCorrectiveModalOpen(false)} className="text-gray-400 dark:text-tx-secondary hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Descripción del Problema</label>
                <input
                  type="text"
                  value={newCorrectiveIssue.title}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                  placeholder="Ej. Ruido en motor"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Reportado por</label>
                <input
                  type="text"
                  value={newCorrectiveIssue.reportedBy}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, reportedBy: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                  placeholder="Nombre del empleado"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Vehículo</label>
                <select
                  value={newCorrectiveIssue.vehicleId}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, vehicleId: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                >
                  {vehicles.map((v: Vehicle) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.patente})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Tipo de Falla</label>
                <select
                  value={newCorrectiveIssue.icon}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, icon: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-tx-primary focus:border-accent dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-emerald-500 font-medium"
                >
                  <option value="Wrench">Mecánica General</option>
                  <option value="BatteryWarning">Eléctrica / Batería</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCorrectiveModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-bd-lines bg-card dark:bg-main px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-tx-primary hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCorrectiveIssue}
                  className="flex-1 rounded-xl bg-accent dark:bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 dark:hover:bg-emerald-500 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {isEmployeeDetailModalOpen && selectedEmployeeDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={cn("relative bg-card dark:bg-card rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95 border border-transparent dark:border-bd-lines transition-all duration-300", employeeTab === 'ficha' ? "max-w-md" : "max-w-2xl")}>
            <div className="sticky top-0 z-20 flex flex-col bg-card dark:bg-main/95 backdrop-blur-md border-b border-gray-100 dark:border-bd-lines">
              <div className="p-4 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-tx-primary flex items-center gap-2">
                  <User size={18} className="text-accent dark:text-emerald-500" />
                  Expediente del Empleado
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={employeeTab === 'ficha' ? handleExportEmployeePDF : handleExportHRPDF}
                    disabled={isExporting}
                    className={cn("p-1.5 rounded transition", isExporting ? "text-gray-300 dark:text-tx-secondary" : "text-gray-500 dark:text-tx-secondary hover:text-accent dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-slate-800")}
                    title="Exportar a PDF"
                  >
                    <FileText size={18} className={isExporting ? "animate-pulse" : ""} />
                  </button>
                  <button onClick={() => setIsEmployeeDetailModalOpen(false)} className="text-gray-400 dark:text-tx-secondary p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex px-4 gap-6 bg-gray-50/50 dark:bg-main/50">
                <button 
                  onClick={() => setEmployeeTab('ficha')} 
                  className={cn("py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", employeeTab === 'ficha' ? "border-accent text-accent dark:border-emerald-500 dark:text-emerald-400" : "border-transparent text-gray-500 dark:text-tx-secondary hover:text-gray-700 dark:hover:text-tx-primary")}
                >
                  <Briefcase size={16} /> Ficha General
                </button>
                <button 
                  onClick={() => setEmployeeTab('rh')} 
                  className={cn("py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0", employeeTab === 'rh' ? "border-accent text-accent dark:border-emerald-500 dark:text-emerald-400" : "border-transparent text-gray-500 dark:text-tx-secondary hover:text-gray-700 dark:hover:text-tx-primary")}
                >
                  <Activity size={16} /> Recursos Humanos
                </button>
                <button 
                  onClick={() => setEmployeeTab('ordenes')} 
                  className={cn("py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0", employeeTab === 'ordenes' ? "border-accent text-accent dark:border-emerald-500 dark:text-emerald-400" : "border-transparent text-gray-500 dark:text-tx-secondary hover:text-gray-700 dark:hover:text-tx-primary")}
                >
                  <CheckSquare size={16} /> Órdenes Diarias
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              {employeeTab === 'ordenes' ? (
                <div className="animate-in slide-in-from-left-4 fade-in duration-300 flex flex-col gap-5">
                  {/* Encabezado y Filtros Rápidos */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-tx-primary flex items-center gap-2">
                        <CheckSquare size={20} className="text-emerald-500" />
                        Órdenes de {selectedEmployeeDetail.name.split(' ')[0]}
                      </h3>
                      <p className="text-sm text-tx-secondary mt-0.5">Gestión de tareas y mantenimientos diarios.</p>
                    </div>
                    <button onClick={() => setIsEmployeeOrderModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-colors shrink-0">
                      <Plus size={16} /> Nueva Orden
                    </button>
                  </div>

                  {(() => {
                    const activeEmployeeOrders = ordenesData?.filter((o: any) => o.empleado === selectedEmployeeDetail.name) || [];
                    const activeOrders = activeEmployeeOrders.filter((o: any) => o.status === 'en_curso');
                    const completedOrders = activeEmployeeOrders.filter((o: any) => o.status === 'completado');
                    const issuesOrders = activeEmployeeOrders.filter((o: any) => o.status === 'con_problemas');

                    const displayedOrders = selectedOrderTab === 'activas' ? [...activeOrders, ...issuesOrders] : completedOrders;
                    
                    const groupedHistory = displayedOrders.reduce((acc: any, cur: any) => {
                       const g = cur.monthGroup || 'Meses Anteriores';
                       if (!acc[g]) acc[g] = [];
                       acc[g].push(cur);
                       return acc;
                    }, {});

                    const getCategoryStyles = (cat: string) => {
                       if (cat?.includes('Pileta')) return { border: 'border-violet-500/20 hover:border-violet-500/40', shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.05)]', badgeBg: 'bg-violet-50 dark:bg-violet-500/10', badgeText: 'text-violet-600 dark:text-violet-400', badgeBorder: 'border-violet-100 dark:border-violet-500/20', strip: 'bg-violet-500' };
                       if (cat?.includes('Riego')) return { border: 'border-emerald-500/20 hover:border-emerald-500/40', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)]', badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10', badgeText: 'text-emerald-600 dark:text-emerald-400', badgeBorder: 'border-emerald-100 dark:border-emerald-500/20', strip: 'bg-emerald-500' };
                       if (cat?.includes('Mantenimiento')) return { border: 'border-orange-500/20 hover:border-orange-500/40', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.05)]', badgeBg: 'bg-orange-50 dark:bg-orange-500/10', badgeText: 'text-orange-600 dark:text-orange-400', badgeBorder: 'border-orange-100 dark:border-orange-500/20', strip: 'bg-orange-500' };
                       return { border: 'border-blue-500/20 hover:border-blue-500/40', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.05)]', badgeBg: 'bg-blue-50 dark:bg-blue-500/10', badgeText: 'text-blue-600 dark:text-blue-400', badgeBorder: 'border-blue-100 dark:border-blue-500/20', strip: 'bg-blue-500' };
                    };

                    return (
                      <>
                        {/* Píldoras de Filtro */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                          <button onClick={() => setSelectedOrderTab('activas')} className={cn("px-4 py-1.5 rounded-full font-bold border text-sm flex items-center gap-2 whitespace-nowrap transition-colors", selectedOrderTab === 'activas' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-main text-tx-secondary hover:text-tx-primary border-bd-lines hover:border-tx-secondary")}>
                            Activas ({activeOrders.length})
                          </button>
                          <button onClick={() => setSelectedOrderTab('completadas')} className={cn("px-4 py-1.5 rounded-full font-bold border text-sm flex items-center gap-2 whitespace-nowrap transition-colors", selectedOrderTab === 'completadas' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-main text-tx-secondary hover:text-tx-primary border-bd-lines hover:border-tx-secondary")}>
                            Completadas ({completedOrders.length})
                          </button>
                          <button className="px-4 py-1.5 rounded-full bg-main text-tx-secondary hover:text-red-400 font-bold border border-bd-lines hover:border-red-500/30 text-sm flex items-center gap-2 whitespace-nowrap transition-colors">
                            Con Problemas
                          </button>
                        </div>

                        {/* Contenido Dinámico con Estética Original */}
                        <div className="mt-4 space-y-4">
                            {displayedOrders.length === 0 && (
                                <div className="p-8 text-center bg-gray-50/50 dark:bg-main border border-dashed border-gray-200 dark:border-bd-lines rounded-xl">
                                    <CheckCircle size={32} className="mx-auto text-gray-300 dark:text-tx-secondary mb-2" />
                                    <p className="text-sm font-bold text-gray-500 dark:text-tx-secondary">No hay órdenes para mostrar.</p>
                                </div>
                            )}

                            {displayedOrders.map((orden: any) => {
                              const st = getCategoryStyles(orden.category);
                              return (
                              <div key={orden.id} className={cn("bg-card dark:bg-card border rounded-xl p-5 relative overflow-hidden group transition-colors", st.border, st.shadow)}>
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1", orden.status === 'completado' ? 'bg-slate-500' : st.strip)}></div>
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditEmployeeOrder(orden)} className="p-1.5 bg-gray-100 dark:bg-slate-800 text-tx-secondary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => removeOrden(orden.id)} className="p-1.5 bg-gray-100 dark:bg-slate-800 text-tx-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex justify-between items-start mb-4 pr-16 border-b border-bd-lines pb-3">
                                  <div>
                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block shadow-sm border", st.badgeBg, st.badgeText, st.badgeBorder)}>{orden.category}</span>
                                    <h4 className="font-extrabold text-tx-primary text-lg leading-tight">{orden.title}</h4>
                                    <p className="text-sm text-tx-secondary mt-1 font-medium flex items-center gap-1.5"><Activity size={14}/> {orden.location}</p>
                                    {orden.description && <p className="text-sm text-tx-secondary mt-2 p-2 bg-gray-50 dark:bg-main rounded-lg border border-bd-lines italic">"{orden.description}"</p>}
                                    {orden.tools && <p className={cn("text-xs font-bold mt-2 flex items-center gap-1", st.badgeText)}><Briefcase size={12}/> Recursos: {orden.tools}</p>}
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                  <span className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2", orden.status === 'completado' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                                    <Timer size={14} /> {orden.status === 'en_curso' ? 'En Curso' : 'Completado'} • {new Date(orden.date).toLocaleDateString()}
                                  </span>
                                  {orden.status === 'en_curso' && (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                      <button onClick={() => setToastMessage("📂 La subida de fotografías y archivos se habilitará próximamente.")} className="flex-1 sm:flex-none px-4 bg-main text-tx-primary hover:bg-slate-800 text-sm font-bold py-2 rounded-xl border border-bd-lines transition-colors inline-flex items-center justify-center gap-2"><CheckSquare size={16}/> Archivos</button>
                                      <button onClick={() => { updateOrden(orden.id, { status: 'completado' }); setToastMessage("✅ Obra finalizada y movida al historial completado"); }} className="flex-1 sm:flex-none px-4 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-sm font-bold py-2 rounded-xl transition-all inline-flex items-center justify-center gap-2"><CheckCircle size={16}/> Finalizar Obra</button>
                                    </div>
                                  )}
                                  {orden.status === 'completado' && (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                      <button onClick={() => updateOrden(orden.id, { status: 'en_curso' })} className="flex-1 sm:flex-none px-4 bg-main text-tx-primary hover:bg-slate-800 text-sm font-bold py-2 rounded-xl border border-bd-lines transition-colors inline-flex items-center justify-center gap-2"><ArrowRight size={16}/> Reabrir</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                             );
                            })}
                        </div>
                      </>
                    );
                  })()}

                </div>
              ) : employeeTab === 'ficha' ? (
                <div className="animate-in slide-in-from-left-4 fade-in duration-300 flex flex-col gap-5">
                  <div className="flex items-center gap-4 bg-card dark:bg-main p-4 rounded-xl border border-gray-100 dark:border-bd-lines shadow-sm shrink-0">
                    <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-slate-700 border-2 border-white dark:border-bd-lines flex items-center justify-center text-gray-500 dark:text-tx-secondary font-bold text-xl shadow-sm shrink-0">
                      {selectedEmployeeDetail.initials}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-gray-900 dark:text-tx-primary truncate">{selectedEmployeeDetail.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-tx-secondary font-medium truncate">{selectedEmployeeDetail.role} • {selectedEmployeeDetail.category === 'interno' ? 'Planta Permanente' : 'Contratista Externo'}</p>
                    </div>
                  </div>

              {/* Información Operativa Card */}
              <div className="bg-card dark:bg-main rounded-xl p-5 border border-gray-100 dark:border-bd-lines shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" /> Información Operativa
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Adelantos */}
                  <div className="flex flex-col justify-between p-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-bd-lines rounded-xl group hover:border-accent/40 transition-colors gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-widest flex items-center gap-2">Adelantos</span>
                      <button
                        onClick={() => {
                          setIsEditingAdelantos(!isEditingAdelantos);
                          if (!isEditingAdelantos) setEditAdelantosValue(selectedEmployeeDetail.adelantos || '$0');
                        }}
                        className="text-gray-400 dark:text-tx-secondary hover:text-accent transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    {isEditingAdelantos ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editAdelantosValue}
                          onChange={(e) => setEditAdelantosValue(e.target.value)}
                          className="w-full p-2 text-sm bg-gray-50 dark:bg-main text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-bd-lines rounded-lg focus:outline-none focus:border-accent transition-colors font-bold shadow-inner"
                          autoFocus
                        />
                        <button onClick={handleSaveEmployeeDetail} className="bg-accent text-white px-3 rounded-lg hover:brightness-110 font-bold transition-all shadow-sm">
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xl font-black text-gray-900 dark:text-tx-primary">{selectedEmployeeDetail.adelantos || '$0'}</span>
                    )}
                  </div>

                  {/* Seguro / ART */}
                  <div className="flex flex-col justify-between p-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-bd-lines rounded-xl group hover:border-accent/40 transition-colors gap-2">
                     <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-widest flex items-center gap-2">Seguro / ART</span>
                      <button
                        onClick={() => {
                          setIsEditingSeguro(!isEditingSeguro);
                          if (!isEditingSeguro) setEditSeguroValue(selectedEmployeeDetail.seguro || '');
                        }}
                        className="text-gray-400 dark:text-tx-secondary hover:text-accent transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    {isEditingSeguro ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editSeguroValue}
                          onChange={(e) => setEditSeguroValue(e.target.value)}
                          className="w-full p-2 text-sm bg-gray-50 dark:bg-main text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-bd-lines rounded-lg focus:outline-none focus:border-accent transition-colors font-bold shadow-inner"
                          autoFocus
                        />
                        <button onClick={handleSaveEmployeeDetail} className="bg-accent text-white px-3 rounded-lg hover:brightness-110 font-bold transition-all shadow-sm">
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                       <span className="text-xl font-black text-gray-900 dark:text-tx-primary">{selectedEmployeeDetail.seguro || 'No especificado'}</span>
                    )}
                  </div>

                  {/* Obra Asignada */}
                  <div className="flex flex-col justify-between p-4 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-bd-lines rounded-xl group hover:border-accent/40 transition-colors gap-2 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-widest flex items-center gap-2">Obra Actual Asignada</span>
                      <button
                        onClick={() => {
                          setIsEditingObraAsignada(!isEditingObraAsignada);
                          if (!isEditingObraAsignada) setEditObraAsignadaValue(selectedEmployeeDetail.obraAsignada || '');
                        }}
                        className="text-gray-400 dark:text-tx-secondary hover:text-accent transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    {isEditingObraAsignada ? (
                      <div className="flex gap-2">
                         <select
                           value={editObraAsignadaValue}
                           onChange={(e) => setEditObraAsignadaValue(e.target.value)}
                           className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-main text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-bd-lines rounded-lg focus:outline-none focus:border-accent transition-colors font-bold shadow-inner"
                         >
                           <option value="">Sin Asignar</option>
                           {projectsData && Object.entries(
                              projectsData.reduce((acc: any, p: any) => {
                                 const clientName = p.cliente || 'Sin Cliente';
                                 if (!acc[clientName]) acc[clientName] = [];
                                 acc[clientName].push(p);
                                 return acc;
                              }, {})
                           ).map(([client, projs]: any) => (
                              <optgroup key={client} label={`Cliente: ${client}`}>
                                 {projs.map((p: any) => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                 ))}
                              </optgroup>
                           ))}
                         </select>
                         <button onClick={handleSaveEmployeeDetail} className="bg-accent text-white px-4 rounded-lg hover:brightness-110 font-bold transition-all shadow-sm">
                           Guardar
                         </button>
                      </div>
                    ) : (
                      <span className="text-xl font-black text-gray-900 dark:text-tx-primary line-clamp-1">
                        {(() => {
                           if (!selectedEmployeeDetail.obraAsignada) return 'Ninguna obra asignada';
                           const proj = projectsData?.find((p: any) => p.name === selectedEmployeeDetail.obraAsignada);
                           return proj ? `${proj.cliente || 'Sin Cliente'} • ${proj.name}` : selectedEmployeeDetail.obraAsignada;
                        })()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reporte de Consumos Card */}
              <div className="bg-card dark:bg-main rounded-xl p-5 border border-gray-100 dark:border-bd-lines shadow-sm flex flex-col gap-4">
                 <div className="flex justify-between items-center mb-1">
                   <p className="text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider flex items-center gap-2">
                     <FileText size={16} className="text-purple-500" /> Registro de Consumos en Obra
                   </p>
                 </div>
                 
                 <div className="flex flex-col gap-3">
                    <select 
                      value={newConsumption.project} 
                      onChange={e => setNewConsumption({...newConsumption, project: e.target.value, materialId: ''})} 
                      className="w-full text-sm bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-bd-lines p-3 rounded-lg outline-none focus:border-accent transition-colors font-bold shadow-sm"
                    >
                      <option value="unset" disabled>Seleccionar Obra (Agrupado por Cliente)...</option>
                      {projectsData && Object.entries(
                        projectsData.reduce((acc: any, p: any) => {
                          const clientName = p.cliente || 'Sin Cliente';
                          if (!acc[clientName]) acc[clientName] = [];
                          acc[clientName].push(p);
                          return acc;
                        }, {})
                      ).map(([client, projs]: any) => (
                        <optgroup key={client} label={`Cliente: ${client}`}>
                          {projs.map((p: any) => (
                             <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    {newConsumption.project !== 'unset' && (
                      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 p-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-bd-lines rounded-xl">
                        <select 
                          value={newConsumption.materialId} 
                          onChange={e => setNewConsumption({...newConsumption, materialId: e.target.value})} 
                          className="w-full text-sm bg-gray-50 dark:bg-main text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-bd-lines p-3 rounded-lg outline-none focus:border-accent transition-colors font-semibold shadow-inner"
                        >
                          <option value="">Selecciona un insumo...</option>
                          {(() => {
                            const selectedProj = projectsData?.find((p: any) => p.id === newConsumption.project);
                            const projItems = selectedProj?.assignedItems || [];
                            const clientMaterials = materialesData?.filter((m: any) => m.clienteId && m.clienteId !== 'sin-asignar' && m.clienteId === selectedProj?.clienteId) || [];
                            
                            return (
                              <>
                                {projItems.length > 0 && (
                                  <optgroup label={`Insumos Directos de la Obra: ${selectedProj?.name}`}>
                                    {projItems.map((m: any) => <option key={`obra_${m.id || Math.random()}`} value={`obra_${m.id}`}>{m.name || m.nombre} (Stock: {m.qty || m.cantidad})</option>)}
                                  </optgroup>
                                )}
                                {clientMaterials.length > 0 && (
                                  <optgroup label={`Catálogo General del Cliente: ${selectedProj?.cliente}`}>
                                    {clientMaterials.map((m: any) => <option key={`gral_${m.id || Math.random()}`} value={`gral_${m.id}`}>{m.name || m.nombre} (Stock: {m.qty || m.cantidad})</option>)}
                                  </optgroup>
                                )}
                              </>
                            );
                          })()}
                        </select>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            min="1" 
                            value={newConsumption.qty} 
                            onChange={e => setNewConsumption({...newConsumption, qty: Number(e.target.value)})} 
                            placeholder="Cant." 
                            className="w-[88px] text-sm bg-gray-50 dark:bg-main text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-bd-lines p-3 rounded-lg outline-none focus:border-accent transition-colors font-bold shadow-inner" 
                          />
                          <input 
                            type="text" 
                            value={newConsumption.notes} 
                            onChange={e => setNewConsumption({...newConsumption, notes: e.target.value})} 
                            placeholder={newConsumption.project !== 'unset' ? "Notas (o reporte de faltante)..." : "Notas..."} 
                            className="flex-1 text-sm bg-gray-50 dark:bg-main text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-bd-lines p-3 rounded-lg outline-none focus:border-accent transition-colors shadow-inner" 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (newConsumption.project !== 'unset' && !newConsumption.materialId && newConsumption.notes.trim()) {
                                  handleReportFaltante();
                                } else {
                                  handleReportConsumption();
                                }
                              }
                            }}
                          />
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={handleReportConsumption} 
                              disabled={!newConsumption.materialId || newConsumption.qty <= 0}
                              className="bg-accent hover:bg-[#2c4a3b] text-white p-3 rounded-lg transition-colors disabled:opacity-50 shadow-sm w-[46px] flex items-center justify-center font-bold"
                              title="Registrar Consumo"
                            >
                              <CheckCircle size={18} />
                            </button>
                            {newConsumption.project !== 'unset' && (
                              <button 
                                onClick={handleReportFaltante} 
                                disabled={!newConsumption.notes.trim() || !!newConsumption.materialId}
                                className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg transition-colors disabled:opacity-50 border border-transparent dark:border-red-500/20 w-[46px] flex items-center justify-center shadow-sm"
                                title="Reportar Faltante en Obra (Escribir en Notas)"
                              >
                                <AlertTriangle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                   {(selectedEmployeeDetail.consumptionReports || []).map(rep => (
                    <div key={rep.id} className="text-xs bg-gray-50/50 dark:bg-slate-900/50 p-3 border border-gray-100 dark:border-bd-lines rounded-xl shadow-sm hover:border-accent/40 transition-colors group">
                      <div className="flex justify-between font-extrabold text-gray-800 dark:text-tx-primary border-b border-gray-100 dark:border-bd-lines pb-2 mb-2">
                        <span className="text-sm">{rep.qty}x {rep.materialName}</span>
                        <span className="text-accent group-hover:brightness-110 transition-colors">{new Date(rep.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 dark:text-tx-secondary font-bold text-sm tracking-tight">{rep.project}</p>
                      {rep.notes && <p className="text-gray-500 dark:text-tx-secondary italic mt-1.5 bg-gray-100 dark:bg-card/50 px-2.5 py-2 rounded-md shadow-inner">"{rep.notes}"</p>}
                    </div>
                  ))}
                  {!(selectedEmployeeDetail.consumptionReports?.length) && (
                    <div className="py-8 bg-gray-50/50 dark:bg-main rounded-xl border border-gray-200 dark:border-bd-lines border-dashed flex flex-col items-center justify-center gap-2">
                       <p className="text-sm italic font-bold text-gray-400 dark:text-tx-secondary">No hay historial de consumos registrado.</p>
                    </div>
                  )}
                 </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-bd-lines">
               <button
                 onClick={() => {
                   setSelectedMember(selectedEmployeeDetail);
                   handleDeleteMember();
                 }}
                 className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
               >
                 <X size={16} /> Eliminar
               </button>
                                <button
                  onClick={() => {
                    setSelectedMember(selectedEmployeeDetail);
                    handleOpenEdit(selectedEmployeeDetail);
                    setIsEmployeeDetailModalOpen(false);
                  }}
                  className="px-4 py-2 bg-accent dark:bg-emerald-600 text-white font-medium rounded-lg hover:opacity-90 dark:hover:bg-emerald-500 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={16} /> Editar Datos
                </button>
               </div>
             </div>
           ) : (
             <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-5">
<div className="flex items-center gap-4 bg-card dark:bg-main p-4 rounded-xl border border-gray-100 dark:border-bd-lines shadow-sm shrink-0">
                 <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-slate-700 border-2 border-white dark:border-bd-lines flex items-center justify-center text-gray-500 dark:text-tx-secondary font-bold text-xl shadow-sm shrink-0">
                   {selectedEmployeeDetail.initials}
                 </div>
                 <div className="min-w-0">
                   <h2 className="text-xl font-black text-gray-900 dark:text-tx-primary truncate">{selectedEmployeeDetail.name}</h2>
                   <p className="text-sm text-gray-500 dark:text-tx-secondary font-medium truncate">{selectedEmployeeDetail.role} • {selectedEmployeeDetail.category === 'interno' ? 'Planta Permanente' : 'Contratista Externo'}</p>
                 </div>
               </div>

               {/* Historial de Métricas Mensuales */}
               <div className="bg-card dark:bg-main rounded-xl p-5 border border-gray-100 dark:border-bd-lines shadow-sm flex flex-col gap-4">
                 <div className="flex justify-between items-center mb-1">
                   <p className="text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Historial de Métricas Mensuales</p>
                   <button 
                     onClick={() => setIsAddingMetric(!isAddingMetric)} 
                     className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                   >
                     {isAddingMetric ? 'Cancelar' : '+ Añadir Mes'}
                   </button>
                 </div>

                 {/* Trend Graph (Mini bars) */}
                 {selectedEmployeeDetail.metricsHistory && selectedEmployeeDetail.metricsHistory.length > 0 && (
                   <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-card/50 border border-gray-100 dark:border-bd-lines rounded-xl">
                     <p className="text-[10px] font-bold text-gray-400 uppercase text-center tracking-widest">Tendencia de Presencialidad</p>
                     <div className="flex items-end justify-center gap-4 h-28 w-full mt-2">
                       {selectedEmployeeDetail.metricsHistory.slice().reverse().map(m => (
                          <div key={`chart_${m.id}`} className="flex flex-col items-center justify-end h-full gap-2 group relative">
                            {/* Bar Track */}
                            <div className="w-8 bg-gray-200 dark:bg-main rounded-t-md flex-1 flex items-end overflow-hidden shadow-inner relative">
                              {/* Actual Bar Fill */}
                              <div 
                                className={`w-full rounded-t-sm transition-all duration-500 relative ${m.attendance >= 90 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_-4px_10px_rgba(16,185,129,0.3)]' : m.attendance >= 70 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' : 'bg-gradient-to-t from-red-600 to-red-400'}`} 
                                style={{ height: `${Math.max(10, m.attendance)}%` }}
                              >
                                 <div className="absolute inset-x-0 top-0 h-1 bg-white/30 rounded-t-sm"></div>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold tracking-wider">{m.month.substr(0,3)}</span>
                            {/* Tooltip */}
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md transition-opacity pointer-events-none whitespace-nowrap z-10 font-bold shadow-lg">
                              {m.attendance}%
                            </div>
                          </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Add Form */}
                 {isAddingMetric && (
                   <div className="bg-blue-50/50 dark:bg-card/50 p-4 border border-blue-100 dark:border-bd-lines rounded-xl grid grid-cols-2 gap-3 mb-2 animate-in slide-in-from-top-2">
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">Mes</label>
                        <select value={newMetric.month} onChange={e => setNewMetric({...newMetric, month: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-card dark:bg-main text-gray-900 dark:text-tx-primary outline-none focus:border-blue-500">
                          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map(mes => <option key={mes} value={mes}>{mes}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">Año</label>
                        <input type="number" value={newMetric.year} onChange={e => setNewMetric({...newMetric, year: Number(e.target.value)})} className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-card dark:bg-main text-gray-900 dark:text-tx-primary outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">Costo Salarial ($)</label>
                        <input type="number" value={newMetric.salary} onChange={e => setNewMetric({...newMetric, salary: e.target.value})} placeholder="Ej. 500000" className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-card dark:bg-main text-gray-900 dark:text-tx-primary outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">Combustible ($)</label>
                        <input type="number" value={newMetric.fuel} onChange={e => setNewMetric({...newMetric, fuel: e.target.value})} placeholder="Ej. 45000" className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-card dark:bg-main text-gray-900 dark:text-tx-primary outline-none focus:border-blue-500" />
                      </div>
                      <div className="col-span-2 flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">Presencialidad (%)</label>
                          <input type="number" min="0" max="100" value={newMetric.attendance} onChange={e => setNewMetric({...newMetric, attendance: e.target.value})} placeholder="Ej. 100" className="w-full text-sm p-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-card dark:bg-main text-gray-900 dark:text-tx-primary outline-none focus:border-blue-500" />
                        </div>
                        <button onClick={handleAddMetric} className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white font-bold h-[38px] px-6 rounded-lg flex items-center justify-center gap-2 transition-colors">
                          <Check size={16}/> Guardar
                        </button>
                      </div>
                   </div>
                 )}

                 {/* List / Table */}
                 <div className="overflow-x-auto border border-gray-100 dark:border-bd-lines rounded-lg shadow-sm">
                   <table className="w-full text-sm text-left align-middle">
                     <thead className="bg-gray-50/80 dark:bg-main/80 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <tr>
                         <th className="px-4 py-3 border-b border-gray-100 dark:border-bd-lines">Período</th>
                         <th className="px-4 py-3 border-b border-gray-100 dark:border-bd-lines"><div className="flex items-center gap-1"><DollarSign size={13}/> Salario</div></th>
                         <th className="px-4 py-3 border-b border-gray-100 dark:border-bd-lines"><div className="flex items-center gap-1"><Fuel size={13}/> Combust.</div></th>
                         <th className="px-4 py-3 border-b border-gray-100 dark:border-bd-lines"><div className="flex items-center gap-1"><CalendarDays size={13}/> Pres.</div></th>
                         <th className="px-4 py-3 border-b border-gray-100 dark:border-bd-lines w-10"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                       {selectedEmployeeDetail.metricsHistory?.slice().sort((a,b)=>a.year===b.year ? ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].indexOf(a.month) - ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].indexOf(b.month) : a.year-b.year).reverse().map(m => (
                         <tr key={m.id} className="bg-card dark:bg-card hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="px-4 py-3 font-bold text-gray-900 dark:text-tx-primary">{m.month} <span className="text-gray-400 font-normal">{m.year}</span></td>
                           <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">
                             ${m.salary.toLocaleString('es-CL')}
                           </td>
                           <td className="px-4 py-3 font-bold text-orange-600 dark:text-orange-400">
                             ${m.fuel.toLocaleString('es-CL')}
                           </td>
                           <td className="px-4 py-3">
                             <div className={`px-2 py-1 rounded inline-block text-xs font-bold leading-none ${m.attendance >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : m.attendance >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                               {m.attendance}%
                             </div>
                           </td>
                           <td className="px-4 py-3 text-right">
                              <button onClick={() => handleRemoveMetric(m.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                           </td>
                         </tr>
                       ))}
                       {(!selectedEmployeeDetail.metricsHistory || selectedEmployeeDetail.metricsHistory.length === 0) && (
                         <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-tx-secondary italic">No hay historial de métricas registrado. Haz click en "Añadir Mes" para comenzar.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>

               {/* Órdenes de Trabajo */}
               <div className="bg-card dark:bg-main rounded-xl p-5 border border-gray-100 dark:border-bd-lines shadow-sm flex-1 flex flex-col min-h-[250px]">
                 <div className="flex justify-between items-center mb-4">
                   <p className="text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider flex items-center gap-2"><Briefcase size={16} className="text-purple-500"/> Repositorio de Órdenes de Trabajo</p>
                 </div>
                 <div className="flex gap-2 mb-4">
                   <input 
                     type="text" 
                     value={newMinuteCode} 
                     onChange={e => setNewMinuteCode(e.target.value)} 
                     placeholder="Añadir código o título de la orden..." 
                     className="flex-1 text-sm bg-gray-50 dark:bg-card text-gray-900 dark:text-tx-primary border border-gray-200 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors shadow-sm"
                     onKeyDown={(e) => { if (e.key === 'Enter') handleAddMinute(); }}
                   />
                   <button onClick={handleAddMinute} className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white px-5 rounded-lg transition-colors font-bold text-sm">Adjuntar</button>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                   {/* Órdenes generadas en sistema */}
                   {ordenesData?.filter((o: any) => o.empleado === selectedEmployeeDetail.name).map((o: any) => (
                     <div key={`sys-${o.id}`} className="flex items-center justify-between bg-blue-50/30 dark:bg-card p-3 border border-blue-100/50 dark:border-blue-500/20 rounded-xl group hover:border-blue-300 dark:hover:border-blue-500/40 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg text-blue-600 dark:text-blue-400"><Briefcase size={16} /></div>
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-gray-700 dark:text-tx-primary line-clamp-1">{o.proyectoNombre || 'Orden General'}</span>
                           <span className="text-xs text-gray-400 font-medium">Fecha: {o.fecha} • Cliente: {o.clienteNombre || 'S/A'}</span>
                         </div>
                       </div>
                       {o.pdfCertificadoUrl && (
                         <a href={o.pdfCertificadoUrl} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center shrink-0">
                            Ver PDF
                         </a>
                       )}
                     </div>
                   ))}

                   {/* Órdenes vinculadas manualmente */}
                   {(selectedEmployeeDetail.minutes || []).map(m => (
                     <div key={m.id} className="flex items-center justify-between bg-gray-50/50 dark:bg-card p-3 border border-gray-100 dark:border-bd-lines rounded-xl group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg text-purple-600 dark:text-purple-400"><FileText size={16} /></div>
                         <div>
                           <span className="block text-sm font-bold text-gray-700 dark:text-tx-primary">{m.code}</span>
                           <span className="block text-xs text-gray-400 font-medium">Asignada el {new Date(m.date).toLocaleDateString()}</span>
                         </div>
                       </div>
                       <button onClick={() => handleRemoveMinute(m.id)} className="p-2 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><Trash2 size={16} /></button>
                     </div>
                   ))}

                   {!(selectedEmployeeDetail.minutes?.length) && !ordenesData?.some((o: any) => o.empleado === selectedEmployeeDetail.name) && (
                     <div className="h-full flex flex-col items-center justify-center py-6 text-gray-400 dark:text-tx-secondary">
                       <Briefcase size={32} className="mb-2 opacity-50"/>
                       <p className="text-sm font-medium">Buzón de órdenes vacío</p>
                       <p className="text-xs opacity-70">Adjunta la orden de trabajo según su código o título</p>
                     </div>
                   )}
                 </div>
               </div>
              </div>
            )}
            </div>
            </div>
          </div>
        )}

      {/* HR Detail Modal */}
      



      {/* Toast Notification */}
      {/* Add New Member Modal */}
      {isEmployeeOrderModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-card border border-transparent dark:border-bd-lines rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-bd-lines flex justify-between items-center bg-gray-50/50 dark:bg-main/50">
              <h3 className="font-bold text-gray-900 dark:text-tx-primary flex items-center gap-2"><Plus size={18} className="text-accent dark:text-emerald-500" /> {newEmployeeOrder.id ? 'Editar Orden Diaria' : 'Nueva Orden Diaria'}</h3>
              <button onClick={() => { setIsEmployeeOrderModalOpen(false); setNewEmployeeOrder({id:'', title:'', location:'', category:'Mantenimiento de Piletas', description: '', tools: '', scheduledDate: new Date().toISOString().split('T')[0]}); }} className="text-gray-400 dark:text-tx-secondary hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto hide-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Título / Tarea Principal</label>
                  <input type="text" value={newEmployeeOrder.title} onChange={e => setNewEmployeeOrder({ ...newEmployeeOrder, title: e.target.value })} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-bold p-3" placeholder="Ej: Reparación general de sistema..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Ubicación / Cliente</label>
                  <input type="text" value={newEmployeeOrder.location} onChange={e => setNewEmployeeOrder({ ...newEmployeeOrder, location: e.target.value })} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium p-3" placeholder="Ej: Las Palmas Lote 44" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Categoría</label>
                  <select value={newEmployeeOrder.category} onChange={e => setNewEmployeeOrder({ ...newEmployeeOrder, category: e.target.value })} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium p-3">
                    <option value="Mantenimiento de Piletas">Piletas</option>
                    <option value="Riego Automatizado">Riego</option>
                    <option value="Desarrollo de Obra">Obra</option>
                    <option value="Mantenimiento General">Mantenimiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Fecha Programada</label>
                  <input type="date" value={newEmployeeOrder.scheduledDate} onChange={e => setNewEmployeeOrder({ ...newEmployeeOrder, scheduledDate: e.target.value })} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium p-3" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Insumos / Herramientas</label>
                  <input type="text" value={newEmployeeOrder.tools} onChange={e => setNewEmployeeOrder({ ...newEmployeeOrder, tools: e.target.value })} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium p-3" placeholder="Ej: 2 Filtros, Llave inglesa..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-tx-secondary uppercase tracking-wider mb-1.5">Descripción Detallada / Protocolo</label>
                  <textarea rows={4} value={newEmployeeOrder.description} onChange={e => setNewEmployeeOrder({ ...newEmployeeOrder, description: e.target.value })} className="w-full rounded-xl border-gray-200 dark:border-bd-lines bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary text-sm focus:border-accent dark:focus:border-emerald-500 focus:ring-accent dark:focus:ring-emerald-500 font-medium p-3" placeholder="Describe los detalles de la visita, checklist a cumplir..." />
                </div>
              </div>
              <button onClick={handleSaveEmployeeOrder} className="w-full h-14 bg-accent dark:bg-emerald-600 hover:opacity-90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
                {newEmployeeOrder.id ? 'Guardar Cambios' : 'Generar y Asignar Orden'} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isNewMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card dark:bg-card border border-transparent dark:border-bd-lines rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-bd-lines flex justify-between items-center bg-gray-50/50 dark:bg-main/50">
              <h3 className="font-bold text-gray-900 dark:text-tx-primary flex items-center gap-2"><User size={18} className="text-accent dark:text-emerald-500" /> Nuevo Miembro</h3>
              <button onClick={() => setIsNewMemberModalOpen(false)} className="text-gray-400 dark:text-tx-secondary hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Nombre Completo</label>
                <input type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary border-gray-300 dark:border-bd-lines rounded-lg text-sm focus:ring-accent focus:border-accent dark:focus:ring-emerald-500 dark:focus:border-emerald-500 font-medium" placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Rol / Puesto</label>
                <input type="text" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="w-full bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary border-gray-300 dark:border-bd-lines rounded-lg text-sm focus:ring-accent focus:border-accent dark:focus:ring-emerald-500 dark:focus:border-emerald-500 font-medium" placeholder="Ej. Operario" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Categoría</label>
                 <select value={newMember.category} onChange={e => setNewMember({...newMember, category: e.target.value as any})} className="w-full bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary border-gray-300 dark:border-bd-lines rounded-lg text-sm focus:ring-accent dark:focus:ring-emerald-500 font-medium outline-none">
                   <option value="interno">Interno (Fijo)</option>
                   <option value="externo">Externo (Contratista)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Estado</label>
                 <select value={newMember.status} onChange={e => setNewMember({...newMember, status: e.target.value as any})} className="w-full bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary border-gray-300 dark:border-bd-lines rounded-lg text-sm focus:ring-accent dark:focus:ring-emerald-500 font-medium outline-none">
                   <option value="activo">Activo</option>
                   <option value="descanso">Descanso</option>
                   <option value="inactivo">Inactivo</option>
                 </select>
              </div>
              <button onClick={handleAddMember} className="w-full mt-2 py-3 bg-accent dark:bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:opacity-90 dark:hover:bg-emerald-500 transition-all flex justify-center items-center gap-2">
                <CheckCircle size={18} /> Crear Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vehicle Modal */}
      {isNewVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card dark:bg-card border border-transparent dark:border-bd-lines rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-4 border-b border-gray-100 dark:border-bd-lines flex justify-between items-center bg-gray-50/50 dark:bg-main/50">
              <h3 className="font-bold text-gray-900 dark:text-tx-primary flex items-center gap-2"><Truck size={18} className="text-accent dark:text-emerald-500" /> Nuevo Vehículo</h3>
              <button onClick={() => setIsNewVehicleModalOpen(false)} className="text-gray-400 dark:text-tx-secondary hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Nombre / Modelo</label>
                <input type="text" value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} className="w-full bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary border-gray-300 dark:border-bd-lines rounded-lg text-sm focus:ring-accent focus:border-accent dark:focus:ring-emerald-500 dark:focus:border-emerald-500 font-medium" placeholder="Ej. Toyota Hilux" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Dominio / Patente</label>
                <input type="text" value={newVehicle.patente} onChange={e => setNewVehicle({...newVehicle, patente: e.target.value})} className="w-full bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary border-gray-300 dark:border-bd-lines rounded-lg text-sm focus:ring-accent focus:border-accent dark:focus:ring-emerald-500 dark:focus:border-emerald-500 font-medium uppercase uppercase:placeholder-normal" placeholder="Ej. AB 123 CD" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Estado</label>
                 <select value={newVehicle.status} onChange={e => setNewVehicle({...newVehicle, status: e.target.value as any})} className="w-full bg-card dark:bg-slate-950 text-gray-900 dark:text-tx-primary border-gray-300 dark:border-bd-lines rounded-lg text-sm focus:ring-accent dark:focus:ring-emerald-500 font-medium outline-none">
                   <option value="activo">Activo</option>
                   <option value="taller">En Taller</option>
                   <option value="inactivo">Inactivo</option>
                 </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-tx-primary mb-1">Foto (Opcional)</label>
                <div className="flex items-center gap-4">
                  {newVehicle.image ? (
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200">
                      <img src={newVehicle.image} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setNewVehicle({...newVehicle, image: ''})}
                        className="absolute top-1 right-1 p-1 bg-card/80 rounded-full text-red-500 hover:bg-card"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-bd-lines bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      <Camera size={20} className="text-gray-400 dark:text-tx-secondary" />
                      <span className="text-[10px] font-medium text-gray-500 dark:text-tx-secondary">Subir</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewVehicle({ ...newVehicle, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  )}
                </div>
              </div>
              <button onClick={handleAddVehicleFunc} className="w-full mt-2 py-3 bg-accent dark:bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:opacity-90 dark:hover:bg-emerald-500 transition-all flex justify-center items-center gap-2">
                <CheckCircle size={18} /> Añadir Vehículo
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
