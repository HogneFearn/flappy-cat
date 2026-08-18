# Flappy Cat — Refactoring & Cleanup Plan

> **Prime directive:** The game must look, feel, sound, and play **exactly** the same
> before and after this work. Every step below is _behavior-preserving_. We change
> _structure_, never _gameplay_. After every phase you do a manual "smoke test" of the
> running game and only continue if it is indistinguishable from the current version.

---

## 1. Where we are today (analysis of the fallow scan)

### 1.1 Architecture as it stands

**Backend** — `server.js` (887 lines)

- Express + SQLite (`sqlite3`) + CORS.
- Serves the `public/` folder statically and exposes a `/api/*` REST surface
  (auth, wallet, inventory, leaderboard, high scores, heartbeat/online count).

**Frontend** — 7 plain scripts loaded in a fixed order in `public/index.html`:

| Order | File             | Lines | Responsibility                                                   |
| ----- | ---------------- | ----- | ---------------------------------------------------------------- |
| 1     | `js/config.js`   | 230   | Global mutable state + shop config + `new Image()` asset loading |
| 2     | `js/canvas.js`   | 72    | `canvas`, `ctx`, `resizeCanvas()`, `getCanvasCoordinates()`      |
| 3     | `js/api.js`      | 509   | `fetch()` wrappers around `/api/*`                               |
| 4     | `js/controls.js` | 656   | touch / click / keyboard handlers                                |
| 5     | `js/game.js`     | 1294  | `update()` loop, spawning, collisions, power-ups                 |
| 6     | `js/draw.js`     | 1368  | `draw()` — all rendering                                         |
| 7     | `js/main.js`     | 346   | bootstrap, auth, `gameLoop()` / `startGame()`                    |

**The core problem:** all 7 files share **one global scope**. `config.js` does
`let player = …; let gameRunning = true; …` and every other file reads and
_reassigns_ those same globals. There are no modules, no imports, and no
encapsulation. This is why:

- The scan reports `draw()` at cognitive complexity **311** and `update()` at **196**.
- Load order is load-bearing and fragile.
- "Strange bugs" appear: any file can mutate any state at any time.

### 1.2 What is actually dead vs. false positives

**Genuinely safe to delete:**

- `old/` — the original monolithic version (`old/game.js` 846 lines + html/css).
  Not referenced by anything that ships.
- `deployment-package/` — a **stale, diverged** copy of the whole app
  (`diff` shows `api.js`, `server.js`, etc. differ from the live `public/`/`server.js`).
  Keeping a second drifting copy is itself a bug source.
- `public/energy_cape.af~lock~` — stray editor/lock artifact.

**False positives in the scan (do NOT act on these):**

- `public/js/*.js` reported as "unused files" — they ARE used; fallow can't see
  `<script>` tags, only ES `import`s. (After this refactor they become real modules
  and the warning disappears for the right reason.)
- `express` / `sqlite3` / `cors` reported as "unused dependencies" — flagged only
  against `deployment-package/package.json`. The root `server.js` genuinely uses
  all three. Deleting `deployment-package/` makes this finding vanish.

### 1.3 Duplication worth removing (from the dupes report)

- `old/game.js` ↔ `public/js/*` — disappears when `old/` is deleted.
- `controls.js`: two ~233-line handlers (`touchstart` vs `click`) that are ~95%
  identical → extract one shared hit-test/dispatch function.
- `server.js`: the session-auth middleware is duplicated (lines ~189 and ~240),
  plus repeated `db.get(... sessions JOIN users ...)` blocks → one `authenticate`
  middleware + small DB helpers.
- `main.js`: login vs signup click handlers are near-identical → one shared handler.
- `game.js`: ghost-shroom activation block and magnet pull block duplicated.

### 1.4 Target end state

- **TypeScript** for type safety (catches a whole class of the "strange bugs").
- **ES modules** with explicit `import`/`export`.
- **Vite** for dev server (HMR + API proxy) and production bundling.
- Mega-functions split into small, single-responsibility units.
- One canonical copy of everything (no `old/`, no `deployment-package/`).
- Express stays as the API + static host; Vite builds the frontend it serves.

---

## 2. Guardrails (read before starting)

1. **Git is your seatbelt.** Commit after every phase. Each phase = one commit (or a
   short-lived branch you merge when the smoke test passes). Never batch two phases.
2. **Smoke test after every phase.** Keep a fixed checklist (see §9) and run through it.
   If anything differs, revert that phase and retry smaller.
3. **No logic edits during structural moves.** When converting a file to a module,
   _move_ code; do not "improve" it in the same step. Refactors of logic happen in
   their own, separate, later steps.
4. **The shared-global trap.** You cannot naively turn `let gameRunning = true` into
   an `export`ed primitive and reassign it from another module — ES module bindings
   are read-only to importers and primitive reassignments don't propagate. The
   behavior-preserving solution is in Phase 3: put all mutable state on a single
   exported `state` object and mutate `state.gameRunning`. This keeps the exact
   "shared mutable global" semantics the game relies on today.
5. **Keep asset URLs identical.** Images are referenced by bare relative names
   (`"cat.png"`, `"cloudy-background.png"`) and sounds by `"sounds/x.mp3"`. Put all of
   them in Vite's `public/` directory so the resolved URLs stay byte-for-byte the same.

---

## 3. Phase 0 — Safety net & baseline

**Goal:** be able to prove "after == before".

1. Ensure a clean git state on a dedicated branch:
   ```bash
   git checkout -b refactor/ts-vite
   git add -A && git commit -m "chore: baseline before refactor"
   ```
2. Record a baseline of the running game:
   - `npm install && npm start`, open `http://localhost:3001`.
   - Walk through the §9 smoke-test checklist and note exact behavior
     (and ideally screen-record it). This is your reference.
3. (Optional but recommended) add `.gitignore` entries for `node_modules`, `dist`,
   `*.db`, `.DS_Store`, `fallow-report.json` if not already ignored.

**Exit criteria:** clean working tree, baseline recording captured.

---

## 4. Phase 1 — Delete dead weight (pure deletion, lowest risk)

**Goal:** shrink the surface area with zero behavior change.

1. Delete the dead/duplicate trees and artifacts:
   ```bash
   git rm -r old deployment-package
   git rm "public/energy_cape.af~lock~"
   ```
2. Search for any stray references to these paths (there should be none):
   ```bash
   grep -rn "deployment-package\|old/game" --include="*.js" --include="*.html" .
   ```
3. `npm start`, run §9 smoke test.

**Exit criteria:** game identical; ~1700+ lines of dead/duplicate code gone.
Commit: `chore: remove dead old/ and stale deployment-package/`.

---

## 5. Phase 2 — Introduce Vite + TypeScript scaffolding (no logic changes)

**Goal:** get the _existing_ code running through Vite + TS as ES modules, with
identical output. This is a mechanical conversion, not a rewrite.

### 5.1 Restructure the frontend into a Vite app

Vite convention: source in `src/`, static passthrough assets in `public/`.

1. Create a `src/` folder for the game code and move the 7 scripts into it
   (renaming `.js` → `.ts`), preserving their current order semantics:
   ```
   src/
     config.ts
     canvas.ts
     api.ts
     controls.ts
     game.ts
     draw.ts
     main.ts        <-- the single ES-module entry point
   ```
2. Keep all binary assets where their URLs resolve unchanged. Move the contents of
   the current `public/` (the PNGs, `sounds/`, `style.css`) so they live under
   Vite's `public/` dir and continue to be served from the site root
   (`/cat.png`, `/sounds/coin.mp3`, `/style.css`). The image `.src = "cat.png"`
   and `"sounds/x.mp3"` strings then still resolve to the same URLs.
3. New `index.html` at the project root (Vite's entry HTML). Body markup is copied
   verbatim from the current `public/index.html`; only the script tags change to a
   single module entry:
   ```html
   <!-- replaces the 7 <script> tags -->
   <script type="module" src="/src/main.ts"></script>
   ```

### 5.2 Wire the modules together (temporary, mechanical)

Because the files still rely on shared globals at this stage, the _minimal_ change to
make them load as one module graph is to have `main.ts` import the others for their
side effects, in the original order:

```ts
// src/main.ts (top of file)
import "./config";
import "./canvas";
import "./api";
import "./controls";
import "./game";
import "./draw";
// ...then the existing main.ts bootstrap code
```

To let the side-effect modules see each other's globals during this transitional
phase, attach the shared symbols to `globalThis` (or `window`). This is ugly and
_temporary_ — Phase 3 replaces it with a proper state module. Do the smallest thing
that compiles and runs.

> Tip: do this one file at a time. Convert `config.ts` first, confirm it loads, then
> the next. Don't convert all 7 in one go.

### 5.3 Tooling config

1. Install dev tooling:
   ```bash
   npm i -D vite typescript @types/node
   ```
2. `tsconfig.json` — start **loose** so the mechanical port compiles, then tighten in
   Phase 6:
   ```jsonc
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "Bundler",
       "strict": false, // tighten later
       "noImplicitAny": false, // tighten later
       "skipLibCheck": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
     },
     "include": ["src"],
   }
   ```
3. `vite.config.ts` — proxy `/api` to Express during dev so relative fetches keep
   working, and build into a folder Express serves in prod:
   ```ts
   import { defineConfig } from "vite";
   export default defineConfig({
     server: {
       port: 5173,
       proxy: { "/api": "http://localhost:3001" },
     },
     build: { outDir: "dist", emptyOutDir: true },
   });
   ```
4. `package.json` scripts:
   ```jsonc
   {
     "scripts": {
       "dev:server": "node server.js", // API on :3001
       "dev:web": "vite", // Vite dev on :5173 (proxies /api)
       "build": "vite build", // emits dist/
       "start": "node server.js", // prod: server serves dist/
     },
   }
   ```
5. Point Express at the built frontend. Change its static root from `public` to
   `dist` (and keep serving the asset `public/` passthrough that Vite copies into
   `dist/`). Run `npm run build` before `npm start` in production.

### 5.4 Verify

- Dev: run `npm run dev:server` and `npm run dev:web`, open `http://localhost:5173`,
  run §9 smoke test.
- Prod-like: `npm run build && npm start`, open `http://localhost:3001`, smoke test.

**Exit criteria:** identical game, now served by Vite/TS, single module entry point.
Commit: `build: migrate frontend to Vite + TypeScript (mechanical, no logic change)`.

---

## 6. Phase 3 — Replace shared globals with a typed state module (the key step)

**Goal:** remove the `globalThis` hack and the load-order fragility _without_ changing
behavior, by centralizing mutable state.

1. Create `src/state.ts` exporting a single mutable object that holds every variable
   currently declared in `config.ts` (player, flags, timers, shop/inventory counts,
   button-coords, etc.), with explicit types:
   ```ts
   export interface Player {
     x: number;
     y: number;
     w: number;
     h: number;
     vx: number;
     vy: number;
     onGround: boolean;
   }
   export const state = {
     player: {
       x: 70,
       y: 300,
       w: 35,
       h: 35,
       vx: 0,
       vy: 0,
       onGround: false,
     } as Player,
     gravity: 0.2,
     jumpPower: -3.5,
     gameSpeed: 2.5,
     gameRunning: true,
     gameStarted: false,
     // ...one field per former global, same initial values...
   };
   ```
2. Mechanically rewrite reads/writes: `gameRunning` → `state.gameRunning`,
   `player.vy = jumpPower` → `state.player.vy = state.jumpPower`, etc. Do this
   **file by file**, smoke-testing after each file. A find/replace per identifier is
   safest; verify each one isn't shadowing a genuine local.
3. Keep truly-constant config (e.g. `availableShopItems`, asset `Image` objects) in
   their own modules (`src/shop.ts`, `src/assets.ts`) and `export` them; import where
   needed.
4. Replace the temporary side-effect imports with real named imports
   (`import { state } from "./state"`, `import { ctx, canvas } from "./canvas"`,
   `import { draw } from "./draw"`, etc.). Remove every `globalThis`/`window` shim.

> Why this works: a single shared object preserves the exact "everyone mutates the
> same state" semantics the game already depends on, while making the dependency
> explicit and type-checked. No timing or ordering behavior changes.

**Exit criteria:** no globals, no `globalThis` shims, game identical.
Commit: `refactor: centralize game state into typed state module`.

---

## 7. Phase 4 — Decompose the mega-functions (behavior-preserving extraction)

**Goal:** bring `draw()`, `update()`, and the `controls` handlers down to readable,
testable sizes. Each extraction is a _pure move_ of a contiguous block into a helper
that takes the values it needs and returns/mutates exactly as before.

Tackle in priority order (matches the scan's "targets"), one helper at a time, smoke
testing between each:

1. **`controls.ts`** (two ~240-line handlers, cognitive 111/110):
   - Extract the shared overlay/shop/button hit-testing into one
     `handlePointer(canvasX, canvasY, source)` used by both `touchstart` and `click`
     (this also removes the 233-line duplication the dupes report flags).
   - Pull each overlay's logic into `handleShopTap`, `handleColorPaletteTap`,
     `handleGameOverButtons`, `handlePowerUpButtons`.
2. **`draw.ts`** (`draw()` 1266 lines, cognitive 311):
   - Split into `drawBackground`, `drawPlayer`, `drawCoins`, `drawObstacles`,
     `drawHUD`, `drawShop`, `drawColorPalette`, `drawLeaderboard`, `drawAuthScreen`,
     `drawGameOver`, `drawStartMessage`, `drawCloseButton`, etc.
     `draw()` becomes a short orchestrator calling them in the same order.
   - Factor the duplicated close-button block into `drawCloseButton()`.
3. **`game.ts`** (`update()` 450 lines, cognitive 196):
   - Extract `updatePlayerPhysics`, `updateObstacles`, `updateCoins`,
     `applyMagnet`, `checkObstacleCollisions`, `checkCoinCollisions`,
     `updatePowerUps`, `updateRocketAndExplosions`.
   - Factor the duplicated ghost-shroom activation and magnet-pull blocks into
     `activateGhostShroom()` and `pullCoin(coin, strength)`.
4. Group related state/functions into cohesive modules if helpful, e.g.
   `src/powerups.ts`, `src/entities.ts`, `src/render/*.ts` — but only move code,
   never change it.

> Rule of thumb: extract → run → eyeball the game → commit. Small commits make any
> regression trivial to bisect.

**Exit criteria:** no function over ~60 lines / cognitive >15 in the hot files; game
identical. Commit per extraction or per file.

---

## 8. Phase 5 — Tidy the backend & Phase 6 — Tighten TypeScript

### 8.1 Phase 5 — `server.js` cleanup (optional `server.ts`)

1. Extract the duplicated session-auth into a single `authenticate(req, res, next)`
   middleware; use it on every protected route.
2. Add small DB helpers (e.g. `getSessionUser(token)`, `getPlayerRow(name)`) to
   remove the repeated `db.get(... sessions JOIN users ...)` blocks.
3. Keep all SQL, routes, and responses byte-identical — this is dedup only.
4. (Optional) convert to `server.ts` compiled with the same TS toolchain, or leave as
   JS. Not required for the frontend goals.
5. Smoke test (auth, leaderboard, wallet, inventory all still work).
   Commit: `refactor(server): single auth middleware + db helpers`.

### 8.2 Phase 6 — Turn the type safety up

1. Flip `tsconfig` to `"strict": true`, `"noImplicitAny": true`,
   `"noUncheckedIndexedAccess": true` (and consider `noUnusedLocals`).
2. Fix the errors that surface — these are exactly the latent "strange bugs"
   (possibly-undefined coords, loose `any` event objects, etc.). Fix by adding types
   and guards, **not** by changing behavior.
3. Add types for API payloads (a shared `src/types.ts`) so `api.ts` responses are
   typed end to end.
   Commit: `chore: enable strict TypeScript and fix surfaced type errors`.

---

## 9. Smoke-test checklist (run after EVERY phase)

Functional parity is verified manually since there are no automated tests today.

- [ ] App loads; auth screen shows; **sign up** a new user works.
- [ ] **Log in** / **log out** works; refresh restores session.
- [ ] Game starts; tap/space makes the cat jump exactly as before.
- [ ] Pipes spawn at the same rate; collision = game over.
- [ ] Coins spawn (gold/red/blue) with correct point values; wallet updates.
- [ ] Shop opens; each item (magnet, gold magnet, mini-nuke, nuke, gold nuke, ghost
      shroom, spring boots, energy cape) purchases and behaves identically.
- [ ] Each power-up's on-screen button, cooldown, and effect/animation is unchanged.
- [ ] Sounds play at the same moments (coin, boom, big-boom, boing).
- [ ] Color palette: cat color selection works and persists.
- [ ] Leaderboard renders, sorts, and shows medals/cat icons identically.
- [ ] Personal high score updates and persists.
- [ ] Online count / heartbeat works.
- [ ] Mobile layout: canvas sizing, touch zones, and pause/rocket/nuke buttons match.
- [ ] Game over screen + "Play Again" / switch-player buttons behave the same.
- [ ] No new console errors.

---

## 10. Suggested commit / PR sequence

1. `chore: baseline before refactor`
2. `chore: remove dead old/ and stale deployment-package/`
3. `build: migrate frontend to Vite + TypeScript (mechanical)`
4. `refactor: centralize game state into typed state module`
5. `refactor(controls): dedupe + split pointer handlers`
6. `refactor(draw): split draw() into render helpers`
7. `refactor(game): split update() into systems`
8. `refactor(server): single auth middleware + db helpers`
9. `chore: enable strict TypeScript`

Each is independently revertible, and the game passes §9 at every step.

---

## 11. Risks & mitigations

| Risk                                            | Mitigation                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| Shared-global reassignment breaks under modules | Phase 3 state object preserves exact semantics; convert file-by-file |
| Asset URLs change under Vite                    | Keep all images/sounds/css in Vite `public/`; URLs stay identical    |
| Dev `/api` calls fail cross-origin              | Vite proxy `/api` → `:3001`                                          |
| Prod serves stale frontend                      | Express serves `dist/`; `npm run build` before `npm start`           |
| Hidden regression during extraction             | Smoke test + commit after each small extraction; bisect if needed    |
| Strict TS reveals real bugs                     | That's the point — fix with types/guards, not behavior changes       |

---

## 12. Definition of done

- `old/` and `deployment-package/` gone; single source of truth.
- Frontend is TypeScript ES modules built by Vite; one `<script type="module">` entry.
- No shared mutable globals; all state flows through `src/state.ts`.
- No function with cognitive complexity > 15 in `draw`/`update`/`controls`.
- `server.js` has one auth middleware and no duplicated DB blocks.
- `tsc --noEmit` passes under `strict`.
- A fresh fallow scan shows the dead-file, duplication, and complexity findings
  resolved (the remaining "unused export" noise is expected for an app entry point).
- **The game is visually and behaviorally identical to the Phase 0 baseline.**
