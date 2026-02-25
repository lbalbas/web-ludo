import React from 'react';
import { Cell } from './Cell';
import type { CellType, PlayerColor } from './Cell';
import { Piece } from './Piece';
import { useGame } from '../../context/GameContext';
import { getPieceCoordinate } from '../../utils/boardCoordinates';

// Helper to determine cell type mathematically strictly based on standard 15x15 Ludo board mapping
function getCellProperties(x: number, y: number): { type: CellType; color: PlayerColor } {
  // Center pocket
  if (x >= 6 && x <= 8 && y >= 6 && y <= 8) return { type: 'center', color: 'none' };
  
  // Base quadrants (6x6 corners)
  if (x < 6 && y < 6) return { type: 'base', color: 'red' };
  if (x > 8 && y < 6) return { type: 'base', color: 'green' };
  if (x < 6 && y > 8) return { type: 'base', color: 'blue' };
  if (x > 8 && y > 8) return { type: 'base', color: 'yellow' };

  // Home Paths
  if (y === 7 && x >= 1 && x <= 5) return { type: 'home-path', color: 'red' };
  if (y === 7 && x >= 9 && x <= 13) return { type: 'home-path', color: 'yellow' }; // Right home path
  if (x === 7 && y >= 1 && y <= 5) return { type: 'home-path', color: 'green' }; // Top home path
  if (x === 7 && y >= 9 && y <= 13) return { type: 'home-path', color: 'blue' }; // Bottom home path

  // Safe zones (Stars)
  if (x === 1 && y === 6) return { type: 'safe', color: 'red' };
  if (x === 2 && y === 8) return { type: 'safe', color: 'none' }; // Neutral safe
  if (x === 6 && y === 1) return { type: 'safe', color: 'none' };
  if (x === 8 && y === 2) return { type: 'safe', color: 'green' };
  if (x === 13 && y === 8) return { type: 'safe', color: 'yellow' };
  if (x === 12 && y === 6) return { type: 'safe', color: 'none' };
  if (x === 8 && y === 13) return { type: 'safe', color: 'none' };
  if (x === 6 && y === 12) return { type: 'safe', color: 'blue' };

  return { type: 'path', color: 'none' };
}

export function Board() {
  const { state, movePiece } = useGame();
  const cells = [];

  // Map pieces by their (x, y) coordinates for quick lookup during rendering
  const pieceLayout: Record<string, React.ReactNode[]> = {};
  Object.values(state.pieces).forEach(piece => {
    const { x, y } = getPieceCoordinate(piece.color, piece.status, piece.position);
    const key = `${x},${y}`;
    if (!pieceLayout[key]) pieceLayout[key] = [];
    pieceLayout[key].push(
      <Piece 
        key={piece.id} 
        color={piece.color} 
        id={piece.id} 
        onClick={() => movePiece(piece.id)} 
      />
    );
  });
  
  // Generate 15x15 board (0-indexed)
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      const { type, color } = getCellProperties(x, y);
      
      const key = `${x},${y}`;
      const piecesAtCell = pieceLayout[key] || [];
      const pieceContent = piecesAtCell.length > 0 ? (
         <div className="relative w-full h-full flex items-center justify-center">
            {piecesAtCell.map((p, i) => (
              <div key={i} className="absolute inset-0" style={{ transform: `translate(${i*4}px, ${-i*4}px)`, zIndex: i }}>
                {p}
              </div>
            ))}
         </div>
      ) : null;

      cells.push(
        <Cell key={`${x}-${y}`} x={x} y={y} type={type} color={color}>
          {pieceContent}
        </Cell>
      );
    }
  }

  return (
    <div className="w-full max-w-[800px] aspect-square p-2 bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 mx-auto">
      <div className="w-full h-full grid grid-cols-15 grid-rows-15 gap-0 box-border rounded-xl overflow-hidden glass-panel">
        {cells}
      </div>
    </div>
  );
}
