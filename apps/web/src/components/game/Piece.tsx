interface PieceProps {
  color: 'red' | 'green' | 'blue' | 'yellow';
  id: string; // Identifier for piece
  onClick?: () => void;
}

export function Piece({ color, onClick }: PieceProps) {
  const colorMap = {
    red: 'from-red-500 to-red-700 shadow-red-500/50 border-red-400',
    green: 'from-green-500 to-green-700 shadow-green-500/50 border-green-400',
    blue: 'from-blue-500 to-blue-700 shadow-blue-500/50 border-blue-400',
    yellow: 'from-yellow-400 to-yellow-600 shadow-yellow-500/50 border-yellow-300',
  };

  const interactiveClasses = onClick
    ? 'cursor-pointer hover:scale-110 active:scale-95'
    : 'cursor-default';

  return (
    <div
      onClick={onClick}
      className={`absolute inset-1 m-auto w-10 h-10 rounded-full bg-gradient-to-br shadow-lg border-2 transition-transform z-10 ${colorMap[color]} ${interactiveClasses}`}
    >
      {/* Glossy highlight effect for the 3D aesthetic */}
      <div className="absolute top-1 left-2 w-4 h-2 bg-white/40 rounded-full rotate-45 blur-[1px]"></div>
    </div>
  );
}
