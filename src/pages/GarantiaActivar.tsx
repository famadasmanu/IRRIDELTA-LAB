import React, { useState } from 'react';
import { Leaf, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function GarantiaActivar() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    fechaInstalacion: '',
    tipoCorte: '',
    marcas: [] as string[],
    herramientasExtra: [] as string[],
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const marcasReconocidas = ['Stihl', 'Husqvarna', 'Niwa', 'Echo', 'Gamma', 'Honda', 'B&S', 'Einhell', 'Black&Decker', 'Otra'];
  const herramientas = ['Bordeadora', 'Sopladora', 'Motosierra', 'Cortasetos', 'Pulverizador'];

  const handleMarcaToggle = (marca: string) => {
    setFormData(prev => ({
      ...prev,
      marcas: prev.marcas.includes(marca)
        ? prev.marcas.filter(m => m !== marca)
        : [...prev.marcas, marca]
    }));
  };

  const handleHerramientaToggle = (herr: string) => {
    setFormData(prev => ({
      ...prev,
      herramientasExtra: prev.herramientasExtra.includes(herr)
        ? prev.herramientasExtra.filter(h => h !== herr)
        : [...prev.herramientasExtra, herr]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.telefono || !formData.tipoCorte) {
      setError('Por favor completa los campos principales para activar tu garantía.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'garantias_y_maquinas'), {
        ...formData,
        fechaActivacion: new Date().toISOString(),
        estadoRegistro: 'Vigente - 12 Meses'
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un error al procesar la alta. Reintentá en un momento.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-main flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-3xl p-8 border border-bd-lines shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
             <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
             <CheckCircle2 size={40} className="relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-tx-primary">¡Garantía Activada!</h2>
          <p className="text-tx-secondary">
             Tu sistema de Riego Inteligente diseñado por <strong>Argent Software</strong> se encuentra cubierto por 12 meses.
          </p>
          <div className="bg-main border border-bd-lines p-4 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Gracias además por tu feedback sobre el equipamiento. Esto nos permite mejorar la ingeniería futura de tu jardín.
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-tx-secondary underline text-sm mt-6 hover:text-tx-primary transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] flex flex-col">
      {/* Elegante Decoración Superior */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500" />
      
      <div className="flex-1 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-xl w-full relative z-10">
          
          <div className="flex justify-center mb-6">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-bold tracking-widest text-sm backdrop-blur-md shadow-lg shadow-emerald-500/10">
               <ShieldCheck size={18} /> ACTIVACIÓN OFICIAL DE GARANTÍA
             </div>
          </div>

          <div className="bg-card/80 backdrop-blur-xl border border-bd-lines/50 shadow-2xl rounded-[2rem] p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Registro de Instalación</h1>
              <p className="text-tx-secondary font-medium">Completá este formulario rápido de 2 pasos para activar tu garantía técnica anual por 12 meses.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-medium">
                <AlertCircle size={20} className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className={`transition-all duration-500 ${step === 1 ? 'block opacity-100' : 'hidden opacity-0'}`}>
                 <h3 className="text-lg font-bold text-white mb-4 border-b border-bd-lines pb-2">Paso 1: Titular del Proyecto</h3>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-tx-secondary text-xs uppercase font-bold tracking-wider mb-2">Nombre y Apellido</label>
                     <input 
                       type="text" required
                       className="w-full bg-main border border-bd-lines rounded-xl p-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-white/20"
                       placeholder="Ej: Marcelo García"
                       value={formData.nombre}
                       onChange={e => setFormData({...formData, nombre: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-tx-secondary text-xs uppercase font-bold tracking-wider mb-2">Teléfono Celular / WhatsApp</label>
                     <input 
                       type="tel" required
                       className="w-full bg-main border border-bd-lines rounded-xl p-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-white/20"
                       placeholder="Ej: 11 4455-6677"
                       value={formData.telefono}
                       onChange={e => setFormData({...formData, telefono: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-tx-secondary text-xs uppercase font-bold tracking-wider mb-2">Fecha Aproximada de Obra Finalizada</label>
                     <input 
                       type="date" required
                       className="w-full bg-main border border-bd-lines rounded-xl p-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                       value={formData.fechaInstalacion}
                       onChange={e => setFormData({...formData, fechaInstalacion: e.target.value})}
                     />
                   </div>
                   <button 
                     type="button"
                     onClick={() => setStep(2)}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                   >
                     Continuar <ChevronRight size={18} />
                   </button>
                 </div>
              </div>

              <div className={`transition-all duration-500 ${step === 2 ? 'block opacity-100' : 'hidden opacity-0'}`}>
                 <h3 className="text-lg font-bold text-white mb-2 border-b border-bd-lines pb-2 flex items-center gap-2">
                   <Leaf size={18} className="text-emerald-500" /> Perfil Técnico del Entorno
                 </h3>
                 <p className="text-xs text-tx-secondary mb-6 leading-relaxed">
                   Para cruzar datos con el ingeniero, evaluar el volumen de pasto cortado semanal que cae sobre los aspersores y calcular el mantenimiento preventivo, ¿podrías indicarnos qué usás actualmente?
                 </p>
                 
                 <div className="space-y-6">
                   <div>
                     <label className="block text-white text-sm font-bold mb-3">1. Frecuencia y Tipo de Corte de Pasto*</label>
                     <select 
                       required={step === 2}
                       className="w-full bg-main border border-bd-lines rounded-xl p-3.5 text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                       value={formData.tipoCorte}
                       onChange={e => setFormData({...formData, tipoCorte: e.target.value})}
                     >
                       <option value="" disabled>Seleccioná una opción...</option>
                       <option value="Máquina a Explosión (Naftera)">Cortadora a Explosión (Naftera)</option>
                       <option value="Máquina Eléctrica / Batería">Cortadora Eléctrica / a Batería</option>
                       <option value="Robot Autónomo">Robot Autónomo</option>
                       <option value="Servicio Tercerizado (Pell/Jardinero)">Lo hace el Jardinero / Tercero</option>
                       <option value="Tractor">Tractor / Giro Cero</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-white text-sm font-bold mb-3">2. ¿Qué marca/s predominan en tus equipos?</label>
                     <div className="flex flex-wrap gap-2">
                       {marcasReconocidas.map(marca => (
                         <button
                           key={marca} type="button"
                           onClick={() => handleMarcaToggle(marca)}
                           className={cn(
                             "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                             formData.marcas.includes(marca)
                               ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                               : "bg-main border-bd-lines text-tx-secondary hover:border-tx-secondary"
                           )}
                         >
                           {marca}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div>
                     <label className="block text-white text-sm font-bold mb-3">3. Herramientas complementarias en la casa</label>
                     <div className="flex flex-wrap gap-2">
                       {herramientas.map(herr => (
                         <button
                           key={herr} type="button"
                           onClick={() => handleHerramientaToggle(herr)}
                           className={cn(
                             "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                             formData.herramientasExtra.includes(herr)
                               ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                               : "bg-main border-bd-lines text-tx-secondary hover:border-tx-secondary"
                           )}
                         >
                           {herr}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="flex items-center gap-3 pt-4 border-t border-bd-lines">
                     <button 
                       type="button"
                       onClick={() => setStep(1)}
                       className="flex-1 bg-main hover:bg-white/5 border border-bd-lines text-white font-bold p-4 rounded-xl transition-all active:scale-[0.98]"
                     >
                       Atrás
                     </button>
                     <button 
                       type="submit"
                       disabled={loading}
                       className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sellar Activación'}
                     </button>
                   </div>
                 </div>
              </div>

            </form>
          </div>
          
          <div className="text-center mt-6 opacity-50">
             <p className="text-white text-xs font-bold tracking-widest uppercase mb-1">Tecnología Registrada</p>
             <p className="text-white text-[10px]">Argent Software • Garantía Asegurada</p>
          </div>
        </div>
      </div>
    </div>
  );
}
