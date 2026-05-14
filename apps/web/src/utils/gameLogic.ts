import type { GameState, PlayerColor, PieceData } from "../types/game";
import { createInitialGameState } from "../types/game";

// Mirrors logic.go constants
export const HOME_ENTRY_POSITIONS: Record<PlayerColor, number> = {
  red: 50,
  green: 11,
  yellow: 24,
  blue: 37,
};

export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

const START_POSITIONS: Record<PlayerColor, number> = {
  red: 0,
  green: 14,
  yellow: 26,
  blue: 40,
};

export function getNextTurn(current: PlayerColor): PlayerColor {
  const order: PlayerColor[] = ["red", "green", "yellow", "blue"];
  return order[(order.indexOf(current) + 1) % order.length];
}

// Pure — returns new GameState after rolling. Mirrors GameState.RollDice()
export function rollDiceLogic(state: GameState): GameState {
  if (state.diceValue !== null) return state;

  const val = Math.floor(Math.random() * 6) + 1;

  const hasPiecesOut = Object.values(state.pieces).some(
    (p) => p.color === state.currentTurn && p.status !== "home"
  );

  // No valid moves: skip turn immediately without showing the roll
  if (val !== 6 && !hasPiecesOut) {
    return { ...state, currentTurn: getNextTurn(state.currentTurn) };
  }

  return { ...state, diceValue: val };
}

// Handles sending an opponent's piece back home on collision.
function applyCollisions(
  pieces: Record<string, PieceData>,
  targetPosition: number,
  targetStatus: "path",
  movingPiece: PieceData
): Record<string, PieceData> {
  const updated = { ...pieces };

  for (const id of Object.keys(updated)) {
    const target = updated[id];
    if (
      target.status === targetStatus &&
      target.position === targetPosition &&
      target.id !== movingPiece.id &&
      target.color !== movingPiece.color
    ) {
      if (SAFE_POSITIONS.includes(targetPosition)) continue;

      // Find a free home slot for the captured piece
      const occupiedHome = new Set(
        Object.values(updated)
          .filter((p) => p.color === target.color && p.status === "home")
          .map((p) => p.position)
      );
      let freeSlot = 0;
      for (let i = 0; i < 4; i++) {
        if (!occupiedHome.has(i)) { freeSlot = i; break; }
      }
      updated[id] = { ...target, status: "home", position: freeSlot };
    }
  }
  return updated;
}

// Pure — returns new GameState after moving a piece. Mirrors GameState.MovePiece()
export function movePieceLogic(state: GameState, pieceId: string): GameState {
  const piece = state.pieces[pieceId];
  if (!piece) return state;
  if (piece.color !== state.currentTurn) return state;
  if (state.diceValue === null) return state;

  const diceVal = state.diceValue;
  let pieces = { ...state.pieces };
  let p = { ...piece };
  let moveCompleted = false;

  // --- Home → Path (requires a 6) ---
  if (p.status === "home") {
    if (diceVal !== 6) return state;
    const targetPos = START_POSITIONS[p.color];
    p = { ...p, status: "path", position: targetPos };
    pieces[pieceId] = p;
    pieces = applyCollisions(pieces, targetPos, "path", p);
    moveCompleted = true;
  }

  // --- Path movement ---
  if (p.status === "path" && !moveCompleted) {
    const rawNext = p.position + diceVal;
    const entryPos = HOME_ENTRY_POSITIONS[p.color];

    const isEnteringHomePath =
      (p.position <= entryPos && rawNext > entryPos) ||
      (p.position > entryPos && rawNext > 52 + entryPos);

    if (isEnteringHomePath) {
      const stepsIn = rawNext - entryPos - 1;
      p = stepsIn >= 5
        ? { ...p, status: "finished", position: 0 }
        : { ...p, status: "home-path", position: stepsIn };
    } else {
      const nextPos = rawNext % 52;
      p = { ...p, position: nextPos };
      pieces = applyCollisions(pieces, nextPos, "path", p);
    }
    pieces[pieceId] = p;
    moveCompleted = true;
  }

  // --- Home-path movement (with bounce) ---
  if (p.status === "home-path" && !moveCompleted) {
    const MAX = 4; // index of the final "finished" cell (0-indexed, length 5)
    const rawNext = p.position + diceVal;

    if (rawNext === MAX) {
      p = { ...p, status: "finished", position: 0 };
    } else if (rawNext > MAX) {
      const overflow = rawNext - MAX;
      p = { ...p, position: Math.max(0, MAX - overflow) };
    } else {
      p = { ...p, position: rawNext };
    }
    pieces[pieceId] = p;
    moveCompleted = true;
  }

  if (!moveCompleted) return state;

  // Advance turn (roll a 6 → play again)
  const nextTurn = diceVal !== 6 ? getNextTurn(state.currentTurn) : state.currentTurn;

  // Check win condition
  const finishedCount = Object.values(pieces).filter(
    (q) => q.color === p.color && q.status === "finished"
  ).length;

  if (finishedCount === 4) {
    // Reset board but signal "finished" so the overlay can fire
    return {
      ...createInitialGameState(),
      id: state.id,
      players: state.players,
      status: "finished",
    };
  }

  return { ...state, pieces, currentTurn: nextTurn, diceValue: null };
}
