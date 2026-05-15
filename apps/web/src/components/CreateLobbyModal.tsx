import { useState } from "react";
import { API_URL } from "../config";

interface CreateLobbyModalProps {
  onJoin: (lobbyId: string) => void;
  onClose: () => void;
}

export function CreateLobbyModal({ onJoin, onClose }: CreateLobbyModalProps) {
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After creation of a private lobby, we show the share screen
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [createdLobbyId, setCreatedLobbyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const url = isPrivate
        ? `${API_URL}/lobbies?private=true`
        : `${API_URL}/lobbies`;
      const response = await fetch(url, { method: "POST" });
      if (!response.ok) throw new Error("Failed to create lobby");
      const lobbyId = await response.text();

      if (isPrivate) {
        // Build the shareable link and show the share screen
        const link = `${window.location.origin}${window.location.pathname}?lobby=${lobbyId}`;
        setShareLink(link);
        setCreatedLobbyId(lobbyId);
      } else {
        // Public lobby → join immediately
        onJoin(lobbyId);
      }
    } catch (err) {
      console.error("Error creating lobby:", err);
      setError("Could not create lobby. Is the server running?");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const input = document.createElement("input");
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Share Screen ──
  if (shareLink && createdLobbyId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/10 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h2 className="text-2xl font-bold text-white">
              Share this link
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-400 text-sm">
            Send this link to your friends — only players with the link can
            join this private lobby.
          </p>

          {/* Link display */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-sm text-blue-300 break-all select-all">
            {shareLink}
          </div>

          <button
            onClick={handleCopy}
            className="px-6 py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <span>✓</span> Copied!
              </>
            ) : (
              <>
                <span>📋</span> Copy Link
              </>
            )}
          </button>

          <button
            onClick={() => onJoin(createdLobbyId)}
            className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 transform hover:-translate-y-1 transition-all text-lg border border-blue-400/30"
          >
            Join Lobby →
          </button>
        </div>
      </div>
    );
  }

  // ── Create Screen ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/10 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h2 className="text-2xl font-bold text-white">Create a Lobby</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Private toggle */}
        <button
          onClick={() => setIsPrivate((v) => !v)}
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            isPrivate
              ? "bg-indigo-500/15 border-indigo-500/40"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{isPrivate ? "🔒" : "🌐"}</span>
            <div className="text-left">
              <div
                className={`font-bold text-sm ${
                  isPrivate ? "text-indigo-300" : "text-white"
                }`}
              >
                {isPrivate ? "Private Lobby" : "Public Lobby"}
              </div>
              <div className="text-slate-500 text-xs">
                {isPrivate
                  ? "Only players with the link can join"
                  : "Visible to everyone in the lobby browser"}
              </div>
            </div>
          </div>
          {/* Toggle pill */}
          <div
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              isPrivate ? "bg-indigo-500" : "bg-white/20"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isPrivate ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </button>

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 transform hover:-translate-y-1 transition-all text-lg border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {creating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </span>
          ) : (
            "Create Lobby"
          )}
        </button>
      </div>
    </div>
  );
}
