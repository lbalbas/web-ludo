import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { GameState } from '../types/game';
import { createInitialGameState } from '../types/game';

interface GameContextType {
  state: GameState;
  rollDice: () => void;
  // We will add more actions later (like movePiece)
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialGameState());

  const rollDice = () => {
    // Only roll if we are not waiting for something else (to be improved)
    const newValue = Math.floor(Math.random() * 6) + 1;
    setState(prev => ({
      ...prev,
      diceValue: newValue,
    }));
  };

  return (
    <GameContext.Provider value={{ state, rollDice }}>
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
