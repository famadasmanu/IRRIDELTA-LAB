import React, { useState } from 'react';
import {
  Menu, Bell, MapPin, Home, Calendar, FolderOpen, User,
  Search, Phone, MessageCircle, Clock, Users, Briefcase,
  ArrowLeft, CheckCircle, Check, ChevronDown, Filter,
  TreePine, AlertTriangle, Locate, MoreVertical, X,
  Truck, Package, Navigation, CheckCircle2, Plus, Edit2, Camera,
  Wrench, Droplets, Activity, FileText, Timer, CalendarDays,
  BatteryWarning, UploadCloud, Save, Leaf, Sun, ArrowRight, Download
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
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
  attendanceAlert?: number; // percentage threshold for alert
  attendanceData?: { date: string; present: boolean }[];
};

const defaultPersonal: PersonalMember[] = [
  {
    id: '1',
    name: 'Carlos Rodriguez',
    role: 'Foreman',
    category: 'interno',
    status: 'activo',
    location: 'Jardines del Norte - Sector A',
    initials: 'C',
    presencialidad: '100%',
    adelantos: '$0',
    attendanceAlert: 90,
    attendanceData: [
      { date: 'Lun', present: true },
      { date: 'Mar', present: true },
      { date: 'Mie', present: true },
      { date: 'Jue', present: true },
      { date: 'Vie', present: true },
    ]
  },
  {
    id: '2',
    name: 'Miguel Torres',
    role: 'Operador de Maquinaria',
    category: 'interno',
    status: 'descanso',
    location: 'Parque Central',
    initials: 'M',
    presencialidad: '95%',
    adelantos: '$15,000',
    attendanceAlert: 85,
    attendanceData: [
      { date: 'Lun', present: true },
      { date: 'Mar', present: true },
      { date: 'Mie', present: false },
      { date: 'Jue', present: true },
      { date: 'Vie', present: true },
    ]
  },
  {
    id: '3',
    name: 'David Chen',
    role: 'Ingeniero Agrónomo',
    category: 'externo',
    status: 'activo',
    location: 'Supervisión Lote Sur',
    initials: 'D',
    presencialidad: '80%',
    adelantos: '$0',
    attendanceAlert: 95,
    attendanceData: [
      { date: 'Lun', present: false },
      { date: 'Mar', present: true },
      { date: 'Mie', present: true },
      { date: 'Jue', present: false },
      { date: 'Vie', present: true },
    ]
  }
];

const initialVehicles = [
  {
    id: 1,
    name: 'Ford F-150',
    patente: 'ABC-123',
    status: 'activo',
    driver: 'Carlos Rodriguez',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAos2nbJFDcZ_2rKHAwzfxjmf5uay0uZsrbz69FlP6iIOiI5vo4aweqigwCOKK4a6wKC_wu2rqKJ_sXW0iFc1fP4pcRTFGA8ma_npK2QxLG6MZPmaRa8hX5k3IUbUflfIe2-yv6H4sNN8AGMq2Q19xKK-AcQ2dWOquTQ9ceTq7mGhY9nHJM6Rx3FU6DXZKnCaw41HyE0G8Zywi72Z4o4PHT0UyH47D53E33YY5SRdmWPJqqwF_fVgQULAWynUX2mXKKvZvkzF3-X-0',
    metric: '45,200 km',
    metricIcon: 'Activity',
    horometro: 45200,
    odometroPorObra: 120,
    fuelLevel: 60,
    nextService: 50000,
    history: [
      { id: 1, date: '2023-08-20', type: 'Mantenimiento Preventivo', description: 'Cambio de aceite y filtros', cost: '$35,000' }
    ]
  },
  {
    id: 2,
    name: 'Mercedes Sprinter',
    patente: 'XYZ-789',
    status: 'taller',
    driver: 'Sin asignar',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJhTNBhXDzRt3Dab5SxHl6TqVjUmaejbtcwSJ-Zk4_xmaO1kvQPXmwrcOM2Vnuu673_m-LZ6OnLWoUYLTtte1J2Wd2bOp6i6SWGWna4241PbrlzKRHELqnKrSZGn_E3geEzJ1SNlaCQ2DF0e-V4v1KXNPayJOsArXxaDeMbbsRJgDsjy8-hUSjD4V_Du_4xFtNVCWYWzMvgry1jhuSLz6tSVNPe8mzhblU1-vgrY1xlC1QOH9bGCKyPeOr7u0mY16AhLoHxjgyHlU',
    metric: '12,150 km',
    metricIcon: 'Activity',
    horometro: 12150,
    odometroPorObra: 45,
    fuelLevel: 15,
    nextService: 15000,
    history: [
      { id: 1, date: '2023-10-05', type: 'Reparación', description: 'Cambio de batería', cost: '$85,000' }
    ]
  },
  {
    id: 3,
    name: 'John Deere ZT',
    patente: 'MOW-001',
    status: 'activo',
    driver: 'Miguel Torres',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYsWi0QTlCxA-bNr6mDiEc3zh0Gmq9YxGD2hBenlzH5m-sigw9plG4fmFuOjsjtjx_wGLwpXATyZtILOKJPq2NrxaEzIr8L6s2X7pY0N868P2M40b68hZyJGUZkUS2-vFM1zIYK6aD58FggRPAA-aYK4cjSWnLUAOUp39mb9mNkRISWgfntYT1DoVSov8ZRSFoxZgTXj_n3AJ1t6joN6s2GFoBtS04LFVBdBCKaoVwEZ4kupophvr5Qvr6rVCzqmEszFUybbJ6wMs',
    metric: '340 hrs',
    metricIcon: 'Clock',
    horometro: 340,
    odometroPorObra: 12,
    fuelLevel: 75,
    nextService: 500,
    history: [
      { id: 1, date: '2023-09-15', type: 'Mantenimiento Preventivo', description: 'Cambio de aceite y filtros', cost: '$45,000' },
      { id: 2, date: '2023-05-10', type: 'Reparación', description: 'Reemplazo de manguera hidráulica', cost: '$12,500' }
    ]
  },
];

const initialDeliveries = [
  { id: 1, origen: 'Vivero El Sol', destino: 'Jardín Frontal Nordelta', material: 'Plantas y Sustrato', status: 'en_camino', eta: '10:30 AM', vehicleId: 1, image: '' },
  { id: 2, origen: 'Corralón Norte', destino: 'Sistema de Riego San Isidro', material: 'Caños y Bombas', status: 'entregado', eta: '08:00 AM', vehicleId: 3, image: '' },
  { id: 3, origen: 'Depósito Central', destino: 'Piscina y Deck CABA', material: 'Madera Lapacho', status: 'pendiente', eta: '14:00 PM', vehicleId: 2, image: '' },
];

const initialCorrectiveIssues = [
  { id: 1, title: 'Ruido en frenos traseros', reportedBy: 'Carlos Ruiz', date: 'Ayer', status: 'pendiente', vehicleId: 1, icon: 'Wrench' },
  { id: 2, title: 'Batería descargada', reportedBy: 'Ana Gomez', date: '12 Oct', status: 'resuelto', vehicleId: 2, icon: 'BatteryWarning' }
];

const initialUpcomingServices = [
  { id: 1, title: 'Cambio de Aceite', vehicleId: 1, status: 'urgente', detail: 'Vencido por 120 km', icon: 'Droplets' },
  { id: 2, title: 'Rotación de Neumáticos', vehicleId: 2, status: 'pronto', detail: 'En 500 km', icon: 'Wrench' },
  { id: 3, title: 'Inspección General', vehicleId: 3, status: 'programado', detail: '15 Nov, 2023', icon: 'Truck' }
];

export default function Personal() {
  const [view, setView] = useState<'equipo' | 'reasignar' | 'asistencia' | 'historial' | 'vehiculos' | 'profesionales'>('equipo');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'todos' | 'interno' | 'externo'>('todos');
  const [personalData, setPersonalData] = useLocalStorage<PersonalMember[]>('personalData', defaultPersonal);
  const [vehicles, setVehicles] = useLocalStorage('personal_vehicles', initialVehicles);
  const [deliveries, setDeliveries] = useLocalStorage('personal_deliveries', initialDeliveries);
  const [correctiveIssues, setCorrectiveIssues] = useLocalStorage('corrective_issues', initialCorrectiveIssues);
  const [upcomingServices, setUpcomingServices] = useLocalStorage('upcoming_services', initialUpcomingServices);
  const [selectedMember, setSelectedMember] = useState<PersonalMember | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editingItemType, setEditingItemType] = useState<'vehicle' | 'delivery' | 'service' | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<any | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCorrectiveModalOpen, setIsCorrectiveModalOpen] = useState(false);
  const [isChangeUserModalOpen, setIsChangeUserModalOpen] = useState(false);
  const [newCorrectiveIssue, setNewCorrectiveIssue] = useState({ title: '', reportedBy: '', vehicleId: 1, icon: 'Wrench' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editPresencialidad, setEditPresencialidad] = useState('');
  const [editAdelantos, setEditAdelantos] = useState('');
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<PersonalMember | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editLocationValue, setEditLocationValue] = useState('');
  const [isEditingAdelantos, setIsEditingAdelantos] = useState(false);
  const [editAdelantosValue, setEditAdelantosValue] = useState('');
  const [isEditingPresencialidad, setIsEditingPresencialidad] = useState(false);
  const [editPresencialidadValue, setEditPresencialidadValue] = useState('');
  const [editAttendanceAlert, setEditAttendanceAlert] = useState<number>(90);

  const [isExporting, setIsExporting] = useState(false);

  const [heatmapFilters, setHeatmapFilters] = useState({
    historico: true,
    curso: true,
    futuro: true
  });
  const [showHeatmapFilters, setShowHeatmapFilters] = useState(false);

  const [heatmapZones, setHeatmapZones] = useState([
    { id: 1, type: 'historico' as const, name: 'Estudio V&A', zone: 'Zona Nordelta', center: [-34.4100, -58.6400] as [number, number], radius: 50, color: '#3b82f6', subtitle: 'Terreno Conquistado', text: 'Aquí es donde este referente ha dejado su mayor huella histórica con diseños sustentables.', features: ['15 Obras Realizadas', 'Top Expertise'] },
    { id: 2, type: 'curso' as const, name: 'Gaston R.', zone: 'Zona San Isidro', center: [-34.4600, -58.5500] as [number, number], radius: 40, color: '#22c55e', subtitle: 'Operación Activa', text: 'Especialista trabajando actualmente en esta área con máxima eficiencia.', features: ['3 Obras Actuales', 'Riego Smart'] },
    { id: 3, type: 'futuro' as const, name: 'Lucía M.', zone: 'Zona Pilar', center: [-34.4650, -58.9100] as [number, number], radius: 65, color: '#f97316', subtitle: 'Próximos Pasos', text: 'Paisajista Senior con grandes proyectos planificados para esta zona.', features: ['4 Obras Futuras', 'Eco-Paisajismo'] }
  ]);

  const updateZoneRadius = (id: number, newRadius: number) => {
    setHeatmapZones(prev => prev.map(z => z.id === id ? { ...z, radius: newRadius } : z));
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEditVehicle = (vehicle: any) => {
    setEditingItemType('vehicle');
    setEditingItemId(vehicle.id);
    setEditName(vehicle.name);
    setEditImage(vehicle.image || '');
    setEditStatus(vehicle.status || 'activo');
    setIsEditModalOpen(true);
  };

  const handleOpenEditDelivery = (delivery: any) => {
    setEditingItemType('delivery');
    setEditingItemId(delivery.id);
    setEditName(delivery.material);
    setEditImage(delivery.image || '');
    setIsEditModalOpen(true);
  };

  const handleOpenEditService = (service: any) => {
    setEditingItemType('service');
    setEditingItemId(service.id);
    setEditName(service.title);
    setEditStatus(service.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEditItem = () => {
    if (editingItemType === 'vehicle' && editingItemId) {
      setVehicles(prev => prev.map(v => v.id === editingItemId ? { ...v, name: editName, image: editImage, status: editStatus } : v));
      showToast('Vehículo actualizado');
    } else if (editingItemType === 'delivery' && editingItemId) {
      setDeliveries(prev => prev.map(d => d.id === editingItemId ? { ...d, material: editName, image: editImage } : d));
      showToast('Entrega actualizada');
    } else if (editingItemType === 'service' && editingItemId) {
      setUpcomingServices(prev => prev.map(s => s.id === editingItemId ? { ...s, title: editName, status: editStatus } : s));
      showToast('Service actualizado');
    }
    setIsEditModalOpen(false);
  };

  const handleSaveCorrectiveIssue = () => {
    if (!newCorrectiveIssue.title || !newCorrectiveIssue.reportedBy) {
      showToast('Por favor completa todos los campos');
      return;
    }
    setCorrectiveIssues(prev => [
      {
        id: Date.now(),
        title: newCorrectiveIssue.title,
        reportedBy: newCorrectiveIssue.reportedBy,
        date: 'Hoy',
        status: 'pendiente',
        vehicleId: newCorrectiveIssue.vehicleId,
        icon: newCorrectiveIssue.icon
      },
      ...prev
    ]);
    setIsCorrectiveModalOpen(false);
    setNewCorrectiveIssue({ title: '', reportedBy: '', vehicleId: 1, icon: 'Wrench' });
    showToast('Mantenimiento correctivo reportado');
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

  const handleOpenOptions = (member: PersonalMember) => {
    setSelectedMember(member);
    setIsOptionsModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (selectedMember) {
      setEditingItemType(null);
      setEditName(selectedMember.name);
      setEditPresencialidad(selectedMember.presencialidad || '');
      setEditAdelantos(selectedMember.adelantos || '');
      setIsOptionsModalOpen(false);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingItemType) {
      handleSaveEditItem();
      return;
    }
    if (selectedMember && editName.trim() !== '') {
      setPersonalData(prev => prev.map(p =>
        p.id === selectedMember.id ? { ...p, name: editName.trim(), presencialidad: editPresencialidad, adelantos: editAdelantos } : p
      ));
      if (selectedEmployeeDetail && selectedEmployeeDetail.id === selectedMember.id) {
        setSelectedEmployeeDetail({ ...selectedEmployeeDetail, name: editName.trim(), presencialidad: editPresencialidad, adelantos: editAdelantos });
      }
      setIsEditModalOpen(false);
      showToast('Datos actualizados correctamente');
    }
  };

  const handleOpenEmployeeDetail = (member: PersonalMember) => {
    setSelectedEmployeeDetail(member);
    setEditLocationValue(member.location || '');
    setEditAttendanceAlert(member.attendanceAlert || 90);
    setIsEmployeeDetailModalOpen(true);
  };

  const handleSaveEmployeeDetail = () => {
    if (selectedEmployeeDetail) {
      const updatedMember = {
        ...selectedEmployeeDetail,
        location: editLocationValue,
        adelantos: editAdelantosValue,
        presencialidad: editPresencialidadValue,
        attendanceAlert: editAttendanceAlert
      };
      setPersonalData(personalData.map(m => m.id === updatedMember.id ? updatedMember : m));
      setSelectedEmployeeDetail(updatedMember);
      setIsEditingLocation(false);
      setIsEditingAdelantos(false);
      setIsEditingPresencialidad(false);
      showToast('Datos actualizados');
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
          <h1 style="color: #3A5F4B; border-bottom: 2px solid #3A5F4B; padding-bottom: 10px; margin-bottom: 30px;">Ficha de Empleado</h1>
          
          <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 40px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #4b5563; border: 2px solid #e5e7eb;">
              ${selectedEmployeeDetail.initials}
            </div>
            <div>
              <h2 style="margin: 0 0 5px 0; font-size: 28px; color: #111827;">${selectedEmployeeDetail.name}</h2>
              <p style="margin: 0; color: #3A5F4B; font-size: 18px; font-weight: 500;">${selectedEmployeeDetail.role}</p>
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

  const handleExportFullPDF = async () => {
    setIsExporting(true);
    showToast('Generando reporte PDF...');

    try {
      const printContent = document.createElement('div');
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';
      printContent.style.top = '0';
      printContent.style.width = '800px';
      printContent.style.backgroundColor = '#ffffff';
      printContent.style.padding = '40px';

      let contentHtml = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h1 style="color: #3A5F4B; margin-bottom: 5px;">Reporte General de Personal</h1>
          <p style="color: #666; margin-bottom: 20px;">IRRIDELTA - Fecha: ${new Date().toLocaleDateString()}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #3A5F4B; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Nombre</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Rol</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Estado</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Ubicación</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Asistencia</th>
              </tr>
            </thead>
            <tbody>
      `;

      personalData.forEach(member => {
        contentHtml += `
          <tr style="background-color: white;">
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${member.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${member.role}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">${member.status}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${member.location || 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${member.presencialidad || '0%'}</td>
          </tr>
        `;
      });

      contentHtml += `
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            Documento generado automáticamente por sistema IRRIDELTA
          </div>
        </div>
      `;

      printContent.innerHTML = contentHtml;
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
      pdf.save(`Reporte_Personal_${new Date().toISOString().split('T')[0]}.pdf`);

      showToast('PDF exportado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Error al generar el PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Nombre', 'Rol', 'Categoria', 'Estado', 'Ubicacion', 'Presencialidad', 'Adelantos'];
    const rows = personalData.map(m => [
      m.id,
      m.name,
      m.role,
      m.category,
      m.status,
      `"${m.location || ''}"`,
      m.presencialidad || '',
      `"${m.adelantos || ''}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Personal_Irridelta_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilla CSV exportada');
  };

  if (view === 'asistencia') {
    return (
      <div className="flex flex-col min-h-[80vh] relative">
        {/* Status Card */}
        <div className="mt-2">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Estado Actual</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <h2 className="text-2xl font-extrabold text-gray-400">Offline</h2>
            </div>
            <p className="text-xs text-gray-400 text-center max-w-[200px]">Debes estar en el sitio para realizar el Check-In.</p>
          </div>
        </div>

        {/* Main Action Area */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 relative">
          <div className="absolute w-64 h-64 rounded-full border border-[#3A5F4B]/10"></div>
          <div className="absolute w-52 h-52 rounded-full border border-[#3A5F4B]/20"></div>
          <button
            onClick={() => {
              showToast('Check-In realizado con éxito');
              setTimeout(() => setView('equipo'), 1500);
            }}
            className="relative w-40 h-40 rounded-full bg-[#3A5F4B] shadow-xl shadow-[#3A5F4B]/30 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform z-10 group"
          >
            <MapPin className="text-white text-4xl group-hover:scale-110 transition-transform" size={40} />
            <span className="text-white font-bold text-lg tracking-wide">Check-In</span>
          </button>
        </div>

        {/* Location Info */}
        <div className="pb-6">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="relative h-32 w-full bg-gray-200">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="bg-[#3A5F4B]/20 w-16 h-16 rounded-full flex items-center justify-center border border-[#3A5F4B]">
                  <div className="w-3 h-3 bg-[#3A5F4B] rounded-full ring-2 ring-white"></div>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-[10px] font-bold shadow-sm text-gray-500">Google Maps</div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Ubicación Actual</p>
                <h3 className="text-gray-900 font-bold text-base flex items-center gap-1">
                  <MapPin className="text-[#3A5F4B]" size={16} />
                  Cerca de Obra Olivos
                </h3>
              </div>
              <div className="bg-green-100 text-[#3A5F4B] text-xs font-bold px-3 py-1.5 rounded-full">
                ~50m
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'historial') {
    return (
      <div className="flex flex-col min-h-[80vh] bg-transparent -mx-4 -mt-4 px-4 pt-4">
        {/* Header Section */}
        <header className="sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setView('asistencia')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
              <ArrowLeft className="text-gray-900" size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Historial de Asistencia</h1>
            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
              <Search className="text-gray-900" size={24} />
            </button>
          </div>

          {/* Scrollable Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-2">
            <button className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#3A5F4B] text-white px-3 text-sm font-medium shadow-sm transition-transform active:scale-95">
              <Calendar size={18} /> Esta Semana <ChevronDown size={18} />
            </button>
            <button className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white border border-gray-200 text-gray-700 px-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50">
              <User size={18} /> Todos <ChevronDown size={18} />
            </button>
            <button className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white border border-gray-200 text-gray-700 px-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50">
              <TreePine size={18} /> Proyectos <ChevronDown size={18} />
            </button>
            <button className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white border border-gray-200 text-gray-700 px-3 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50">
              <Filter size={18} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 pb-24">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#3A5F4B] p-4 text-white shadow-lg shadow-[#3A5F4B]/20">
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <Clock size={20} />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Horas</span>
              </div>
              <div className="text-3xl font-bold">42.5h</div>
              <div className="text-xs opacity-80 mt-1">+2.5h vs semana pasada</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <CheckCircle size={20} />
                <span className="text-xs font-semibold uppercase tracking-wider">Asistencias</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">5/5</div>
              <div className="text-xs text-green-600 font-medium mt-1">100% Puntualidad</div>
            </div>
          </div>

          {/* Today's Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Hoy, 24 Octubre</h2>
              <span className="text-xs font-medium text-[#3A5F4B] bg-[#3A5F4B]/10 px-2 py-1 rounded">En curso</span>
            </div>

            {/* Active Card */}
            <div className="relative overflow-hidden rounded-xl bg-white shadow-md border border-gray-100 group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#3A5F4B]"></div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Jardines del Norte</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin size={14} /> Zona Residencial A
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-100">
                      <CheckCircle size={14} /> Geo-validado
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-3 border-t border-gray-100 border-dashed">
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 block mb-1">Entrada</span>
                    <span className="text-base font-bold text-gray-900">07:00 AM</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2">
                    <span className="text-xs font-bold text-[#3A5F4B] bg-[#3A5F4B]/10 px-2 py-0.5 rounded-full">9h 00m</span>
                    <ArrowRight size={20} className="text-gray-300 my-1" />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-xs text-gray-500 block mb-1">Salida</span>
                    <span className="text-base font-bold text-gray-900">04:00 PM</span>
                  </div>
                </div>

                {/* Map Preview */}
                <div className="mt-2 h-24 w-full rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')" }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                    <span className="text-white text-xs font-medium flex items-center gap-1">
                      <Locate size={14} /> Ubicación confirmada
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Previous Days Section */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Ayer, 23 Octubre</h2>
            <div className="space-y-3">
              {/* History Item 1 */}
              <div className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
                      <TreePine size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Mantenimiento Central</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Parque Corporativo</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-gray-900">8h 30m</span>
                    <span className="text-xs text-green-600 flex items-center justify-end gap-0.5">
                      <CheckCircle size={12} /> Validado
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  <span>07:15 AM</span>
                  <div className="h-[1px] flex-1 bg-gray-200 mx-2"></div>
                  <span>03:45 PM</span>
                </div>
              </div>

              {/* History Item 2 */}
              <div className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
                      <Leaf size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Residencial Los Olivos</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Podado y Riego</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-gray-900">4h 00m</span>
                    <span className="text-xs text-orange-500 flex items-center justify-end gap-0.5">
                      <AlertTriangle size={12} /> Manual
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  <span>08:00 AM</span>
                  <div className="h-[1px] flex-1 bg-gray-200 mx-2"></div>
                  <span>12:00 PM</span>
                </div>
              </div>
            </div>
          </section>

          {/* More History */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">22 Octubre</h2>
            {/* History Item 3 */}
            <div className="flex flex-col bg-white rounded-xl p-4 shadow-sm border border-gray-100 opacity-80">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600">
                    <Sun size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Plaza Comercial Sur</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Instalación</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-gray-900">9h 15m</span>
                  <span className="text-xs text-green-600 flex items-center justify-end gap-0.5">
                    <CheckCircle size={12} /> Validado
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                <span>06:45 AM</span>
                <div className="h-[1px] flex-1 bg-gray-200 mx-2"></div>
                <span>04:00 PM</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (view === 'reasignar') {
    return (
      <div className="flex flex-col min-h-[80vh]">
        <header className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
          <button onClick={() => setView('equipo')} className="flex items-center justify-center p-2 rounded-full hover:bg-[#3A5F4B]/10 transition-colors text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-10">Reasignar Personal</h1>
        </header>

        <div className="flex items-center gap-4 px-2 mb-6">
          <div className="h-12 w-12 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-gray-500 font-bold text-xl">
            C
          </div>
          <div>
            <p className="text-xs font-medium text-[#3A5F4B] uppercase tracking-wider">Empleado</p>
            <h2 className="text-lg font-bold text-gray-900">Carlos Méndez</h2>
          </div>
        </div>

        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2 uppercase tracking-wide">Proyecto Actual</h3>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4 items-start relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-[#3A5F4B]/10 text-[#3A5F4B] text-xs font-bold px-3 py-1 rounded-bl-lg">ACTIVO</div>
            <div className="h-20 w-20 rounded-lg bg-gray-200 shrink-0 flex items-center justify-center text-gray-400">
              <MapPin size={32} />
            </div>
            <div className="flex flex-col justify-center h-full py-1">
              <h4 className="text-base font-bold text-gray-900 leading-tight">Residencial Las Lomas</h4>
              <p className="text-sm text-gray-500 mt-1">Jardinería General</p>
              <div className="flex items-center gap-1 mt-2 text-[#3A5F4B]">
                <User size={16} />
                <span className="text-xs font-medium">Equipo: 4 personas</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-500 px-2 uppercase tracking-wide">Seleccionar Nuevo Proyecto</h3>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#3A5F4B] shadow-sm" placeholder="Buscar proyecto activo..." type="text" />
          </div>

          <div className="space-y-3">
            <label className="relative flex items-center p-4 rounded-xl bg-white border-2 border-transparent hover:border-[#3A5F4B]/50 cursor-pointer shadow-sm transition-all has-[:checked]:border-[#3A5F4B] has-[:checked]:bg-[#3A5F4B]/5">
              <input className="sr-only peer" name="new_project" type="radio" value="1" />
              <div className="flex-1 flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-gray-200 shrink-0"></div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">Torre Ejecutiva Norte</h4>
                  <p className="text-sm text-gray-500">Mantenimiento de Fachada</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-gray-600">
                      <User size={14} /> <span className="text-xs">8 en sitio</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center peer-checked:border-[#3A5F4B] peer-checked:bg-[#3A5F4B] transition-all">
                <Check className="text-white opacity-0 peer-checked:opacity-100" size={16} />
              </div>
            </label>
          </div>
        </section>

        <div className="mt-8">
          <button
            onClick={() => {
              showToast('Personal reasignado correctamente');
              setView('equipo');
            }}
            className="w-full bg-[#3A5F4B] hover:bg-[#3A5F4B]/90 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-[#3A5F4B]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle size={24} /> Confirmar Reasignación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {view === 'vehiculos' ? 'Gestión de Flota' : view === 'profesionales' ? 'Comunidad Pro' : 'Gestión de Personal'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Administración centralizada de recursos y equipo.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-[#3A5F4B] hover:bg-[#3A5F4B]/5 rounded transition-colors"
              title="Exportar a CSV"
            >
              <Download size={16} /> CSV
            </button>
            <div className="w-[1px] h-4 bg-gray-200" />
            <button 
              onClick={handleExportFullPDF}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-[#3A5F4B] hover:bg-[#3A5F4B]/5 rounded transition-colors"
              disabled={isExporting}
              title="Exportar a PDF"
            >
              <FileText size={16} /> {isExporting ? '...' : 'PDF'}
            </button>
          </div>
          
          {view === 'vehiculos' ? (
            <button onClick={() => setIsServiceModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2d4a3a] transition-colors text-sm shadow-md shadow-[#3A5F4B]/20">
              <Plus size={18} /> Nuevo Service
            </button>
          ) : view === 'equipo' ? (
            <button onClick={() => showToast('Funcionalidad para añadir personal')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2d4a3a] transition-colors text-sm shadow-md shadow-[#3A5F4B]/20">
              <Plus size={18} /> Nuevo Miembro
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex p-1 bg-[#3A5F4B]/10 rounded-lg w-full overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setView('equipo')}
          className={cn("flex-1 py-1.5 px-3 rounded text-sm font-semibold transition-all whitespace-nowrap", view === 'equipo' ? "shadow-sm bg-white text-[#3A5F4B] ring-1 ring-black/5" : "text-gray-500 hover:text-[#3A5F4B]")}
        >
          Empleados
        </button>
        <button
          onClick={() => setView('vehiculos')}
          className={cn("flex-1 py-1.5 px-3 rounded text-sm font-semibold transition-all whitespace-nowrap", view === 'vehiculos' ? "shadow-sm bg-white text-[#3A5F4B] ring-1 ring-black/5" : "text-gray-500 hover:text-[#3A5F4B]")}
        >
          Vehículos de trabajo
        </button>
        <button
          onClick={() => setView('profesionales')}
          className={cn("flex-1 py-1.5 px-3 rounded text-sm font-semibold transition-all whitespace-nowrap", view === 'profesionales' ? "shadow-sm bg-white text-[#3A5F4B] ring-1 ring-black/5" : "text-gray-500 hover:text-[#3A5F4B]")}
        >
          Comunidad Pro
        </button>
      </div>

      {view === 'profesionales' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
               <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <Users className="text-[#3A5F4B]" size={24} /> Red de Profesionales
               </h2>
               <p className="text-sm text-gray-500 mt-1">Mapa de calor de actividad y comunidad de apoyo.</p>
             </div>
             <div className="flex gap-2 w-full sm:w-auto relative">
               <button 
                 onClick={() => setShowHeatmapFilters(!showHeatmapFilters)}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
               >
                 <Filter size={18} /> Filtrar Zonas
               </button>
               
               {showHeatmapFilters && (
                 <div className="absolute top-12 left-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                   <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Mostrar Huellas</h4>
                   <div className="space-y-3">
                     <label className="flex items-center gap-3 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={heatmapFilters.historico} 
                         onChange={() => setHeatmapFilters(p => ({ ...p, historico: !p.historico }))}
                         className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500" 
                       />
                       <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                         <span className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></span> Históricas
                       </span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={heatmapFilters.curso} 
                         onChange={() => setHeatmapFilters(p => ({ ...p, curso: !p.curso }))}
                         className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500" 
                       />
                       <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 transition-colors flex items-center gap-2">
                         <span className="w-3 h-3 rounded-full bg-green-500 opacity-60"></span> En curso
                       </span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={heatmapFilters.futuro} 
                         onChange={() => setHeatmapFilters(p => ({ ...p, futuro: !p.futuro }))}
                         className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500" 
                       />
                       <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors flex items-center gap-2">
                         <span className="w-3 h-3 rounded-full bg-orange-400 opacity-60"></span> Proyectadas
                       </span>
                     </label>
                   </div>
                 </div>
               )}

               <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#F27D26] text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-[#F27D26]/20 hover:bg-orange-600 transition-colors">
                 <MessageCircle size={18} /> Foro Local
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden h-[500px] relative z-0">
               <iframe
                 width="100%"
                 height="100%"
                 frameBorder="0"
                 style={{ border: 0 }}
                 referrerPolicy="no-referrer-when-downgrade"
                 src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d105073.44367005296!2d-58.7000!3d-34.4500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2sar!4v1700000000000!5m2!1ses!2sar"
                 allowFullScreen
               ></iframe>
               <div className="absolute top-4 left-4 right-4 flex gap-2 overflow-x-auto hide-scrollbar z-10 pointer-events-none">
                 {heatmapZones.filter(z => heatmapFilters[z.type]).map(z => (
                   <div key={z.id} className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 min-w-[200px] pointer-events-auto">
                     <strong className="block text-sm text-gray-900 border-b pb-1 mb-1">{z.name} - {z.zone}</strong>
                     <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100" style={{ color: z.color }}>{z.subtitle}</span>
                     <p className="text-xs text-gray-600 mt-1 leading-tight">{z.text}</p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Panel de Gamificación y Top Referentes (Comunidad) */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#3A5F4B]/10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                    <CheckCircle className="text-[#F27D26]" size={20} /> Top Referentes
                  </h3>
                  <button className="text-xs font-bold text-[#F27D26] bg-[#F27D26]/10 px-3 py-1.5 rounded-lg hover:bg-[#F27D26]/20 transition-colors">
                    Ver Ranking Global
                  </button>
                </div>
                
                <div className="space-y-4 flex-1">
                  {/* Top Referent 1 */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 shadow-sm relative group">
                    <div className="absolute top-0 right-0 p-2">
                       <span className="text-2xl" title="Instalador Diamante">💎</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center font-bold text-amber-700 shadow-inner">
                      EV
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">Estudio V&A</h4>
                      <p className="text-xs mt-0.5 text-[#3A5F4B] font-medium flex items-center gap-1">
                        <MapPin size={12}/> Zona Norte
                      </p>
                      <ul className="mt-2 flex gap-2">
                         <li className="text-[10px] font-bold text-amber-800 bg-amber-100/50 px-2 py-0.5 rounded-full border border-amber-200">10,000 m² Instalados</li>
                         <li className="text-[10px] font-bold text-amber-800 bg-amber-100/50 px-2 py-0.5 rounded-full border border-amber-200">Experto Smart</li>
                      </ul>
                    </div>
                  </div>

                  {/* Top Referent 2 */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm relative group">
                    <div className="absolute top-0 right-0 p-2">
                       <span className="text-2xl" title="Instalador Platino">🥈</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700 shadow-inner">
                      GR
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">Gastón R.</h4>
                      <p className="text-xs mt-0.5 text-[#3A5F4B] font-medium flex items-center gap-1">
                        <MapPin size={12}/> San Isidro
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                         <li className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Rápida Respuesta</li>
                         <li className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">25 Proyectos</li>
                      </ul>
                    </div>
                  </div>

                  {/* Top Referent 3 */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm relative group">
                    <div className="absolute top-0 right-0 p-2">
                       <span className="text-2xl" title="Revelación">🌟</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center font-bold text-orange-700 shadow-inner">
                      LM
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">Lucía M.</h4>
                      <p className="text-xs mt-0.5 text-[#3A5F4B] font-medium flex items-center gap-1">
                        <MapPin size={12}/> Pilar
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                         <li className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">Estrella Creciente</li>
                         <li className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">Innovación 2024</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                     <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                        <AlertTriangle size={14} className="text-[#3A5F4B]"/> Completa proyectos para subir de nivel en la red Irridelta.
                     </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'equipo' && (
        <>
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-[#3A5F4B]/20 text-base transition-all"
                placeholder="Buscar miembro del equipo..."
                type="text"
              />
            </div>
            {/* Filtros de Tipo de Personal */}
            <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setActiveCategoryFilter('todos')}
                className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap", activeCategoryFilter === 'todos' ? "bg-[#3A5F4B] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveCategoryFilter('interno')}
                className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2", activeCategoryFilter === 'interno' ? "bg-[#3A5F4B] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
              >
                <User size={16} /> Operarios (Internos)
              </button>
              <button
                onClick={() => setActiveCategoryFilter('externo')}
                className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2", activeCategoryFilter === 'externo' ? "bg-[#3A5F4B] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50")}
              >
                <Briefcase size={16} /> Profesionales (Externos)
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {personalData.filter(m => activeCategoryFilter === 'todos' || m.category === activeCategoryFilter).map((member) => (
              <div key={member.id} className={cn("bg-white rounded-2xl p-4 shadow-sm border border-[#3A5F4B]/10 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-[#3A5F4B]/30 transition-all", member.status === 'inactivo' && "opacity-60")} onClick={() => handleOpenEmployeeDetail(member)}>
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-full bg-gray-200 border-2 border-[#3A5F4B]/10 flex items-center justify-center text-gray-500 font-bold text-xl">{member.initials}</div>
                    <span className={cn("absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white",
                      member.status === 'activo' ? "bg-green-500" :
                        member.status === 'descanso' ? "bg-yellow-500" : "bg-gray-400"
                    )}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 truncate">{member.name}</h3>
                        {member.category === 'externo' && (
                          <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-purple-200">Externo</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          member.status === 'activo' ? "bg-green-100 text-green-700" :
                            member.status === 'descanso' ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"
                        )}>
                          {member.status === 'activo' ? 'Activo' : member.status === 'descanso' ? 'Descanso' : 'Inactivo'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenOptions(member); }}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#3A5F4B] font-medium mt-0.5">{member.role}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      {member.status === 'inactivo' ? (
                        <><Clock size={14} /> <span className="truncate">{member.schedule || 'Sin turno'}</span></>
                      ) : (
                        <><MapPin size={14} /> <span className="truncate">{member.location || 'Sin asignar'}</span></>
                      )}
                    </div>
                  </div>
                </div>
                {member.status !== 'inactivo' && (
                  <div className={cn("flex gap-2 pt-1", member.status === 'descanso' && "opacity-75 hover:opacity-100 transition-opacity")}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setView('reasignar'); }}
                      className="flex-1 py-2 px-3 bg-gray-50 hover:bg-[#3A5F4B]/5 rounded-lg text-sm font-semibold text-gray-900 transition-colors border border-transparent hover:border-[#3A5F4B]/20"
                    >
                      Reasignar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); showToast(member.status === 'activo' ? 'Llamando...' : 'Abriendo chat...'); }}
                      className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2",
                        member.status === 'activo' ? "bg-[#3A5F4B] hover:bg-[#2d4a3a] text-white" : "bg-white border border-[#3A5F4B]/20 hover:bg-[#3A5F4B]/5 text-[#3A5F4B]"
                      )}
                    >
                      {member.status === 'activo' ? <><Phone size={18} /> Llamar</> : <><MessageCircle size={18} /> Mensaje</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-center pb-6">
            <button
              onClick={() => setView('asistencia')}
              className="text-[#3A5F4B] font-medium hover:underline flex items-center gap-2"
            >
              <MapPin size={18} /> Ir a Control de Asistencia
            </button>
          </div>
        </>
      )}

      {view === 'vehiculos' && (
        <div className="space-y-6">
          {/* Flota de Vehículos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Vehículos de la Flota</h2>
              <button className="text-sm font-semibold text-[#3A5F4B]">Ver todos</button>
            </div>

            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {vehicles.map(v => (
                <div key={v.id} className="snap-center shrink-0 w-[240px] bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 flex flex-col overflow-hidden cursor-pointer hover:shadow-md hover:border-[#3A5F4B]/30 transition-all relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditVehicle(v);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-[#3A5F4B] hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                  >
                    <MoreVertical size={16} />
                  </button>
                  <div
                    className="h-32 w-full bg-gray-100 bg-cover bg-center"
                    style={{ backgroundImage: `url('${v.image}')` }}
                    onClick={() => setSelectedVehicleDetail(v)}
                  ></div>
                  <div className="p-4 flex-1 flex flex-col" onClick={() => setSelectedVehicleDetail(v)}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 truncate pr-2">{v.name}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                        v.status === 'activo' ? "bg-green-100 text-green-700" :
                          v.status === 'taller' ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                      )}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{v.patente}</p>
                    <div className="mt-auto flex items-center text-xs text-gray-500 gap-1">
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Próximos Services</h2>
            <div className="flex flex-col gap-3">
              {upcomingServices.map(service => {
                const vehicle = vehicles.find(v => v.id === service.vehicleId);
                return (
                  <div key={service.id} className="flex items-center bg-white p-4 rounded-2xl shadow-sm border border-[#3A5F4B]/10 relative overflow-hidden group hover:shadow-md hover:border-[#3A5F4B]/30 transition-all">
                    <button
                      onClick={() => handleOpenEditService(service)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-gray-400 hover:text-[#3A5F4B] hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                      service.status === 'urgente' ? "bg-red-500" :
                        service.status === 'pronto' ? "bg-yellow-400" : "bg-[#3A5F4B]"
                    )}></div>
                    <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mr-4 shrink-0",
                      service.status === 'urgente' ? "bg-red-50 text-red-600" :
                        service.status === 'pronto' ? "bg-yellow-50 text-yellow-600" : "bg-[#3A5F4B]/10 text-[#3A5F4B]"
                    )}>
                      {service.icon === 'Droplets' ? <Droplets size={24} /> :
                        service.icon === 'Wrench' ? <Wrench size={24} /> : <Truck size={24} />}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{service.title}</h4>
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full",
                          service.status === 'urgente' ? "text-red-600 bg-red-50" :
                            service.status === 'pronto' ? "text-yellow-600 bg-yellow-50" : "text-[#3A5F4B] bg-[#3A5F4B]/10"
                        )}>
                          {service.status === 'urgente' ? 'Urgente' : service.status === 'pronto' ? 'Pronto' : 'Programado'}
                        </span>
                      </div>
                      {vehicle && <p className="text-xs text-gray-500 mb-1">{vehicle.name} • {vehicle.patente}</p>}
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
              <h2 className="text-xl font-bold text-gray-900">Mantenimientos Correctivos</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleExportPDF} className="p-1.5 rounded text-gray-500 hover:text-[#3A5F4B] hover:bg-[#3A5F4B]/10 transition" title="Exportar a PDF">
                  <FileText size={20} />
                </button>
                <button onClick={() => setIsCorrectiveModalOpen(true)} className="p-1.5 rounded text-[#3A5F4B] hover:bg-[#3A5F4B]/10 transition" title="Nuevo Reporte">
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="space-y-3 print-section">
              {correctiveIssues.map(issue => {
                const vehicle = vehicles.find(v => v.id === issue.vehicleId);
                return (
                  <div key={issue.id} className={cn("bg-white p-4 rounded-2xl shadow-sm border border-[#3A5F4B]/10 hover:shadow-md hover:border-[#3A5F4B]/30 transition-all", issue.status === 'resuelto' && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        {issue.icon === 'Wrench' ? <Wrench size={16} /> : <BatteryWarning size={16} />}
                      </div>
                      <div className="flex-1">
                        <h4 className={cn("font-bold text-gray-900 text-sm", issue.status === 'resuelto' && "line-through")}>{issue.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">Reportado por: {issue.reportedBy} • {issue.date}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded",
                        issue.status === 'pendiente' ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"
                      )}>
                        {issue.status}
                      </span>
                    </div>
                    {vehicle && (
                      <div className="mt-3 pl-11 flex items-center gap-2">
                        {vehicle.image ? (
                          <div className="h-6 w-6 rounded-full bg-cover bg-center border border-gray-200 shadow-sm" style={{ backgroundImage: `url('${vehicle.image}')` }}></div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
                            <Truck size={10} className="text-gray-400" />
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-900">{vehicle.name}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{vehicle.patente}</span>
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
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Opciones: {selectedMember.name}</h3>
              <button onClick={() => setIsOptionsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={handleOpenEdit}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
              >
                <User size={18} className="text-gray-400" />
                Editar Nombre
              </button>
              <button
                onClick={() => {
                  setIsOptionsModalOpen(false);
                  showToast('Funcionalidad en desarrollo');
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
              >
                <Briefcase size={18} className="text-gray-400" />
                Cambiar Rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">
                {editingItemType === 'vehicle' ? 'Editar Vehículo' :
                  editingItemType === 'delivery' ? 'Editar Entrega' :
                    editingItemType === 'service' ? 'Editar Service' :
                      'Editar Nombre'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {editingItemType === 'vehicle' ? 'Nombre del Vehículo' :
                    editingItemType === 'delivery' ? 'Material / Carga' :
                      editingItemType === 'service' ? 'Título del Service' :
                        'Nombre del Empleado'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. Carlos Rodriguez"
                  autoFocus
                />
              </div>

              {!editingItemType && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Presencialidad
                    </label>
                    <input
                      type="text"
                      value={editPresencialidad}
                      onChange={(e) => setEditPresencialidad(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                      placeholder="Ej. 100%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Adelantos
                    </label>
                    <input
                      type="text"
                      value={editAdelantos}
                      onChange={(e) => setEditAdelantos(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
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
                          className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white"
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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
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
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-xl bg-[#3A5F4B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2d4a3a] transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95">
            <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedVehicleDetail.name}</h3>
                <p className="text-sm text-gray-500 font-mono mt-0.5">Patente / ID: {selectedVehicleDetail.patente}</p>
              </div>
              <button onClick={() => setSelectedVehicleDetail(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Odómetro Total</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedVehicleDetail.horometro || 0} <span className="text-sm font-medium text-gray-500">{selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</span></div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Odóm. por Obra</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedVehicleDetail.odometroPorObra || 0} <span className="text-sm font-medium text-gray-500">{selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</span></div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Locate size={10} /> GPS Tracked</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Droplets size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Combustible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-gray-900">{selectedVehicleDetail.fuelLevel || 0}%</div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", (selectedVehicleDetail.fuelLevel || 0) > 20 ? "bg-green-500" : "bg-red-500")} style={{ width: `${selectedVehicleDetail.fuelLevel || 0}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Wrench size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Próx. Service</span>
                  </div>
                  <div className="text-2xl font-bold text-[#3A5F4B]">{(selectedVehicleDetail.nextService || 0) - (selectedVehicleDetail.horometro || 0)} <span className="text-sm font-medium text-gray-500">{selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</span></div>
                  <div className="text-xs text-gray-500 mt-1">a los {selectedVehicleDetail.nextService || 0} {selectedVehicleDetail.metricIcon === 'Clock' ? 'hrs' : 'km'}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <User size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Operario</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">{selectedVehicleDetail.driver || 'Sin asignar'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const message = encodeURIComponent(`Hola, reporto una falla técnica en el vehículo ${selectedVehicleDetail.name} (Patente: ${selectedVehicleDetail.patente}).`);
                    window.open(`https://wa.me/?text=${message}`, '_blank');
                  }}
                  className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={18} /> Reportar Falla por WhatsApp
                </button>
                <button
                  onClick={() => {
                    setIsChangeUserModalOpen(true);
                  }}
                  className="flex-1 py-3 px-4 bg-[#3A5F4B] hover:bg-[#2d4a3a] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <User size={18} /> Cambiar Usuario
                </button>
              </div>

              {/* History */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="text-[#3A5F4B]" size={20} /> Historial de Reparaciones
                </h4>
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                  {selectedVehicleDetail.history && selectedVehicleDetail.history.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {selectedVehicleDetail.history.map((record: any) => (
                        <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                              {record.type}
                            </span>
                            <span className="text-sm font-medium text-gray-500">{record.date}</span>
                          </div>
                          <p className="text-gray-900 font-medium mt-2">{record.description}</p>
                          <p className="text-sm text-gray-500 mt-1 font-mono">Costo: {record.cost}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
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
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Seleccionar Operario</h3>
              <button onClick={() => setIsChangeUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {personalData.map(person => (
                <button
                  key={person.id}
                  onClick={() => {
                    setVehicles(prev => prev.map(v => v.id === selectedVehicleDetail.id ? { ...v, driver: person.name } : v));
                    setSelectedVehicleDetail({ ...selectedVehicleDetail, driver: person.name });
                    setIsChangeUserModalOpen(false);
                    showToast('Usuario actualizado');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-[#3A5F4B]/10 text-[#3A5F4B] flex items-center justify-center font-bold text-sm shrink-0">
                    {person.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{person.name}</p>
                    <p className="text-xs text-gray-500">{person.role}</p>
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95">
            <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 flex items-center justify-between">
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-gray-900 text-lg font-bold leading-tight flex-1 text-center pr-10">Registro de Service</h2>
            </div>

            <div className="p-4 flex flex-col gap-6">
              {/* Section: Service Type */}
              <div className="flex flex-col gap-3">
                <h3 className="text-gray-900 text-base font-bold">Tipo de Servicio</h3>
                <div className="flex gap-3">
                  <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-[#3A5F4B] text-white font-medium transition-all shadow-sm shadow-[#3A5F4B]/20">
                    <Wrench size={20} />
                    Preventivo
                  </button>
                  <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-all">
                    <AlertTriangle size={20} />
                    Correctivo
                  </button>
                </div>
              </div>

              {/* Section: Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-gray-700 text-sm font-medium">Odómetro (km)</span>
                  <div className="relative">
                    <Activity size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="w-full pl-11 pr-4 h-14 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#3A5F4B] focus:ring-[#3A5F4B]" placeholder="45,000" type="number" />
                  </div>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-gray-700 text-sm font-medium">Costo Total</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input className="w-full pl-11 pr-4 h-14 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#3A5F4B] focus:ring-[#3A5F4B]" placeholder="120.00" type="number" />
                  </div>
                </label>
                <label className="flex flex-col gap-2 col-span-2">
                  <span className="text-gray-700 text-sm font-medium">Proveedor de Servicio</span>
                  <div className="relative">
                    <Briefcase size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="w-full pl-11 pr-4 h-14 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#3A5F4B] focus:ring-[#3A5F4B]" placeholder="Nombre del Taller / Mecánico" type="text" />
                  </div>
                </label>
              </div>

              {/* Section: Checklist */}
              <div className="flex flex-col gap-3">
                <h3 className="text-gray-900 text-base font-bold">Checklist Realizado</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:border-[#3A5F4B]/30 cursor-pointer transition-colors group">
                    <input defaultChecked className="w-5 h-5 rounded text-[#3A5F4B] focus:ring-[#3A5F4B] border-gray-300 mr-3" type="checkbox" />
                    <span className="text-gray-700 text-sm font-medium group-hover:text-[#3A5F4B] transition-colors">Aceite y Filtro</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:border-[#3A5F4B]/30 cursor-pointer transition-colors group">
                    <input className="w-5 h-5 rounded text-[#3A5F4B] focus:ring-[#3A5F4B] border-gray-300 mr-3" type="checkbox" />
                    <span className="text-gray-700 text-sm font-medium group-hover:text-[#3A5F4B] transition-colors">Frenos</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:border-[#3A5F4B]/30 cursor-pointer transition-colors group">
                    <input className="w-5 h-5 rounded text-[#3A5F4B] focus:ring-[#3A5F4B] border-gray-300 mr-3" type="checkbox" />
                    <span className="text-gray-700 text-sm font-medium group-hover:text-[#3A5F4B] transition-colors">Luces</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:border-[#3A5F4B]/30 cursor-pointer transition-colors group">
                    <input className="w-5 h-5 rounded text-[#3A5F4B] focus:ring-[#3A5F4B] border-gray-300 mr-3" type="checkbox" />
                    <span className="text-gray-700 text-sm font-medium group-hover:text-[#3A5F4B] transition-colors">Neumáticos</span>
                  </label>
                </div>
              </div>

              {/* Section: Document Upload */}
              <div className="flex flex-col gap-3">
                <h3 className="text-gray-900 text-base font-bold">Comprobante</h3>
                <div className="relative group cursor-pointer">
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-[#3A5F4B]/30 bg-[#3A5F4B]/5 flex flex-col items-center justify-center gap-2 transition-all hover:bg-[#3A5F4B]/10">
                    <div className="h-10 w-10 rounded-full bg-[#3A5F4B]/10 flex items-center justify-center text-[#3A5F4B]">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-[#3A5F4B] text-sm font-medium">Subir Factura o Recibo</p>
                  </div>
                </div>
              </div>

              {/* Section: Reminder */}
              <div className="flex flex-col gap-3 pb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900 text-base font-bold">Próximo Service</h3>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input defaultChecked className="sr-only peer" type="checkbox" value="" />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3A5F4B]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A5F4B]"></div>
                    </label>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Por Fecha</label>
                      <div className="flex items-center h-10 w-full bg-white rounded-lg px-3 border border-gray-200 text-gray-700 text-sm">
                        <CalendarDays size={16} className="mr-2 text-[#3A5F4B]" />
                        12 Oct, 2024
                      </div>
                    </div>
                    <div className="w-[1px] h-10 bg-gray-200"></div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Por Km</label>
                      <div className="flex items-center h-10 w-full bg-white rounded-lg px-3 border border-gray-200 text-gray-700 text-sm">
                        <Activity size={16} className="mr-2 text-[#3A5F4B]" />
                        55,000
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="sticky bottom-0 pb-4 pt-2 bg-white">
                <button
                  onClick={() => {
                    setIsServiceModalOpen(false);
                    showToast('Registro guardado correctamente');
                  }}
                  className="w-full h-14 bg-[#3A5F4B] hover:bg-[#2e4c3c] active:bg-[#233a2e] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#3A5F4B]/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                >
                  <Save size={20} />
                  Guardar Registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corrective Maintenance Modal */}
      {isCorrectiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Reportar Falla Técnica</h3>
              <button onClick={() => setIsCorrectiveModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descripción del Problema</label>
                <input
                  type="text"
                  value={newCorrectiveIssue.title}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Ej. Ruido en motor"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reportado por</label>
                <input
                  type="text"
                  value={newCorrectiveIssue.reportedBy}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, reportedBy: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                  placeholder="Nombre del empleado"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vehículo</label>
                <select
                  value={newCorrectiveIssue.vehicleId}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, vehicleId: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.patente})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de Falla</label>
                <select
                  value={newCorrectiveIssue.icon}
                  onChange={(e) => setNewCorrectiveIssue({ ...newCorrectiveIssue, icon: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#3A5F4B] focus:outline-none focus:ring-1 focus:ring-[#3A5F4B]"
                >
                  <option value="Wrench">Mecánica General</option>
                  <option value="BatteryWarning">Eléctrica / Batería</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCorrectiveModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCorrectiveIssue}
                  className="flex-1 rounded-xl bg-[#3A5F4B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2d4a3a] transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Ficha de Empleado</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportEmployeePDF}
                  disabled={isExporting}
                  className={cn("p-1.5 rounded transition", isExporting ? "text-gray-300" : "text-gray-500 hover:text-[#3A5F4B] hover:bg-[#3A5F4B]/10")}
                  title="Exportar a PDF"
                >
                  <FileText size={20} className={isExporting ? "animate-pulse" : ""} />
                </button>
                <button onClick={() => setIsEmployeeDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 border-2 border-[#3A5F4B]/10 flex items-center justify-center text-gray-500 font-bold text-2xl">
                  {selectedEmployeeDetail.initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedEmployeeDetail.name}</h2>
                  <p className="text-sm text-[#3A5F4B] font-medium">{selectedEmployeeDetail.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{selectedEmployeeDetail.status}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación</p>
                    <button
                      onClick={() => {
                        setIsEditingLocation(!isEditingLocation);
                        if (!isEditingLocation) setEditLocationValue(selectedEmployeeDetail.location || '');
                      }}
                      className="text-gray-400 hover:text-[#3A5F4B] transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                    {isEditingLocation ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editLocationValue}
                          onChange={(e) => setEditLocationValue(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#3A5F4B]"
                          autoFocus
                        />
                        <button onClick={handleSaveEmployeeDetail} className="bg-[#3A5F4B] text-white p-1 rounded hover:bg-[#2d4a3a]">
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-gray-900 truncate">{selectedEmployeeDetail.location || selectedEmployeeDetail.schedule || 'No asignado'}</p>
                    )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Presencialidad</p>
                    <button
                      onClick={() => {
                        setIsEditingPresencialidad(!isEditingPresencialidad);
                        if (!isEditingPresencialidad) setEditPresencialidadValue(selectedEmployeeDetail.presencialidad || 'No registrada');
                      }}
                      className="text-gray-400 hover:text-[#3A5F4B] transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  {isEditingPresencialidad ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editPresencialidadValue}
                        onChange={(e) => setEditPresencialidadValue(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#3A5F4B]"
                        autoFocus
                      />
                      <button onClick={handleSaveEmployeeDetail} className="bg-[#3A5F4B] text-white p-1 rounded hover:bg-[#2d4a3a]">
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-gray-900">{selectedEmployeeDetail.presencialidad || 'No registrada'}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Adelantos</p>
                    <button
                      onClick={() => {
                        setIsEditingAdelantos(!isEditingAdelantos);
                        if (!isEditingAdelantos) setEditAdelantosValue(selectedEmployeeDetail.adelantos || '$0');
                      }}
                      className="text-gray-400 hover:text-[#3A5F4B] transition-colors"
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
                         className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#3A5F4B]"
                         autoFocus
                       />
                       <button onClick={handleSaveEmployeeDetail} className="bg-[#3A5F4B] text-white p-1 rounded hover:bg-[#2d4a3a]">
                         <Check size={14} />
                       </button>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-gray-900">{selectedEmployeeDetail.adelantos || '$0'}</p>
                  )}
                </div>
              </div>

              {/* Gráfico de Asistencia */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Activity size={16} className="text-[#3A5F4B]" />
                    Asistencia en {selectedEmployeeDetail.location || 'Obra'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-medium">Alerta si baja de:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editAttendanceAlert}
                        onChange={(e) => setEditAttendanceAlert(Number(e.target.value))}
                        onBlur={handleSaveEmployeeDetail}
                        className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:border-[#3A5F4B]"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                {parseInt(selectedEmployeeDetail.presencialidad || '0') < (selectedEmployeeDetail.attendanceAlert || 90) && (
                  <div className="mb-4 bg-red-50 text-red-700 p-2 rounded-lg text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Alerta: La presencialidad está por debajo del límite configurado ({selectedEmployeeDetail.attendanceAlert || 90}%).
                  </div>
                )}

                <div className="flex justify-between items-end h-24 gap-2">
                  {selectedEmployeeDetail.attendanceData ? selectedEmployeeDetail.attendanceData.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all duration-500",
                          day.present ? "bg-[#3A5F4B] h-full" : "bg-red-200 h-1/4"
                        )}
                        title={day.present ? 'Presente' : 'Ausente'}
                      />
                      <span className="text-[10px] font-medium text-gray-500">{day.date}</span>
                    </div>
                  )) : (
                    <div className="w-full text-center text-sm text-gray-400 py-4">No hay datos de asistencia</div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedMember(selectedEmployeeDetail);
                    handleOpenEdit();
                    setIsEmployeeDetailModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#3A5F4B] text-white font-medium rounded-lg hover:bg-[#2d4a3a] transition-colors flex items-center gap-2"
                >
                  <Edit2 size={16} /> Editar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
