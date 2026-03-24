import React, { useState } from 'react';
import { Calculator, Wifi } from 'lucide-react';
import Calculadora from './Calculadora';
import Controladores from './Controladores';

export default function Herramientas() {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'controladores'>('calculadora');

  return (
    <div className="flex flex-col gap-2 w-full pb-10">
      <div className="flex gap-3 w-full overflow-x-auto hide-scrollbar mb-2">
        <button
          onClick={() => setActiveTab('calculadora')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${
            activeTab === 'calculadora'
              ? 'bg-accent text-white shadow-lg shadow-accent/20 border-accent'
              : 'bg-card text-tx-secondary hover:bg-slate-800/10 dark:hover:bg-white/5 border-bd-lines'
          }`}
        >
          <Calculator size={20} />
          Calculadora Hidráulica
        </button>
        
        <button
          onClick={() => setActiveTab('controladores')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${
            activeTab === 'controladores'
              ? 'bg-accent text-white shadow-lg shadow-accent/20 border-accent'
              : 'bg-card text-tx-secondary hover:bg-slate-800/10 dark:hover:bg-white/5 border-bd-lines'
          }`}
        >
          <Wifi size={20} />
          Controladores Hydrawise
        </button>
      </div>

      <div className="w-full pt-2">
        {activeTab === 'calculadora' && <Calculadora />}
        {activeTab === 'controladores' && <Controladores />}
      </div>
    </div>
  );
}
