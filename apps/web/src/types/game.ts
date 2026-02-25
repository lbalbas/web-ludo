export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type PieceStatus = 'home' | 'path' | 'home-path' | 'finished';

export interface PieceData {
  id: string;
  color: PlayerColor;
  status: PieceStatus;
  position: number; // 0-51 for path, 0-4 for home-path (standard index)
}

export interface PlayerData {
  color: PlayerColor;
  id: string; // User ID or anonymous ID
  isBot?: boolean;
}

export interface GameState {
  id: string;
  players: PlayerData[];
  pieces: Record<string, PieceData>; // Keyed by Piece ID, e.g. "red-0"
  currentTurn: PlayerColor;
  diceValue: number | null;
  status: 'waiting' | 'playing' | 'finished';
}

// Initial state builder
export const createInitialGameState = (): GameState => {
  const pieces: Record<string, PieceData> = {};
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  
  colors.forEach(color => {
    for (let i = 0; i < 4; i++) {
        const id = `${color}-${i}`;
        pieces[id] = { id, color, status: 'home', position: i }; 
        // position 0, 1, 2, 3 in home base logic
    }
  });

  return {
    id: 'local-match',
    players: [], // Add local players here later
    pieces,
    currentTurn: 'red',
    diceValue: null,
    status: 'playing' // Just jump into playing for local
  };
};
