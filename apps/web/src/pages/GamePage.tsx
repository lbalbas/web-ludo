import { useEffect, useRef, useState } from "react";
import { Board } from "../components/game/Board";
import { GameProvider, useGame } from "../context/GameContext";
import { Dice } from "../components/game/Dice";

interface GamePageProps {
  onLeave: () => void;
}

// Inner component to access context
function GameLayout({ onLeave }: GamePageProps) {
  const { state, status, myColor, isMyTurn } = useGame();

  const colorConfig = {
    red: {
      name: "Red",
      bg: "bg-red-500/20",
      border: "border-red-500/40",
      text: "text-red-400",
      dot: "bg-red-500",
      shadow: "shadow-[0_0_10px_rgba(239,68,68,0.8)]",
    },
    green: {
      name: "Green",
      bg: "bg-green-500/20",
      border: "border-green-500/40",
      text: "text-green-400",
      dot: "bg-green-500",
      shadow: "shadow-[0_0_10px_rgba(34,197,94,0.8)]",
    },
    yellow: {
      name: "Yellow",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/40",
      text: "text-yellow-400",
      dot: "bg-yellow-500",
      shadow: "shadow-[0_0_10px_rgba(234,179,8,0.8)]",
    },
    blue: {
      name: "Blue",
      bg: "bg-blue-500/20",
      border: "border-blue-500/40",
      text: "text-blue-400",
      dot: "bg-blue-500",
      shadow: "shadow-[0_0_10px_rgba(59,130,246,0.8)]",
    },
  };

  const activeColor = colorConfig[state.currentTurn];

  const [winner, setWinner] = useState<string | null>(null);
  const prevTurnRef = useRef(state.currentTurn);

  // When status flips to 'finished', the state has already reset (currentTurn is back to 'red').
  // So we capture the winner name from the *previous* turn via a ref.
  useEffect(() => {
    if (state.status === "finished" && winner === null) {
      setWinner(colorConfig[prevTurnRef.current].name);
      const timer = setTimeout(() => setWinner(null), 3500);
      return () => clearTimeout(timer);
    }
    // Track previous turn whenever it changes
    if (state.status === "playing") {
      prevTurnRef.current = state.currentTurn;
    }
  }, [state.status, state.currentTurn]);

  // Connection status indicator
  const statusConfig = {
    connecting: {
      label: "Connecting…",
      color: "text-yellow-400",
      dot: "bg-yellow-400",
    },
    connected: {
      label: "Connected",
      color: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    disconnected: {
      label: "Disconnected",
      color: "text-red-400",
      dot: "bg-red-400",
    },
    error: { label: "Error", color: "text-red-400", dot: "bg-red-400" },
  };
  const connStatus = statusConfig[status];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-hidden bg-slate-900">
      {/* Winner Overlay */}
      {winner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center p-10 rounded-3xl bg-slate-800/90 border border-white/20 shadow-2xl animate-bounce">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-4xl font-black text-white mb-2">{winner}</h2>
            <p className="text-slate-400 text-lg">wins the game!</p>
          </div>
        </div>
      )}

      {/* Background Decorators */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        {/* Left/Top Sidebar (Controls/Stats) */}
        <div className="glass-panel p-6 rounded-2xl w-full lg:w-80 flex flex-col gap-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Online Match
            </h2>
            <button
              onClick={onLeave}
              className="text-xs px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-white transition-colors border border-red-500/30"
            >
              Leave
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${connStatus.dot} animate-pulse`}
            ></div>
            <span className={connStatus.color}>{connStatus.label}</span>
          </div>

          {/* Your Color Badge */}
          {myColor && (
            <div
              className={`p-3 rounded-xl ${colorConfig[myColor].bg} border ${colorConfig[myColor].border} flex items-center gap-3`}
            >
              <div
                className={`w-5 h-5 rounded-full ${colorConfig[myColor].dot}`}
              ></div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  You are
                </div>
                <div className={`font-bold ${colorConfig[myColor].text}`}>
                  {colorConfig[myColor].name}
                </div>
              </div>
            </div>
          )}

          {/* Player Roster */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Players ({state.players.length}/4)
            </h3>
            {(["red", "green", "blue", "yellow"] as const).map((color) => {
              const player = state.players.find((p) => p.color === color);
              const isTurn = state.currentTurn === color;
              const isMe = myColor === color;
              const cfg = colorConfig[color];

              return (
                <div
                  key={color}
                  className={`p-2.5 rounded-lg flex items-center justify-between transition-all duration-300
                    ${player ? `${cfg.bg} border ${cfg.border}` : "bg-white/5 border border-white/5"}
                    ${isTurn ? "ring-1 ring-white/30" : ""}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${player ? cfg.dot : "bg-slate-600"}`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${player ? cfg.text : "text-slate-600"}`}
                    >
                      {player ? cfg.name : `${cfg.name} (empty)`}
                    </span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-medium">
                        YOU
                      </span>
                    )}
                  </div>
                  {isTurn && player && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white font-medium animate-pulse">
                      TURN
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Turn Indicator */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Current Turn
            </h3>
            <div
              className={`p-4 rounded-xl ${activeColor.bg} border ${activeColor.border} flex items-center justify-between transition-colors duration-500`}
            >
              <span className={`font-bold ${activeColor.text}`}>
                {activeColor.name}
                {isMyTurn && (
                  <span className="text-white/60 text-sm ml-2">
                    (your turn!)
                  </span>
                )}
              </span>
              <div
                className={`w-4 h-4 rounded-full ${activeColor.dot} ${activeColor.shadow} animate-pulse transition-colors duration-500`}
              ></div>
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
