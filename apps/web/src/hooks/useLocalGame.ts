import { useState, useCallback, useEffect } from "react";
import type { GameState, PlayerColor } from "../types/game";
import { createInitialGameState } from "../types/game";
import { rollDiceLogic, movePieceLogic } from "../utils/gameLogic";

const LOCAL_PLAYERS = [
  { id: "red-player",    color: "red"    as PlayerColor },
  { id: "green-player",  color: "green"  as PlayerColor },
  { id: "yellow-player", color: "yellow" as PlayerColor },
  { id: "blue-player",   color: "blue"   as PlayerColor },
];

function makeInitialLocalState(): GameState {
  return { ...createInitialGameState(), players: LOCAL_PLAYERS };
}

/**
 * Manages a fully client-side hot-seat Ludo game.
 * Always called unconditionally; only active when `isActive` is true.
 */
export function useLocalGame(isActive: boolean) {
  const [state, setState] = useState<GameState>(makeInitialLocalState);

  // After a win the status flips to "finished" so the overlay fires.
  // Auto-reset to a fresh game once the overlay has had time to show.
  useEffect(() => {
    if (!isActive || state.status !== "finished") return;
    const timer = setTimeout(() => setState(makeInitialLocalState()), 4000);
    return () => clearTimeout(timer);
  }, [isActive, state.status]);

  const rollDice = useCallback(() => {
    if (!isActive) return;
    setState((prev) => rollDiceLogic(prev));
  }, [isActive]);

  const movePiece = useCallback((pieceId: string) => {
    if (!isActive) return;
    setState((prev) => movePieceLogic(prev, pieceId));
  }, [isActive]);

  const overrideState = useCallback((patch: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    state,
    // Hot-seat: the "local player" is always whoever's turn it is
    myColor: state.currentTurn,
    rollDice,
    movePiece,
    overrideState,
  };
}
