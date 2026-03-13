import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertCircle } from 'lucide-react';

const financeData = [
    { name: 'Ene', ingresos: 4000, egresos: 2400 },
    { name: 'Feb', ingresos: 3000, egresos: 1398 },
    { name: 'Mar', ingresos: 2000, egresos: 9800 },
    { name: 'Abr', ingresos: 2780, egresos: 3908 },
    { name: 'May', ingresos: 1890, egresos: 4800 },
    { name: 'Jun', ingresos: 2390, egresos: 3800 },
];

const jobsData = [
    { name: 'Completados', value: 45, color: '#10b981' },
    { name: 'En Progreso', value: 25, color: '#3b82f6' },
    { name: 'Pendientes', value: 15, color: '#f59e0b' },
];

const lowStockItems = [
    { id: 1, name: 'Tubo PVC 20mm', stock: 5, min: 10 },
    { id: 2, name: 'Aspersor Hunter', stock: 2, min: 15 },
    { id: 3, name: 'Bomba 1HP', stock: 1, min: 3 },
];

export default function DashboardCharts() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-6">
            {/* Gráfico Financiero */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Finanzas: Ingresos vs Egresos</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                            <Legend iconType="circle" />
                            <Bar dataKey="ingresos" name="Ingresos ($)" fill="#3A5F4B" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="egresos" name="Egresos ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Gráfico de Trabajos */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Estado de Trabajos</h3>
                    <div className="h-48 w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={jobsData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {jobsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-2">
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">{jobsData.reduce((a, b) => a + b.value, 0)}</span>
                            <span className="text-xs text-slate-500">Total</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {jobsData.map(j => (
                            <div key={j.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: j.color }}></div>
                                {j.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alertas Inventario */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-[#3A5F4B]/10 flex-1">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="text-orange-500 size-5" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas de Stock</h3>
                    </div>
                    <div className="space-y-3">
                        {lowStockItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-500/20">
                                <div className="flex items-center gap-3">
                                    <Package className="size-8 p-1.5 bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300 rounded-md" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Min: {item.min} u.</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{item.stock}</span>
                                    <p className="text-[10px] text-orange-500 font-bold uppercase">Restantes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
