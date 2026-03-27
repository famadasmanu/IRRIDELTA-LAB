import { motion, useAnimation } from 'framer-motion';
import React, { useState } from 'react';

export const MagicLogo = ({ className = '', scale = 1 }: { className?: string; scale?: number }) => {
  const [falling, setFalling] = useState(false);
  const controls = useAnimation();
  
  const handleDrop = () => {
    if (falling) return;
    setFalling(true);
    // Simula una pieza sólida cayendo bajo la gravedad
    controls.start({
      y: 600, // Cae fuera de la pantalla
      rotate: Math.random() * 45 - 20,
      transition: { type: 'spring', stiffness: 100, damping: 10, mass: 2 }
    }).then(() => {
      // Regresa a su lugar después de unos segundos
      setTimeout(() => {
        controls.start({ 
           y: 0, 
           rotate: 0, 
           transition: { type: 'spring', stiffness: 200, damping: 20 } 
        });
        setFalling(false);
      }, 2000);
    });
  };

  return (
    <motion.div 
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      className={`relative isolate cursor-grab active:cursor-grabbing w-full max-w-[280px] h-[100px] mx-auto select-none overflow-hidden rounded-xl ${className}`}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.4}
      onClick={handleDrop}
      animate={controls}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Física 2D de una pieza sólida bajo Gravedad"
    >
      {/* 2. Textura Base: Fondo Blanco nativo (fondo de letras en blanco) */}
      <div className="absolute inset-0 bg-white" />

      {/* 3. Textura de Letras (Azul/Celeste) para la palabra ARGEN */}
      <div className="absolute top-0 left-[2%] w-[88%] h-[68%] bg-[#4A90E2] mix-blend-multiply" />
      
      {/* 4. Textura Dorada/Amarilla para el sol de Mayo (ubicado dentro de la A) */}
      <div className="absolute left-[20%] top-[45%] w-[40px] h-[40px] bg-[#F5A623] rounded-full mix-blend-multiply blur-[2px] -translate-x-1/2 -translate-y-1/2" />
      
      {/* 5. Textura Gris oscura para la palabra SOFTWARE en la base */}
      <div className="absolute bottom-0 left-[35%] w-[60%] h-[28%] bg-gray-800 mix-blend-multiply" />

      {/* 1. Máscara de Colisión B/N renderizada encima. 
          Blanco = Ciega los colores. Negro = Transparente mediante ScreenBlend 
          Es decir: Screen Blend vuelve TODO transparente SI es Negro. 
          Si la imagen adjunta es Texto NEGRO en fondo BLANCO, Screen Blend mantendrá Blanco puro pero pintará el texto Negro!
      */}
      <img src="/bw-logo.jpg" alt="Collision Map Mask" className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen" />
    </motion.div>
  );
};
