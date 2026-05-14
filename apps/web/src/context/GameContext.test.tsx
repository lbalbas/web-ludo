import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';

import { GameProvider } from '../context/GameContext';
import { useGame } from '../hooks/useGame';
import { createInitialGameState } from '../types/game';
import type { GameState } from '../types/game';
import React from 'react';

// Test harness that exposes GameContext state to the DOM for assertions
// We add more buttons and data-testids to simulate the full game loop
// Test harness that exposes GameContext state to the DOM for assertions
// We add more buttons and data-testids to simulate the full game loop
function TestHarness({
  initialOverride
}: {
  initialOverride?: Partial<GameState>
}) {
  const { state, rollDice, movePiece, _testSetState } = useGame();

  // On mount, if initialOverride is provided, inject it
  React.useEffect(() => {
    if (initialOverride && _testSetState) {
      _testSetState(initialOverride);
    }
  }, []);

  return (
    <div>
      <div data-testid="turn">{state.currentTurn}</div>
      <div data-testid="dice">{state.diceValue ?? ''}</div>
      <div data-testid="status">{state.status}</div>

      {/* Red Pieces */}
      <div data-testid="red-0-status">{state.pieces['red-0']?.status ?? ''}</div>
      <div data-testid="red-0-pos">{state.pieces['red-0']?.position ?? ''}</div>
      <button data-testid="move-red-0" onClick={() => movePiece('red-0')}>Move red-0</button>

      {/* Green Pieces */}
      <div data-testid="green-0-status">{state.pieces['green-0']?.status ?? ''}</div>
      <div data-testid="green-0-pos">{state.pieces['green-0']?.position ?? ''}</div>
      <button data-testid="move-green-0" onClick={() => movePiece('green-0')}>Move green-0</button>
      
      <button data-testid="roll" onClick={rollDice}>Roll</button>
    </div>
  );
}

let randomSpy: MockInstance;

describe('GameContext Phase 1 behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
    vi.useRealTimers();
  });

  it('rolls a 6 and can move a piece out of home (out-of-home path)', async () => {
    randomSpy.mockReturnValue(0.999999); // forces 6
    const { getByTestId } = render(<GameProvider><TestHarness /></GameProvider>);
    fireEvent.click(getByTestId('roll'));
    expect(getByTestId('dice').textContent).toBe('6');
    fireEvent.click(getByTestId('move-red-0'));
    expect(getByTestId('red-0-status').textContent).toBe('path');
    expect(getByTestId('red-0-pos').textContent).toBe('0');
  });

  it('rolls a non-6 and advances turn after timeout when no pieces are out', () => {
    randomSpy.mockReturnValue(0.2); // forces 2
    const { getByTestId } = render(<GameProvider><TestHarness /></GameProvider>);
    fireEvent.click(getByTestId('roll'));
    expect(getByTestId('dice').textContent).toBe('2');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(getByTestId('turn').textContent).toBe('green');
    expect(getByTestId('dice').textContent).toBe('');
  });

  it('captures an opponent piece when landing on their square (not a safe zone)', () => {
    // Setup: Green at pos 5, Red at pos 2, Red's turn, dice is 3 -> Red lands on Green
    const override: Partial<GameState> = {
      currentTurn: 'red',
      diceValue: 3,
      pieces: {
        ...createInitialGameState().pieces,
        'red-0': { id: 'red-0', color: 'red', status: 'path', position: 2 },
        'green-0': { id: 'green-0', color: 'green', status: 'path', position: 5 }
      }
    };
    const { getByTestId } = render(<GameProvider><TestHarness initialOverride={override} /></GameProvider>);
    
    // Move red-0
    fireEvent.click(getByTestId('move-red-0'));
    
    // Red moved to 5
    expect(getByTestId('red-0-status').textContent).toBe('path');
    expect(getByTestId('red-0-pos').textContent).toBe('5');
    
    // Green captured -> sent home
    expect(getByTestId('green-0-status').textContent).toBe('home');
    expect(getByTestId('green-0-pos').textContent).toMatch(/^[0-3]$/);
  });

  it('does NOT capture an opponent piece when landing on a safe zone (star)', () => {
    // Setup: Green at pos 8 (safe zone), Red at pos 5, Red's turn, dice is 3 -> Red lands on Green
    const override: Partial<GameState> = {
      currentTurn: 'red',
      diceValue: 3,
      pieces: {
        ...createInitialGameState().pieces,
        'red-0': { id: 'red-0', color: 'red', status: 'path', position: 5 },
        'green-0': { id: 'green-0', color: 'green', status: 'path', position: 8 }
      }
    };
    const { getByTestId } = render(<GameProvider><TestHarness initialOverride={override} /></GameProvider>);
    
    // Move red-0
    fireEvent.click(getByTestId('move-red-0'));
    
    // Both pieces coexist safely at position 8
    expect(getByTestId('red-0-pos').textContent).toBe('8');
    expect(getByTestId('green-0-status').textContent).toBe('path');
    expect(getByTestId('green-0-pos').textContent).toBe('8');
  });

  it('enters the home path when moving past the entry position', () => {
    // Red enters home path after pos 50.
    // Setup: Red at 48, dice is 4 -> 48 + 4 = 52.  (52 - 50 - 1) = 1 steps into home path
    const override: Partial<GameState> = {
      currentTurn: 'red',
      diceValue: 4,
      pieces: {
        ...createInitialGameState().pieces,
        'red-0': { id: 'red-0', color: 'red', status: 'path', position: 48 },
      }
    };
    const { getByTestId } = render(<GameProvider><TestHarness initialOverride={override} /></GameProvider>);
    
    fireEvent.click(getByTestId('move-red-0'));
    
    expect(getByTestId('red-0-status').textContent).toBe('home-path');
    expect(getByTestId('red-0-pos').textContent).toBe('1');
  });

  it('bounces back (overflow) if roll is larger than needed to finish on home path', () => {
    // Home path indices are 0 to 4. 
    // Setup: Red at home-path pos 3, dice is 4. -> overshoot to 7 -> bounce back to 4 - (7 - 4) = 1
    const override: Partial<GameState> = {
      currentTurn: 'red',
      diceValue: 4,
      pieces: {
        ...createInitialGameState().pieces,
        'red-0': { id: 'red-0', color: 'red', status: 'home-path', position: 3 },
      }
    };
    const { getByTestId } = render(<GameProvider><TestHarness initialOverride={override} /></GameProvider>);
    
    fireEvent.click(getByTestId('move-red-0'));
    
    expect(getByTestId('red-0-status').textContent).toBe('home-path');
    expect(getByTestId('red-0-pos').textContent).toBe('1'); // Bounced back to index 1
  });

  it('triggers win condition and resets the game when final piece finishes', () => {
    // Red needs 1 step from home-path 3 to get to 4 (finish)
    // Three other red pieces are already finished
    const override: Partial<GameState> = {
      currentTurn: 'red',
      diceValue: 1,
      pieces: {
        ...createInitialGameState().pieces,
        'red-0': { id: 'red-0', color: 'red', status: 'home-path', position: 3 },
        'red-1': { id: 'red-1', color: 'red', status: 'finished', position: 0 },
        'red-2': { id: 'red-2', color: 'red', status: 'finished', position: 0 },
        'red-3': { id: 'red-3', color: 'red', status: 'finished', position: 0 },
      }
    };
    const { getByTestId } = render(<GameProvider><TestHarness initialOverride={override} /></GameProvider>);
    
    fireEvent.click(getByTestId('move-red-0'));
    
    // Status flips to 'finished'. 
    // The GameContext logic currently sets status to 'finished' and returns the initial pieces but combined with 'finished'
    // Actually, looking at GameContext.tsx:
    // `return { ...createInitialGameState(), status: 'finished' };`
    // This resets all pieces to `home` and sets status to `finished`.
    expect(getByTestId('status').textContent).toBe('finished');
    expect(getByTestId('red-0-status').textContent).toBe('home'); // Has been reset
    expect(getByTestId('turn').textContent).toBe('red');
  });

});
