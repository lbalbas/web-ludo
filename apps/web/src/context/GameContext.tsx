import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { GameState } from '../types/game';
import { createInitialGameState } from '../types/game';

interface GameContextType {
  state: GameState;
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialGameState());

  const rollDice = () => {
    // Only roll if we are not waiting for something else (to be improved)
    if (state.diceValue !== null) return; // Prevent rolling if a move is pending
    const newValue = Math.floor(Math.random() * 6) + 1;
    setState(prev => ({
      ...prev,
      diceValue: newValue,
    }));
  };

  const movePiece = (pieceId: string) => {
    setState(prev => {
      const piece = prev.pieces[pieceId];
      if (!piece) return prev; // Piece not found

      // Only allow moving the piece of the player whose turn it is
      if (piece.color !== prev.currentTurn) return prev;

      // Only allow moving if dice has been rolled
      if (prev.diceValue === null) return prev;

      // --- LOGIC: Moving out of home ---
      if (piece.status === 'home') {
        if (prev.diceValue === 6) {
          const START_POSITIONS: Record<string, number> = {
            red: 0,
            green: 13,
            yellow: 26,
            blue: 39,
          };
          
          return {
            ...prev,
            diceValue: null, // Consume the dice roll
            pieces: {
              ...prev.pieces,
              [pieceId]: {
                ...piece,
                status: 'path',
                position: START_POSITIONS[piece.color],
              }
            }
          };
        } else {
          // Cannot move out of home without a 6
          return prev;
        }
      }

      // We will add other movement logic later
      return prev;
    });
  };

  return (
    <GameContext.Provider value={{ state, rollDice, movePiece }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
