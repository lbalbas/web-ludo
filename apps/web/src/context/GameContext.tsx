import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { GameState, PlayerColor } from "../types/game";
import { createInitialGameState } from "../types/game";
import { useGameSocket } from "../hooks/useGameSocket";

interface GameContextType {
  state: GameState;
  status: "connecting" | "connected" | "disconnected" | "error";
  myColor: PlayerColor | null;
  isMyTurn: boolean;
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
  _testSetState?: (newState: Partial<GameState>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialGameState());
  const sessionId = useRef<string | null>(
    localStorage.getItem("my-game-session"),
  );

  const {
    status,
    gameState: socketGameState,
    myColor,
    sendEvent,
  } = useGameSocket(
    `ws://localhost:8080/ws?sessionId=${sessionId.current || ""}`,
  );

  useEffect(() => {
    if (socketGameState) {
      setState(socketGameState);
    }
  }, [socketGameState]);

  const isMyTurn = myColor !== null && state.currentTurn === myColor;

  const rollDice = () => {
    if (!isMyTurn) return;
    sendEvent("ROLL_DICE");
  };

  const movePiece = (pieceId: string) => {
    if (!isMyTurn) return;
    sendEvent("MOVE_PIECE", { pieceId });
  };

  const _testSetState = (newState: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  return (
    <GameContext.Provider
      value={{
        state,
        status,
        myColor,
        isMyTurn,
        rollDice,
        movePiece,
        _testSetState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
