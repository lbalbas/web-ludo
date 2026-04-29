import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { GameState } from '../types/game';
import { createInitialGameState } from '../types/game';
import type { PlayerColor } from '../types/game';
import { useGameSocket } from '../hooks/useGameSocket';


interface GameContextType {
  state: GameState;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
  _testSetState?: (newState: Partial<GameState>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialGameState());
  const { status, gameState: socketGameState, sendEvent } = useGameSocket('ws://localhost:8080/ws');

  useEffect(() => {
    if (socketGameState) {
      setState(socketGameState);
    }
  }, [socketGameState]);

  const rollDice = () => {
    sendEvent('ROLL_DICE');
  };

  const movePiece = (pieceId: string) => {
    sendEvent('MOVE_PIECE', { pieceId });
  };

  const _testSetState = (newState: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  return (
    <GameContext.Provider value={{ state, status, rollDice, movePiece, _testSetState }}>
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
