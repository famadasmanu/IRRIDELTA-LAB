import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Share2, ZoomIn, Maximize, Minimize, Smartphone, Info, ShoppingCart, Map as MapIcon, Package, User, Square, Layers, Ruler, FolderOpen, Eye, BarChart2, Settings, Home, Activity, CheckCircle, Upload, Trash2, MapPin, Sun, Droplets, Navigation, Check, SplitSquareHorizontal, Download, Sparkles, AlertTriangle, Merge, Plus, Camera, Save, Image as ImageIcon, FileText, BookOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Calculadora() {
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState('calculadora');
 const [projectName, setProjectName] = useState('Proyecto de Riego #402');
 const [projectFile, setProjectFile] = useState<string | null>(null);
 const [isDrawingMode, setIsDrawingMode] = useState(false);
 const [nodes, setNodes] = useState<{ x: number, y: number, pipeSize?: string, isStart?: boolean, isEnd?: boolean }[]>([]);
 const [currentPipeSize, setCurrentPipeSize] = useState('32mm');
 const [caudal, setCaudal] = useState('');
 const [material, setMaterial] = useState('PVC Clase 10');

 // Conversor Emisores & Zonas
 const [emitterBrand, setEmitterBrand] = useState('Hunter');
 const [emitterModel, setEmitterModel] = useState('Rotor PGP-ADJ');
 const [emitterSubType, setEmitterSubType] = useState('Boquilla #2.0');
 const [emitterAngle, setEmitterAngle] = useState('180');
 const [emitterCount, setEmitterCount] = useState<number | ''>(1);
 const [currentZoneName, setCurrentZoneName] = useState('Zona 1');
 const [currentZonePhoto, setCurrentZonePhoto] = useState<string | null>(null);
 const [currentEmitters, setCurrentEmitters] = useState<any[]>([]);
 const [zonasGuardadas, setZonasGuardadas] = useState<any[]>([]);

 // Factores Ambientales
 const [sustrato, setSustrato] = useState('Franco');
 const [soleamiento, setSoleamiento] = useState('Medio');
 const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [desnivel, setDesnivel] = useState('0');
  const [accesoriosValvulas, setAccesoriosValvulas] = useState('1');
  const [accesoriosCodos, setAccesoriosCodos] = useState('2');

 // Calibración y Escala
 const [isCalibrating, setIsCalibrating] = useState(false);
 const [calibrationNodes, setCalibrationNodes] = useState<{ x: number, y: number }[]>([]);
 const [pixelsPerMeter, setPixelsPerMeter] = useState<number | null>(null);
 const [calibrationDistanceInput, setCalibrationDistanceInput] = useState('');
 const [showCalibrationModal, setShowCalibrationModal] = useState(false);
 const scaleFactor = pixelsPerMeter ? (1 / pixelsPerMeter) : 0.1;

 const [resultados, setResultados] = useState<{ perdida: string, velocidad: string, caudalTotal: string, diametro: string, recomendacion?: string } | null>(null);
 const [totalDistance, setTotalDistance] = useState(0);
 const [showOriginalLayer, setShowOriginalLayer] = useState(true);
 const [showDrawingLayer, setShowDrawingLayer] = useState(true);
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const pdfExportRef = useRef<HTMLDivElement>(null);

 const { data: inventarioRaw, add: addInventarioToDB } = useFirestoreCollection<any>('inventario');
 const inventarioData = inventarioRaw;

 // Clientes are needed to link projects
 const { data: clientesRaw, update: updateClientInDB } = useFirestoreCollection<any>('clientes');
 const clientesData = clientesRaw;
 const [selectedClientId, setSelectedClientId] = useState('');

 // Estados de IA Copilot
 const [copilotoActivo, setCopilotoActivo] = useState(true);
 const [autoTelescopico, setAutoTelescopico] = useState(false);
 const [iaAlerts, setIaAlerts] = useState<{ id: number, type: 'warning'|'error'|'info'|'success', message: string }[]>([]);
 const [procesandoPlano, setProcesandoPlano] = useState(false);

 // Vistas del Visualizador
 const [isFullscreen, setIsFullscreen] = useState(false);
 const [isMobileView, setIsMobileView] = useState(false);

 const agregarAlertaIa = (type: 'warning'|'error'|'info'|'success', message: string) => {
 setIaAlerts(prev => {
 if (prev.some(a => a.message === message)) return prev;
 return [{ id: Date.now() + Math.random(), type, message }, ...prev].slice(0, 3);
 });
 };
 const handleGetLocation = () => {
 setIsGettingLocation(true);
 if ('geolocation' in navigator) {
 navigator.geolocation.getCurrentPosition(
 (position) => {
 setIsGettingLocation(false);
 setSoleamiento('Alto'); // Simulación para la demo
 if (copilotoActivo) {
 setSustrato('Franco');
 agregarAlertaIa('success', 'Satélite: ET0=5.2mm/día detectado. Sustrato Franco asignado y Soleamiento Alto.');
 } else {
 alert('Ubicación obtenida. Soleamiento estimado en esta latitud: Alto.');
 }
 },
 (error) => {
 setIsGettingLocation(false);
 alert('Error al obtener ubicación (GPS denegado). Puede seleccionarlo manualmente.');
 }
 );
 } else {
 setIsGettingLocation(false);
 alert('Geolocalización no soportada.');
 }
 };

 const confirmarCalibracion = () => {
 const distReal = parseFloat(calibrationDistanceInput);
 if (calibrationNodes.length === 2 && distReal > 0) {
 const dx = calibrationNodes[1].x - calibrationNodes[0].x;
 const dy = calibrationNodes[1].y - calibrationNodes[0].y;
 const distPx = Math.sqrt(dx * dx + dy * dy);
 const newPixelsPerMeter = distPx / distReal;
 setPixelsPerMeter(newPixelsPerMeter);

 if (nodes.length > 1) {
 let newTotal = 0;
 for (let i = 1; i < nodes.length; i++) {
 const pxDist = Math.sqrt(Math.pow(nodes[i].x - nodes[i - 1].x, 2) + Math.pow(nodes[i].y - nodes[i - 1].y, 2));
 newTotal += pxDist * (1 / newPixelsPerMeter);
 }
 setTotalDistance(newTotal);
 }
 alert('Escala calibrada con éxito.');
 }
 setShowCalibrationModal(false);
 setCalibrationNodes([]);
 setCalibrationDistanceInput('');
 };

 const handleAddToCart = (product: any) => {
 const newItem = {
 id: Date.now(),
 nombre: product.name,
 categoria: 'Materiales',
 cantidad: 1,
 unidad: 'Unidad',
 minimo: 1,
 precio: product.price,
 proveedor: product.provider,
 estado: 'ok',
 checklist: true // Custom flag to identify it as added from calculator
 };
 addInventarioToDB(newItem);
 alert(`${product.name} agregado a la checklist de inventario.`);
 };

 const handleSaveProjectToClient = () => {
 if (!resultados) {
 alert('Primero debes calcular los requerimientos antes de guardar el proyecto.');
 return;
 }
 if (!selectedClientId) {
 alert('Por favor selecciona un cliente para guardar el proyecto.');
 return;
 }

 const clientId = parseInt(selectedClientId);
 const clientToUpdate = clientesData.find((c: any) => c.id === clientId);
 if (!clientToUpdate) {
 alert('Cliente no encontrado.');
 return;
 }

 const newProject = {
 id: Date.now().toString(),
 nombre: projectName,
 fecha: new Date().toLocaleDateString('es-AR'),
 caudal: `${caudal} L/min`,
 distancia: totalDistance.toFixed(1) + ' m',
 material,
 perdida: resultados.perdida,
 velocidad: resultados.velocidad,
 recomendacion: resultados.recomendacion,
 nodes: nodes.length
 };

 const updatedClient = {
 ...clientToUpdate,
 proyectos_riego: clientToUpdate.proyectos_riego ? [...clientToUpdate.proyectos_riego, newProject] : [newProject]
 };

 const clientIdToUpdate = clientToUpdate.id; // getting string id from Firestore client

 updateClientInDB(clientIdToUpdate, updatedClient);
 alert(`Proyecto "${projectName}" guardado exitosamente en el cliente ${clientToUpdate.name}.`);
 };

 
  const handleUndoNode = () => {
    if (nodes.length === 0) return;
    const newNodes = nodes.slice(0, -1);
    setNodes(newNodes);
    
    if (newNodes.length > 1) {
      let newTotal = 0;
      for (let i = 1; i < newNodes.length; i++) {
        const dx = newNodes[i].x - newNodes[i - 1].x;
        const dy = newNodes[i].y - newNodes[i - 1].y;
        newTotal += Math.sqrt(dx * dx + dy * dy) * scaleFactor;
      }
      setTotalDistance(newTotal);
    } else {
      setTotalDistance(0);
    }
  };

const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 const rect = canvas.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;

 if (isCalibrating) {
 const newCalNodes = [...calibrationNodes, { x, y }];
 setCalibrationNodes(newCalNodes);
 if (newCalNodes.length === 2) {
 setIsCalibrating(false);
 setShowCalibrationModal(true);
 }
 return;
 }

 if (!isDrawingMode) return;

 const isStart = nodes.length === 0;
 const newNodes = [...nodes, { x, y, pipeSize: currentPipeSize, isStart }];
 setNodes(newNodes);

 if (newNodes.length > 1) {
 const lastNode = newNodes[newNodes.length - 2];
 const dx = x - lastNode.x;
 const dy = y - lastNode.y;
 const distance = Math.sqrt(dx * dx + dy * dy) * scaleFactor;
 setTotalDistance(prev => prev + distance);
 }
 };

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 ctx.clearRect(0, 0, canvas.width, canvas.height);

 if (!showDrawingLayer) return;

 // Draw lines
 ctx.beginPath();
 ctx.strokeStyle = '#059669';
 ctx.lineWidth = 3;
 nodes.forEach((node, index) => {
 if (index === 0) {
 ctx.moveTo(node.x, node.y);
 } else {
 ctx.lineTo(node.x, node.y);
 }
 });
 ctx.stroke();

 // Draw calibration line if exists
 if (calibrationNodes.length > 0) {
 ctx.beginPath();
 ctx.strokeStyle = '#F27D26';
 ctx.setLineDash([5, 5]);
 ctx.lineWidth = 2;
 ctx.moveTo(calibrationNodes[0].x, calibrationNodes[0].y);
 if (calibrationNodes.length === 2) {
 ctx.lineTo(calibrationNodes[1].x, calibrationNodes[1].y);
 }
 ctx.stroke();
 ctx.setLineDash([]);

 calibrationNodes.forEach(node => {
 ctx.beginPath();
 ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
 ctx.fillStyle = '#F27D26';
 ctx.fill();
 });
 }

 // Draw nodes
 nodes.forEach((node, index) => {
 ctx.beginPath();
 const isStart = index === 0;
 const isEnd = index === nodes.length - 1 && nodes.length > 1;

 if (isStart) ctx.fillStyle = '#3b82f6'; // Inicio (Bomba) Azul
 else if (isEnd) ctx.fillStyle = '#ef4444'; // Fin (Emisor) Rojo
 else ctx.fillStyle = '#059669'; // Nodos verdes

 ctx.arc(node.x, node.y, isStart || isEnd ? 8 : 6, 0, 2 * Math.PI);
 ctx.fill();
 ctx.strokeStyle = '#ffffff';
 ctx.lineWidth = 2;
 ctx.stroke();

 // Draw distance label for segments
 if (index > 0) {
 const prevNode = nodes[index - 1];
 const midX = (prevNode.x + node.x) / 2;
 const midY = (prevNode.y + node.y) / 2;
 const dx = node.x - prevNode.x;
 const dy = node.y - prevNode.y;
 const dist = (Math.sqrt(dx * dx + dy * dy) * scaleFactor).toFixed(1);

 ctx.fillStyle = '#ffffff';
 ctx.fillRect(midX - 15, midY - 10, 30, 20);
 ctx.fillStyle = '#059669';
 ctx.font = '10px monospace';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillText(`${dist}m (${node.pipeSize || '32mm'})`, midX, midY);
 }
 });
 }, [nodes, showDrawingLayer, calibrationNodes, scaleFactor]);

 // Resize canvas to match container
 useEffect(() => {
 const resizeCanvas = () => {
 if (containerRef.current && canvasRef.current) {
 canvasRef.current.width = containerRef.current.clientWidth;
 canvasRef.current.height = containerRef.current.clientHeight;
 }
 };
 resizeCanvas();
 window.addEventListener('resize', resizeCanvas);
 return () => window.removeEventListener('resize', resizeCanvas);
 }, [projectFile]);

 const handleCalcular = () => {
 if (!caudal || totalDistance === 0) {
 alert('Por favor ingrese el caudal y dibuje al menos un tramo en el plano.');
 return;
 }

 const Q = parseFloat(caudal); // L/min
 const Q_m3h = Q * 60 / 1000;
 const Q_m3s = Q_m3h / 3600;

 let perdidaTotal = 0;
 let newAlerts: {type: 'warning'|'error'|'info'|'success', message: string}[] = [];
 
 let calcNodes = [...nodes];
 if (copilotoActivo && autoTelescopico && nodes.length > 2) {
 const diams = ['63mm', '50mm', '40mm', '32mm', '25mm', '20mm'];
 let startIdx = diams.indexOf(currentPipeSize);
 if (startIdx === -1) startIdx = 3;
 calcNodes = nodes.map((node, i) => {
 if (i === 0) return { ...node, pipeSize: diams[startIdx] };
 const sizeReduction = Math.floor(i / 2); // se reduce cada 2 nodos
 const newIdx = Math.min(startIdx + sizeReduction, diams.length - 1);
 return { ...node, pipeSize: diams[newIdx] };
 });
 
 let changed = false;
 for(let j=0; j<nodes.length; j++) {
 if(nodes[j].pipeSize !== calcNodes[j].pipeSize) changed = true;
 }
 
 if (changed) {
 setNodes(calcNodes);
 newAlerts.push({ type: 'success', message: 'Telescópico Inteligente: Diámetros adaptados gradualmente para ahorrar PVC y evitar purgado deficiente.'});
 }
 }

 if (calcNodes.length > 1) {
 let maxV = 0;
 let minV = 100;

 for (let i = 1; i < calcNodes.length; i++) {
 const prevNode = calcNodes[i - 1];
 const currNode = calcNodes[i];
 const dx = currNode.x - prevNode.x;
 const dy = currNode.y - prevNode.y;
 const lengthMeters = Math.sqrt(dx * dx + dy * dy) * scaleFactor;

 const diamString = currNode.pipeSize || '32mm';
 const D_mm = parseFloat(diamString.replace('mm', ''));
 const D_m = D_mm / 1000;

 let C = 150; // PVC
 if (material.includes('Polietileno')) C = 140;

 const hf_mwc = 10.67 * lengthMeters * Math.pow(Q_m3s / C, 1.852) / Math.pow(D_m, 4.87);
 const hf_bar = hf_mwc / 10.197;
 perdidaTotal += hf_bar;

 const v = (4 * Q_m3s) / (Math.PI * Math.pow(D_m, 2));
 if (v > maxV) maxV = v;
 if (v < minV) minV = v;
 }

 if (copilotoActivo) {
 if (maxV > 2.0) {
 newAlerts.push({ type: 'error', message: `¡Ruptura por Golpe de Ariete! Velocidad máxima en algún tramo es de ${maxV.toFixed(2)} m/s (súperando los 2.0 m/s críticos). Por favor, cambie la Montante a un diámetro mayor.`});
 } else if (maxV > 1.5) {
 newAlerts.push({ type: 'warning', message: `Reduciendo vida útil: Velocidad límite de ${maxV.toFixed(2)} m/s alcanzada. Inspeccione la clase del tubo para asegurar aguante hidráulico.`});
 }
 
 if (minV < 0.6 && !autoTelescopico) {
 newAlerts.push({ type: 'info', message: `Velocidades remanentes bajas (${minV.toFixed(2)} m/s). Riesgo enorme de sedimentación. Activa el dimensionado telescópico.`});
 }
 
 if (perdidaTotal > 2.5) {
 newAlerts.push({ type: 'error', message: `Diseño Inviable: Pérdida total sumada de ${perdidaTotal.toFixed(2)} bar. Los emisores finales en la serie no tendrán presión basal de trabajo.`});
 }
 }
 } else {
 perdidaTotal = (Q * 0.05 * (totalDistance / 10)); // Fallback
 }

 if (newAlerts.length > 0) {
 setIaAlerts(prev => {
 let updated = [...newAlerts.map(a => ({...a, id: Date.now() + Math.random()})), ...prev];
 updated = updated.filter((v,i,a)=>a.findIndex(v2=>(v2.message===v.message))===i);
 return updated.slice(0, 3);
 });
 }

 const diamString = calcNodes.length > 0 ? (calcNodes[0].pipeSize || currentPipeSize) : currentPipeSize;
 const D_mm = parseFloat(diamString.replace('mm', ''));
 const velocity = (4 * Q_m3s) / (Math.PI * Math.pow(D_mm / 1000, 2));

 let sugerencia = '';
 if (sustrato === 'Arenoso') {
 sugerencia = 'Agronomía IA: Por altísima infiltración y baja retención (V.I >= 50 mm/h), programe ciclos muy cortos (3-5 min) reiterados para no perder lámina por percolación extrema.';
 } else if (sustrato === 'Arcilloso') {
 sugerencia = 'Agronomía IA: Riegue en pulsos espaciados. La infiltración basal del lote es paupérrima (V.I <= 3 mm/h). Si concentra riego sin pausa generará un encharcamiento e hipoxia radicular nociva.';
 } else {
 sugerencia = 'Agronomía IA: Lote Franco ideal. Riegos espaciados moderados y sin encharcamiento estimado para lograr un humedecimiento a 15-20cm radicular.';
 }
 if (soleamiento === 'Alto' || soleamiento === 'Muy Alto') sugerencia += ' NOTA: ET de la zona requerirá +30% de aportes en temporada Estival, asegure sobredimensionar la bomba para caudal max diario.';

 setResultados({
 perdida: `${perdidaTotal.toFixed(3)} bar`,
 velocidad: `${velocity.toFixed(2)} m/s`,
 caudalTotal: `${Q_m3h.toFixed(2)} m³/h`,
 diametro: currentPipeSize,
 recomendacion: sugerencia
 });
 };

 const handleShareWhatsApp = () => {
 if (!resultados) {
 alert('Primero debes calcular los requerimientos.');
 return;
 }

 const text = `*Resultados Calculadora Hidráulica - ${projectName}*\n\n` +
 `*Parámetros:*\n` +
 `- Caudal: ${caudal} L/min\n` +
 `- Distancia Total: ${totalDistance.toFixed(1)} m\n` +
 `- Material: ${material}\n\n` +
 `*Resultados:*\n` +
 `- Pérdida de Carga: ${resultados.perdida}\n` +
 `- Velocidad: ${resultados.velocidad}\n` +
 `- Caudal Total: ${resultados.caudalTotal}\n` +
 `- Diámetro Principal: ${resultados.diametro}\n`;

 const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
 window.open(url, '_blank');
 };

 const handleGeneratePDF = async () => {
 if (!resultados) {
 alert('Primero debes calcular los requerimientos.');
 return;
 }

 const element = pdfExportRef.current;
 if (!element) return;

 try {
 element.style.display = 'block'; // Ensure it's rendered for canvas
 const canvasObj = await html2canvas(element, { scale: 2 });
 element.style.display = 'none';

 const imgData = canvasObj.toDataURL('image/png');
 const pdf = new jsPDF('p', 'mm', 'a4');
 const pdfWidth = pdf.internal.pageSize.getWidth();
 const pdfHeight = (canvasObj.height * pdfWidth) / canvasObj.width;

 pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
 pdf.save(`Presupuesto_${projectName.replace(/\s+/g, '_')}.pdf`);
 } catch (error) {
 console.error("Error generating PDF:", error);
 alert("Hubo un error al generar el PDF.");
 if (element) element.style.display = 'none';
 }
 };

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => setProjectFile(reader.result as string);
 reader.readAsDataURL(file);
 }
 };

 const [showAiQuoteModal, setShowAiQuoteModal] = useState(false);
 const [aiQuoteData, setAiQuoteData] = useState<{items: any[], total: number} | null>(null);

 const handleGenerateAIQuote = () => {
 if (!resultados) {
 alert('Primero debes calcular los requerimientos hidráulicos.');
 return;
 }
 setProcesandoPlano(true);
 setTimeout(() => {
 setProcesandoPlano(false);
 const pipeCost = 1200 * totalDistance;
 const pumpCost = 345000;
 const connectionCost = nodes.length > 0 ? nodes.length * 2500 : 50000;
 const laborCost = 150000;
 const total = pipeCost + pumpCost + connectionCost + laborCost;
 setAiQuoteData({
 items: [
 { name: `Tubería ${material} ${currentPipeSize}`, qty: Math.ceil(totalDistance), price: 1200, isStock: true },
 { name: 'Bomba Centrífuga 1.5HP (Sugerida IA)', qty: 1, price: pumpCost, isStock: false },
 { name: 'Accesorios y Codos (Estimación IA)', qty: nodes.length > 0 ? nodes.length : 20, price: 2500, isStock: true },
 { name: 'Mano de Obra Especializada (Estimación)', qty: 1, price: laborCost, isStock: false }
 ],
 total
 });
 setShowAiQuoteModal(true);
 agregarAlertaIa('success', 'Presupuesto IA generado en base geométrica y requerimientos de caudal.');
 }, 2500);
 };

 return (
 <div className="flex flex-col font-sans pb-8 max-w-6xl mx-auto w-full">
 {/* Header */}
 <header className="glass-card rounded-2xl p-4 shadow-sm border border-bd-lines mb-6 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <button
 onClick={() => navigate(-1)}
 className="text-accent bg-accent/10 p-2 rounded-lg hover:bg-accent/20 transition-colors"
 >
 <ArrowLeft size={24} />
 </button>
 <div>
 <h1 className="text-2xl font-extrabold tracking-tight text-tx-primary">Calculadora Hidráulica</h1>
 <div className="flex items-center gap-2 mt-1">
 <input
 type="text"
 value={projectName}
 onChange={(e) => setProjectName(e.target.value)}
 className="text-sm text-tx-secondary font-medium bg-transparent border-b border-dashed border-bd-lines focus:border-accent outline-none px-1 py-0.5 transition-colors hover:border-accent"
 placeholder="Nombre del proyecto..."
 />
 </div>
 </div>
 </div>
 <div className="flex gap-2">
 <button
 onClick={handleShareWhatsApp}
 className="flex items-center gap-2 text-sm font-bold text-tx-secondary bg-slate-800/20 backdrop-blur-md px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
 >
 <Share2 size={18} />
 Compartir
 </button>
 </div>
 </header>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 {/* Left Column (Main Focus): PDF Viewer & Map */}
 <div className={`lg:col-span-8 order-1 flex flex-col gap-6 w-full ${isFullscreen ? 'z-[100]' : ''}`}>
 {/* Main Visualizer */}
 <div className={
 isFullscreen ? 'fixed inset-0 z-[100] bg-slate-200 flex flex-col h-screen w-screen transition-all duration-300' :
 isMobileView ? 'bg-card shadow-2xl border-[12px] border-slate-800 rounded-[2.5rem] mx-auto w-full max-w-[375px] h-[812px] overflow-hidden flex flex-col relative transition-all duration-500' :
 'glass-card rounded-2xl shadow-sm border border-bd-lines overflow-hidden flex flex-col h-[450px] lg:h-[700px] relative transition-all duration-500'
 }>
 {/* Toolbar */}
 <div className="flex items-center justify-between p-3 border-b border-bd-lines bg-slate-800/20 backdrop-blur-md">
 <div className="flex items-center gap-2">
 <button
 onClick={() => document.getElementById('pdf-upload')?.click()}
 className="flex items-center gap-2 bg-card border border-bd-lines text-tx-secondary px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-800/20 backdrop-blur-md transition-colors shadow-sm"
 >
 <Upload size={16} />
 Subir Plano/PDF
 </button>
 <input
 id="pdf-upload"
 type="file"
 accept="application/pdf,image/*"
 className="hidden"
 onChange={handleFileUpload}
 />
 </div>
 <div className="flex items-center gap-2">
 {/* Mini IA Toggle in Toolbar for cleaner UI */}
 <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 mr-4">
 <Sparkles size={14} className="text-indigo-600" />
 <span className="text-xs font-bold text-indigo-900">Copiloto IA</span>
 <label className="flex items-center cursor-pointer ml-1">
 <div className="relative">
 <input type="checkbox" className="sr-only" checked={copilotoActivo} onChange={() => setCopilotoActivo(!copilotoActivo)} />
 <div className={`block w-7 h-4 rounded-full transition-colors ${copilotoActivo ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
 <div className={`dot absolute left-[2px] top-[2px] bg-card w-3 h-3 rounded-full transition-transform ${copilotoActivo ? 'transform translate-x-3' : ''}`}></div>
 </div>
 </label>
 </div>
 <button 
 onClick={() => { setIsMobileView(!isMobileView); setIsFullscreen(false); }}
 className={`p-1.5 rounded-lg transition-colors ${isMobileView ? 'bg-accent text-white' : 'text-tx-secondary hover:bg-card hover:text-accent'}`}
 title="Vista Simulación Móvil"
 >
 <Smartphone size={18} />
 </button>
 <button 
 onClick={() => { setIsFullscreen(!isFullscreen); setIsMobileView(false); }}
 className={`p-1.5 rounded-lg transition-colors ${isFullscreen ? 'bg-accent text-white' : 'text-tx-secondary hover:bg-card hover:text-accent'}`}
 title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
 >
 {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
 </button>
 </div>
 </div>

 {/* Viewer Area */}
 <div className="flex-1 bg-slate-200 relative overflow-hidden group" ref={containerRef}>
 {showCalibrationModal && (
 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-card p-4 rounded-xl shadow-2xl border border-bd-lines flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4">
 <h4 className="font-bold text-tx-primary text-sm">Distancia de los dos puntos marcados:</h4>
 <div className="flex gap-2 items-center">
 <input
 type="number"
 value={calibrationDistanceInput}
 onChange={(e) => setCalibrationDistanceInput(e.target.value)}
 placeholder="Ej. 10.5"
 className="w-24 h-9 px-3 border border-bd-lines rounded-lg outline-none focus:border-accent text-center font-bold text-accent"
 autoFocus
 />
 <span className="text-tx-secondary font-bold">m</span>
 </div>
 <div className="flex gap-2 w-full mt-1">
 <button onClick={() => { setShowCalibrationModal(false); setCalibrationNodes([]); }} className="flex-1 bg-slate-800/20 backdrop-blur-md text-tx-secondary font-bold py-2 rounded-lg hover:bg-slate-200 text-xs transition-colors">Cancelar</button>
 <button onClick={confirmarCalibracion} className="flex-1 bg-accent text-white font-bold py-2 rounded-lg hover:bg-[#15803d] text-xs transition-colors flex justify-center items-center gap-1"><Check size={14} /> Aplicar</button>
 </div>
 </div>
 )}
 <div className="absolute inset-0 flex items-center justify-center">
 {showOriginalLayer && (
 projectFile ? (
 projectFile.startsWith('data:application/pdf') ? (
 <embed src={projectFile} type="application/pdf" className="w-full h-full pointer-events-none" />
 ) : (
 <div className="w-full h-full bg-contain bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: `url('${projectFile}')` }}></div>
 )
 ) : (
 <div className="w-full h-full bg-cover bg-center opacity-90 pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDQXLVZgcvUmvYtvAADhqAZOdzy8wdrkDLnPoG44zl1lXoMXwu_GNX2i3FOrVaCmVOuX0xbKH5btV1HWefgk2YTu1JEtIKB76_Yv3OIfOXOaA5YymdqIMvgRyNdrgNNCcR_temvJ_2AUbRHuYopy4yoXd7MqIO5X6K0I-OvuW3KMAOYOli49LlfNfrQC-chdgznvVqAIXnp_CZ9Il0cUPjpsm5F6lMqxEQjKT6KTBo3V833PBmZQCeGF2IK9z-Go7Lxr5opBZmaxaA')" }}></div>
 )
 )}

 <canvas
 ref={canvasRef}
 onClick={handleCanvasClick}
 className={`absolute inset-0 z-10 ${isDrawingMode ? 'cursor-crosshair' : 'cursor-default'}`}
 />

 {(!projectFile || !projectFile.startsWith('data:application/pdf')) && !isDrawingMode && nodes.length === 0 && (
 <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
 )}
 </div>

 {/* Floating Tools */}
 <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
 <button
 onClick={() => {
 setIsCalibrating(!isCalibrating);
 setIsDrawingMode(false);
 if (!isCalibrating) {
 setCalibrationNodes([]);
 alert('Haga click en dos puntos del plano actual para definir una medida real conocida. (Se trazará una línea punteada y luego le preguntaremos la distancia)');
 }
 }}
 className={`p-2 rounded-xl shadow-lg transition-colors ${isCalibrating ? 'bg-[#F27D26] text-white animate-pulse' : 'bg-accent text-white hover:bg-[#15803d]'}`}
 title={isCalibrating ? "Cancelando calibración..." : "Calibrar escala geométrica de este plano"}
 >
 <Navigation size={20} />
 </button>
 <button
 onClick={() => { setIsDrawingMode(!isDrawingMode); setIsCalibrating(false); }}
 className={`p-2 rounded-xl shadow-lg transition-colors ${isDrawingMode ? 'bg-[#F27D26] text-white' : 'bg-accent text-white hover:bg-[#15803d]'}`}
 title={isDrawingMode ? "Desactivar dibujo de nodos" : "Dibujar nodos de tubería"}
 >
 <Ruler size={20} />
 </button>
 <button
 onClick={() => setShowOriginalLayer(!showOriginalLayer)}
 className={`p-2 rounded-xl shadow-sm border transition-colors ${showOriginalLayer ? 'bg-card/90 text-accent border-bd-lines' : 'bg-slate-200 text-tx-secondary border-bd-lines'}`}
 title="Alternar capa original (Plano)"
 >
 <Eye size={20} />
 </button>
 <button
 onClick={() => setShowDrawingLayer(!showDrawingLayer)}
 className={`p-2 rounded-xl shadow-sm border transition-colors ${showDrawingLayer ? 'bg-card/90 text-accent border-bd-lines' : 'bg-slate-200 text-tx-secondary border-bd-lines'}`}
 title="Alternar capa de dibujo (Nodos)"
 >
 <Layers size={20} />
 </button>
 {nodes.length > 0 && (
 <button
 onClick={() => { setNodes([]); setTotalDistance(0); }}
 className="bg-card/90 text-red-500 p-2 rounded-xl shadow-sm border border-bd-lines hover:bg-red-50 transition-colors"
 title="Borrar nodos"
 >
 <Trash2 size={20} />
 </button>
 )}
 </div>

 {/* Smart Alerts IA Layer (Only shows if copiloto is ON and there are alerts) */}
 {copilotoActivo && iaAlerts.length > 0 && (
 <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm pointer-events-none">
 {iaAlerts.map(al => (
 <div key={al.id} className={`flex items-start gap-2 p-3 rounded-xl text-xs font-semibold shadow-2xl pointer-events-auto border animate-in fade-in slide-in-from-left-4 ${al.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : al.type === 'warning' ? 'bg-orange-50 text-orange-800 border-orange-200' : al.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-card/90 backdrop-blur text-indigo-800 border-indigo-200'}`}>
 {al.type === 'error' ? <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /> : al.type === 'success' ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <Info size={16} className="mt-0.5 flex-shrink-0" />}
 <span className="leading-tight">{al.message}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Right Column (Controls): Zone Builder & Parameters */}
 <div className="lg:col-span-4 lg:row-span-2 order-2 flex flex-col gap-6 w-full">

 {/* Constructor de Zonas Card */}
 <div className="glass-card rounded-[1.5rem] p-6 shadow-sm border border-bd-lines mb-6 relative overflow-hidden">
 <h3 className="text-lg font-bold text-tx-primary mb-1 flex items-center gap-2">
 <Droplets className="text-accent" size={20} />
 Constructor de Zonas de Riego
 </h3>
 <p className="text-xs text-tx-secondary mb-5 font-medium leading-relaxed">Configurá las zonas agrupando emisores precisos de Hunter o Rain Bird, especificando ángulos y modelos.</p>

 {/* Crear Zona Activa */}
 <div className="bg-slate-800/20 backdrop-blur-md p-4 rounded-xl border border-bd-lines mb-5">
 <div className="flex gap-3 mb-4 items-center">
 <div className="flex-1">
 <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest pl-1">Nombre de la Zona</label>
 <input type="text" value={currentZoneName} onChange={(e) => setCurrentZoneName(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-bd-lines bg-card focus:bg-card focus:border-accent text-sm font-bold text-tx-primary outline-none transition-all" />
 </div>
 <div className="flex flex-col items-center">
 <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest mb-0.5">Foto</label>
 <button onClick={() => {
 const url = prompt("Pegue la URL de la foto de la zona (ej. desde Google Photos o Imgur):", "https://i.imgur.com/vHq0gO7.jpeg");
 if(url) setCurrentZonePhoto(url);
 }} className="h-10 w-12 rounded-xl border border-bd-lines bg-card hover:bg-slate-800/20 backdrop-blur-md text-tx-secondary flex items-center justify-center transition-all">
 {currentZonePhoto ? <ImageIcon size={18} className="text-accent" /> : <Camera size={18} />}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 mb-3">
 <div className="flex flex-col gap-1 lg:col-span-2">
 <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest pl-1">Marca</label>
 <select value={emitterBrand} onChange={(e) => {
 const brand = e.target.value;
 setEmitterBrand(brand);
 if (brand === 'Hunter') {
 setEmitterModel('Rotor PGP-ADJ');
 setEmitterSubType('Boquilla #2.0');
 } else {
 setEmitterModel('Rotor 5004');
 setEmitterSubType('Boquilla #2.0');
 }
 }} className="w-full h-9 px-2 rounded-lg border border-bd-lines bg-card text-xs font-bold text-tx-secondary outline-none hover:border-accent">
 <option>Hunter</option>
 <option>Rain Bird</option>
 </select>
 </div>
 <div className="flex flex-col gap-1 lg:col-span-3">
 <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest pl-1">Modelo</label>
 <select value={emitterModel} onChange={(e) => {
 const mod = e.target.value;
 setEmitterModel(mod);
 if(mod.includes('Pro-Spray') || mod.includes('Tobera')) setEmitterSubType('Tobera PSU 17A');
 else if(mod.includes('MP Rotator')) setEmitterSubType('MP 2000');
 else if(mod.includes('R-VAN')) setEmitterSubType('R-VAN 18');
 else if(mod.includes('HE-VAN')) setEmitterSubType('HE-VAN 15');
 else setEmitterSubType('Boquilla #2.0');
 }} className="w-full h-9 px-2 rounded-lg border border-bd-lines bg-card text-xs font-bold text-tx-secondary outline-none hover:border-accent">
 {emitterBrand === 'Hunter' ? (
 <>
 <option>Rotor PGP-ADJ (Hunter via Todo Riego (Distribuye: Argent Software))</option>
 <option>Rotor PGP-Ultra (Hunter via Todo Riego (Distribuye: Argent Software))</option>
 <option>Rotor I-20</option>
 <option>Rotor PGJ</option>
 <option>MP Rotator (Boquilla)</option>
 <option>Tobera Pro-Spray / PSU</option>
 </>
 ) : (
 <>
 <option>Rotor 5004</option>
 <option>Rotor 3504</option>
 <option>Rotor 8005</option>
 <option>Boquilla R-VAN (Rain Bird via Munditol (Distribuye: Argent Software))</option>
 <option>Boquilla HE-VAN / 1800</option>
 </>
 )}
 </select>
 </div>
 <div className="flex flex-col gap-1 lg:col-span-3">
 <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest pl-1">Tipo/Tobera</label>
 <select value={emitterSubType} onChange={(e) => setEmitterSubType(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-bd-lines bg-card text-xs font-bold text-tx-secondary outline-none hover:border-accent">
 {emitterModel.includes('Rotor') ? (
 <>
 <option>Boquilla #1.0</option>
 <option>Boquilla #1.5</option>
 <option>Boquilla #2.0</option>
 <option>Boquilla #3.0</option>
 <option>Boquilla #4.0</option>
 </>
 ) : emitterModel.includes('Pro-Spray') ? (
 <>
 <option>Tobera PSU 10A</option>
 <option>Tobera PSU 12A</option>
 <option>Tobera PSU 15A</option>
 <option>Tobera PSU 17A</option>
 </>
 ) : emitterModel.includes('MP Rotator') ? (
 <>
 <option>MP 1000</option>
 <option>MP 2000</option>
 <option>MP 3000</option>
 <option>MP 3500</option>
 </>
 ) : emitterModel.includes('R-VAN') ? (
 <>
 <option>R-VAN 14</option>
 <option>R-VAN 18</option>
 <option>R-VAN 24</option>
 </>
 ) : (
 <>
 <option>HE-VAN 10</option>
 <option>HE-VAN 12</option>
 <option>HE-VAN 15</option>
 </>
 )}
 </select>
 </div>
 <div className="flex flex-col gap-1 lg:col-span-2">
 <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest pl-1">Ángulo</label>
 <select value={emitterAngle} onChange={(e) => setEmitterAngle(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-bd-lines bg-card text-xs font-bold text-tx-secondary outline-none hover:border-accent">
 <option value="90">90°</option>
 <option value="180">180°</option>
 <option value="270">270°</option>
 <option value="360">360°</option>
 </select>
 </div>
 <div className="flex flex-col gap-1 lg:col-span-2">
 <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest pl-1 text-center">Cantidad</label>
 <div className="flex bg-card rounded-lg border border-bd-lines overflow-hidden shadow-sm hover:border-accent focus-within:border-accent transition-colors h-9">
 <input type="number" min="1" value={emitterCount} onChange={(e) => setEmitterCount(e.target.value ? parseInt(e.target.value) : '')} placeholder="1" className="w-full min-w-[30px] h-full px-2 text-xs font-extrabold text-accent outline-none text-center bg-transparent" />
 <button onClick={() => {
 const lpm90Rates: Record<string, number> = {
 'Rotor PGP-ADJ': 2.5, 'Rotor PGP-Ultra': 2.8, 'Rotor I-20': 3.0, 'Rotor PGJ': 1.5, 'MP Rotator (Boquilla)': 0.8, 'Tobera Pro-Spray / PSU': 1.5,
 'Rotor 5004': 2.8, 'Rotor 3504': 1.6, 'Rotor 8005': 8.0, 'Boquilla R-VAN': 0.9, 'Boquilla HE-VAN / 1800': 1.6
 };
 const base = lpm90Rates[emitterModel] || 1.5;
 const subMultiplier = emitterSubType.includes('#3.0') || emitterSubType.includes('17A') || emitterSubType.includes('MP 3000') ? 1.5 : 1;
 const lpm = (base * (parseInt(emitterAngle) / 90)) * (emitterCount || 1) * subMultiplier;
 const nE = { id: Date.now().toString(), brand: emitterBrand, model: emitterModel, subType: emitterSubType, angle: emitterAngle, count: emitterCount || 1, lpm };
 setCurrentEmitters([...currentEmitters, nE]);
 setEmitterCount(1);
 }} className="w-12 shrink-0 h-full flex items-center justify-center bg-accent text-white hover:bg-[#15803d] transition-colors border-l border-bd-lines"><Plus size={16} strokeWidth={3}/></button>
 </div>
 </div>
 </div>

 {currentEmitters.length > 0 && (
 <div className="mb-4">
 <h4 className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest mb-2 border-b border-bd-lines pb-1">Emisores Agregados a {currentZoneName}</h4>
 <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
 {currentEmitters.map(em => (
 <li key={em.id} className="flex justify-between items-center bg-card border border-bd-lines p-2 rounded-lg text-xs shadow-sm">
 <span className="font-bold text-tx-secondary">{em.count}x {em.model} <span className="text-[#F27D26] font-black">{em.subType}</span> ({em.angle}°)</span>
 <div className="flex items-center gap-3">
 <span className="text-accent font-bold">{em.lpm.toFixed(1)} L/M</span>
 <button onClick={() => setCurrentEmitters(currentEmitters.filter(e => e.id !== em.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
 </div>
 </li>
 ))}
 </ul>
 <div className="mt-2 text-right">
 <span className="text-xs font-bold text-tx-secondary">Total Pre-calculado: </span>
 <span className="text-sm font-black text-accent">{currentEmitters.reduce((acc, curr) => acc + curr.lpm, 0).toFixed(1)} L/min</span>
 </div>
 </div>
 )}

 <button onClick={() => {
 if(currentEmitters.length === 0) return alert("Agregue al menos un emisor a la zona.");
 const tLpm = currentEmitters.reduce((acc, curr) => acc + curr.lpm, 0);
 const nZ = { id: Date.now().toString(), name: currentZoneName, photo: currentZonePhoto, emitters: [...currentEmitters], totalLpm: tLpm };
 setZonasGuardadas([...zonasGuardadas, nZ]);
 setCurrentEmitters([]);
 setCurrentZoneName('Zona ' + (zonasGuardadas.length + 2));
 setCurrentZonePhoto(null);
 setIaAlerts(prev => [{ id: Date.now(), type: 'success' as const, message: '✅ Zona guardada y catalogada correctamente.' }, ...prev].slice(0, 3));
 }} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl hover:bg-slate-900 transition-transform shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50" disabled={currentEmitters.length === 0}>
 <Save size={16} /> Guardar Zona Definitiva
 </button>
 </div>

 {/* Listado de Zonas Guardadas */}
 {zonasGuardadas.length > 0 && (
 <div className="space-y-3">
 <h4 className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest mb-2">Zonas Configuradas en Proyecto</h4>
 {zonasGuardadas.map(zona => (
 <div key={zona.id} className="border border-bd-lines rounded-xl overflow-hidden bg-slate-800/20 backdrop-blur-md">
 <div className="flex items-center justify-between p-3 bg-card border-b border-bd-lines">
 <div className="flex items-center gap-3">
 {zona.photo ? (
 <img src={zona.photo} alt="zona" className="w-10 h-10 object-cover rounded-lg shadow-sm border border-bd-lines" />
 ) : (
 <div className="w-10 h-10 bg-slate-800/20 backdrop-blur-md rounded-lg border border-bd-lines flex items-center justify-center text-tx-secondary"><ImageIcon size={18} /></div>
 )}
 <div>
 <h5 className="font-bold text-sm text-tx-primary">{zona.name}</h5>
 <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">{zona.emitters.length} tipos de emisores</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={() => {
 setCaudal(zona.totalLpm.toFixed(2));
 setIaAlerts(prev => [{ id: Date.now(), type: 'info' as const, message: `Inyectando caudal de ${zona.name} (${zona.totalLpm.toFixed(1)} L/M) al módulo calc.` }, ...prev].slice(0, 3));
 }} className="px-2 py-1.5 bg-[#F27D26]/10 text-[#F27D26] hover:bg-[#F27D26]/20 font-bold text-[10px] uppercase rounded-lg border border-[#F27D26]/20 flex items-center gap-1 transition-colors shadow-sm" title="Inyectar a la calculadora principal">
 <Merge size={12} /> Trazar
 </button>
 <button onClick={() => setZonasGuardadas(zonasGuardadas.filter(z => z.id !== zona.id))} className="p-1.5 text-tx-secondary hover:text-red-500 transition-colors bg-card rounded-lg border border-bd-lines shadow-sm">
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 <div className="p-3">
 <div className="flex flex-wrap gap-1.5 mb-2">
 {zona.emitters.map((e:any, i:number) => (
 <span key={i} className="text-[10px] bg-card border border-bd-lines px-2 py-1 rounded-md text-tx-secondary font-medium whitespace-nowrap shadow-sm">
 {e.count}x {e.model} <span className="text-[#F27D26] font-bold">{e.subType}</span> ({e.angle}°)
 </span>
 ))}
 </div>
 <div className="flex justify-between items-center text-xs mt-2 border-t border-bd-lines/50 pt-2">
 <span className="text-tx-secondary font-medium">Consumo Nominal:</span>
 <span className="font-black text-tx-primary">{zona.totalLpm.toFixed(1)} <span className="text-tx-secondary font-medium">L/min</span></span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Calculator Card */}
 <div className="glass-card rounded-2xl p-6 shadow-sm border border-bd-lines">
 <h3 className="text-lg font-bold text-tx-primary mb-4 flex items-center gap-2">
 <Settings className="text-accent" size={20} />
 Parámetros
 </h3>

 <div className="space-y-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-sm font-semibold text-tx-secondary">Caudal (L/min)</label>
 <div className="relative">
 <input
 value={caudal}
 onChange={(e) => setCaudal(e.target.value)}
 className="w-full h-12 px-4 rounded-xl border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
 placeholder="0.00"
 type="number"
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-tx-secondary text-xs font-bold">L/M</span>
 </div>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-sm font-semibold text-tx-secondary">Distancia Total Calculada (Metros)</label>
 <div className="relative">
 <input
 className="w-full h-12 px-4 rounded-xl border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
 placeholder="0"
 type="number"
 value={totalDistance > 0 ? totalDistance.toFixed(1) : ''}
 readOnly
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-tx-secondary text-xs font-bold">M</span>
 </div>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-sm font-semibold text-tx-secondary">Material de Tubería</label>
 <select
 value={material}
 onChange={(e) => setMaterial(e.target.value)}
 className="w-full h-12 px-4 rounded-xl border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
 >
 <option>PVC Clase 10 (Imp. Todo Riego (Distribuye: Argent Software))</option>
 <option>PVC Clase 6 (Imp. Todo Riego (Distribuye: Argent Software))</option>
 <option>Polietileno K4 (Imp. Munditol (Distribuye: Argent Software))</option>
 <option>Polietileno K6 (Imp. Munditol (Distribuye: Argent Software))</option>
 </select>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-sm font-semibold text-tx-secondary">Medida de Caño (para dibujo)</label>
 <select
 value={currentPipeSize}
 onChange={(e) => setCurrentPipeSize(e.target.value)}
 className="w-full h-12 px-4 rounded-xl border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
 >
 <option value="20mm">20mm (1/2")</option>
 <option value="25mm">25mm (3/4")</option>
 <option value="32mm">32mm (1")</option>
 <option value="40mm">40mm (1 1/4")</option>
 <option value="50mm">50mm (1 1/2")</option>
 <option value="63mm">63mm (2")</option>
 </select>
 </div>

 <div className="grid grid-cols-2 gap-3 pt-2">
 <div className="flex flex-col gap-1.5">
 <label className="text-sm font-semibold text-tx-secondary flex items-center gap-1"><Droplets size={14} className="text-accent" />Sustrato</label>
 <select
 value={sustrato}
 onChange={(e) => setSustrato(e.target.value)}
 className="w-full h-10 px-3 rounded-xl border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent text-sm outline-none transition-all appearance-none"
 >
 <option>Arenoso</option>
 <option>Franco</option>
 <option>Arcilloso</option>
 </select>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-sm font-semibold text-tx-secondary flex items-center gap-1">
 <Sun size={14} className="text-[#F27D26]" />Soleamiento
 <button onClick={handleGetLocation} className="ml-auto text-tx-secondary hover:text-accent" title="Auto-detectar con GPS" disabled={isGettingLocation}>
 <MapPin size={14} className={isGettingLocation ? 'animate-pulse' : ''} />
 </button>
 </label>
 <select
 value={soleamiento}
 onChange={(e) => setSoleamiento(e.target.value)}
 className="w-full h-10 px-3 rounded-xl border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent text-sm outline-none transition-all appearance-none"
 >
 <option>Alto</option>
 <option>Medio</option>
 <option>Bajo</option>
 </select>
 </div>
 </div>
 </div>

  <div className="pt-2 mt-4 border-t border-bd-lines border-dashed space-y-4">
    <h4 className="text-sm font-bold text-tx-primary mb-2 flex items-center gap-2">
      <Layers size={16} className="text-[#F27D26]" /> Variables Avanzadas
    </h4>
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest">Desnivel (Cota en m)</label>
        <input
          type="number"
          value={desnivel}
          onChange={(e) => setDesnivel(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-bd-lines text-xs glass focus:bg-card/10 text-tx-primary focus:border-[#F27D26] outline-none transition-all appearance-none"
          placeholder="+ subida / - baj"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-tx-secondary uppercase tracking-widest text-center">Válvulas / Codos</label>
        <div className="flex gap-1 h-10">
          <input
            type="number"
            value={accesoriosValvulas}
            onChange={(e) => setAccesoriosValvulas(e.target.value)}
            className="w-1/2 h-full px-1 rounded-xl border border-bd-lines text-xs glass focus:bg-card/10 text-tx-primary focus:border-[#F27D26] outline-none transition-all text-center appearance-none"
            title="Electroválvulas"
            placeholder="V"
          />
          <input
            type="number"
            value={accesoriosCodos}
            onChange={(e) => setAccesoriosCodos(e.target.value)}
            className="w-1/2 h-full px-1 rounded-xl border border-bd-lines text-xs glass focus:bg-card/10 text-tx-primary focus:border-[#F27D26] outline-none transition-all text-center appearance-none"
            title="Codos a 90°"
            placeholder="C"
          />
        </div>
      </div>
    </div>
  </div>

 <button
 onClick={handleCalcular}
 className="w-full mt-6 bg-accent text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-[#15803d] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
 >
 <Activity size={18} />
 Calcular Requerimientos
 </button>
 </div>

 {/* Analysis Card */}
 <div className="glass-card rounded-2xl p-6 shadow-sm border border-bd-lines">
 <div className="flex items-center gap-2 mb-4">
 <BarChart2 className="text-accent" size={20} />
 <h3 className="text-lg font-bold text-tx-primary">Resultados</h3>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Pérdida Carga</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.perdida : '-'}</p>
 </div>
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Velocidad</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.velocidad : '-'}</p>
 </div>
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Caudal Total</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.caudalTotal : '-'}</p>
 </div>
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Diámetro</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.diametro : '-'}</p>
 </div>
 </div>

 {resultados?.recomendacion && (
 <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
 <p className="text-sm text-blue-800 flex items-start gap-2">
 <Info size={16} className="mt-0.5 flex-shrink-0" />
 <span>{resultados.recomendacion}</span>
 </p>
 </div>
 )}

 {resultados && (
 <div className="mt-6 pt-4 border-t border-bd-lines">
 <h4 className="text-sm font-bold text-tx-primary mb-3 flex items-center gap-2">
 <User size={16} className="text-accent" />
 Vincular a Cliente (CRM)
 </h4>
 <div className="flex flex-col gap-3">
 <select
 value={selectedClientId}
 onChange={(e) => setSelectedClientId(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent outline-none text-sm transition-all"
 >
 <option value="">Seleccione un cliente...</option>
 {clientesData.map((client: any) => (
 <option key={client.id} value={client.id}>{client.name} - {client.location}</option>
 ))}
 </select>
 <button
 onClick={handleSaveProjectToClient}
 className="w-full bg-slate-800/20 backdrop-blur-md text-accent border border-bd-lines font-bold py-2.5 rounded-lg hover:bg-accent/10 transition-colors flex justify-center items-center gap-2 text-sm"
 >
 <CheckCircle size={16} />
 Guardar Proyecto y Generar Pre-Presupuesto
 </button>
 <button
 onClick={handleGeneratePDF}
 className="w-full bg-accent text-white font-bold py-2.5 rounded-lg hover:bg-[#15803d] transition-colors flex justify-center items-center gap-2 text-sm shadow-sm mt-1"
 >
 <Download size={16} />
 Exportar Presupuesto en PDF
 </button>
 <button
 onClick={handleGenerateAIQuote}
 className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 text-sm shadow-sm mt-1"
 >
 <Sparkles size={16} />
 Generar Propuesta con Argent Software
 </button>
 <button
 onClick={() => {
 navigate('/archivo', { state: { targetTab: 'comparador', originProduct: 'Hunter PGP Ultra' } });
 }}
 className="w-full bg-[#F27D26] text-white font-bold py-2.5 rounded-lg hover:bg-orange-600 transition-colors flex justify-center items-center gap-2 text-sm shadow-sm mt-2"
 >
 <SplitSquareHorizontal size={16} />
 Ver Comparativa B2B de Productos Sugeridos
 </button>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Assistants / Non-prioritized content moved below Viewer (Bottom Left Margin filled) */}
 <div className="lg:col-span-8 order-3 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-95 hover:opacity-100 transition-opacity w-full">
 {/* Analysis Card */}
 <div className="glass-card rounded-2xl p-6 shadow-sm border border-bd-lines">
 <div className="flex items-center gap-2 mb-4">
 <BarChart2 className="text-accent" size={20} />
 <h3 className="text-lg font-bold text-tx-primary">Métricas Finales</h3>
 </div>

 <div className="grid grid-cols-2 gap-3 mb-6">
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Pérdida Carga</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.perdida : '-'}</p>
 </div>
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Velocidad</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.velocidad : '-'}</p>
 </div>
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Caudal Total</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.caudalTotal : '-'}</p>
 </div>
 <div className="bg-slate-800/20 backdrop-blur-md rounded-xl p-3 border border-bd-lines">
 <p className="text-tx-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Diámetro</p>
 <p className="text-accent text-xl font-bold">{resultados ? resultados.diametro : '-'}</p>
 </div>
 </div>

 {resultados?.recomendacion && (
 <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
 <p className="text-sm text-blue-800 flex items-start gap-2">
 <Info size={16} className="mt-0.5 flex-shrink-0" />
 <span>{resultados.recomendacion}</span>
 </p>
 </div>
 )}

 {resultados && (
 <div className="pt-4 border-t border-bd-lines">
 <h4 className="text-sm font-bold text-tx-primary mb-3 flex items-center gap-2">
 <User size={16} className="text-accent" />
 Acciones de Exportación
 </h4>
 <div className="flex flex-col gap-3">
 <select
 value={selectedClientId}
 onChange={(e) => setSelectedClientId(e.target.value)}
 className="w-full h-11 px-3 rounded-lg border border-bd-lines glass focus:bg-card/10 text-tx-primary focus:border-accent outline-none text-sm transition-all"
 >
 <option value="">Seleccione un cliente (opcional)...</option>
 {clientesData.map((client: any) => (
 <option key={client.id} value={client.id}>{client.name} - {client.location}</option>
 ))}
 </select>
 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={handleSaveProjectToClient}
 className="bg-slate-800/20 backdrop-blur-md text-accent border border-bd-lines font-bold py-2.5 rounded-lg hover:bg-accent/10 transition-colors flex justify-center items-center gap-1.5 text-[11px] uppercase tracking-wider shadow-sm"
 >
 <CheckCircle size={14} /> Linkear a CRM
 </button>
 <button
 onClick={handleGeneratePDF}
 className="bg-accent text-white font-bold py-2.5 rounded-lg hover:bg-[#15803d] transition-colors flex justify-center items-center gap-1.5 text-[11px] uppercase tracking-wider shadow-sm"
 >
 <Download size={14} /> Exportar PDF
 </button>
 </div>
 </div>
 </div>
 )}
 </div>

 
        {/* Engineering/Technical Resources Card */}
        <div className="glass-card rounded-2xl p-6 shadow-sm flex flex-col items-start justify-center text-left border border-bd-lines relative overflow-hidden group mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-accent/5 group-hover:from-blue-500/10 group-hover:to-accent/10 transition-colors z-0" />
          
          <div className="flex items-center gap-2 mb-2 relative z-10 w-full border-b border-bd-lines pb-3">
            <FileText className="text-accent" size={20} />
            <h3 className="text-lg font-bold text-tx-primary">Fichas Técnicas Oficiales</h3>
          </div>
          
          <p className="text-xs text-tx-secondary mb-5 relative z-10 leading-relaxed max-w-sm">
            Accede a las curvas de rendimiento, manuales de instalación y tablas de fricción provistas directamente por los fabricantes.
          </p>

          <div className="w-full flex flex-col gap-2.5 relative z-10">
            <button 
              onClick={() => alert("Descargando Curvas de Rendimiento Todo Riego (PDF)...")}
              className="w-full bg-slate-800/20 backdrop-blur-md border border-bd-lines font-medium py-3 px-4 justify-between rounded-xl hover:border-accent/50 hover:shadow-md transition-all flex items-center text-xs shadow-sm text-tx-primary group/btn">
              <div className="flex flex-col items-start">
                <span className="font-bold text-tx-primary text-left text-[13px] group-hover/btn:text-accent transition-colors">Curvas de Riego y Bombeo</span>
                <span className="text-[10px] text-tx-secondary uppercase tracking-widest mt-1 font-semibold flex items-center gap-1"><BookOpen size={10} /> Documento Oficial: Todo Riego</span>
              </div>
              <Download size={16} className="text-tx-secondary group-hover/btn:text-accent transition-colors" />
            </button>
            
            <button 
              onClick={() => alert("Descargando Tablas de Fricción K4/K6 (PDF)...")}
              className="w-full bg-slate-800/20 backdrop-blur-md border border-bd-lines font-medium py-3 px-4 justify-between rounded-xl hover:border-accent/50 hover:shadow-md transition-all flex items-center text-xs shadow-sm text-tx-primary group/btn">
              <div className="flex flex-col items-start">
                <span className="font-bold text-tx-primary text-left text-[13px] group-hover/btn:text-accent transition-colors">Tablas de Fricción de Tuberías</span>
                <span className="text-[10px] text-tx-secondary uppercase tracking-widest mt-1 font-semibold flex items-center gap-1"><BookOpen size={10} /> Documento Oficial: Munditol</span>
              </div>
              <Download size={16} className="text-tx-secondary group-hover/btn:text-accent transition-colors" />
            </button>

            <button 
              onClick={() => alert("Abriendo Manual de Mantenimiento...")}
              className="w-full bg-slate-800/20 backdrop-blur-md border border-bd-lines font-medium py-3 px-4 justify-between rounded-xl hover:border-accent/50 hover:shadow-md transition-all flex items-center text-xs shadow-sm text-tx-primary group/btn">
              <div className="flex flex-col items-start">
                <span className="font-bold text-tx-primary text-left text-[13px] group-hover/btn:text-accent transition-colors">Manual Rotores y Toberas</span>
                <span className="text-[10px] text-tx-secondary uppercase tracking-widest mt-1 font-semibold flex items-center gap-1"><BookOpen size={10} /> Documento Oficial: Hunter / RainBird</span>
              </div>
              <ExternalLink size={16} className="text-tx-secondary group-hover/btn:text-accent transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>

  {/* Hidden printable area for PDF generation */}
 <div
 ref={pdfExportRef}
 style={{ display: 'none', width: '800px', backgroundColor: 'white', padding: '40px', color: '#1e293b' }}
 className="text-left font-sans"
 >
 <div className="flex justify-between items-start border-b-2 border-bd-lines pb-6 mb-6 relative">
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
 <img src="/argen-logo.png" alt="" className="w-[500px] object-contain opacity-[0.05] grayscale" />
 </div>
 <div className="relative z-10">
 <img src="/argen-logo.png" alt="Argen Software" className="h-10 w-auto object-contain mb-2" />
 <p className="text-sm font-bold text-tx-secondary mt-1 uppercase tracking-widest">Sistemas Profesionales</p>
 </div>
 <div className="text-right">
 <h2 className="text-xl font-bold text-tx-primary">PRESUPUESTO ESTIMADO</h2>
 <p className="text-sm text-tx-secondary">Fecha: {new Date().toLocaleDateString('es-AR')}</p>
 <p className="text-sm text-tx-secondary">Ref: {projectName}</p>
 </div>
 </div>

 <div className="mb-8">
 <h3 className="text-lg font-bold text-tx-primary border-b border-bd-lines pb-2 mb-4">Detalles del Proyecto</h3>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-xs font-bold text-tx-secondary uppercase tracking-widest">Caudal Base</p>
 <p className="text-base font-bold text-tx-primary">{caudal || '0'} L/min ({resultados?.caudalTotal || '0 m³/h'})</p>
 </div>
 <div>
 <p className="text-xs font-bold text-tx-secondary uppercase tracking-widest">Distancia Total</p>
 <p className="text-base font-bold text-tx-primary">{totalDistance.toFixed(1)} Metros</p>
 </div>
 <div>
 <p className="text-xs font-bold text-tx-secondary uppercase tracking-widest">Material</p>
 <p className="text-base font-bold text-tx-primary">{material}</p>
 </div>
 <div>
 <p className="text-xs font-bold text-tx-secondary uppercase tracking-widest">Diámetro Calculado</p>
 <p className="text-base font-bold text-tx-primary">{currentPipeSize}</p>
 </div>
 </div>
 </div>

 <div className="mb-8">
 <h3 className="text-lg font-bold text-tx-primary border-b border-bd-lines pb-2 mb-4">Análisis Téchnico</h3>
 <div className="bg-slate-800/20 backdrop-blur-md p-4 rounded-xl border border-bd-lines">
 <div className="flex justify-between py-2 border-b border-bd-lines">
 <span className="font-semibold text-tx-secondary">Pérdida de Carga Estimada:</span>
 <span className="font-bold text-accent">{resultados?.perdida || '0 bar'}</span>
 </div>
 <div className="flex justify-between py-2 border-b border-bd-lines">
 <span className="font-semibold text-tx-secondary">Velocidad de Flujo:</span>
 <span className="font-bold text-accent">{resultados?.velocidad || '0 m/s'}</span>
 </div>
 <div className="flex justify-between py-2 border-b border-bd-lines">
 <span className="font-semibold text-tx-secondary">Terreno / Sustrato:</span>
 <span className="font-bold text-tx-primary">{sustrato} & {soleamiento} solemn.</span>
 </div>
 </div>
 {resultados?.recomendacion && (
 <p className="mt-4 text-sm text-tx-secondary italic">Nota: {resultados.recomendacion}</p>
 )}
 </div>

 <div className="mb-8">
 <h3 className="text-lg font-bold text-tx-primary border-b border-bd-lines pb-2 mb-4">Materiales Recomendados (A Cotizar)</h3>
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-800/20 backdrop-blur-md text-sm">
 <th className="p-3 border border-bd-lines font-bold text-tx-secondary">Ítem</th>
 <th className="p-3 border border-bd-lines font-bold text-tx-secondary">Cant. Estimada</th>
 <th className="p-3 border border-bd-lines font-bold text-tx-secondary">Unidad</th>
 </tr>
 </thead>
 <tbody>
 <tr className="text-sm">
 <td className="p-3 border border-bd-lines">Tubería Principal {material} {currentPipeSize}</td>
 <td className="p-3 border border-bd-lines text-center">{Math.ceil(totalDistance)}</td>
 <td className="p-3 border border-bd-lines">Metros</td>
 </tr>
 <tr className="text-sm">
 <td className="p-3 border border-bd-lines">Accesorios (Codos, Uniones)</td>
 <td className="p-3 border border-bd-lines text-center">{Math.max(nodes.length * 2, 4)}</td>
 <td className="p-3 border border-bd-lines">Unidades</td>
 </tr>
 <tr className="text-sm">
 <td className="p-3 border border-bd-lines">Bomba sugerida para {resultados?.caudalTotal || '0'}</td>
 <td className="p-3 border border-bd-lines text-center">1</td>
 <td className="p-3 border border-bd-lines">Unidad</td>
 </tr>
 </tbody>
 </table>
 <p className="text-xs text-tx-secondary mt-4">*Este listado es una estimación referencial basada en el plano. Las cantidades exactas dependen de detalles de instalación en terreno.</p>
 </div>
 </div>
 </div>
 );
}
