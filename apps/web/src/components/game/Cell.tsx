import React from 'react';

export type CellType = 'base' | 'home-path' | 'path' | 'safe' | 'center';
export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow' | 'none';

interface CellProps {
  x: number;
  y: number;
  type: CellType;
  color?: PlayerColor;
  children?: React.ReactNode;
}

export function Cell({ type, color = 'none', children }: CellProps) {
  // Determine standard background coloring based on type and cell color context
  let bgClass = 'bg-white/20 border-white/30'; // default path (brighter)

  if (type === 'base') {
    bgClass = {
      red: 'bg-red-500/40 border-red-500/50',
      green: 'bg-green-500/40 border-green-500/50',
      blue: 'bg-blue-500/40 border-blue-500/50',
      yellow: 'bg-yellow-500/40 border-yellow-500/50',
      none: 'bg-transparent border-transparent'
    }[color] || bgClass;
  } else if (type === 'home-path' || type === 'safe') {
    bgClass = {
      red: 'bg-red-500/70 border-red-500/80',
      green: 'bg-green-500/70 border-green-500/80',
      blue: 'bg-blue-500/70 border-blue-500/80',
      yellow: 'bg-yellow-500/70 border-yellow-500/80',
      none: 'bg-white/50 border-white/60' // Neutral safe zone
    }[color] || bgClass;
  } else if (type === 'center') {
    bgClass = 'bg-slate-800/80 border-slate-600'; // Finish pocket
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center border ${bgClass} transition-colors`}>
      {children}
    </div>
  );
}
