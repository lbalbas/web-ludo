import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState, PlayerColor } from "../types/game";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface GameEvent {
  type: string;
  payload: any;
}

function getOrCreateSessionId(): string {
  const saved = localStorage.getItem("my-game-session");
  if (saved) return saved;
  const newId = Math.random().toString(36).substring(2, 15);
  localStorage.setItem("my-game-session", newId);
  return newId;
}

export function useGameSocket(baseUrl: string) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myColor, setMyColor] = useState<PlayerColor | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Compute the session ID once and store it in a ref.
  // useRef does NOT accept a lazy initializer — it would store the function
  // itself as .current. We call the helper immediately instead.
  const sessionId = useRef<string>(getOrCreateSessionId());

  const connect = useCallback(() => {
    console.log("Connecting to WebSocket...");
    // Append session ID to the URL
    const url = new URL(baseUrl);
    url.searchParams.set("sessionId", sessionId.current);

    const ws = new WebSocket(url.toString());
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket Connected");
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: GameEvent = JSON.parse(event.data);

        if (data.type === "SYNC_STATE") {
          setGameState(data.payload as GameState);
        }

        if (data.type === "PLAYER_ASSIGNED") {
          const color = (data.payload as { color: PlayerColor }).color;
          console.log("Assigned color:", color);
          setMyColor(color);
        }

        if (data.type === "ERROR") {
          console.error("Server error:", data.payload);
          setStatus("error");
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
      setStatus("disconnected");
      // Don't clear myColor here — the server remembers our session,
      // so after reconnect we'll get PLAYER_ASSIGNED with the same color.
      // Clearing it causes a UI flash and loses context during brief disconnects.

      // Simple reconnection logic
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
          setStatus("connecting");
          connect();
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setStatus("error");
    };
  }, [baseUrl]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [connect]);

  const sendEvent = useCallback((type: string, payload?: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const event: GameEvent = { type, payload };
      socketRef.current.send(JSON.stringify(event));
    } else {
      console.warn("Cannot send event, WebSocket is not open");
    }
  }, []);

  return {
    status,
    gameState,
    myColor,
    sendEvent,
  };
}
