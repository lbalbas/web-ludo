import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState } from "../types/game";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface GameEvent {
  type: string;
  payload: any;
}

export function useGameSocket(url: string) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    console.log("Connecting to WebSocket...");
    const ws = new WebSocket(url);
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
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
      setStatus("disconnected");
      // Simple reconnection logic
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setStatus("error");
    };
  }, [url]);

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
    sendEvent,
  };
}
