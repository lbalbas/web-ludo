import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { GameState } from '../types/game';
import { createInitialGameState } from '../types/game';
import type { PlayerColor } from '../types/game';

const TURN_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

const getNextTurn = (currentTurn: PlayerColor): PlayerColor => {
  const currentIndex = TURN_ORDER.indexOf(currentTurn);
  return TURN_ORDER[(currentIndex + 1) % TURN_ORDER.length];
};

interface GameContextType {
  state: GameState;
  rollDice: () => void;
  movePiece: (pieceId: string) => void;
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
        const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];
        
        // Find other pieces at this exact spot
        const piecesAtTarget = Object.values(nextPieces).filter(
          p => p.status === targetStatus && p.position === targetPosition && p.id !== pieceId
        );

        piecesAtTarget.forEach(targetPiece => {
          if (targetPiece.color !== piece.color) {
            // Is it a safe zone on the main path?
            if (targetStatus === 'path' && SAFE_POSITIONS.includes(targetPosition)) {
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
        const nextPosition = (piece.position + prev.diceValue) % 52;

        nextPieces[pieceId] = {
          ...piece,
          position: nextPosition,
        };

        handleCollisions(nextPosition, 'path');
        moveCompleted = true;
      }

      if (moveCompleted) {
        return {
          ...prev,
          diceValue: null, // Consume the dice roll
          currentTurn: prev.diceValue === 6 ? prev.currentTurn : getNextTurn(prev.currentTurn), // 6 gives another roll
          pieces: nextPieces
        };
      }

      // We will add other movement logic later (like entering home-path)
      return prev;
    });
  };

  return (
    <GameContext.Provider value={{ state, rollDice, movePiece }}>
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
