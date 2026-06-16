# Flappy Cat

A Flappy Bird-style game I vibe coded together with my young nephew. Features a shared multiplayer leaderboard, a coin/wallet system, and a shop with power-ups.

## Features

- Flappy Bird gameplay with a cat
- Rare coin system (Gold: 1pt, Red: 5pts, Blue: 20pts)
- Per-player wallet and shop with power-ups (magnets, nukes, ghost shroom, energy cape, spring boots)
- Shared leaderboard and personal high scores
- Mobile-optimized

## Local Development

```bash
npm install
```

**Production-style run** (Express serves the built frontend):

```bash
npm run build   # bundles the TypeScript frontend into dist/
npm start       # serves API + dist/ on http://localhost:3001
```

**Dev with hot reload** (two terminals):

```bash
npm run dev:server   # API on http://localhost:3001
npm run dev:web      # Vite dev server on http://localhost:5173 (proxies /api)
```

Type-check without emitting: `npm run typecheck`.

## Tech Stack

- Node.js + Express
- SQLite (via `sqlite3`)
- TypeScript frontend (ES modules) bundled with Vite
