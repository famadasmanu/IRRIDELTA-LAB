const fs = require('fs');
const filepath = 'c:/Users/famad/Desktop/IRRIDELTA/src/pages/Trabajos.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Create the helper functions for nested gastos.
const handlersStr = `
  // --- Start Módulos de Obra handlers ---
  const handleAddGastoPactado = (pactadoId: number) => {
    if (!selectedTrabajo) return;
    const updatedData = portfolioData.map((item: any) => {
      if (item.id === selectedTrabajo.id) {
        return {
          ...item,
          trabajosPactados: (item.trabajosPactados || []).map((p: any) => {
            if (p.id === pactadoId) {
              return {
                ...p,
                gastos: [...(p.gastos || []), { id: Date.now().toString(), descripcion: '', cantidad: 1, precioUnitario: 0 }]
              };
            }
            return p;
          })
        };
      }
      return item;
    });
    setPortfolioData(updatedData);
    setSelectedTrabajo(updatedData.find((i: any) => i.id === selectedTrabajo.id));
  };

  const handleUpdateGastoPactado = (pactadoId: number, gastoId: string, field: string, value: any) => {
    if (!selectedTrabajo) return;
    const updatedData = portfolioData.map((item: any) => {
      if (item.id === selectedTrabajo.id) {
        return {
          ...item,
          trabajosPactados: (item.trabajosPactados || []).map((p: any) => {
            if (p.id === pactadoId) {
              return {
                ...p,
                gastos: (p.gastos || []).map((g: any) => g.id === gastoId ? { ...g, [field]: value } : g)
              };
            }
            return p;
          })
        };
      }
      return item;
    });
    setPortfolioData(updatedData);
    setSelectedTrabajo(updatedData.find((i: any) => i.id === selectedTrabajo.id));
  };

  const handleRemoveGastoPactado = (pactadoId: number, gastoId: string) => {
    if (!selectedTrabajo) return;
    const updatedData = portfolioData.map((item: any) => {
      if (item.id === selectedTrabajo.id) {
        return {
          ...item,
          trabajosPactados: (item.trabajosPactados || []).map((p: any) => {
            if (p.id === pactadoId) {
              return {
                ...p,
                gastos: (p.gastos || []).filter((g: any) => g.id !== gastoId)
              };
            }
            return p;
          })
        };
      }
      return item;
    });
    setPortfolioData(updatedData);
    setSelectedTrabajo(updatedData.find((i: any) => i.id === selectedTrabajo.id));
  };
  // --- End Módulos de Obra handlers ---
`;

if (!content.includes('handleAddGastoPactado')) {
    content = content.replace('const handleAddTrabajoPactado =', handlersStr + '\n  const handleAddTrabajoPactado =');
}

const oldPlantilla = `  const cargarPlantillaJardineria = () => {
    const plantillaGastos = [
      { id: 'p1', descripcion: 'Tierra negra zarandeada', cantidad: 50, precioUnitario: 1500, unidad: 'bolsas' },
      { id: 'p2', descripcion: 'Fertilizante Urea', cantidad: 2, precioUnitario: 4500, unidad: 'kg' },
      { id: 'p3', descripcion: 'Plantines florales (petunias)', cantidad: 100, precioUnitario: 350, unidad: 'unidades' },
      { id: 'p4', descripcion: 'Corte de pasto (horas operario)', cantidad: 4, precioUnitario: 3500, unidad: 'horas' },
      { id: 'p5', descripcion: 'Combustible maquinaria', cantidad: 5, precioUnitario: 950, unidad: 'litros' },
    ];
    setGastosDetalle([...gastosDetalle, ...plantillaGastos]);
    displayToast('Plantilla cargada exitosamente');
  };`;

const newPlantilla = `  const cargarPlantillaJardineria = () => {
    if (!selectedTrabajo) return;
    const nuevoEstadio = {
      id: Date.now(),
      nombre: 'Plantilla: Mantenimiento Base',
      foto: 'https://images.unsplash.com/photo-1599388145214-e692f8d87a53?auto=format&fit=crop&q=80&w=200',
      tags: ['mantenimiento', 'jardineria'],
      gastos: [
        { id: 'p1', descripcion: 'Tierra negra zarandeada', cantidad: 50, precioUnitario: 1500 },
        { id: 'p2', descripcion: 'Fertilizante Urea', cantidad: 2, precioUnitario: 4500 },
        { id: 'p3', descripcion: 'Plantines florales (petunias)', cantidad: 100, precioUnitario: 350 },
        { id: 'p4', descripcion: 'Corte de pasto (hs operario)', cantidad: 4, precioUnitario: 3500 },
        { id: 'p5', descripcion: 'Combustible', cantidad: 5, precioUnitario: 950 },
      ]
    };
    const updatedData = portfolioData.map((item: any) =>
      item.id === selectedTrabajo.id ? {
        ...item,
        trabajosPactados: [...(item.trabajosPactados || []), nuevoEstadio]
      } : item
    );
    setPortfolioData(updatedData);
    setSelectedTrabajo(updatedData.find((i: any) => i.id === selectedTrabajo.id));
    displayToast('Módulo Plantilla añadido');
  };`;

content = content.replace(oldPlantilla, newPlantilla);

const reGastosToUse = /const gastosToUse = selectedTrabajo\?\.gastosDetalle \? [^;]+;/s;
const newGastosToUse = `
  let gastosToUse = 0;
  if (selectedTrabajo && selectedTrabajo.trabajosPactados) {
    selectedTrabajo.trabajosPactados.forEach((pactado: any) => {
      (pactado.gastos || []).forEach((g: any) => {
        gastosToUse += (Number(g.cantidad) || 0) * (Number(g.precioUnitario) || 0);
      });
    });
  }
`;

content = content.replace(reGastosToUse, newGastosToUse);
content = content.replace(/let calculoGastosTotales = 0;[\s\S]*?gastosToUse = calculoGastosTotales;\s*}/, '');

const startToken = '{/* Desglose de Gastos */}';
const endToken = '{/* Hidden PDF Template */}';
const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);

if (startIndex > -1 && endIndex > -1) {
  const replacementStr = `
              {/* Nueva Línea de Estadios (Módulos de Obra) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10 mt-6 relative overflow-hidden lg:col-span-2">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#3A5F4B] to-emerald-400"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <Activity className="text-[#3A5F4B]" size={28} />
                      Plan de Obra y Módulos
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 ml-9">
                      Gestione la obra como una cascada de estadios con sus recursos específicos autopresupuestados.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={cargarPlantillaJardineria} className="flex flex-1 sm:flex-none items-center justify-center gap-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-100 transition-colors shadow-sm">
                      <Leaf size={16} />
                      Plantilla Demo
                    </button>
                    <button
                      onClick={() => setIsTrabajoPactadoModalOpen(true)}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-[#3A5F4B]/30 hover:shadow-[#3A5F4B]/50 transition-all hover:-translate-y-0.5"
                    >
                      <Plus size={18} /> Módulo / Estadio
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="flex flex-1 sm:flex-none items-center justify-center gap-2 text-sm bg-slate-800 text-white border border-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-slate-700 transition-all hover:-translate-y-0.5">
                      <Download size={16} className={isExporting ? "animate-pulse" : ""} /> 
                      {isExporting ? 'Generando PDF...' : 'Generar PDF'}
                    </button>
                  </div>
                </div>

                {/* Timeline Estadios */}
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {selectedTrabajo.trabajosPactados && selectedTrabajo.trabajosPactados.length > 0 ? (
                    selectedTrabajo.trabajosPactados.map((pactado: any, idx: number) => {
                      const estadioGastos = pactado.gastos || [];
                      const subtotal = estadioGastos.reduce((acc: number, item: any) => acc + ((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)), 0);
                      
                      return (
                        <div key={pactado.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          {/* Timeline dot */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#3A5F4B] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <span className="font-bold text-sm">{idx + 1}</span>
                          </div>
                          
                          {/* Card */}
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 w-full h-1 bg-[#3A5F4B]/50 left-0"></div>
                            <div className="flex justify-between items-start mb-3 pt-2">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shrink-0 hidden sm:block">
                                  <img src={pactado.foto} alt={pactado.nombre} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800 text-lg leading-tight uppercase tracking-tight">{pactado.nombre}</h3>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {pactado.tags && pactado.tags.map((tag: string, tagIdx: number) => (
                                      <span key={tagIdx} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 pl-2">
                                <button onClick={() => handleRemoveTrabajoPactado(pactado.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            
                            {/* Materiales Inline */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <div className="flex justify-between items-end mb-2">
                                <h4 className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                                  <Folder size={14} className="text-slate-400" />
                                  Recursos del Estadio
                                </h4>
                                <span className="text-xs font-bold text-[#3A5F4B] bg-[#3A5F4B]/10 px-2.5 py-1 rounded-lg border border-[#3A5F4B]/20">
                                  Subtotal: \${subtotal.toLocaleString('es-AR')}
                                </span>
                              </div>
                              
                              <div className="space-y-2 mt-3">
                                {estadioGastos.map((gasto: any) => (
                                  <div key={gasto.id} className="flex flex-col sm:flex-row gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 hover:border-[#3A5F4B]/30 transition-colors items-center">
                                    <input
                                      type="text"
                                      value={gasto.descripcion}
                                      onChange={e => handleUpdateGastoPactado(pactado.id, gasto.id, 'descripcion', e.target.value)}
                                      placeholder="Insumo o herramienta..."
                                      className="flex-1 w-full sm:w-auto bg-white border border-slate-200 text-sm px-3 py-2 rounded-lg focus:ring-1 focus:ring-[#3A5F4B] outline-none font-medium shadow-sm"
                                    />
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                      <div className="flex items-center bg-white border border-slate-200 rounded-lg pr-2 shadow-sm min-w-40">
                                        <input
                                          type="number"
                                          value={gasto.cantidad}
                                          onChange={e => handleUpdateGastoPactado(pactado.id, gasto.id, 'cantidad', e.target.value)}
                                          className="w-14 text-sm px-2 py-2 rounded-l-lg outline-none text-center bg-transparent shrink-0"
                                          placeholder="Cant."
                                        />
                                        <span className="text-slate-300 font-bold px-1 text-xs">X</span>
                                        <span className="text-slate-400 font-bold ml-1 text-xs">$</span>
                                        <input
                                          type="number"
                                          value={gasto.precioUnitario}
                                          onChange={e => handleUpdateGastoPactado(pactado.id, gasto.id, 'precioUnitario', e.target.value)}
                                          className="flex-1 text-sm px-1 py-2 rounded-r-lg outline-none bg-transparent"
                                          placeholder="Precio"
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleRemoveGastoPactado(pactado.id, gasto.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shrink-0"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                
                                <button 
                                  onClick={() => handleAddGastoPactado(pactado.id)}
                                  className="w-full py-2.5 mt-2 border border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-[#3A5F4B]/50 hover:text-[#3A5F4B] transition-colors flex items-center justify-center gap-1.5 text-xs bg-white hover:bg-[#3A5F4B]/5 shadow-sm"
                                >
                                  <Plus size={16} /> Añadir Insumo
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full w-full mx-auto text-center py-10">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                        <CheckCircle className="text-slate-400 h-8 w-8" />
                      </div>
                      <h3 className="text-slate-600 font-bold text-lg">Aún no hay etapas de obra activas</h3>
                      <p className="text-slate-500 text-sm mt-1 mb-4">Delinea el proyecto dividiéndolo por estadios y agregando sus recursos.</p>
                      <button
                        onClick={() => setIsTrabajoPactadoModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-white text-[#3A5F4B] font-bold border border-[#3A5F4B]/30 px-5 py-2.5 rounded-xl hover:bg-[#3A5F4B]/5 transition-colors"
                      >
                        <Plus size={18} /> Crear Primer Estadio
                      </button>
                    </div>
                  )}
                </div>
              </div>
  `;
  content = content.substring(0, startIndex) + replacementStr + '\n            ' + content.substring(endIndex);
}

// 4. Update the PDF Template mapping since the structure changed
content = content.replace(/\{gastosDetalle\.map\(\(\(item/g, '{selectedTrabajo.trabajosPactados?.flatMap((p: any) => p.gastos || []).map(((item: any');

fs.writeFileSync(filepath, content, 'utf8');
console.log('File successfully updated with rewrite_trabajos.js');
