import { state } from "./state";

// API helper functions
async function apiRequest(url: string, options: RequestInit = {}) {
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
export async function signupPlayer(username, password) {
  const result = await apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return result;
}

export async function loginPlayer(username, password) {
  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return result;
}

export async function validateSession(sessionToken) {
  const result = await apiRequest("/api/auth/validate", {
    method: "POST",
    body: JSON.stringify({ sessionToken }),
  });
  return result && result.success;
}

// Session management
export function saveSession(sessionData) {
  localStorage.setItem("catFlappySession", JSON.stringify(sessionData));
}

export function loadSession() {
  const sessionData = localStorage.getItem("catFlappySession");
  return sessionData ? JSON.parse(sessionData) : null;
}

export function clearSession() {
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

export async function savePlayerWallet(sessionToken, coins) {
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

export async function addToLeaderboard(sessionToken, score) {
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
    state.leaderboard = await loadLeaderboard();
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

export async function savePlayerInventory(sessionToken, inventory) {
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

export async function buyMagnet(sessionToken, currentWallet) {
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

export async function buyGoldMagnet(sessionToken, currentWallet) {
  const goldMagnetCost = 750;
  if (currentWallet >= goldMagnetCost) {
    const newWallet = currentWallet - goldMagnetCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.goldMagnetRoundsLeft = (inventory.goldMagnetRoundsLeft || 0) + 1; // Only 1 round for gold magnet

    await savePlayerWallet(sessionToken, newWallet);
    await savePlayerInventory(sessionToken, inventory);

    return { success: true, newWallet, inventory };
  }
  return { success: false };
}

export async function buyMiniNuke(sessionToken, currentWallet) {
  const miniNukeCost = 350;
  if (currentWallet >= miniNukeCost) {
    const newWallet = currentWallet - miniNukeCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.miniNukeCount = (inventory.miniNukeCount || 0) + 1; // 1 use per purchase

    await savePlayerWallet(sessionToken, newWallet);
    await savePlayerInventory(sessionToken, inventory);

    return { success: true, newWallet, inventory };
  }
  return { success: false };
}

export async function buyNuke(sessionToken, currentWallet) {
  const nukeCost = 1000;
  if (currentWallet >= nukeCost) {
    const newWallet = currentWallet - nukeCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.nukeCount = (inventory.nukeCount || 0) + 1; // 1 use per purchase

    await savePlayerWallet(sessionToken, newWallet);
    await savePlayerInventory(sessionToken, inventory);

    return { success: true, newWallet, inventory };
  }
  return { success: false };
}

export async function buyGoldNuke(sessionToken, currentWallet) {
  const goldNukeCost = 2450;
  if (currentWallet >= goldNukeCost) {
    const newWallet = currentWallet - goldNukeCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.goldNukeCount = (inventory.goldNukeCount || 0) + 1; // 1 use per purchase

    await savePlayerWallet(sessionToken, newWallet);
    await savePlayerInventory(sessionToken, inventory);

    return { success: true, newWallet, inventory };
  }
  return { success: false };
}

export async function buyGhostShroom(sessionToken, currentWallet) {
  const ghostShroomCost = 650;
  if (currentWallet >= ghostShroomCost) {
    const newWallet = currentWallet - ghostShroomCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.ghostShroomCount = (inventory.ghostShroomCount || 0) + 1; // 1 use per purchase

    await savePlayerWallet(sessionToken, newWallet);
    await savePlayerInventory(sessionToken, inventory);

    return { success: true, newWallet, inventory };
  }
  return { success: false };
}

export async function buySpringBoots(sessionToken, currentWallet) {
  const springBootsCost = 550;
  if (currentWallet >= springBootsCost) {
    const newWallet = currentWallet - springBootsCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.springBootsCount = (inventory.springBootsCount || 0) + 1; // 1 use per purchase

    await savePlayerWallet(sessionToken, newWallet);
    await savePlayerInventory(sessionToken, inventory);

    return { success: true, newWallet, inventory };
  }
  return { success: false };
}

export async function buyEnergyCape(sessionToken, currentWallet) {
  const energyCapeCost = 1750;
  if (currentWallet >= energyCapeCost) {
    const newWallet = currentWallet - energyCapeCost;
    const inventory = await loadPlayerInventory(sessionToken);
    inventory.energyCapeRoundsLeft = (inventory.energyCapeRoundsLeft || 0) + 1; // 1 round per purchase

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
  return result ? result.highScore : 0;
}

export async function savePlayerHighScore(sessionToken, score) {
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
export async function initializeGameData() {
  if (!state.currentSession || !state.currentSession.sessionToken) {
    console.error("No valid session for initializing game data");
    return;
  }

  try {
    // Load player data using session token
    state.totalCoinsWallet = await loadPlayerWallet(
      state.currentSession.sessionToken,
    );
    state.playerHighScore = await getPlayerHighScore(
      state.currentSession.sessionToken,
    );

    // Load inventory to get magnet rounds
    const inventory = await loadPlayerInventory(
      state.currentSession.sessionToken,
    );
    state.magnetRoundsLeft = inventory.magnetRoundsLeft || 0;
    state.hasMagnet = state.magnetRoundsLeft > 0; // Set hasMagnet based on rounds left

    state.goldMagnetRoundsLeft = inventory.goldMagnetRoundsLeft || 0;
    state.hasGoldMagnet = state.goldMagnetRoundsLeft > 0; // Set hasGoldMagnet based on rounds left

    state.miniNukeCount = inventory.miniNukeCount || 0;
    state.hasMiniNuke = state.miniNukeCount > 0; // Set hasMiniNuke based on count

    state.nukeCount = inventory.nukeCount || 0;
    state.hasNuke = state.nukeCount > 0; // Set hasNuke based on count

    state.goldNukeCount = inventory.goldNukeCount || 0;
    state.hasGoldNuke = state.goldNukeCount > 0; // Set hasGoldNuke based on count

    state.ghostShroomCount = inventory.ghostShroomCount || 0;
    state.hasGhostShroom = state.ghostShroomCount > 0; // Set hasGhostShroom based on count

    state.energyCapeRoundsLeft = inventory.energyCapeRoundsLeft || 0;
    state.hasEnergyCape = state.energyCapeRoundsLeft > 0; // Set hasEnergyCape based on rounds left

    // Load color preference
    state.selectedCatColor = await getPlayerColor(
      state.currentSession.sessionToken,
    );

    // Load leaderboard
    state.leaderboard = await loadLeaderboard();

    // Mark game as ready
    state.gameNameEntered = true;

    console.log("Game data initialized successfully");
  } catch (error) {
    console.error("Failed to initialize game data:", error);
  }
}

// Online user tracking
let heartbeatInterval;

export async function startHeartbeat(sessionToken) {
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
        state.onlineCount,
        "to",
        result.onlineCount,
      );
      state.onlineCount = result.onlineCount;
      console.log("onlineCount is now:", state.onlineCount);
    }
  } catch (error) {
    console.error("Initial heartbeat failed:", error);
  }

  // Send heartbeat every 2 minutes
  heartbeatInterval = setInterval(
    async () => {
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
          state.onlineCount = result.onlineCount;
        }
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    },
    2 * 60 * 1000,
  ); // 2 minutes
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export async function getOnlineCount() {
  const result = await apiRequest("/api/online-count");
  return result ? result.count : 0;
}

export async function logout(sessionToken) {
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

export async function savePlayerColor(sessionToken, selectedColor) {
  await apiRequest("/api/player/color", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ selectedColor }),
  });
}
