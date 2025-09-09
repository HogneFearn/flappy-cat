// API helper functions
async function apiRequest(url, options = {}) {
  try {
    // Log the request details
    if (options.method === "POST") {
      console.log("Making POST request:", {
        url,
        headers: options.headers,
        body: options.body,
        bodyType: typeof options.body,
      });
    }

    // Ensure proper headers for JSON requests
    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, requestOptions);

    const result = await response.json();

    if (!response.ok) {
      console.error(`API request failed: ${response.status}`, result);
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Authentication functions
async function signupPlayer(username, password) {
  const result = await apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return result;
}

async function loginPlayer(username, password) {
  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return result;
}

async function validateSession(sessionToken) {
  const result = await apiRequest("/api/auth/validate", {
    method: "POST",
    body: JSON.stringify({ sessionToken }),
  });
  return result && result.success;
}

// Session management
function saveSession(sessionData) {
  localStorage.setItem("catFlappySession", JSON.stringify(sessionData));
}

function loadSession() {
  const sessionData = localStorage.getItem("catFlappySession");
  return sessionData ? JSON.parse(sessionData) : null;
}

function clearSession() {
  localStorage.removeItem("catFlappySession");
}

// Player wallet functions (now using API instead of localStorage)
async function loadPlayerWallet(sessionToken) {
  if (!sessionToken) {
    console.error("No session token provided for loadPlayerWallet");
    return 0;
  }

  const result = await apiRequest("/api/player/wallet", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  return result ? result.wallet : 0;
}

async function savePlayerWallet(sessionToken, coins) {
  if (!sessionToken) {
    console.error("No session token provided for savePlayerWallet");
    return;
  }

  await apiRequest("/api/player/wallet", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ wallet: coins }),
  });
}

// Leaderboard functions (now using API instead of localStorage)
async function loadLeaderboard() {
  const result = await apiRequest("/api/leaderboard");
  return result || [];
}

async function addToLeaderboard(sessionToken, score) {
  if (!sessionToken) {
    console.error("No session token provided for addToLeaderboard");
    return;
  }

  if (score === undefined || score === null || isNaN(score)) {
    console.error("Invalid score provided for addToLeaderboard:", score);
    return;
  }

  console.log("Adding score to leaderboard:", score);

  const requestBody = JSON.stringify({ score: parseInt(score) });
  console.log("Request body JSON:", requestBody);

  try {
    // Save to API with session token
    await apiRequest("/api/leaderboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      body: requestBody,
    });

    // Reload leaderboard after adding score
    leaderboard = await loadLeaderboard();
  } catch (error) {
    console.error("Failed to add score to leaderboard:", error);
  }
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

// Shop/inventory functions
async function loadPlayerInventory(sessionToken) {
  if (!sessionToken) {
    console.error("No session token provided for loadPlayerInventory");
    return { magnetRoundsLeft: 0 };
  }

  const result = await apiRequest("/api/player/inventory", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  return result || { magnetRoundsLeft: 0 };
}

async function savePlayerInventory(sessionToken, inventory) {
  if (!sessionToken) {
    console.error("No session token provided for savePlayerInventory");
    return;
  }

  await apiRequest("/api/player/inventory", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(inventory),
  });
}

async function buyMagnet(sessionToken, currentWallet) {
  const magnetCost = 200;
  if (currentWallet >= magnetCost) {
    const newWallet = currentWallet - magnetCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.magnetRoundsLeft = (inventory.magnetRoundsLeft || 0) + 3;

    await savePlayerWallet(sessionToken, newWallet);
    await savePlayerInventory(sessionToken, inventory);

    return { success: true, newWallet, inventory };
  }
  return { success: false };
}

// Player-specific high score functions
async function loadPlayerHighScore(sessionToken) {
  if (!sessionToken) {
    console.error("No session token provided for loadPlayerHighScore");
    return 0;
  }

  const result = await apiRequest("/api/player/highscore", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  return result ? result.score : 0;
}

async function savePlayerHighScore(sessionToken, score) {
  if (!sessionToken) {
    console.error("No session token provided for savePlayerHighScore");
    return;
  }

  await apiRequest("/api/player/highscore", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ score }),
  });
}

// Helper function for getting player high score
async function getPlayerHighScore(sessionToken) {
  return await loadPlayerHighScore(sessionToken);
}

// Helper function for checking if player has magnet
async function checkPlayerHasMagnet(sessionToken) {
  const inventory = await loadPlayerInventory(sessionToken);
  return inventory && inventory.hasMagnet;
}

// Initialize game data from API
async function initializeGameData() {
  if (!currentSession || !currentSession.sessionToken) {
    console.error("No valid session for initializing game data");
    return;
  }

  try {
    // Load player data using session token
    totalCoinsWallet = await loadPlayerWallet(currentSession.sessionToken);
    playerHighScore = await getPlayerHighScore(currentSession.sessionToken);

    // Load inventory to get magnet rounds
    const inventory = await loadPlayerInventory(currentSession.sessionToken);
    magnetRoundsLeft = inventory.magnetRoundsLeft || 0;
    hasMagnet = magnetRoundsLeft > 0; // Set hasMagnet based on rounds left

    // Load color preference
    selectedCatColor = await getPlayerColor(currentSession.sessionToken);

    // Load leaderboard
    leaderboard = await loadLeaderboard();

    // Mark game as ready
    gameNameEntered = true;

    console.log("Game data initialized successfully");
  } catch (error) {
    console.error("Failed to initialize game data:", error);
  }
}

// Online user tracking
let heartbeatInterval;

async function startHeartbeat(sessionToken) {
  console.log("startHeartbeat called with sessionToken:", sessionToken);

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Send initial heartbeat immediately
  try {
    console.log("Sending initial heartbeat...");
    const result = await apiRequest("/api/heartbeat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    console.log("Initial heartbeat successful:", result);
    // Update online count from heartbeat response
    if (result.onlineCount !== undefined) {
      console.log(
        "Updating onlineCount from",
        onlineCount,
        "to",
        result.onlineCount
      );
      onlineCount = result.onlineCount;
      console.log("onlineCount is now:", onlineCount);
    }
  } catch (error) {
    console.error("Initial heartbeat failed:", error);
  }

  // Send heartbeat every 2 minutes
  heartbeatInterval = setInterval(async () => {
    try {
      console.log("Sending periodic heartbeat...");
      const result = await apiRequest("/api/heartbeat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      console.log("Periodic heartbeat successful:", result);
      // Update online count from heartbeat response
      if (result.onlineCount !== undefined) {
        onlineCount = result.onlineCount;
      }
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  }, 2 * 60 * 1000); // 2 minutes
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

async function getOnlineCount() {
  const result = await apiRequest("/api/online-count");
  return result ? result.count : 0;
}

async function logout(sessionToken) {
  if (!sessionToken) return;

  stopHeartbeat();

  await apiRequest("/api/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  clearSession();
}

// Color preference functions
async function getPlayerColor(sessionToken) {
  const result = await apiRequest("/api/player/color", {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  return result.selectedColor;
}

async function savePlayerColor(sessionToken, selectedColor) {
  await apiRequest("/api/player/color", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ selectedColor }),
  });
}
