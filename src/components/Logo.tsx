import React from 'react';

export const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <img 
      src="/logo.png?v=3" 
      alt="Argen Software" 
      className={`object-contain ${className}`}
    />
  );
};
