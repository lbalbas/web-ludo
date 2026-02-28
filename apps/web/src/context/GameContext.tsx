import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { GameState } from '../types/game';
import { createInitialGameState } from '../types/game';
import type { PlayerColor } from '../types/game';

const TURN_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// The path index where each player enters their home path.
// The piece has to be past this index to enter.
const HOME_ENTRY_POSITIONS: Record<PlayerColor, number> = {
  red: 50,    // Red enters home path after index 50 (last segment before wrapping)
  green: 11,  // Green enters after index 11
  yellow: 24, // Yellow enters after index 24
  blue: 37,   // Blue enters after index 37
};

// The safe positions on the main path (starts + stars). No captures here.
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

const getNextTurn = (currentTurn: PlayerColor): PlayerColor => {
  const currentIndex = TURN_ORDER.indexOf(currentTurn);
  return TURN_ORDER[(currentIndex + 1) % TURN_ORDER.length];
};

interface GameContextType {
  state: GameState;
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
  _testSetState?: (newState: Partial<GameState>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialGameState());

  const rollDice = () => {
    // Only roll if we are not waiting for something else
    if (state.diceValue !== null) return; 

    const newValue = Math.floor(Math.random() * 6) + 1;
    
    // Check condition outside of setState to avoid StrictMode double-fire
    const hasPiecesOut = Object.values(state.pieces).some(
      p => p.color === state.currentTurn && p.status !== 'home'
    );

    if (newValue !== 6 && !hasPiecesOut) {
      // Set the dice value so the user sees what they rolled
      setState(prev => ({
        ...prev,
        diceValue: newValue,
      }));

      // Then schedule a timeout to skip their turn after a brief delay
      setTimeout(() => {
        setState(s => ({
          ...s,
          diceValue: null,
          currentTurn: getNextTurn(s.currentTurn)
        }));
      }, 1000);
    } else {
      // Normal roll where the player will make a move
      setState(prev => ({
        ...prev,
        diceValue: newValue,
      }));
    }
  };

  const movePiece = (pieceId: string) => {
    setState(prev => {
      const piece = prev.pieces[pieceId];
      if (!piece) return prev; // Piece not found

      // Only allow moving the piece of the player whose turn it is
      if (piece.color !== prev.currentTurn) return prev;

      // Only allow moving if dice has been rolled
      if (prev.diceValue === null) return prev;

      let nextPieces = { ...prev.pieces };
      let moveCompleted = false;

      // Helper to handle collisions at target position
      const handleCollisions = (targetPosition: number, targetStatus: 'path' | 'home-path') => {
        // Safe zones indices on the main path (0-51)
        // Red: 0(start), 8(star). Green: 13(start), 21(star). Yellow: 26(start), 34(star). Blue: 39(start), 47(star).
        const SAFE_POSITIONS_LOCAL = SAFE_POSITIONS;
        
        // Find other pieces at this exact spot
        const piecesAtTarget = Object.values(nextPieces).filter(
          p => p.status === targetStatus && p.position === targetPosition && p.id !== pieceId
        );

        piecesAtTarget.forEach(targetPiece => {
          if (targetPiece.color !== piece.color) {
            // Is it a safe zone on the main path?
            if (targetStatus === 'path' && SAFE_POSITIONS_LOCAL.includes(targetPosition)) {
              // Doing nothing -> pieces safely share the space
              return; 
            }

            // CAPTURE! Opponent piece goes back to home.
            // Find an available home index (0-3) for the captured piece
            const homePieces = Object.values(nextPieces).filter(
              p => p.color === targetPiece.color && p.status === 'home'
            );
            const occupiedHomeIndices = homePieces.map(p => p.position);
            const freeHomeIndex = [0, 1, 2, 3].find(idx => !occupiedHomeIndices.includes(idx)) || 0;
            
            nextPieces[targetPiece.id] = {
              ...targetPiece,
              status: 'home',
              position: freeHomeIndex
            };
          }
          // If same color, do nothing. Our Grid layout inherently stacks them visually using z-index
        });
      };

      // --- LOGIC: Moving out of home ---
      if (piece.status === 'home') {
        if (prev.diceValue === 6) {
          const START_POSITIONS: Record<string, number> = {
            red: 0,
            green: 14,
            yellow: 26,
            blue: 40,
          };
          
          const targetPosition = START_POSITIONS[piece.color];
          
          nextPieces[pieceId] = {
            ...piece,
            status: 'path',
            position: targetPosition,
          };
          
          handleCollisions(targetPosition, 'path');
          moveCompleted = true;
        } else {
          // Cannot move out of home without a 6
          return prev;
        }
      }
      
      // --- LOGIC: Moving on the main path ---
      if (piece.status === 'path' && !moveCompleted) {
        const rawNext = piece.position + prev.diceValue;
        const entryPos = HOME_ENTRY_POSITIONS[piece.color];

        // Check if piece has crossed its home-path entry point
        // The home-path is entered when summing the move would push past the entry index
        const isEnteringHomePath = (
          // Handles normal crossing case (not wrap-around)
          (piece.position <= entryPos && rawNext > entryPos) ||
          // Handles wrap-around case (e.g. red going from 50-> 51 -> 0...)
          (piece.position > entryPos && rawNext > 52 + entryPos)
        );

        if (isEnteringHomePath) {
          // Calculate how many steps into the home path the piece ends up
          const stepsIntoHomePath = rawNext - entryPos - 1;

          if (stepsIntoHomePath >= 5) {
            // Piece reaches the finish (center pocket)!
            nextPieces[pieceId] = { ...piece, status: 'finished', position: 0 };
          } else {
            nextPieces[pieceId] = { ...piece, status: 'home-path', position: stepsIntoHomePath };
          }
        } else {
          const nextPosition = rawNext % 52;
          nextPieces[pieceId] = { ...piece, position: nextPosition };
          handleCollisions(nextPosition, 'path');
        }

        moveCompleted = true;
      }

      // --- LOGIC: Moving on the home path ---
      if (piece.status === 'home-path' && !moveCompleted) {
        // Home path has 5 squares: indices 0-4, where 4 is the center pocket entry
        const HOME_PATH_LENGTH = 5;
        const rawNext = piece.position + prev.diceValue;

        if (rawNext === HOME_PATH_LENGTH - 1) {
          // Lands exactly on the last square — finish!
          nextPieces[pieceId] = { ...piece, status: 'finished', position: 0 };
        } else if (rawNext > HOME_PATH_LENGTH - 1) {
          // Overflow: bounce backwards from the end
          // e.g. at index 3 and rolls 4 -> would go to 7 (overflow by 3) -> bounce to 4-3=1
          const overflow = rawNext - (HOME_PATH_LENGTH - 1);
          const bouncedPosition = (HOME_PATH_LENGTH - 1) - overflow;
          nextPieces[pieceId] = { ...piece, position: Math.max(0, bouncedPosition) };
        } else {
          // Normal advance within home path
          nextPieces[pieceId] = { ...piece, position: rawNext };
        }

        moveCompleted = true;
      }

      if (moveCompleted) {
        const updatedPieces = nextPieces;
        // Check win condition: all 4 pieces finished
        const hasWon = Object.values(updatedPieces).filter(
          p => p.color === prev.currentTurn
        ).every(p => p.status === 'finished');

        if (hasWon) {
          // For now, just reset the game after a short winner announcement
          return {
            ...createInitialGameState(),
            status: 'finished', // signal game over briefly
          };
        }

        return {
          ...prev,
          diceValue: null,
          currentTurn: prev.diceValue === 6 ? prev.currentTurn : getNextTurn(prev.currentTurn),
          pieces: updatedPieces,
        };
      }

      // We will add other movement logic later (like entering home-path)
      return prev;
    });
  };

  const _testSetState = (newState: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  return (
    <GameContext.Provider value={{ state, rollDice, movePiece, _testSetState }}>
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
