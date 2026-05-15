import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { createInitialGameState } from '../types/game';
import type { GameState } from '../types/game';
import {
  getNextTurn,
  rollDiceLogic,
  movePieceLogic,
  HOME_ENTRY_POSITIONS,
  SAFE_POSITIONS,
} from './gameLogic';

// --- Helpers ---

function freshState(): GameState {
  return { ...createInitialGameState(), players: [] };
}

/** Returns a state with one piece placed at a specific status/position. */
function stateWithPiece(
  color: GameState['currentTurn'],
  pieceIndex: number,
  status: 'home' | 'path' | 'home-path' | 'finished',
  position: number,
  diceValue: number
): GameState {
  const state = freshState();
  state.currentTurn = color;
  state.diceValue = diceValue;

  const id = `${color}-${pieceIndex}`;
  state.pieces[id] = { ...state.pieces[id], status, position };
  return state;
}

// --- getNextTurn ---

describe('getNextTurn', () => {
  it('cycles red → green → yellow → blue → red', () => {
    expect(getNextTurn('red')).toBe('green');
    expect(getNextTurn('green')).toBe('yellow');
    expect(getNextTurn('yellow')).toBe('blue');
    expect(getNextTurn('blue')).toBe('red');
  });
});

// --- rollDiceLogic ---

describe('rollDiceLogic', () => {
  let randomSpy: MockInstance;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('sets diceValue between 1 and 6 when a piece is on the board', () => {
    randomSpy.mockReturnValue(0.5); // forces 4
    const state = freshState();
    state.pieces['red-0'] = { ...state.pieces['red-0'], status: 'path', position: 5 };

    const result = rollDiceLogic(state);
    expect(result.diceValue).toBe(4);
  });

  it('does nothing if dice is already set', () => {
    const state = freshState();
    state.diceValue = 3;

    const result = rollDiceLogic(state);
    expect(result).toBe(state); // same reference — no mutation
  });

  it('skips turn synchronously when all pieces are home and non-6 is rolled', () => {
    randomSpy.mockReturnValue(0.2); // forces 2
    const state = freshState();

    const result = rollDiceLogic(state);
    expect(result.diceValue).toBeNull();
    expect(result.currentTurn).toBe('green');
  });

  it('sets dice to 6 and does NOT skip turn when all pieces are home', () => {
    randomSpy.mockReturnValue(0.999999); // forces 6
    const state = freshState();

    const result = rollDiceLogic(state);
    expect(result.diceValue).toBe(6);
    expect(result.currentTurn).toBe('red');
  });
});

// --- movePieceLogic: guard conditions ---

describe('movePieceLogic — guards', () => {
  it('ignores move for nonexistent piece', () => {
    const state = freshState();
    state.diceValue = 6;
    const result = movePieceLogic(state, 'nonexistent-99');
    expect(result).toBe(state);
  });

  it('ignores move for wrong color', () => {
    const state = freshState();
    state.currentTurn = 'red';
    state.diceValue = 6;
    const result = movePieceLogic(state, 'green-0');
    expect(result.pieces['green-0'].status).toBe('home');
  });

  it('ignores move when dice is null', () => {
    const state = freshState();
    state.diceValue = null;
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].status).toBe('home');
  });

  it('cannot leave home without a 6', () => {
    const state = freshState();
    state.diceValue = 3;
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].status).toBe('home');
  });
});

// --- movePieceLogic: home → path ---

describe('movePieceLogic — out of home', () => {
  it('moves piece to start position on a 6', () => {
    const state = freshState();
    state.diceValue = 6;
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].status).toBe('path');
    expect(result.pieces['red-0'].position).toBe(0); // red start
  });

  it('keeps turn on a 6 (extra roll)', () => {
    const state = freshState();
    state.diceValue = 6;
    const result = movePieceLogic(state, 'red-0');
    expect(result.currentTurn).toBe('red');
    expect(result.diceValue).toBeNull();
  });

  it('uses correct start position per color', () => {
    for (const [color, startPos] of [
      ['red', 0], ['green', 14], ['yellow', 26], ['blue', 40],
    ] as const) {
      const state = freshState();
      state.currentTurn = color;
      state.diceValue = 6;
      const result = movePieceLogic(state, `${color}-0`);
      expect(result.pieces[`${color}-0`].position).toBe(startPos);
    }
  });
});

// --- movePieceLogic: path movement ---

describe('movePieceLogic — path movement', () => {
  it('advances position by dice value', () => {
    const state = stateWithPiece('red', 0, 'path', 5, 3);
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].position).toBe(8);
    expect(result.pieces['red-0'].status).toBe('path');
  });

  it('wraps around position 52', () => {
    const state = stateWithPiece('green', 0, 'path', 50, 4);
    // Green entry is at 11. 50+4=54, not entering home path (50 > 11, 54 < 52+11=63)
    const result = movePieceLogic(state, 'green-0');
    expect(result.pieces['green-0'].position).toBe(2); // 54 % 52 = 2
  });

  it('advances turn on non-6 move', () => {
    const state = stateWithPiece('red', 0, 'path', 5, 2);
    const result = movePieceLogic(state, 'red-0');
    expect(result.currentTurn).toBe('green');
  });

  it('clears dice after move', () => {
    const state = stateWithPiece('red', 0, 'path', 5, 3);
    const result = movePieceLogic(state, 'red-0');
    expect(result.diceValue).toBeNull();
  });
});

// --- movePieceLogic: captures ---

describe('movePieceLogic — captures', () => {
  it('captures opponent piece on normal square', () => {
    const state = stateWithPiece('red', 0, 'path', 2, 3);
    state.pieces['green-0'] = { id: 'green-0', color: 'green', status: 'path', position: 5 };

    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].position).toBe(5);
    expect(result.pieces['green-0'].status).toBe('home');
  });

  it('does NOT capture on a safe position', () => {
    // Position 8 is safe
    const state = stateWithPiece('red', 0, 'path', 5, 3);
    state.pieces['green-0'] = { id: 'green-0', color: 'green', status: 'path', position: 8 };

    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].position).toBe(8);
    expect(result.pieces['green-0'].status).toBe('path');
    expect(result.pieces['green-0'].position).toBe(8);
  });

  it('does NOT capture friendly piece', () => {
    const state = stateWithPiece('red', 0, 'path', 2, 3);
    state.pieces['red-1'] = { id: 'red-1', color: 'red', status: 'path', position: 5 };

    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-1'].status).toBe('path');
    expect(result.pieces['red-1'].position).toBe(5);
  });
});

// --- movePieceLogic: home path ---

describe('movePieceLogic — home path', () => {
  it('enters home path when moving past entry position', () => {
    // Red entry is 50. Red at 48, dice 4. 48+4=52 > 50 → stepsIn = 52-50-1 = 1
    const state = stateWithPiece('red', 0, 'path', 48, 4);
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].status).toBe('home-path');
    expect(result.pieces['red-0'].position).toBe(1);
  });

  it('advances within home path', () => {
    const state = stateWithPiece('red', 0, 'home-path', 1, 2);
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].status).toBe('home-path');
    expect(result.pieces['red-0'].position).toBe(3);
  });

  it('finishes exactly at home path index 4', () => {
    const state = stateWithPiece('red', 0, 'home-path', 3, 1);
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].status).toBe('finished');
  });

  it('bounces back on overshoot', () => {
    // At home-path 3, dice 4 → rawNext=7. overflow=7-4=3, bounced=4-3=1
    const state = stateWithPiece('red', 0, 'home-path', 3, 4);
    const result = movePieceLogic(state, 'red-0');
    expect(result.pieces['red-0'].status).toBe('home-path');
    expect(result.pieces['red-0'].position).toBe(1);
  });
});

// --- movePieceLogic: win condition ---

describe('movePieceLogic — win condition', () => {
  it('triggers win when all 4 pieces finish and resets board', () => {
    const state = stateWithPiece('red', 0, 'home-path', 3, 1);
    // Set other 3 red pieces to finished
    for (let i = 1; i <= 3; i++) {
      state.pieces[`red-${i}`] = {
        id: `red-${i}`, color: 'red', status: 'finished', position: 0,
      };
    }

    const result = movePieceLogic(state, 'red-0');
    expect(result.status).toBe('finished');
    // Board is reset — all pieces back to home
    expect(result.pieces['red-0'].status).toBe('home');
    expect(result.pieces['red-1'].status).toBe('home');
  });

  it('does not trigger win with only 3 finished', () => {
    const state = stateWithPiece('red', 0, 'home-path', 3, 1);
    // Only 2 other finished
    state.pieces['red-1'] = { id: 'red-1', color: 'red', status: 'finished', position: 0 };
    state.pieces['red-2'] = { id: 'red-2', color: 'red', status: 'finished', position: 0 };

    const result = movePieceLogic(state, 'red-0');
    expect(result.status).toBe('playing');
    expect(result.pieces['red-0'].status).toBe('finished');
  });
});
