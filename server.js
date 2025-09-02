const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Player high scores table
  db.run(`CREATE TABLE IF NOT EXISTS player_high_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT UNIQUE NOT NULL,
    high_score INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

// API Routes

// Get player wallet
app.get("/api/player/:name/wallet", (req, res) => {
  const playerName = req.params.name;

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
app.post("/api/player/:name/wallet", (req, res) => {
  const playerName = req.params.name;
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
app.get("/api/player/:name/inventory", (req, res) => {
  const playerName = req.params.name;

  db.get(
    "SELECT magnet_rounds_left FROM player_inventory WHERE player_name = ?",
    [playerName],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        res.json({ magnetRoundsLeft: row.magnet_rounds_left });
      } else {
        // Create new inventory with default values
        db.run(
          "INSERT INTO player_inventory (player_name, magnet_rounds_left) VALUES (?, 0)",
          [playerName],
          function (err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ magnetRoundsLeft: 0 });
          }
        );
      }
    }
  );
});

// Update player inventory
app.post("/api/player/:name/inventory", (req, res) => {
  const playerName = req.params.name;
  const { magnetRoundsLeft } = req.body;

  db.run(
    "INSERT OR REPLACE INTO player_inventory (player_name, magnet_rounds_left, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    [playerName, magnetRoundsLeft],
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
app.get("/api/player/:name/highscore", (req, res) => {
  const playerName = req.params.name;

  db.get(
    "SELECT high_score FROM player_high_scores WHERE player_name = ?",
    [playerName],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        res.json({ score: row.high_score });
      } else {
        // Create new player high score entry with 0
        db.run(
          "INSERT INTO player_high_scores (player_name, high_score) VALUES (?, 0)",
          [playerName],
          function (err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ score: 0 });
          }
        );
      }
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
    `SELECT player_name, MAX(score) as score 
          FROM leaderboard 
          GROUP BY player_name 
          ORDER BY score DESC 
          LIMIT 100`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(
        rows.map((row) => ({ name: row.player_name, score: row.score }))
      );
    }
  );
});

// Add score to leaderboard
app.post("/api/leaderboard", (req, res) => {
  const { playerName, score } = req.body;

  db.run(
    "INSERT INTO leaderboard (player_name, score) VALUES (?, ?)",
    [playerName, score],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

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
  res.sendFile(path.join(__dirname, "public", "index.html"));
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
