import type { PlayerColor, PieceStatus } from '../types/game';

interface Coordinate {
  x: number;
  y: number;
}

// Helper: home positions mapped out per player color
// Each player has 4 pieces, here are their (x, y) starting coords on a 15x15 board
const HomeCoordinates: Record<PlayerColor, Coordinate[]> = {
  red:    [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
  green:  [{ x: 11, y: 2 }, { x: 12, y: 2 }, { x: 11, y: 3 }, { x: 12, y: 3 }],
  yellow: [{ x: 11, y: 11 }, { x: 12, y: 11 }, { x: 11, y: 12 }, { x: 12, y: 12 }],
  blue:   [{ x: 2, y: 11 }, { x: 3, y: 11 }, { x: 2, y: 12 }, { x: 3, y: 12 }],
};

// 52-step global path. Index 0 is starting point for Red.
// Moves clockwise.
// We hardcode the coordinates corresponding to the standard 15x15 Ludo layout.
const PathCoordinates: Coordinate[] = [
  // Red start path (0-4)
  {x: 1, y: 6}, {x: 2, y: 6}, {x: 3, y: 6}, {x: 4, y: 6}, {x: 5, y: 6},
  // Going up towards green (5-10)
  {x: 6, y: 5}, {x: 6, y: 4}, {x: 6, y: 3}, {x: 6, y: 2}, {x: 6, y: 1}, {x: 6, y: 0},
  // Across green top (11-12)
  {x: 7, y: 0}, {x: 8, y: 0},
  // Down green side (13-17)
  {x: 8, y: 1}, {x: 8, y: 2}, {x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 5},
  // Right towards yellow (18-23)
  {x: 9, y: 6}, {x: 10, y: 6}, {x: 11, y: 6}, {x: 12, y: 6}, {x: 13, y: 6}, {x: 14, y: 6},
  // Down yellow right side (24-25)
  {x: 14, y: 7}, {x: 14, y: 8},
  // Left towards blue (26-30)
  {x: 13, y: 8}, {x: 12, y: 8}, {x: 11, y: 8}, {x: 10, y: 8}, {x: 9, y: 8},
  // Down towards blue bottom (31-36)
  {x: 8, y: 9}, {x: 8, y: 10}, {x: 8, y: 11}, {x: 8, y: 12}, {x: 8, y: 13}, {x: 8, y: 14},
  // Across blue bottom (37-38)
  {x: 7, y: 14}, {x: 6, y: 14},
  // Up blue side (39-43)
  {x: 6, y: 13}, {x: 6, y: 12}, {x: 6, y: 11}, {x: 6, y: 10}, {x: 6, y: 9},
  // Left towards red (44-49)
  {x: 5, y: 8}, {x: 4, y: 8}, {x: 3, y: 8}, {x: 2, y: 8}, {x: 1, y: 8}, {x: 0, y: 8},
  // Up red left side (50-51)
  {x: 0, y: 7}, {x: 0, y: 6}, // Wraps back to 0!
];

// Each player has a 5-step home path. Index 0 is closest to board edge, 4 is inner.
const HomePathCoordinates: Record<PlayerColor, Coordinate[]> = {
  red:    [{x: 1, y: 7}, {x: 2, y: 7}, {x: 3, y: 7}, {x: 4, y: 7}, {x: 5, y: 7}],
  green:  [{x: 7, y: 1}, {x: 7, y: 2}, {x: 7, y: 3}, {x: 7, y: 4}, {x: 7, y: 5}],
  yellow: [{x: 13, y: 7}, {x: 12, y: 7}, {x: 11, y: 7}, {x: 10, y: 7}, {x: 9, y: 7}],
  blue:   [{x: 7, y: 13}, {x: 7, y: 12}, {x: 7, y: 11}, {x: 7, y: 10}, {x: 7, y: 9}],
};

export function getPieceCoordinate(color: PlayerColor, status: PieceStatus, position: number): Coordinate {
  if (status === 'home') {
    return HomeCoordinates[color][position % 4];
  } 
  if (status === 'path') {
    return PathCoordinates[position % 52];
  }
  if (status === 'home-path') {
    return HomePathCoordinates[color][Math.min(position, 4)];
  }
  // status === 'finished' - just hide them or put them in center
  return { x: 7, y: 7 };
}
