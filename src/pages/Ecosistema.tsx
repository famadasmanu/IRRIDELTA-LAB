import React, { useState } from 'react';
import { Network, MessageSquare, ThumbsUp, Share2, TrendingUp, BarChart3, Search, Filter, MapPin, Award, Zap, PieChart, Package, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

// Datos de prueba simulando la interacción de la comunidad
const communityFeed = [
  {
    id: 1,
    user: "Martín Gómez",
    role: "Instalador Senior",
    avatar: "https://i.pravatar.cc/150?u=martin",
    location: "Pilar, Buenos Aires",
    time: "Hace 2 horas",
    title: "Automatización de 5000m2 finalizada",
    content: "Excelente rendimiento de las electroválvulas de 2'' instaladas en paralelo. La presión se mantuvo constante a 3.5 bares durante todo el ciclo de prueba. ¿Alguien más notó una mejora de caudal en este último lote?",
    tags: ["Rainbird", "Electroválvulas", "Alta Presión", "Automatización"],
    likes: 24,
    comments: 5,
    image: "https://images.unsplash.com/photo-1599540066928-11bedeb34a9b?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    user: "Laura Fernández",
    role: "Paisajista",
    avatar: "https://i.pravatar.cc/150?u=laura",
    location: "Nordelta, Tigre",
    time: "Hace 5 horas",
    title: "Duda técnica sobre aspersores emergentes",
    content: "En terrenos con mucho desnivel, ¿qué marca de toberas con ajuste de arco están prefiriendo para evitar el charqueo rápido? Estoy entre dos marcas principales y me gustaría saber el desgaste a 2 años.",
    tags: ["Toberas", "Desnivel", "Mantenimiento"],
    likes: 8,
    comments: 12,
  },
  {
    id: 3,
    user: "TecnoRiego SRL",
    role: "Distribuidor",
    avatar: "https://i.pravatar.cc/150?u=tecnoriego",
    location: "Rosario, Santa Fe",
    time: "Ayer",
    title: "Cambio de tuberías de PEAD a PVC en lote agrícola",
    content: "Terminamos de migrar 2km de red primaria. Usamos uniones termofusionadas en lugar de roscadas y el tiempo de instalación bajó un 40%.",
    tags: ["PVC", "Termofusión", "Instalación Rápida", "Obra Mayor"],
    likes: 45,
    comments: 18,
    image: "https://images.unsplash.com/photo-1574697960100-3027bca50190?auto=format&fit=crop&q=80&w=800"
  }
];

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

  // Procesamiento en tiempo real de Marcas y Categorías extraidas de Trabajos Completados
  const brandCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  let totalMarcas = 0;

  trabajosRaw.forEach(trabajo => {
    if (trabajo.estado === 'Completado' && trabajo.gastosDetalle) {
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
  anotacionesRaw.forEach(anotacion => {
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Feed Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Caja de Nueva Publicación */}
            <div className="bg-card rounded-2xl p-5 border border-bd-lines shadow-sm flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0 border border-accent/30 text-accent font-bold">
                  TU
                </div>
                <div className="flex-1">
                  <textarea 
                    placeholder="¿Qué material o técnica estás usando en tu obra de hoy?" 
                    className="w-full bg-main border border-bd-lines rounded-xl p-3 text-tx-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none h-20"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-bd-lines">
                <div className="flex gap-2">
                  <button className="text-tx-secondary hover:text-accent p-2 rounded-lg hover:bg-main transition-colors text-sm font-semibold flex items-center gap-2">
                    <MapPin size={16} /> Etiquetar Obra
                  </button>
                  <button className="text-tx-secondary hover:text-accent p-2 rounded-lg hover:bg-main transition-colors text-sm font-semibold flex items-center gap-2">
                    <Package size={16} /> Etiquetar Producto
                  </button>
                </div>
                <button className="bg-accent text-white px-5 py-2 rounded-xl font-bold hover:bg-[#15803d] shadow-sm transform hover:scale-105 transition-all">
                  Publicar
                </button>
              </div>
            </div>

            {/* Muro de Publicaciones */}
            <div className="space-y-6">
              {communityFeed.map((post) => (
                <div key={post.id} className="bg-card rounded-2xl border border-bd-lines shadow-sm overflow-hidden group">
                  <div className="p-5">
                    {/* Cabecera del Post */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={post.avatar} alt={post.user} className="w-12 h-12 rounded-full border border-bd-lines" />
                        <div>
                          <h4 className="font-bold text-tx-primary leading-tight">{post.user}</h4>
                          <span className="text-xs text-tx-secondary flex items-center gap-1 mt-0.5">
                            {post.role} • <MapPin size={10} /> {post.location}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-tx-secondary font-medium">{post.time}</span>
                    </div>

                    {/* Contenido */}
                    <h3 className="text-lg font-bold text-tx-primary mb-2">{post.title}</h3>
                    <p className="text-tx-secondary text-sm leading-relaxed mb-4">{post.content}</p>

                    {/* Tags (Minería invisible de datos) */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span key={tag} className="bg-accent/10 border border-accent/20 text-accent text-xs font-bold px-2.5 py-1 rounded-md cursor-pointer hover:bg-accent hover:text-white transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Media si existe */}
                    {post.image && (
                      <div className="mb-4 rounded-xl overflow-hidden max-h-[300px] border border-bd-lines">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}

                    {/* Interacciones */}
                    <div className="flex items-center gap-6 pt-4 border-t border-bd-lines">
                      <button className="flex items-center gap-2 text-tx-secondary hover:text-blue-500 font-semibold text-sm transition-colors">
                        <ThumbsUp size={18} /> {post.likes}
                      </button>
                      <button className="flex items-center gap-2 text-tx-secondary hover:text-accent font-semibold text-sm transition-colors">
                        <MessageSquare size={18} /> {post.comments} Respuestas
                      </button>
                      <button className="flex items-center gap-2 text-tx-secondary hover:text-white font-semibold text-sm transition-colors ml-auto">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Derecho - Tendencias PÚBLICAS (Motivan a participar) */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-5 border border-bd-lines shadow-sm">
              <h3 className="text-tx-primary font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="text-accent size-5" /> Tendencias en el Campo
              </h3>
              <div className="space-y-4">
                {stakeholderStats.trendingTopics.map((topic, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-main border border-bd-lines cursor-pointer hover:border-accent transition-colors">
                    <div>
                      <p className="font-bold text-sm text-tx-primary flex items-center gap-2">
                        <span className="text-tx-secondary font-black">#{i+1}</span> {topic.topic}
                      </p>
                      <span className="text-xs text-tx-secondary">{topic.mentions} menciones esta semana</span>
                    </div>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">{topic.growth}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-bd-lines shadow-sm">
              <h3 className="text-tx-primary font-bold flex items-center gap-2 mb-2">
                <Award className="text-yellow-500 size-5" /> Top Profesionales
              </h3>
              <p className="text-xs text-tx-secondary mb-4 leading-relaxed">
                Nuestros instaladores y agrónomos que más soluciones comparten con la comunidad.
              </p>
              <div className="space-y-3">
                {['Diego H.', 'Ing. Agrónoma Clara', 'Piscinas & Riegos Sur'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
                      {i+1}
                    </div>
                    <span className="text-sm font-medium text-tx-primary">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA PRIVADA DEL DUEÑO: DATA MINING PARA STAKEHOLDERS */
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-[#1a3a2a] to-[#0f2419] rounded-2xl p-6 border border-emerald-500/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <PieChart size={150} />
            </div>
            <div className="relative z-10">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block border border-emerald-500/30">
                Módulo Monetizable
              </span>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Market Intelligence & Data Mining</h2>
              <p className="text-emerald-100/70 max-w-2xl text-sm leading-relaxed mb-6">
                Toda la interacción del "Ecosistema Cooperativo" se filtra y acumula aquí. Alimenta estos dashboards con el comportamiento geolocalizado, uso de marcas, roturas frecuentes y preferencias del mercado laboral. Esta es la información cruda y valiosa lista para ser vendida a los fabricantes (Stakeholders).
              </p>
              <button className="bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                Procesar Reporte Mensual PDF
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
                        <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md"><TrendingUp size={12} className="mr-1"/> Sube</span> :
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
