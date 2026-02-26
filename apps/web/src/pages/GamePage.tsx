import { Board } from '../components/game/Board';
import { GameProvider, useGame } from '../context/GameContext';
import { Dice } from '../components/game/Dice';

interface GamePageProps {
  onLeave: () => void;
}

// Inner component to access context
function GameLayout({ onLeave }: GamePageProps) {
  const { state } = useGame();

  const colorConfig = {
    red: { name: 'Player 1 (Red)', bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500', shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.8)]' },
    green: { name: 'Player 2 (Green)', bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', dot: 'bg-green-500', shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.8)]' },
    yellow: { name: 'Player 3 (Yellow)', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', dot: 'bg-yellow-500', shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.8)]' },
    blue: { name: 'Player 4 (Blue)', bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', dot: 'bg-blue-500', shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.8)]' }
  };

  const activeColor = colorConfig[state.currentTurn];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-hidden bg-slate-900">
      
      {/* Background Decorators */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        
        {/* Left/Top Sidebar (Controls/Stats) */}
        <div className="glass-panel p-6 rounded-2xl w-full lg:w-80 flex flex-col gap-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Local Match
            </h2>
            <button 
              onClick={onLeave}
              className="text-xs px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-white transition-colors border border-red-500/30"
            >
              Leave
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Current Turn</h3>
            <div className={`p-4 rounded-xl ${activeColor.bg} border ${activeColor.border} flex items-center justify-between transition-colors duration-500`}>
              <span className={`font-bold ${activeColor.text}`}>{activeColor.name}</span>
              <div className={`w-4 h-4 rounded-full ${activeColor.dot} ${activeColor.shadow} animate-pulse transition-colors duration-500`}></div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <Dice />
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 w-full max-w-[800px] flex justify-center items-center">
          <Board />
        </div>

      </div>
    </div>
  );
}

export function GamePage({ onLeave }: GamePageProps) {
  return (
    <GameProvider>
      <GameLayout onLeave={onLeave} />
    </GameProvider>
  );
}
