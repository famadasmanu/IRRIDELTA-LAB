const fs = require('fs');
const filepath = 'c:/Users/famad/Desktop/IRRIDELTA/src/pages/Trabajos.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const missingBlock = `
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3A5F4B]/5 rounded-bl-[100px] pointer-events-none"></div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                  <Activity size={24} className="text-[#3A5F4B]" />
                  Métricas del Proyecto
                </h2>
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gastos Totales ($)</label>
                    <input
                      type="number"
                      value={gastosToUse}
                      disabled={true}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculado automáticamente desde los estadios.</p>
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
                    className="w-full flex items-center justify-center gap-2 bg-[#3A5F4B] text-white px-4 py-3.5 rounded-xl font-bold shadow-lg shadow-[#3A5F4B]/30 hover:shadow-[#3A5F4B]/50 transition-all hover:-translate-y-0.5 mt-6"
                  >
                    <Save size={20} /> Actualizar Métricas
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#3A5F4B]/10 overflow-hidden">
                <img src={selectedTrabajo.img} alt={selectedTrabajo.titulo} className="w-full h-48 object-cover" />
              </div>
            </div>
          </div>
`;

content = content.replace(
  '{/* Nueva Línea de Estadios (Módulos de Obra) */}',
  missingBlock + '\n              {/* Nueva Línea de Estadios (Módulos de Obra) */}'
);

content = content.replace(
  '<div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10 mt-6 relative overflow-hidden lg:col-span-2">',
  '<div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10 mt-6 relative overflow-hidden">'
);

fs.writeFileSync(filepath, content, 'utf8');
console.log('File successfully fixed!');
