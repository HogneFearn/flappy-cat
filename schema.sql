-- D1 schema for Flappy Cat. Mirrors the tables the old Express/SQLite server
-- created at runtime (initDatabase in server.js), with the incremental ALTER
-- columns folded into their CREATE TABLE. Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  wallet INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS high_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score_type TEXT UNIQUE NOT NULL,
  score INTEGER NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT UNIQUE NOT NULL,
  magnet_rounds_left INTEGER DEFAULT 0,
  mini_nuke_count INTEGER DEFAULT 0,
  nuke_count INTEGER DEFAULT 0,
  gold_nuke_count INTEGER DEFAULT 0,
  gold_magnet_rounds_left INTEGER DEFAULT 0,
  ghost_shroom_count INTEGER DEFAULT 0,
  energy_cape_rounds_left INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_high_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT UNIQUE NOT NULL,
  high_score INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT UNIQUE NOT NULL,
  selected_color TEXT DEFAULT 'gray',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- last_seen replaces the in-memory onlineUsers Map from the old server:
-- online = sessions with last_seen inside the timeout window.
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_seen DATETIME,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions (last_seen);

INSERT OR IGNORE INTO high_scores (score_type, score) VALUES ('obstacle', 0);
