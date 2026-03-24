import React from 'react';
import { ArrowLeft, Share2, Calendar, Handshake } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const newsData = {
 'todo-riego': {
 partnerName: 'Todo Riego',
 title: 'Nueva línea de aspersores de bajo consumo',
 date: '2023-10-25',
 image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAigqe4mWkrN51yhHvph9BjfT9LcGWM46Mm51MDxPuLMM64X95dKlvP3JR2VhwTSVFDPUoluj6hXadTyFfoH4uYWqV1QbPYpPb5vMxUF8ekETjcdDqy-ZM-tkPs9AsO2FEXmp4VEu6Xkc8e_va7-d9qWrjrpj6x76mGwXAztdenBnssAfbYAq1FjfjBKTdTS9hNybvYpCaGuxKlVRs6-hSE0JU3cUpi8w0y0JYWUfby00Cw04wx0_n3TumEf2QaBuZIv1_r_UCrok',
 content: `
 <p>Nos complace anunciar el lanzamiento de nuestra nueva línea de aspersores residenciales diseñados específicamente para maximizar la eficiencia hídrica.</p>
 <br/>
 <p>Esta nueva tecnología permite ahorrar hasta un 30% de agua en comparación con los modelos tradicionales, manteniendo una cobertura uniforme y un rendimiento excepcional incluso en condiciones de baja presión.</p>
 <br/>
 <p><strong>Características principales:</strong></p>
 <ul style="list-style-type: disc; margin-left: 20px; margin-top: 10px;">
 <li>Boquillas de alta eficiencia preinstaladas.</li>
 <li>Regulación de presión integrada para evitar la nebulización.</li>
 <li>Construcción robusta para mayor durabilidad.</li>
 </ul>
 <br/>
 <p>Invitamos a todos los profesionales del sector a conocer más sobre esta innovación en nuestras próximas jornadas técnicas.</p>
 `
 },
 'munditol': {
 partnerName: 'Munditol',
 title: 'Lanzamiento: Motosierras a batería STIHL',
 date: '2023-10-28',
 image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdtNY0QqOgqKWSC5qOnKQoaH8fn13fZMhlB3PlmPRxoGEUQ_m9z7dXrBU_IcXavc2c8gEgyWhgtsVyoisocscIW7ACBNhphUY_VrT3ACWYYET5zC1rFvyaBSbbtGWATSaebFO47JJVNyGcQKWczEjVRCd2kbXgSBqtWuXXY1Hsuwl_fa2ICfUT5JQu3-8iUY_S5qG9SKsgHsfQ-64wWojyJnLb5qkEQdDyDidjczLqfg_rLVDscqe_CgiOuVGaqYBzMcF8FYQS8pE',
 content: `
 <p>STIHL da un paso hacia el futuro del paisajismo profesional con su nueva gama de motosierras a batería, combinando la potencia legendaria de la marca con tecnología libre de emisiones.</p>
 <br/>
 <p>Diseñadas para trabajos intensivos en zonas sensibles al ruido, estas herramientas ofrecen un rendimiento comparable a sus equivalentes de gasolina, pero con un mantenimiento significativamente menor y una huella de carbono reducida.</p>
 <br/>
 <p><strong>Beneficios destacados:</strong></p>
 <ul style="list-style-type: disc; margin-left: 20px; margin-top: 10px;">
 <li>Cero emisiones de escape.</li>
 <li>Funcionamiento silencioso, ideal para áreas urbanas y residenciales.</li>
 <li>Arranque instantáneo y manejo ergonómico.</li>
 </ul>
 <br/>
 <p>Descubre la nueva era del mantenimiento de áreas verdes con STIHL y Munditol.</p>
 `
 },
 'hunter': {
 partnerName: 'Hunter Industries',
 title: 'Certificación Hydrawise 2024',
 date: '2023-11-02',
 image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
 content: `
 <p>El programa de certificación Hydrawise 2024 ya está abierto para inscripciones. Este programa está diseñado para instaladores profesionales que desean dominar la tecnología de riego inteligente líder en la industria.</p>
 <br/>
 <p>A través de módulos interactivos y evaluaciones prácticas, los participantes aprenderán a diseñar, instalar y gestionar sistemas de riego eficientes utilizando la plataforma Hydrawise.</p>
 <br/>
 <p><strong>¿Qué aprenderás?</strong></p>
 <ul style="list-style-type: disc; margin-left: 20px; margin-top: 10px;">
 <li>Configuración avanzada de controladores Wi-Fi.</li>
 <li>Programación predictiva basada en datos meteorológicos.</li>
 <li>Gestión remota de múltiples sitios desde la aplicación.</li>
 </ul>
 <br/>
 <p>Eleva tu perfil profesional y ofrece a tus clientes las mejores soluciones en gestión del agua.</p>
 `
 }
};

export default function PartnerDetalle() {
 const navigate = useNavigate();
 const { id } = useParams<{ id: string }>();
 
 const newsId = id && newsData[id as keyof typeof newsData] ? id : 'todo-riego';
 const news = newsData[newsId as keyof typeof newsData];

 return (
 <div className="relative flex min-h-screen w-full flex-col max-w-2xl mx-auto bg-card shadow-xl overflow-x-hidden text-tx-primary pb-12">
 {/* TopAppBar */}
 <div className="sticky top-0 z-50 flex items-center bg-card/90 backdrop-blur-md p-4 justify-between border-b border-bd-lines shadow-sm">
 <button 
 onClick={() => navigate(-1)}
 className="text-tx-secondary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-main transition-colors"
 >
 <ArrowLeft size={24} />
 </button>
 <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-tx-primary">
 Novedad de Socio
 </h2>
 <button className="text-tx-secondary flex size-10 items-center justify-center rounded-full hover:bg-main transition-colors">
 <Share2 size={24} />
 </button>
 </div>

 {/* Hero Image */}
 <div className="w-full h-64 md:h-80 relative">
 <img 
 src={news.image} 
 alt={news.title}
 className="w-full h-full object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
 <div className="absolute bottom-6 left-6 right-6">
 <div className="flex items-center gap-2 mb-3">
 <span className="bg-card/90 backdrop-blur-sm text-tx-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm">
 {news.partnerName}
 </span>
 </div>
 <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
 {news.title}
 </h1>
 </div>
 </div>

 {/* Content */}
 <div className="p-6 md:p-8">
 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-bd-lines">
 <div className="flex items-center gap-2 text-tx-secondary text-sm font-medium">
 <Calendar size={16} />
 {format(parseISO(news.date), "d 'de' MMMM, yyyy", { locale: es })}
 </div>
 <div className="flex items-center gap-2 text-tx-secondary text-sm font-medium">
 <Handshake size={16} />
 Socio Estratégico
 </div>
 </div>

 <div 
 className="prose prose-slate max-w-none prose-p:text-tx-secondary prose-p:leading-relaxed prose-headings:text-tx-primary prose-headings:font-bold prose-a:text-accent hover:prose-a:text-[#15803d] prose-strong:text-tx-primary prose-ul:list-disc prose-ul:pl-5 prose-li:text-tx-secondary prose-li:marker:text-accent"
 dangerouslySetInnerHTML={{ __html: news.content }}
 />
 </div>
 </div>
 );
}
