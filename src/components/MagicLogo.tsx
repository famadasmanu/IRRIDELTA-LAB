import { motion } from 'framer-motion';
import React from 'react';

export const MagicLogo = ({ className = '', scale = 1 }: { className?: string; scale?: number }) => {
  return (
    <motion.div 
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'center' }}
      className={`relative flex items-center justify-center w-full mx-auto select-none ${className || 'max-w-[280px] h-[100px]'}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 
        NOTA PARA LEANDRO:
        Por favor asegurate de que la imagen que me acabas de pasar (con el sol y el texto de Argen) 
        esté guardada en la carpeta "public" con el nombre "logo.png". 
      */}
      <img 
        src="/logo.png" 
        alt="Argen Software" 
        className="w-full h-full object-contain drop-shadow-md rounded-xl"
        onError={(e) => {
          // Si no encuentra 'logo.png', intenta caer de nuevo al JPEG o mostrar un texto.
          e.currentTarget.style.display = 'none';
          if (e.currentTarget.nextElementSibling) {
             (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
          }
        }}
      />
      
      {/* Fallback Text si falta el logo */}
      <div 
        className="hidden text-xl font-bold text-tx-primary tracking-widest text-center"
      >
        <span className="text-accent">ARGEN</span> SOFTWARE
      </div>
    </motion.div>
  );
};
