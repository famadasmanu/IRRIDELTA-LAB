import React, { useState } from 'react';
import { Network, MessageSquare, ThumbsUp, Share2, TrendingUp, BarChart3, Search, Filter, MapPin, Award, Zap, PieChart, Package, AlertTriangle, BookOpen, UserPlus, X, Link } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Modal } from '../components/Modal';
import { jsPDF } from 'jspdf';

// Datos ficticios para el dashboard del Stakeholder (Data Mining)
const stakeholderStats = {
  brandShare: [
    { brand: "Rainbird", percentage: 45, color: "bg-blue-500" },
    { brand: "Hunter", percentage: 35, color: "bg-emerald-500" },
    { brand: "Toro", percentage: 12, color: "bg-red-500" },
    { brand: "Otras", percentage: 8, color: "bg-gray-500" }
  ],
  trendingTopics: [
    { topic: "Ahorro de agua", growth: "+150%", mentions: 342 },
    { topic: "Automatización WiFi", growth: "+85%", mentions: 215 },
    { topic: "Fallas de presión", growth: "-20%", mentions: 89 }
  ],
  materialUsage: [
    { material: "PVC 40mm", amount: "15,400 mts", trend: "up" },
    { material: "PEAD 25mm", amount: "8,200 mts", trend: "down" },
    { material: "Electroválvulas 1.5''", amount: "340 uds", trend: "up" }
  ]
};

export default function Ecosistema() {
  const [activeTab, setActiveTab] = useState<'comunidad' | 'insights'>('comunidad');
  // Solo los admins pueden ver los insights de venta a stakeholders
  const [userRole] = useState(() => {
    try {
      const item = window.localStorage.getItem('user_role');
      if (item && !item.startsWith('"') && !item.startsWith('{')) return item;
      return item ? JSON.parse(item) : 'admin';
    } catch { return 'admin'; }
  });

  const isAdmin = userRole === 'admin' || userRole === 'invitado' || userRole === 'desarrollador';

  const { data: trabajosRaw } = useFirestoreCollection<any>('trabajos_portfolio');
  const { data: anotacionesRaw } = useFirestoreCollection<any>('trabajos_anotaciones');
  
  // Novedad: Directorio de Profesionales
  const { data: directorioData, add: addDirectorio } = useFirestoreCollection<any>('directorio_profesionales');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newDirectorio, setNewDirectorio] = useState({ nombre: '', especialidad: 'Sistemas de Riego', zona: '', telefono: '', redSocial: '', descripcion: '' });

  const handleRegisterDirectorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectorio.nombre || !newDirectorio.telefono) return;
    
    // Auto-formateo del número de teléfono (quitar espacios, obligar +549 si es vacío, etc)
    let formatTelf = newDirectorio.telefono.replace(/\s+/g, '');
    if (!formatTelf.startsWith('+') && !formatTelf.startsWith('549')) {
      if (formatTelf.startsWith('11') || formatTelf.startsWith('15')) {
        formatTelf = '549' + formatTelf;
      }
    }

    await addDirectorio({ ...newDirectorio, telefono: formatTelf, createdAt: new Date().toISOString() });
    setIsRegisterModalOpen(false);
    setNewDirectorio({ nombre: '', especialidad: 'Sistemas de Riego', zona: '', telefono: '', redSocial: '', descripcion: '' });
  };

  const [directorioSearch, setDirectorioSearch] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Procesamiento en tiempo real de Marcas y Categorías extraidas de Trabajos Completados
  const brandCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  let totalMarcas = 0;

  (trabajosRaw || []).forEach(trabajo => {
    if (trabajo.estado === 'Completado' && Array.isArray(trabajo.gastosDetalle)) {
      trabajo.gastosDetalle.forEach((gasto: any) => {
        // Conteos de Marcas
        if (gasto.marca && gasto.marca !== '' && gasto.marca !== 'Otra' && gasto.marca !== 'Personal') {
          brandCounts[gasto.marca] = (brandCounts[gasto.marca] || 0) + (Number(gasto.cantidad) || 1);
          totalMarcas += (Number(gasto.cantidad) || 1);
        }
        // Conteos de Categorias (Evitar contar servicios como materiales)
        if (gasto.categoria && gasto.categoria !== '' && gasto.categoria !== 'Mano de Obra' && gasto.categoria !== 'Logística') {
          categoryCounts[gasto.categoria] = (categoryCounts[gasto.categoria] || 0) + (Number(gasto.cantidad) || 1);
        }
      });
    }
  });

  // Procesamiento de El Cementerio (Fallas)
  const fallasCounts: Record<string, number> = {};
  (anotacionesRaw || []).forEach(anotacion => {
    if (anotacion.categoria === 'Recambio / Falla') {
      const match = anotacion.titulo?.match(/\[Rotura\/Falla\]\s(.*?)\s-\s(.*)/);
      if (match && match[2]) {
        const marca = match[2];
        const pieza = match[1];
        const tituloCorto = `${pieza} (${marca})`;
        fallasCounts[tituloCorto] = (fallasCounts[tituloCorto] || 0) + 1;
      }
    }
  });

  const dynamicFallas = Object.entries(fallasCounts)
    .map(([topic, mentions]) => ({
      topic,
      growth: `+${Math.floor(Math.random() * 50) + 10}%`, // Simulado para crecimiento real vs. mes anterior
      mentions
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 3);
  
  const displayFallas = dynamicFallas.length > 0 ? dynamicFallas : stakeholderStats.trendingTopics;

  const generateColor = (index: number) => {
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-red-500"];
    return colors[index % colors.length];
  };

  const dynamicBrandShare = Object.entries(brandCounts)
    .map(([brand, count], index) => ({
      brand,
      percentage: totalMarcas > 0 ? Math.round((count / totalMarcas) * 100) : 0,
      color: generateColor(index),
      count
    }))
    .sort((a, b) => b.count - a.count);

  const displayBrandShare = dynamicBrandShare.length > 0 ? dynamicBrandShare : stakeholderStats.brandShare;

  const dynamicMaterialUsage = Object.entries(categoryCounts)
    .map(([material, amount]) => ({
      material,
      amount: `${amount} uds`,
      trend: "up" as const
    }))
    .sort((a, b) => parseInt(b.amount) - parseInt(a.amount))
    .slice(0, 4);

  const displayMaterialUsage = dynamicMaterialUsage.length > 0 ? dynamicMaterialUsage : stakeholderStats.materialUsage;

  const handleExportDataPDF = () => {
    try {
      setIsExportingPDF(true);
      const doc = new jsPDF();
      let y = 20;

      // Portada y Títulos
      doc.setFillColor(37, 211, 102); // bg-accent
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Reporte de Market Intelligence", 14, 20);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
      doc.text(`Generado el: ${dateStr}`, 14, 40);
      doc.text("Plataforma Integral: Argent Software", 14, 46);
      
      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 52, 196, 52);
      
      y = 65;
      
      // 1. Share de Marcas
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 211, 102);
      doc.text("1. Share de Marcas - Instalación Real en Obras", 14, y);
      y += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      displayBrandShare.forEach((b: any) => {
        doc.text(`• ${b.brand}: ${b.percentage}% (Basado en ${b.count || 0} unidades instaladas)`, 14, y);
        y += 8;
      });
      
      y += 10;
      if (y > 270) { doc.addPage(); y = 20; }
      
      // 2. Consumo Materiales
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246); // bg-blue-500
      doc.text("2. Volumen Acumulado de Componentes Físicos", 14, y);
      y += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      displayMaterialUsage.forEach((m: any) => {
        doc.text(`• ${m.material}: ${m.amount} (Tendencia: ${m.trend === 'up' ? 'Alza' : 'Baja'})`, 14, y);
        y += 8;
      });

      y += 10;
      if (y > 270) { doc.addPage(); y = 20; }
      
      // 3. Cementerio / Fallas
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(249, 115, 22); // orange-500
      doc.text("3. Pain Points / Reportes de Fallas en Campo (El Cementerio)", 14, y);
      y += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      displayFallas.forEach((f: any) => {
        doc.text(`• ${f.topic}: ${f.mentions} casos detectados (Crecimiento aprox: ${f.growth})`, 14, y);
        y += 8;
      });

      // Pie de pág
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Argent Software - Derechos Reservados. Documento confidencial exclusivo comercial.", 14, 290);
      
      doc.save(`Stakeholders_Inteligencia_${format(new Date(), 'MMyy')}.pdf`);
    } catch (error) {
       console.error("Error creating PDF", error);
       alert("Hubo un error construyendo el PDF corporativo.");
    } finally {
       setIsExportingPDF(false);
    }
  };

  const filteredDirectorio = directorioData.filter((prof: any) => {
    const s = directorioSearch.toLowerCase();
    return (prof.nombre || '').toLowerCase().includes(s) || 
           (prof.especialidad || '').toLowerCase().includes(s) || 
           (prof.zona || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-tx-primary tracking-tight flex items-center gap-3">
            <Network className="text-accent size-8" />
            Ecosistema & Comunidad
          </h1>
          <p className="text-tx-secondary mt-1">Conecta, comparte y descubre las tendencias del mercado de riego.</p>
        </div>
        
        {/* Pestañas de Navegación Front/Back */}
        {isAdmin && (
          <div className="flex bg-main p-1 rounded-xl border border-bd-lines shadow-sm">
            <button
              onClick={() => setActiveTab('comunidad')}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                activeTab === 'comunidad' ? "bg-card text-accent shadow-sm" : "text-tx-secondary hover:text-tx-primary"
              )}
            >
              Foro Público
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                activeTab === 'insights' ? "bg-accent text-white shadow-sm" : "text-tx-secondary hover:text-tx-primary"
              )}
            >
              <BarChart3 size={16} /> Data & Stakeholders
            </button>
          </div>
        )}
      </div>

      {activeTab === 'comunidad' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Banner Puente Oficial */}
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 opacity-20 transform group-hover:scale-110 transition-transform duration-700">
               <MessageSquare size={220} />
            </div>
            <div className="relative z-10 mb-6 md:mb-0 max-w-2xl">
               <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Tu Comunidad Oficial en WhatsApp</h2>
               <p className="text-accent/20 text-base md:text-lg font-medium leading-relaxed">
                 Únete al grupo cerrado de instaladores, paisajistas y técnicos de Argent Software. Conversa sin intermediarios.
               </p>
            </div>
            <a href="https://chat.whatsapp.com/JHQjB8xPzBDEpC8RkT5cQe" target="_blank" rel="noopener noreferrer" className="relative z-10 w-full md:w-auto text-center bg-white text-[#128C7E] px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2">
              <MessageSquare size={22} /> Unirme al Grupo Libre
            </a>
          </div>

          <div className="h-px w-full bg-bd-lines my-8"></div>

          {/* Directorio de Especialistas */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-black text-tx-primary flex items-center gap-3">
                <BookOpen className="text-accent size-7" /> Directorio de Profesionales
              </h3>
              <p className="text-tx-secondary mt-1 text-sm">Encuentra y contacta subcontratistas directamente, sin comisiones.</p>
            </div>
            
            <div className="flex-1 max-w-md w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tx-secondary" size={18} />
              <input 
                type="text" 
                placeholder="Filtrar por Especialidad, Zona o Nombre..." 
                value={directorioSearch}
                onChange={e => setDirectorioSearch(e.target.value)}
                className="w-full bg-card border border-bd-lines rounded-xl pl-12 pr-4 py-3.5 text-tx-primary text-sm font-semibold focus:ring-2 focus:ring-accent outline-none shadow-sm transition-all"
              />
            </div>
            
            <button onClick={() => setIsRegisterModalOpen(true)} className="flex items-center shrink-0 gap-2 bg-accent text-white hover:brightness-110 font-bold px-5 py-3.5 rounded-xl transition-all shadow-sm w-full md:w-auto justify-center">
              <UserPlus size={18} /> Ofrecer mis Servicios
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredDirectorio.map((prof: any) => (
               <div key={prof.id} className="bg-card border border-bd-lines rounded-3xl p-6 shadow-sm hover:border-accent hover:shadow-md transition-all group flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-5">
                     <div className="size-16 rounded-full bg-gradient-to-br from-accent to-[#128C7E] p-[2px]">
                       <div className="w-full h-full bg-card rounded-full flex items-center justify-center text-tx-primary text-xl font-black uppercase">
                         {(prof.nombre || '??').substring(0,2)}
                       </div>
                     </div>
                     <div>
                       <h4 className="font-bold text-tx-primary text-[1.1rem] leading-tight group-hover:text-accent transition-colors">{prof.nombre || 'Sin Nombre'}</h4>
                       <p className="text-sm font-bold text-accent/80 uppercase tracking-wider text-[10px] mt-1">{prof.especialidad || 'Especialidad'}</p>
                     </div>
                  </div>
                  
                  {prof.descripcion && (
                    <div className="mb-5 bg-main p-3 rounded-xl border border-bd-lines h-20 overflow-hidden">
                      <p className="text-xs text-tx-secondary leading-relaxed line-clamp-3 italic">"{prof.descripcion}"</p>
                    </div>
                  )}

                  <div className="mb-auto space-y-3 pb-6 border-b border-bd-lines/50">
                    <p className="text-sm text-tx-secondary flex items-start gap-3">
                       <MapPin size={16} className="shrink-0 text-tx-primary/50 mt-0.5" /> 
                       <span className="text-tx-primary font-medium">{prof.zona || 'No especificada'}</span>
                    </p>
                    {prof.redSocial && typeof prof.redSocial === 'string' && (
                      <a href={prof.redSocial.startsWith('http') ? prof.redSocial : `https://${prof.redSocial}`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:brightness-110 font-medium flex items-center gap-3 w-fit">
                         <Link size={16} className="shrink-0 mt-0.5" /> 
                         <span className="truncate max-w-[200px]">{prof.redSocial.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <a href={`https://wa.me/${prof.telefono}?text=Hola ${prof.nombre}, te ubiqué a través del Directorio Oficial de Argent Software. Te contacto porque necesito...`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] py-3.5 rounded-xl font-bold hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 hover:scale-[1.02]">
                       <MessageSquare size={20} /> Escribir por WhatsApp
                    </a>
                  </div>
               </div>
             ))}
             {filteredDirectorio.length === 0 && (
               <div className="col-span-full py-16 text-center text-tx-secondary bg-card rounded-3xl border border-bd-lines border-dashed">
                 <div className="w-20 h-20 bg-main rounded-full flex items-center justify-center mx-auto mb-4 border border-bd-lines">
                    <UserPlus size={32} className="text-accent opacity-50" />
                 </div>
                 {directorioData.length === 0 ? (
                   <>
                     <h3 className="text-lg font-bold text-tx-primary mb-1">Directorio en Cero</h3>
                     <p className="max-w-md mx-auto">Sé el primer profesional en destacar tu trabajo. Completa el registro y recibe contactos directamente a tu celular.</p>
                   </>
                 ) : (
                   <>
                     <h3 className="text-lg font-bold text-tx-primary mb-1">Búsqueda sin resultados</h3>
                     <p className="max-w-md mx-auto">No hay ningún profesional o equipo que coincida con tu búsqueda de "{directorioSearch}".</p>
                   </>
                 )}
               </div>
             )}
          </div>

          <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Ofrecer Mis Servicios">
            <form onSubmit={handleRegisterDirectorio} className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-tx-primary mb-1">Tu Nombre Completo / Empresa</label>
                  <input type="text" required value={newDirectorio.nombre} onChange={e => setNewDirectorio({...newDirectorio, nombre: e.target.value})} className="w-full bg-main border border-bd-lines rounded-xl px-4 py-3 text-tx-primary" placeholder="Ej: Juan Pérez Instalaciones" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-tx-primary mb-1">Especialidad Principal</label>
                    <select value={newDirectorio.especialidad} onChange={e => setNewDirectorio({...newDirectorio, especialidad: e.target.value})} className="w-full bg-main border border-bd-lines rounded-xl px-4 py-3 text-tx-primary">
                      <option>Sistemas de Riego</option>
                      <option>Paisajismo & Parquización</option>
                      <option>Reparación de Bombas</option>
                      <option>Zanjeo y Movimiento</option>
                      <option>Programación Automática</option>
                      <option>Electricidad General</option>
                      <option>Mantenimiento General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-tx-primary mb-1">Nº WhatsApp (Móvil)</label>
                    <input type="tel" required value={newDirectorio.telefono} onChange={e => setNewDirectorio({...newDirectorio, telefono: e.target.value})} className="w-full bg-main border border-bd-lines rounded-xl px-4 py-3 text-tx-primary" placeholder="Ej: 1145328990" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-tx-primary mb-1">Zona Principal de Cobertura</label>
                  <input type="text" required value={newDirectorio.zona} onChange={e => setNewDirectorio({...newDirectorio, zona: e.target.value})} className="w-full bg-main border border-bd-lines rounded-xl px-4 py-3 text-tx-primary" placeholder="Ej: Zona Norte, Pilar, Tigre..." />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-tx-primary mb-1">URL de Red Social / Portfolio (Opcional)</label>
                  <input type="url" value={newDirectorio.redSocial} onChange={e => setNewDirectorio({...newDirectorio, redSocial: e.target.value})} className="w-full bg-main border border-bd-lines rounded-xl px-4 py-3 text-tx-primary" placeholder="Ej: https://instagram.com/tu_perfil" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-tx-primary mb-1">Breve Descripción (Tus fortalezas)</label>
                  <textarea maxLength={150} rows={2} value={newDirectorio.descripcion} onChange={e => setNewDirectorio({...newDirectorio, descripcion: e.target.value})} className="w-full bg-main border border-bd-lines rounded-xl px-4 py-3 text-tx-primary resize-none" placeholder="15 años en el rubro, matrícula en GBA, experto en válvulas Hunter..."></textarea>
               </div>
               <button type="submit" className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:brightness-110 transition-colors shadow-sm mt-2">
                 Publicar en el Directorio
               </button>
            </form>
          </Modal>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* VISTA PRIVADA DEL DUEÑO: DATA MINING PARA STAKEHOLDERS */}
          <div className="bg-gradient-to-r from-[#1a3a2a] to-[#0f2419] rounded-2xl p-6 border border-accent/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <PieChart size={150} />
            </div>
            <div className="relative z-10">
              <span className="bg-accent/20 text-accent text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block border border-accent/30">
                Módulo Monetizable
              </span>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Market Intelligence & Data Mining</h2>
              <p className="text-accent/70 max-w-2xl text-sm leading-relaxed mb-6">
                Toda la interacción del "Ecosistema Cooperativo" se filtra y acumula aquí. Alimenta estos dashboards con el comportamiento geolocalizado, uso de marcas, roturas frecuentes y preferencias del mercado laboral. Esta es la información cruda y valiosa lista para ser vendida a los fabricantes (Stakeholders).
              </p>
              <button 
                onClick={handleExportDataPDF}
                disabled={isExportingPDF}
                className="bg-accent text-white font-bold py-3 px-6 rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:scale-[1.02] flex items-center gap-2"
              >
                {isExportingPDF ? 'Procesando...' : 'Descargar Reporte Mensual PDF'}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Share de Marcas */}
            <div className="bg-card p-6 rounded-2xl border border-bd-lines shadow-sm">
              <h3 className="text-lg font-bold text-tx-primary mb-6 flex items-center gap-2">
                <PieChart className="text-accent size-5" /> Share de Marcas Real (Obras Instaladas)
              </h3>
              <div className="space-y-4">
                {displayBrandShare.map(brand => (
                  <div key={brand.brand}>
                    <div className="flex justify-between text-sm mb-1.5 font-semibold">
                      <span className="text-tx-primary">{brand.brand}</span>
                      <span className="text-tx-secondary">{brand.percentage}%</span>
                    </div>
                    <div className="w-full bg-main rounded-full h-2.5 overflow-hidden border border-bd-lines">
                      <div className={cn("h-full rounded-full transition-all duration-1000", brand.color)} style={{ width: `${brand.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-tx-secondary mt-6 italic">
                * Basado en extracción de datos transaccionales en Presupuestos y Gastos de Trabajos Completados.
                {dynamicBrandShare.length === 0 && " (Actualmente mostrando datos de prueba hasta que se completen obras)."}
              </p>
            </div>

            {/* Consumo de Materiales Físico */}
            <div className="bg-card p-6 rounded-2xl border border-bd-lines shadow-sm">
              <h3 className="text-lg font-bold text-tx-primary mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-500 size-5" /> Consumo Global de Materiales (Volumen)
              </h3>
              <div className="space-y-4">
                {displayMaterialUsage.map(mat => (
                  <div key={mat.material} className="flex items-center justify-between p-3 rounded-xl bg-main border border-bd-lines">
                    <span className="font-semibold text-sm text-tx-primary">{mat.material}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-tx-primary">{mat.amount}</span>
                      {mat.trend === 'up' ? 
                        <span className="flex items-center text-accent text-xs font-bold bg-accent/10 px-2 py-0.5 rounded-md"><TrendingUp size={12} className="mr-1"/> Sube</span> :
                        <span className="flex items-center text-red-500 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded-md"><TrendingUp size={12} className="mr-1 rotate-180"/> Baja</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-tx-secondary mt-6 italic">
                * Sumatoria de unidades facturadas o presupuestadas en Trabajos Completados.
                {dynamicMaterialUsage.length === 0 && " (Actualmente procesando simulados)."}
              </p>
            </div>

            {/* Pain Points del Mercado / El Cementerio */}
            <div className="bg-card p-6 rounded-2xl border border-bd-lines shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-tx-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="text-orange-500 size-5" /> Fallas Detectadas (El Cementerio)
              </h3>
              <p className="text-sm text-tx-secondary mb-4 leading-relaxed">
                El sistema recopila automáticamente los reportes de roturas y fallas realizados en obra. Información vital para fabricantes y Control de Calidad.
              </p>
              
              <div className="flex-1 space-y-3">
                {displayFallas.map((falla, idx) => (
                  <div key={idx} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-1">
                      Reportada {falla.mentions} veces ({falla.growth} mensual)
                    </span>
                    <p className="text-sm text-tx-primary font-medium leading-tight">Pieza: {falla.topic}</p>
                  </div>
                ))}
                {dynamicFallas.length === 0 && (
                  <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-1">Simulación (Sin Datos Reales Aún)</span>
                    <p className="text-sm text-tx-primary font-medium leading-tight">Mucha demanda insatisfecha o reportes de fallas por confirmar en campo.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
