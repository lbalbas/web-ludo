# Web-Ludo

A multiplayer online Ludo game designed as a learning / portfolio project. The game allows players to create and join public or private lobbies. In the future, automated matchmaking queues may be implemented.

## Tech Stack Overview
- **Frontend**: A Single Page Application built with **React**, **TypeScript**, and **Vite**.
- **Backend API**: A fast, concurrent **Go** server utilizing the **chi** router.
- **Real-Time Communication**: Extensive use of WebSockets to synchronize and update the game state seamlessly.
- **Database**: **SQLite** via **Turso** for storing lobby and persistent game state.

## Monorepo Architecture
This project uses **PNPM Workspaces** to easily orchestrate both applications side-by-side.

### Directory Structure
```
web-ludo/
├── apps/
│   ├── web/        # Vite + React + TS Frontend
│   └── server/     # Go + chi Backend
├── package.json    # Root npm scripts
├── pnpm-workspace.yaml  
└── .env            # Turso database credentials (template)
```

## Running the Application Locally
To simultaneously start both the frontend and backend in development mode, simply run:

```bash
pnpm install
pnpm dev
```

- The React frontend is usually served on `http://localhost:5173`.
- The Go backend health API responds on `http://localhost:8080/api`.
