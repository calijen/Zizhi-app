
import React, { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const Phoebe: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for eye movement
  const springConfig = { damping: 20, stiffness: 150 };
  const eyeX = useSpring(mouseX, springConfig);
  const eyeY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      
      // Limit eye movement range
      mouseX.set(x * 6);
      mouseY.set(y * 6);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={style}
      className={`relative select-none pointer-events-none ${className}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
        {/* Hand-drawn body blob */}
        <path 
          d="M20,50 Q20,20 50,20 Q80,20 80,50 Q80,80 50,85 Q20,90 20,50" 
          fill="white" 
          stroke="black" 
          strokeWidth="3" 
        />
        
        {/* Left Eye Socket */}
        <ellipse cx="38" cy="45" rx="8" ry="10" fill="white" stroke="black" strokeWidth="2" />
        {/* Right Eye Socket */}
        <ellipse cx="62" cy="45" rx="8" ry="10" fill="white" stroke="black" strokeWidth="2" />
        
        {/* Pupils (Interactive) */}
        <motion.circle cx={38} cy={45} r="4" fill="black" style={{ x: eyeX, y: eyeY }} />
        <motion.circle cx={62} cy={45} r="4" fill="black" style={{ x: eyeX, y: eyeY }} />
        
        {/* Simple smile */}
        <path d="M40,65 Q50,72 60,65" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />
      </svg>
      
      {/* Speech Bubble */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute -top-12 -right-24 bg-white border-2 border-black p-2 shadow-[4px_4px_0_black]"
      >
        <p className="text-[10px] font-black uppercase whitespace-nowrap">I couldn't help but notice that...</p>
        {/* Tail */}
        <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-b-2 border-r-2 border-black rotate-45" />
      </motion.div>
    </motion.div>
  );
};

export const HandDrawnArrow: React.FC<{ className?: string; rotation?: number }> = ({ className, rotation = 0 }) => (
  <svg viewBox="0 0 100 50" className={className} style={{ transform: `rotate(${rotation}deg)` }}>
    <motion.path 
      d="M10,25 Q50,10 85,25" 
      fill="none" 
      stroke="black" 
      strokeWidth="2" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      transition={{ duration: 0.8 }}
    />
    <motion.path 
      d="M75,15 L85,25 L75,35" 
      fill="none" 
      stroke="black" 
      strokeWidth="2" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    />
  </svg>
);

export const ScribbleLine: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 40" className={className}>
    <motion.path 
      d="M10,20 C30,10 50,30 70,20 C90,10 110,30 130,20 C150,10 170,30 190,20" 
      fill="none" 
      stroke="#FF6321" 
      strokeWidth="3" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      transition={{ duration: 1.2 }}
    />
  </svg>
);
