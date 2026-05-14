const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

export const API_URL = `${API_BASE_URL}/api`;
export const WS_URL = `${WS_BASE_URL}/ws`;
