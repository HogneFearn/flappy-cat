// API helper functions
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    return null;
  }
}

// Player wallet functions (now using API instead of localStorage)
async function loadPlayerWallet(playerName) {
  const result = await apiRequest(
    `/api/player/${encodeURIComponent(playerName)}/wallet`
  );
  return result ? result.wallet : 0;
}

async function savePlayerWallet(playerName, coins) {
  await apiRequest(`/api/player/${encodeURIComponent(playerName)}/wallet`, {
    method: "POST",
    body: JSON.stringify({ wallet: coins }),
  });
}

// Leaderboard functions (now using API instead of localStorage)
async function loadLeaderboard() {
  const result = await apiRequest("/api/leaderboard");
  return result || [];
}

async function addToLeaderboard(name, score) {
  // Find existing entry for this player
  const existingPlayerIndex = leaderboard.findIndex(
    (entry) => entry.name === name
  );

  if (existingPlayerIndex !== -1) {
    // Player exists - only update if new score is higher
    if (score > leaderboard[existingPlayerIndex].score) {
      leaderboard[existingPlayerIndex].score = score;
      leaderboard[existingPlayerIndex].date = new Date().toLocaleDateString();
    }
  } else {
    // New player - add to leaderboard
    leaderboard.push({
      name: name,
      score: score,
      date: new Date().toLocaleDateString(),
    });
  }

  // Sort by score and keep only top 100 unique players
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 100);

  // Save to API instead of localStorage
  await apiRequest("/api/leaderboard", {
    method: "POST",
    body: JSON.stringify({ playerName: name, score }),
  });

  // Reload leaderboard after adding score
  leaderboard = await loadLeaderboard();
}

// High score functions (now using API instead of localStorage)
async function loadHighScore() {
  const result = await apiRequest("/api/highscore/obstacle");
  return result ? result.score : 0;
}

async function saveHighScore(score) {
  await apiRequest("/api/highscore/obstacle", {
    method: "POST",
    body: JSON.stringify({ score }),
  });
}

// Initialize game data from API
async function initializeGameData() {
  obstacleHighscore = await loadHighScore();
  leaderboard = await loadLeaderboard();
}
