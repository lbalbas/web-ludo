import { useEffect, useState } from "react";
import { API_URL } from "../config";

interface LobbyBrowserProps {
  onJoin: (id: string) => void;
  onClose: () => void;
}

export function LobbyBrowser({ onJoin, onClose }: LobbyBrowserProps) {
  const [lobbies, setLobbies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLobbies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/lobbies`);
      if (!response.ok) throw new Error("Failed to fetch lobbies");
      const data = await response.json();
      setLobbies(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load lobbies. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/10 flex flex-col gap-6 scale-in-center">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h2 className="text-2xl font-bold text-white">Join a Lobby</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="min-h-50 flex flex-col gap-3">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-slate-400 text-sm">
                Searching for matches...
              </span>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={fetchLobbies}
                className="px-4 py-2 rounded-lg bg-white/5 text-white text-xs hover:bg-white/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : lobbies.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-slate-500 text-lg">📭</span>
              <span className="text-slate-400 text-sm">
                No active lobbies found.
              </span>
              <span className="text-slate-500 text-xs">
                Create one to get started!
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
              {lobbies.map((id) => (
                <button
                  key={id}
                  onClick={() => onJoin(id)}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 text-left transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">
                        Lobby ID
                      </span>
                      <span className="text-white font-mono text-sm">
                        {id.substring(0, 8)}...
                      </span>
                    </div>
                    <span className="text-blue-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      JOIN →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={fetchLobbies}
          className="text-xs text-slate-500 hover:text-blue-400 transition-colors self-center"
        >
          Refresh List
        </button>
      </div>
    </div>
  );
}
