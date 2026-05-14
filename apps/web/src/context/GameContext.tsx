import { createContext, useState } from "react";
import type { ReactNode } from "react";
import type { GameState, PlayerColor } from "../types/game";
import { createInitialGameState } from "../types/game";
import { useGameSocket } from "../hooks/useGameSocket";
import { useLocalGame } from "../hooks/useLocalGame";

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

export function GameProvider({
  children,
  lobbyId,
}: {
  children: ReactNode;
  lobbyId: string | null;
}) {
  const isLocal = lobbyId === "local-match";

  // --- Online path ---
  // Pass null when in local mode so the socket never connects.
  const {
    status: socketStatus,
    gameState: socketGameState,
    myColor: socketMyColor,
    sendEvent,
  } = useGameSocket(`ws://localhost:8080/ws`, isLocal ? null : lobbyId);

  // --- Local path ---
  // Always called (Rules of Hooks); only active when isLocal is true.
  const {
    state: localState,
    myColor: localMyColor,
    rollDice: localRollDice,
    movePiece: localMovePiece,
    overrideState: localOverrideState,
  } = useLocalGame(isLocal);

  // --- Unified values ---
  const state = isLocal
    ? localState
    : socketGameState ?? createInitialGameState();

  const myColor: PlayerColor | null = isLocal ? localMyColor : socketMyColor;

  const status: GameContextType["status"] = isLocal ? "connected" : socketStatus;

  // In hot-seat mode it is always "your" turn (whoever is sitting can play).
  const isMyTurn = isLocal
    ? true
    : myColor !== null && state.currentTurn === myColor;

  // --- Override state (for tests / dev) ---
  const [_onlineOverride, _setOnlineOverride] = useState<Partial<GameState> | null>(null);
  const effectiveState = isLocal
    ? localState
    : _onlineOverride
    ? { ...state, ..._onlineOverride }
    : state;

  const _testSetState = (patch: Partial<GameState>) => {
    if (isLocal) {
      localOverrideState(patch);
    } else {
      _setOnlineOverride((prev) => ({ ...prev, ...patch }));
    }
  };

  // --- Actions ---
  const rollDice = () => {
    if (isLocal) {
      localRollDice();
    } else {
      if (!isMyTurn) return;
      sendEvent("ROLL_DICE");
    }
  };

  const movePiece = (pieceId: string) => {
    if (isLocal) {
      localMovePiece(pieceId);
    } else {
      if (!isMyTurn) return;
      sendEvent("MOVE_PIECE", { pieceId });
    }
  };

  const leaveGame = () => {
    if (!isLocal) {
      sendEvent("LEAVE_GAME");
      localStorage.removeItem("my-game-session");
      window.location.reload();
    }
    // Local mode: onLeave() in GamePage handles navigation; nothing to clean up here.
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
