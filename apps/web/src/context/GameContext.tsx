import { createContext, useState } from "react";
import type { ReactNode } from "react";
import type { GameState, PlayerColor } from "../types/game";
import { createInitialGameState } from "../types/game";
import { useGameSocket } from "../hooks/useGameSocket";
import { WS_URL } from "../config";

interface GameContextType {
  state: GameState;
  status: "connecting" | "connected" | "disconnected" | "error";
  myColor: PlayerColor | null;
  isMyTurn: boolean;
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
  leaveGame: () => void;
  _testSetState?: (newState: Partial<GameState>) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children, lobbyId }: { children: ReactNode; lobbyId: string | null }) {
  const {
    status,
    gameState: socketGameState,
    myColor,
    sendEvent,
  } = useGameSocket(WS_URL, lobbyId);

  const state = socketGameState ?? createInitialGameState();

  const isMyTurn = myColor !== null && state.currentTurn === myColor;


  const rollDice = () => {
    if (!isMyTurn) return;
    sendEvent("ROLL_DICE");
  };

  const movePiece = (pieceId: string) => {
    if (!isMyTurn) return;
    sendEvent("MOVE_PIECE", { pieceId });
  };

  const [_overrideState, _setOverrideState] = useState<Partial<GameState> | null>(null);
  const effectiveState = _overrideState ? { ...state, ..._overrideState } : state;

  const _testSetState = (newState: Partial<GameState>) => {
    _setOverrideState((prev) => ({ ...prev, ...newState }));
  };

  const leaveGame = () => {
    sendEvent("LEAVE_GAME");
    localStorage.removeItem("my-game-session");
    window.location.reload();
  };

  return (
    <GameContext.Provider
      value={{
        state: effectiveState,
        status,
        myColor,
        isMyTurn,
        rollDice,
        movePiece,
        _testSetState,
        leaveGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
