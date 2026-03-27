import { Sun } from 'lucide-react';

export const ArgenLogo = ({ 
  className = "", 
  dark = false,
  scale = 1
}: { 
  className?: string;
  dark?: boolean;
  scale?: number;
}) => {
  // Ajuste fino del sol de mayo dentro de la "A" y la palabra "GÉN"
  const blueColor = dark ? '#60A5FA' : '#3B82F6'; // Tailwind blue-400 : blue-500
  const sunColor = '#F5A623'; // Amarillo soleado cálido (Sol de Mayo)
  
  return (
    <div 
      className={`flex flex-col items-center justify-center font-sans select-none drop-shadow-md cursor-pointer ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      <div className="flex items-center leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* 'A' con Sol de Mayo */}
        <div className="relative flex items-center justify-center">
          <span className="text-[46px] font-black tracking-tighter" style={{ color: blueColor }}>A</span>
          {/* Posicionamos el sol en el hueco superior/medio de la A */}
          <Sun 
            className="absolute left-[50%] top-[60%] -translate-x-[50%] -translate-y-[50%] animate-[spin_60s_linear_infinite]" 
            style={{ color: sunColor, fill: sunColor, width: '15px', height: '15px' }} 
          />
        </div>
        
        {/* 'RGÉN' con tilde */}
        <span className="text-[46px] font-black tracking-tighter ml-0.5" style={{ color: blueColor }}>
          RGÉN
        </span>
        
      </div>
      
      {/* SOFTWARE */}
      <span className="text-[12px] font-bold tracking-[0.45em] uppercase mt-0.5 ml-1" style={{ color: dark ? '#CBD5E1' : '#64748B' }}>
        Software
      </span>
    </div>
  );
};
