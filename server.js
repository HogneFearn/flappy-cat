const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;
const TEST_ADMIN_USER = process.env.TEST_ADMIN_USER || "";

// Serve the Vite production build from `dist/` when it exists, otherwise fall
// back to `public/` (e.g. before the first `npm run build`).
const DIST_DIR = path.join(__dirname, "dist");
const STATIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : path.join(__dirname, "public");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(STATIC_DIR));

// Debug middleware to log all requests
app.use((req, res, next) => {
  if (req.method === "POST" && req.url.includes("/api/")) {
    console.log("POST request debug:", {
      url: req.url,
      headers: req.headers,
      body: req.body,
      contentType: req.get("Content-Type"),
    });
  }
  next();
});

// Initialize SQLite database
const db = new sqlite3.Database("game.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  // Players table for wallets
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    wallet INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Leaderboard table
  db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // High score table
  db.run(
    `CREATE TABLE IF NOT EXISTS high_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score_type TEXT UNIQUE NOT NULL,
    score INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
    (err) => {
      if (err) {
        console.error("Error creating high_scores table:", err.message);
      } else {
        // Insert default high score if it doesn't exist
        db.run(
          `INSERT OR IGNORE INTO high_scores (score_type, score) VALUES ('obstacle', 0)`
        );
      }
    }
  );

  // Player inventory table
  db.run(`CREATE TABLE IF NOT EXISTS player_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT UNIQUE NOT NULL,
    magnet_rounds_left INTEGER DEFAULT 0,
    mini_nuke_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add mini_nuke_count column to existing tables (migration)
  db.run(
    `ALTER TABLE player_inventory ADD COLUMN mini_nuke_count INTEGER DEFAULT 0`,
    (err) => {
      // Ignore error if column already exists
    }
  );

  // Add nuke_count column to existing tables (migration)
  db.run(
    `ALTER TABLE player_inventory ADD COLUMN nuke_count INTEGER DEFAULT 0`,
    (err) => {
      // Ignore error if column already exists
    }
  );

  // Add gold_nuke_count column to existing tables (migration)
  db.run(
    `ALTER TABLE player_inventory ADD COLUMN gold_nuke_count INTEGER DEFAULT 0`,
    (err) => {
      // Ignore error if column already exists
    }
  );

  // Add gold_magnet_rounds_left column to existing tables (migration)
  db.run(
    `ALTER TABLE player_inventory ADD COLUMN gold_magnet_rounds_left INTEGER DEFAULT 0`,
    (err) => {
      // Ignore error if column already exists
    }
  );

  // Add ghost_shroom_count column to existing tables (migration)
  db.run(
    `ALTER TABLE player_inventory ADD COLUMN ghost_shroom_count INTEGER DEFAULT 0`,
    (err) => {
      // Ignore error if column already exists
    }
  );

  // Add energy_cape_rounds_left column to existing tables (migration)
  db.run(
    `ALTER TABLE player_inventory ADD COLUMN energy_cape_rounds_left INTEGER DEFAULT 0`,
    (err) => {
      // Ignore error if column already exists
    }
  );

  // Player high scores table
  db.run(`CREATE TABLE IF NOT EXISTS player_high_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT UNIQUE NOT NULL,
    high_score INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Player color preferences table
  db.run(`CREATE TABLE IF NOT EXISTS player_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT UNIQUE NOT NULL,
    selected_color TEXT DEFAULT 'gray',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Authentication tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
}

// Helper functions for authentication
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt() {
  return crypto.randomBytes(32).toString("hex");
}

function generateSessionToken() {
  return crypto.randomBytes(64).toString("hex");
}

function getExpirationDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30); // 30 days
  return date.toISOString();
}

// Shared session authentication. Validates the Bearer token against the
// sessions table; when `trackOnline` is set it also updates the online-users map.
function authenticateRequest(req, res, next, trackOnline) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No valid session token provided" });
  }

  const sessionToken = authHeader.substring(7);

  db.get(
    `SELECT s.user_id, u.username FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.session_token = ? AND s.expires_at > datetime('now')`,
    [sessionToken],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        if (trackOnline) {
          // Remove from online users if session is invalid
          onlineUsers.delete(sessionToken);
        }
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      req.user = { id: row.user_id, username: row.username };

      if (trackOnline) {
        // Update online status
        onlineUsers.set(sessionToken, {
          username: row.username,
          lastSeen: Date.now(),
        });
      } else {
        console.log("Session validated for user:", req.user);
      }

      next();
    }
  );
}

// Middleware to validate session
function validateSession(req, res, next) {
  authenticateRequest(req, res, next, false);
}


// Track online users
let onlineUsers = new Map(); // sessionToken -> { username, lastSeen }
const ONLINE_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds

// Cleanup offline users periodically
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [sessionToken, userData] of onlineUsers.entries()) {
    if (now - userData.lastSeen > ONLINE_TIMEOUT) {
      onlineUsers.delete(sessionToken);
      cleanedCount++;
      console.log(`User ${userData.username} is now offline (timeout)`);
    }
  }
  if (cleanedCount > 0) {
    console.log(
      `Cleaned up ${cleanedCount} offline users. Currently online: ${onlineUsers.size}`
    );
  }
}, 60000); // Check every minute

// Enhanced session validation middleware that tracks online status
function validateSessionAndTrackOnline(req, res, next) {
  authenticateRequest(req, res, next, true);
}

// Add heartbeat endpoint for keeping users online
app.post("/api/heartbeat", validateSessionAndTrackOnline, (req, res) => {
  res.json({
    success: true,
    onlineCount: onlineUsers.size,
    message: "Heartbeat received",
  });
});

// Get online user count (public endpoint)
app.get("/api/online-count", (req, res) => {
  res.json({ count: onlineUsers.size });
});

// API Routes

// Authentication routes
app.post("/api/auth/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({
      error:
        "Username must be at least 3 characters and password at least 6 characters",
    });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  db.run(
    "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
    [username, passwordHash, salt],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(409).json({ error: "Username already exists" });
        }
        return res.status(500).json({ error: err.message });
      }

      // Create session for new user
      const sessionToken = generateSessionToken();
      const expiresAt = getExpirationDate();

      db.run(
        "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)",
        [this.lastID, sessionToken, expiresAt],
        function (sessionErr) {
          if (sessionErr) {
            return res.status(500).json({ error: sessionErr.message });
          }

          // Initialize player data
          db.run("INSERT INTO players (name, wallet) VALUES (?, 0)", [
            username,
          ]);
          db.run(
            "INSERT INTO player_inventory (player_name, magnet_rounds_left, mini_nuke_count, nuke_count, gold_magnet_rounds_left) VALUES (?, 0, 0, 0, 0)",
            [username]
          );
          db.run(
            "INSERT INTO player_high_scores (player_name, high_score) VALUES (?, 0)",
            [username]
          );

          res.json({
            success: true,
            sessionToken,
            username,
            message: "Account created successfully",
          });
        }
      );
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  db.get(
    "SELECT id, username, password_hash, salt FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const passwordHash = hashPassword(password, row.salt);
      if (passwordHash !== row.password_hash) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Create new session
      const sessionToken = generateSessionToken();
      const expiresAt = getExpirationDate();

      // Clean up any existing online sessions for this user
      // Remove from onlineUsers map
      for (const [token, userData] of onlineUsers.entries()) {
        if (userData.username === row.username) {
          onlineUsers.delete(token);
          console.log(
            `Removed existing online session for user: ${row.username}`
          );
        }
      }

      // Also clean up old sessions from database (optional - keeps DB clean)
      db.run(
        "DELETE FROM sessions WHERE user_id = ? AND expires_at < datetime('now')",
        [row.id]
      );

      db.run(
        "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)",
        [row.id, sessionToken, expiresAt],
        function (sessionErr) {
          if (sessionErr) {
            return res.status(500).json({ error: sessionErr.message });
          }

          res.json({
            success: true,
            sessionToken,
            username: row.username,
            message: "Login successful",
          });
        }
      );
    }
  );
});

app.post("/api/auth/validate", (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ error: "Session token is required" });
  }

  db.get(
    `SELECT s.user_id, u.username FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.session_token = ? AND s.expires_at > datetime('now')`,
    [sessionToken],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      res.json({
        success: true,
        username: row.username,
      });
    }
  );
});

// Logout endpoint
app.post("/api/auth/logout", validateSessionAndTrackOnline, (req, res) => {
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader.substring(7);

  // Remove from online users
  onlineUsers.delete(sessionToken);
  console.log(`User ${req.user.username} logged out`);

  // Optionally, you could also remove the session from database
  // For now, we'll just let it expire naturally
  // db.run("DELETE FROM sessions WHERE session_token = ?", [sessionToken]);

  res.json({ success: true, message: "Logged out successfully" });
});

// Logout endpoint for sendBeacon (no auth header validation needed)
app.post("/api/auth/logout-beacon", (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res
      .status(200)
      .json({ success: false, message: "No session token provided" });
  }

  // Find and remove from online users
  if (onlineUsers.has(sessionToken)) {
    const userData = onlineUsers.get(sessionToken);
    onlineUsers.delete(sessionToken);
    console.log(`User ${userData.username} logged out via beacon`);
  }

  res.json({ success: true, message: "Logged out successfully" });
});

// Get player wallet
app.get("/api/player/wallet", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;

  // Special handling for test admin: Always reset wallet to 1,000,000
  if (playerName === TEST_ADMIN_USER) {
    const testWalletAmount = 1000000;
    db.run(
      "INSERT OR REPLACE INTO players (name, wallet) VALUES (?, ?)",
      [playerName, testWalletAmount],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ wallet: testWalletAmount });
      }
    );
    return;
  }

  db.get(
    "SELECT wallet FROM players WHERE name = ?",
    [playerName],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        res.json({ wallet: row.wallet });
      } else {
        // Create new player with 0 wallet
        db.run(
          "INSERT INTO players (name, wallet) VALUES (?, 0)",
          [playerName],
          function (err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ wallet: 0 });
          }
        );
      }
    }
  );
});

// Update player wallet
app.post("/api/player/wallet", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;
  const { wallet } = req.body;

  db.run(
    "INSERT OR REPLACE INTO players (name, wallet) VALUES (?, ?)",
    [playerName, wallet],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, wallet: wallet });
    }
  );
});

// Get player inventory
app.get("/api/player/inventory", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;

  db.get(
    "SELECT magnet_rounds_left, mini_nuke_count, nuke_count, gold_nuke_count, gold_magnet_rounds_left, ghost_shroom_count, energy_cape_rounds_left FROM player_inventory WHERE player_name = ?",
    [playerName],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        res.json({
          magnetRoundsLeft: row.magnet_rounds_left,
          miniNukeCount: row.mini_nuke_count || 0,
          nukeCount: row.nuke_count || 0,
          goldNukeCount: row.gold_nuke_count || 0,
          goldMagnetRoundsLeft: row.gold_magnet_rounds_left || 0,
          ghostShroomCount: row.ghost_shroom_count || 0,
        });
      } else {
        // Create new inventory with default values
        db.run(
          "INSERT INTO player_inventory (player_name, magnet_rounds_left, mini_nuke_count, nuke_count, gold_nuke_count, gold_magnet_rounds_left, ghost_shroom_count) VALUES (?, 0, 0, 0, 0, 0, 0)",
          [playerName],
          function (err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({
              magnetRoundsLeft: 0,
              miniNukeCount: 0,
              nukeCount: 0,
              goldNukeCount: 0,
              goldMagnetRoundsLeft: 0,
              ghostShroomCount: 0,
            });
          }
        );
      }
    }
  );
});

// Update player inventory
app.post("/api/player/inventory", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;
  const {
    magnetRoundsLeft,
    miniNukeCount,
    nukeCount,
    goldNukeCount,
    goldMagnetRoundsLeft,
    ghostShroomCount,
    energyCapeRoundsLeft,
  } = req.body;

  db.run(
    "INSERT OR REPLACE INTO player_inventory (player_name, magnet_rounds_left, mini_nuke_count, nuke_count, gold_nuke_count, gold_magnet_rounds_left, ghost_shroom_count, energy_cape_rounds_left, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
    [
      playerName,
      magnetRoundsLeft || 0,
      miniNukeCount || 0,
      nukeCount || 0,
      goldNukeCount || 0,
      goldMagnetRoundsLeft || 0,
      ghostShroomCount || 0,
      energyCapeRoundsLeft || 0,
    ],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, magnetRoundsLeft: magnetRoundsLeft });
    }
  );
});

// Get player high score
// Get player high score
app.get("/api/player/highscore", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;

  db.get(
    "SELECT high_score FROM player_high_scores WHERE player_name = ?",
    [playerName],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
      } else {
        res.json({ highScore: row ? row.high_score : 0 });
      }
    }
  );
});

// Get player color preference
app.get("/api/player/color", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;

  db.get(
    "SELECT selected_color FROM player_colors WHERE player_name = ?",
    [playerName],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
      } else {
        res.json({ selectedColor: row ? row.selected_color : "gray" });
      }
    }
  );
});

// Update player color preference
app.post("/api/player/color", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;
  const { selectedColor } = req.body;

  // Validate the color is in the allowed list
  const validColors = [
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

  if (!validColors.includes(selectedColor)) {
    return res.status(400).json({ error: "Invalid color selection" });
  }

  db.run(
    "INSERT OR REPLACE INTO player_colors (player_name, selected_color, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    [playerName, selectedColor],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
      } else {
        res.json({ success: true, selectedColor });
      }
    }
  );
});

// Update player high score
app.post("/api/player/highscore", validateSessionAndTrackOnline, (req, res) => {
  const playerName = req.user.username;
  const { score } = req.body;

  db.run(
    "INSERT OR REPLACE INTO player_high_scores (player_name, high_score, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    [playerName, score],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, score: score });
    }
  );
});

// Update player high score
app.post("/api/player/:name/highscore", (req, res) => {
  const playerName = req.params.name;
  const { score } = req.body;

  db.run(
    "INSERT OR REPLACE INTO player_high_scores (player_name, high_score, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    [playerName, score],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, score: score });
    }
  );
});

// Get leaderboard
app.get("/api/leaderboard", (req, res) => {
  db.all(
    `SELECT l.player_name, MAX(l.score) as score, 
            COALESCE(pc.selected_color, 'gray') as selected_color
     FROM leaderboard l
     LEFT JOIN player_colors pc ON l.player_name = pc.player_name
     GROUP BY l.player_name 
     ORDER BY score DESC 
     LIMIT 100`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(
        rows.map((row) => ({
          name: row.player_name,
          score: row.score,
          color: row.selected_color,
        }))
      );
    }
  );
});

// Add score to leaderboard
app.post(
  "/api/leaderboard",
  (req, res, next) => {
    console.log("Raw leaderboard request:", {
      body: req.body,
      rawBody: req.rawBody,
      contentType: req.get("Content-Type"),
      contentLength: req.get("Content-Length"),
    });
    next();
  },
  validateSessionAndTrackOnline,
  (req, res) => {
    const playerName = req.user.username;
    const { score } = req.body;

    // Special handling for test admin: Do not save score to leaderboard
    if (playerName === TEST_ADMIN_USER) {
      console.log("Test admin score ignored for leaderboard");
      return res.json({ success: true });
    }

    console.log("Leaderboard POST request:", {
      playerName,
      score,
      scoreType: typeof score,
      body: req.body,
    });

    if (score === undefined || score === null) {
      return res.status(400).json({ error: "Score is required" });
    }

    db.run(
      "INSERT INTO leaderboard (player_name, score) VALUES (?, ?)",
      [playerName, score],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          res.status(500).json({ error: err.message });
          return;
        }
        console.log("Score added successfully:", { playerName, score });
        res.json({ success: true });
      }
    );
  }
);

// Get high score
app.get("/api/highscore/:type", (req, res) => {
  const scoreType = req.params.type;

  db.get(
    "SELECT score FROM high_scores WHERE score_type = ?",
    [scoreType],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ score: row ? row.score : 0 });
    }
  );
});

// Update high score
app.post("/api/highscore/:type", (req, res) => {
  const scoreType = req.params.type;
  const { score } = req.body;

  db.run(
    "UPDATE high_scores SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE score_type = ?",
    [score, scoreType],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// Serve the game on root route
app.get("/", (req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Database connection closed.");
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
