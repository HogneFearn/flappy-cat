import { Hono } from "hono";
import type { Context, Next } from "hono";

export type Bindings = {
  DB: D1Database;
  TEST_ADMIN_USER?: string;
};

type Variables = {
  user: { id: number; username: string };
};

// A session is "online" if its last_seen is within this window (was a 3-minute
// in-memory timeout in the old Express server; now derived from D1).
const ONLINE_WINDOW = "-3 minutes";

const VALID_COLORS = [
  "gray",
  "blue",
  "brown",
  "cyan",
  "fire",
  "galaxy",
  "green",
  "ice",
  "lime",
  "magenta",
  "orange",
  "pink",
  "purple",
  "rainbow",
  "red",
  "yellow",
];

// ---- crypto helpers (Web Crypto) -----------------------------------------
// hashPassword matches Node's crypto.pbkdf2Sync(password, salt, 10000, 64,
// "sha512").toString("hex") from the old server, so hashes stay compatible if
// existing user rows are ever imported into D1.

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 10000,
      hash: "SHA-512",
    },
    key,
    512,
  );
  return toHex(bits);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function expiresInDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

// Reject non-integer / negative / absurd values from the client. This does not
// stop a determined cheat (the game is scored client-side) but caps the blast
// radius, e.g. no wallet = 1e308 or negative leaderboard entries.
const MAX_INT = 1_000_000_000_000;

function toInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isInteger(n) || n < 0 || n > MAX_INT) return null;
  return n;
}

function clampInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.trunc(n), 0), MAX_INT);
}

async function onlineCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) AS count FROM sessions
       WHERE last_seen IS NOT NULL AND last_seen > datetime('now', ?)`,
    )
    .bind(ONLINE_WINDOW)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

// ---- app ------------------------------------------------------------------

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath(
  "/api",
);

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// Shared session auth. When `track` is set, keeps the session marked online.
function auth(track: boolean) {
  return async (c: AppContext, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "No valid session token provided" }, 401);
    }
    const token = authHeader.slice(7);
    const row = await c.env.DB.prepare(
      `SELECT s.user_id, u.username FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = ? AND s.expires_at > datetime('now')`,
    )
      .bind(token)
      .first<{ user_id: number; username: string }>();

    if (!row) {
      if (track) {
        await c.env.DB.prepare(
          "UPDATE sessions SET last_seen = NULL WHERE session_token = ?",
        )
          .bind(token)
          .run();
      }
      return c.json({ error: "Invalid or expired session" }, 401);
    }

    c.set("user", { id: row.user_id, username: row.username });

    if (track) {
      await c.env.DB.prepare(
        "UPDATE sessions SET last_seen = datetime('now') WHERE session_token = ?",
      )
        .bind(token)
        .run();
    }

    await next();
  };
}

// ---- presence -------------------------------------------------------------

app.post("/heartbeat", auth(true), async (c) => {
  return c.json({
    success: true,
    onlineCount: await onlineCount(c.env.DB),
    message: "Heartbeat received",
  });
});

app.get("/online-count", async (c) => {
  return c.json({ count: await onlineCount(c.env.DB) });
});

// ---- auth -----------------------------------------------------------------

app.post("/auth/signup", async (c) => {
  const { username, password } = await c.req.json().catch(() => ({}) as any);

  if (!username || !password) {
    return c.json({ error: "Username and password are required" }, 400);
  }
  if (username.length < 3 || password.length < 6) {
    return c.json(
      {
        error:
          "Username must be at least 3 characters and password at least 6 characters",
      },
      400,
    );
  }

  const salt = randomHex(32);
  const passwordHash = await hashPassword(password, salt);

  let userId: number;
  try {
    const res = await c.env.DB.prepare(
      "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
    )
      .bind(username, passwordHash, salt)
      .run();
    userId = res.meta.last_row_id as number;
  } catch (e) {
    if (String((e as Error).message).includes("UNIQUE")) {
      return c.json({ error: "Username already exists" }, 409);
    }
    return c.json({ error: "Could not create account" }, 500);
  }

  const sessionToken = randomHex(64);
  const expiresAt = expiresInDays(30);

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO sessions (user_id, session_token, expires_at, last_seen) VALUES (?, ?, ?, datetime('now'))",
    ).bind(userId, sessionToken, expiresAt),
    c.env.DB.prepare("INSERT INTO players (name, wallet) VALUES (?, 0)").bind(
      username,
    ),
    c.env.DB.prepare(
      "INSERT INTO player_inventory (player_name, magnet_rounds_left, mini_nuke_count, nuke_count, gold_magnet_rounds_left) VALUES (?, 0, 0, 0, 0)",
    ).bind(username),
    c.env.DB.prepare(
      "INSERT INTO player_high_scores (player_name, high_score) VALUES (?, 0)",
    ).bind(username),
  ]);

  return c.json({
    success: true,
    sessionToken,
    username,
    message: "Account created successfully",
  });
});

app.post("/auth/login", async (c) => {
  const { username, password } = await c.req.json().catch(() => ({}) as any);

  if (!username || !password) {
    return c.json({ error: "Username and password are required" }, 400);
  }

  const row = await c.env.DB.prepare(
    "SELECT id, username, password_hash, salt FROM users WHERE username = ?",
  )
    .bind(username)
    .first<{
      id: number;
      username: string;
      password_hash: string;
      salt: string;
    }>();

  if (!row) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const passwordHash = await hashPassword(password, row.salt);
  if (!timingSafeEqualHex(passwordHash, row.password_hash)) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const sessionToken = randomHex(64);
  const expiresAt = expiresInDays(30);

  await c.env.DB.batch([
    // Mark this user's other sessions offline (replaces onlineUsers cleanup).
    c.env.DB.prepare(
      "UPDATE sessions SET last_seen = NULL WHERE user_id = ?",
    ).bind(row.id),
    c.env.DB.prepare(
      "DELETE FROM sessions WHERE user_id = ? AND expires_at < datetime('now')",
    ).bind(row.id),
    c.env.DB.prepare(
      "INSERT INTO sessions (user_id, session_token, expires_at, last_seen) VALUES (?, ?, ?, datetime('now'))",
    ).bind(row.id, sessionToken, expiresAt),
  ]);

  return c.json({
    success: true,
    sessionToken,
    username: row.username,
    message: "Login successful",
  });
});

app.post("/auth/validate", async (c) => {
  const { sessionToken } = await c.req.json().catch(() => ({}) as any);

  if (!sessionToken) {
    return c.json({ error: "Session token is required" }, 400);
  }

  const row = await c.env.DB.prepare(
    `SELECT s.user_id, u.username FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.session_token = ? AND s.expires_at > datetime('now')`,
  )
    .bind(sessionToken)
    .first<{ user_id: number; username: string }>();

  if (!row) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  return c.json({ success: true, username: row.username });
});

app.post("/auth/logout", auth(true), async (c) => {
  const token = c.req.header("Authorization")!.slice(7);
  await c.env.DB.prepare("DELETE FROM sessions WHERE session_token = ?")
    .bind(token)
    .run();
  return c.json({ success: true, message: "Logged out successfully" });
});

app.post("/auth/logout-beacon", async (c) => {
  const { sessionToken } = await c.req.json().catch(() => ({}) as any);
  if (!sessionToken) {
    return c.json({ success: false, message: "No session token provided" });
  }
  await c.env.DB.prepare("DELETE FROM sessions WHERE session_token = ?")
    .bind(sessionToken)
    .run();
  return c.json({ success: true, message: "Logged out successfully" });
});

// ---- player wallet --------------------------------------------------------

app.get("/player/wallet", auth(true), async (c) => {
  const name = c.get("user").username;

  // Test admin always gets a fresh 1,000,000 wallet.
  if (c.env.TEST_ADMIN_USER && name === c.env.TEST_ADMIN_USER) {
    const amount = 1000000;
    await c.env.DB.prepare(
      "INSERT OR REPLACE INTO players (name, wallet) VALUES (?, ?)",
    )
      .bind(name, amount)
      .run();
    return c.json({ wallet: amount });
  }

  const row = await c.env.DB.prepare(
    "SELECT wallet FROM players WHERE name = ?",
  )
    .bind(name)
    .first<{ wallet: number }>();

  if (row) return c.json({ wallet: row.wallet });

  await c.env.DB.prepare("INSERT INTO players (name, wallet) VALUES (?, 0)")
    .bind(name)
    .run();
  return c.json({ wallet: 0 });
});

app.post("/player/wallet", auth(true), async (c) => {
  const name = c.get("user").username;
  const { wallet } = await c.req.json();
  const value = toInt(wallet);
  if (value === null) {
    return c.json({ error: "Invalid wallet value" }, 400);
  }
  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO players (name, wallet) VALUES (?, ?)",
  )
    .bind(name, value)
    .run();
  return c.json({ success: true, wallet: value });
});

// ---- player inventory -----------------------------------------------------

app.get("/player/inventory", auth(true), async (c) => {
  const name = c.get("user").username;

  const row = await c.env.DB.prepare(
    "SELECT magnet_rounds_left, mini_nuke_count, nuke_count, gold_nuke_count, gold_magnet_rounds_left, ghost_shroom_count, energy_cape_rounds_left FROM player_inventory WHERE player_name = ?",
  )
    .bind(name)
    .first<Record<string, number>>();

  if (row) {
    return c.json({
      magnetRoundsLeft: row.magnet_rounds_left,
      miniNukeCount: row.mini_nuke_count || 0,
      nukeCount: row.nuke_count || 0,
      goldNukeCount: row.gold_nuke_count || 0,
      goldMagnetRoundsLeft: row.gold_magnet_rounds_left || 0,
      ghostShroomCount: row.ghost_shroom_count || 0,
    });
  }

  await c.env.DB.prepare(
    "INSERT INTO player_inventory (player_name, magnet_rounds_left, mini_nuke_count, nuke_count, gold_nuke_count, gold_magnet_rounds_left, ghost_shroom_count) VALUES (?, 0, 0, 0, 0, 0, 0)",
  )
    .bind(name)
    .run();

  return c.json({
    magnetRoundsLeft: 0,
    miniNukeCount: 0,
    nukeCount: 0,
    goldNukeCount: 0,
    goldMagnetRoundsLeft: 0,
    ghostShroomCount: 0,
  });
});

app.post("/player/inventory", auth(true), async (c) => {
  const name = c.get("user").username;
  const b = await c.req.json();
  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO player_inventory (player_name, magnet_rounds_left, mini_nuke_count, nuke_count, gold_nuke_count, gold_magnet_rounds_left, ghost_shroom_count, energy_cape_rounds_left, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
  )
    .bind(
      name,
      clampInt(b.magnetRoundsLeft),
      clampInt(b.miniNukeCount),
      clampInt(b.nukeCount),
      clampInt(b.goldNukeCount),
      clampInt(b.goldMagnetRoundsLeft),
      clampInt(b.ghostShroomCount),
      clampInt(b.energyCapeRoundsLeft),
    )
    .run();
  return c.json({ success: true, magnetRoundsLeft: clampInt(b.magnetRoundsLeft) });
});

// ---- player high score & color -------------------------------------------

app.get("/player/highscore", auth(true), async (c) => {
  const name = c.get("user").username;
  const row = await c.env.DB.prepare(
    "SELECT high_score FROM player_high_scores WHERE player_name = ?",
  )
    .bind(name)
    .first<{ high_score: number }>();
  return c.json({ highScore: row ? row.high_score : 0 });
});

app.post("/player/highscore", auth(true), async (c) => {
  const name = c.get("user").username;
  const { score } = await c.req.json();
  const value = toInt(score);
  if (value === null) {
    return c.json({ error: "Invalid score" }, 400);
  }
  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO player_high_scores (player_name, high_score, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
  )
    .bind(name, value)
    .run();
  return c.json({ success: true, score: value });
});

app.get("/player/color", auth(true), async (c) => {
  const name = c.get("user").username;
  const row = await c.env.DB.prepare(
    "SELECT selected_color FROM player_colors WHERE player_name = ?",
  )
    .bind(name)
    .first<{ selected_color: string }>();
  return c.json({ selectedColor: row ? row.selected_color : "gray" });
});

app.post("/player/color", auth(true), async (c) => {
  const name = c.get("user").username;
  const { selectedColor } = await c.req.json();
  if (!VALID_COLORS.includes(selectedColor)) {
    return c.json({ error: "Invalid color selection" }, 400);
  }
  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO player_colors (player_name, selected_color, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
  )
    .bind(name, selectedColor)
    .run();
  return c.json({ success: true, selectedColor });
});

// ---- leaderboard ----------------------------------------------------------

app.get("/leaderboard", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT l.player_name, MAX(l.score) as score,
            COALESCE(pc.selected_color, 'gray') as selected_color
     FROM leaderboard l
     LEFT JOIN player_colors pc ON l.player_name = pc.player_name
     GROUP BY l.player_name
     ORDER BY score DESC
     LIMIT 100`,
  ).all<{ player_name: string; score: number; selected_color: string }>();

  return c.json(
    results.map((row) => ({
      name: row.player_name,
      score: row.score,
      color: row.selected_color,
    })),
  );
});

app.post("/leaderboard", auth(true), async (c) => {
  const name = c.get("user").username;
  const { score } = await c.req.json();

  // Test admin scores are not recorded.
  if (c.env.TEST_ADMIN_USER && name === c.env.TEST_ADMIN_USER) {
    return c.json({ success: true });
  }

  const value = toInt(score);
  if (value === null) {
    return c.json({ error: "Invalid score" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT INTO leaderboard (player_name, score) VALUES (?, ?)",
  )
    .bind(name, value)
    .run();
  return c.json({ success: true });
});

// ---- global high scores ---------------------------------------------------

app.get("/highscore/:type", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT score FROM high_scores WHERE score_type = ?",
  )
    .bind(c.req.param("type"))
    .first<{ score: number }>();
  return c.json({ score: row ? row.score : 0 });
});

app.post("/highscore/:type", async (c) => {
  const { score } = await c.req.json();
  const value = toInt(score);
  if (value === null) {
    return c.json({ error: "Invalid score" }, 400);
  }
  await c.env.DB.prepare(
    "UPDATE high_scores SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE score_type = ?",
  )
    .bind(value, c.req.param("type"))
    .run();
  return c.json({ success: true });
});

export default app;
