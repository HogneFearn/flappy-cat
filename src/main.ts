// ===================== config.js =====================
// Game variables
let player = { x: 70, y: 300, w: 35, h: 35, vx: 0, vy: 0, onGround: false };
let gravity = 0.2;
let jumpPower = -3.5;
let gameSpeed = 2.5;
let baseGameSpeed = 2.5; // Store the original game speed

// Delta time variables for consistent frame rate
let lastTime = 0;
let deltaTime = 0;
const targetFPS = 60;
const targetFrameTime = 1000 / targetFPS; // 16.67ms for 60fps
let coins = [];
let obstacles = [];
let obstacleScore = 0;
let totalCoinsWallet = 0; // Will be loaded when player name is set
let onlineCount = 0; // Online users count
let playerHighScore = 0; // Will be loaded from API for current player
let gameRunning = true;
let gameStarted = false;
let gameNameEntered = false;
let nameInputActive = false;
let obstacleSpawnTimer = 0; // Now in milliseconds
let validationTimer = 0; // Now in milliseconds
let jumpHoldTimer = 0; // Now in milliseconds
let playerName = "";
let inputName = "";
let inputPassword = "";
let showLeaderboard = false;
let switchingPlayer = false;
let leaderboard = []; // Will be loaded from API instead of localStorage
let showGameOverButtons = false; // Controls whether to show buttons after game over screen
let gamePaused = false; // Controls whether the game is paused
let pauseButtonCoords = {}; // Store pause button coordinates for click detection

// Authentication variables
let authMode = "login"; // "login", "signup", or "authenticated"
let showAuthScreen = true;
let authError = "";
let currentSession = null;

// Shop variables
let showShop = false;
let hasMagnet = false;
let magnetRoundsLeft = 0;
let magnetRadius = 250;
let hasGoldMagnet = false;
let goldMagnetRoundsLeft = 0;
let goldMagnetRadius = 280; // Greater radius than regular magnet
let goldMagnetPullSpeed = 2; // Faster pull speed
let hasMiniNuke = false;
let miniNukeCount = 0;
let hasNuke = false;
let nukeCount = 0;
let hasGoldNuke = false;
let goldNukeCount = 0;
let hasGhostShroom = false;
let ghostShroomCount = 0;
let hasSpringBoots = false;
let springBootsCount = 0;
let hasEnergyCape = false;
let energyCapeRoundsLeft = 0;
let energyCapeActive = false; // Is player currently dashing?
let energyCapeReloadTimer = 0; // Cooldown timer (0 to 4000ms)
let energyCapeCooldown = 4000; // 4 seconds cooldown
let energyCapeButtonCoords = {}; // Store energy cape button coordinates for click detection
let isGhostActive = false;
let ghostModeActivationTime = 0; // Track when ghost mode was activated
let ghostModeGracePeriod = 2000; // 2 seconds of invincibility in milliseconds
let isRocketActive = false;
let rocket = null; // Will store rocket position and animation data
let rocketButtonCoords = {}; // Store rocket button coordinates for click detection
let nukeButtonCoords = {}; // Store nuke button coordinates for click detection
let goldNukeButtonCoords = {}; // Store gold nuke button coordinates for click detection
let springBootsButtonCoords = {}; // Store spring boots button coordinates for click detection
let explosion = null; // Will store explosion animation data
let lastExplosionType = null; // Track the type of the last explosion
let shopGridCoords = []; // Will store the exact coordinates of each shop item button

// Shop items configuration
let availableShopItems = [
  {
    id: "magnet",
    name: "🧲 Coin Magnet",
    price: 200,
    description: "Attracts coins from 7x distance",
    duration: "3 rounds",
  },
  {
    id: "miniNuke",
    name: "🚀 Mini Nuke",
    price: 350,
    description: "Clears 3 pipe sets (+15 points)",
    duration: "1 use",
  },
  {
    id: "springBoots",
    name: "👢 Spring Boots",
    price: 550,
    description: "Super jump on ground hit",
    duration: "1 round",
  },
  {
    id: "ghostShroom",
    name: "👻 Ghost Shroom",
    price: 650,
    description: "Survive one obstacle hit",
    duration: "1 use",
  },
  {
    id: "goldMagnet",
    name: "🟡 Gold Magnet",
    price: 750,
    description: "Stronger magnet with faster pull",
    duration: "1 round",
  },
  {
    id: "nuke",
    name: "💥 Nuke",
    price: 1000,
    description: "Clears 10 pipe sets (+50 points)",
    duration: "1 use",
  },
  {
    id: "goldNuke",
    name: "☢️ Gold Nuke",
    price: 2450,
    description: "Clears 20 pipes + 2x coins",
    duration: "1 use",
  },
  {
    id: "energyCape",
    name: "⚡ Energy Cape",
    price: 1750,
    description: "Dash through pipes! 4s cooldown",
    duration: "1 round",
  },
];

// Color palette variables
let showColorPalette = false;
let selectedCatColor = "gray"; // Default color
let colorGridCoords = []; // Will store the exact coordinates of each color button
let closeButtonCoords = { x: 0, y: 0, size: 0 }; // Will store close button coordinates
let availableColors = [
  { name: "gray", displayName: "Gray", filename: "cat.png" },
  { name: "blue", displayName: "Blue", filename: "cat_blue.png" },
  { name: "brown", displayName: "Brown", filename: "cat_brown.png" },
  { name: "cyan", displayName: "Cyan", filename: "cat_cyan.png" },
  { name: "fire", displayName: "Fire", filename: "cat_fire.png" },
  { name: "galaxy", displayName: "Galaxy", filename: "cat_galaxy.png" },
  { name: "green", displayName: "Green", filename: "cat_green.png" },
  { name: "ice", displayName: "Ice", filename: "cat_ice.png" },
  { name: "lime", displayName: "Lime", filename: "cat_lime.png" },
  { name: "magenta", displayName: "Magenta", filename: "cat_magenta.png" },
  { name: "orange", displayName: "Orange", filename: "cat_orange.png" },
  { name: "pink", displayName: "Pink", filename: "cat_pink.png" },
  { name: "purple", displayName: "Purple", filename: "cat_purple.png" },
  { name: "rainbow", displayName: "Rainbow", filename: "cat_rainbow.png" },
  { name: "red", displayName: "Red", filename: "cat_red.png" },
  { name: "yellow", displayName: "Yellow", filename: "cat_yellow.png" },
];

// Cat images - load all color variants
const catImages = {};
availableColors.forEach((color) => {
  catImages[color.name] = new Image();
  catImages[color.name].src = color.filename;
});

// For backward compatibility
const catImage = catImages.gray;

// Background image
const backgroundImage = new Image();
backgroundImage.src = "cloudy-background.png";

// Coin images
const yellowCoinImage = new Image();
yellowCoinImage.src = "yellow_coin.png";

const redCoinImage = new Image();
redCoinImage.src = "red_coin.png";

const blueCoinImage = new Image();
blueCoinImage.src = "blue_coin.png";

// Magnet images
const redMagnetImage = new Image();
redMagnetImage.src = "red-magnet.png";

const goldMagnetImage = new Image();
goldMagnetImage.src = "gold-magnet.png";

// Mini nuke image
const miniNukeImage = new Image();
miniNukeImage.src = "mini-nuke.png";

// Nuke image
const nukeImage = new Image();
nukeImage.src = "nuke.png";

// Gold Nuke image
const goldNukeImage = new Image();
goldNukeImage.src = "gold_nuke.png";

// Ghost shroom image
const ghostShroomImage = new Image();
ghostShroomImage.src = "ghost_shroom.png";

// Spring boots image
const springBootsImage = new Image();
springBootsImage.src = "spring_boots.png";

// Ghost cat image
const ghostCatImage = new Image();
ghostCatImage.src = "ghost_cat.png";

// Energy Cape image
const energyCapeImage = new Image();
energyCapeImage.src = "energy_cape.png";

// Mobile detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// In-canvas button system for game over screen
let gameOverButtons = [];

// ===================== canvas.js =====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Declare groundY before resizeCanvas function
let groundY = 520; // Default value, will be updated by resizeCanvas

// Responsive canvas sizing
function resizeCanvas() {
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobileDevice) {
    // For mobile, use a fixed logical size that scales well
    canvas.width = 400;
    canvas.height = 600;

    // Set CSS size to fill screen while maintaining aspect ratio
    const maxWidth = Math.min(window.innerWidth * 0.95, 414);
    const maxHeight = Math.min(window.innerHeight * 0.95, 896);

    const aspectRatio = 400 / 600;

    let cssWidth, cssHeight;
    if (maxWidth / maxHeight > aspectRatio) {
      // Screen is wider than our ratio, constrain by height
      cssHeight = maxHeight;
      cssWidth = maxHeight * aspectRatio;
    } else {
      // Screen is taller than our ratio, constrain by width
      cssWidth = maxWidth;
      cssHeight = maxWidth / aspectRatio;
    }

    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
  } else {
    // For desktop, use larger fixed size
    canvas.width = 600;
    canvas.height = 800;
    canvas.style.width = "600px";
    canvas.style.height = "800px";
  }

  // Update ground position based on canvas height (not CSS height)
  groundY = canvas.height - 80;
}

// Initialize canvas size
resizeCanvas();

// Resize on window resize
window.addEventListener("resize", resizeCanvas);

// Helper function to get accurate canvas coordinates from screen coordinates
function getCanvasCoordinates(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();

  // Calculate the scale factors
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Convert screen coordinates to canvas coordinates
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;

  return {
    x: Math.round(canvasX), // Round to avoid floating point precision issues
    y: Math.round(canvasY),
  };
}

// ===================== api.js =====================
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

async function buyGoldMagnet(sessionToken, currentWallet) {
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

async function buyMiniNuke(sessionToken, currentWallet) {
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

async function buyNuke(sessionToken, currentWallet) {
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

async function buyGoldNuke(sessionToken, currentWallet) {
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

async function buyGhostShroom(sessionToken, currentWallet) {
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

async function buySpringBoots(sessionToken, currentWallet) {
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

async function buyEnergyCape(sessionToken, currentWallet) {
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

    goldMagnetRoundsLeft = inventory.goldMagnetRoundsLeft || 0;
    hasGoldMagnet = goldMagnetRoundsLeft > 0; // Set hasGoldMagnet based on rounds left

    miniNukeCount = inventory.miniNukeCount || 0;
    hasMiniNuke = miniNukeCount > 0; // Set hasMiniNuke based on count

    nukeCount = inventory.nukeCount || 0;
    hasNuke = nukeCount > 0; // Set hasNuke based on count

    goldNukeCount = inventory.goldNukeCount || 0;
    hasGoldNuke = goldNukeCount > 0; // Set hasGoldNuke based on count

    ghostShroomCount = inventory.ghostShroomCount || 0;
    hasGhostShroom = ghostShroomCount > 0; // Set hasGhostShroom based on count

    energyCapeRoundsLeft = inventory.energyCapeRoundsLeft || 0;
    hasEnergyCape = energyCapeRoundsLeft > 0; // Set hasEnergyCape based on rounds left

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

// ===================== controls.js =====================
// Controls
let keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  // Initialize audio system on first user interaction
  if (!audioInitialized) {
    initializeAudio();
  }

  // Skip input handling if authentication screen is showing
  if (showAuthScreen) {
    return;
  }
});
document.addEventListener("keyup", (e) => (keys[e.code] = false));

// Hold-to-jump functionality
let isJumpHeld = false;

// Canvas touch handler for all game interactions
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  // Initialize audio system on first user interaction
  if (!audioInitialized) {
    initializeAudio();
  }

  // Get accurate canvas coordinates
  const coords = getCanvasCoordinates(
    e.touches[0].clientX,
    e.touches[0].clientY
  );
  const canvasX = coords.x;
  const canvasY = coords.y;

  // Priority 1: Handle overlay screens (these should block all other interactions)
  if (showColorPalette) {
    // Check if touch is on close button using stored coordinates
    if (
      canvasX >= closeButtonCoords.x &&
      canvasX <= closeButtonCoords.x + closeButtonCoords.size &&
      canvasY >= closeButtonCoords.y &&
      canvasY <= closeButtonCoords.y + closeButtonCoords.size
    ) {
      showColorPalette = false;
      return;
    }

    // Handle color selection touches using stored coordinates
    for (let i = 0; i < colorGridCoords.length; i++) {
      const colorCoord = colorGridCoords[i];

      if (
        canvasX >= colorCoord.x &&
        canvasX <= colorCoord.x + colorCoord.width &&
        canvasY >= colorCoord.y &&
        canvasY <= colorCoord.y + colorCoord.height
      ) {
        selectCatColor(colorCoord.color);
        break;
      }
    }

    return; // Important: prevent any other touch handling when color palette is open
  } else if (showShop) {
    // Check if touch is on close button
    if (
      canvasX >= closeButtonCoords.x &&
      canvasX <= closeButtonCoords.x + closeButtonCoords.size &&
      canvasY >= closeButtonCoords.y &&
      canvasY <= closeButtonCoords.y + closeButtonCoords.size
    ) {
      showShop = false;
      return;
    }

    // Handle shop item selection touches using stored coordinates
    for (let i = 0; i < shopGridCoords.length; i++) {
      const shopCoord = shopGridCoords[i];

      if (
        canvasX >= shopCoord.x &&
        canvasX <= shopCoord.x + shopCoord.width &&
        canvasY >= shopCoord.y &&
        canvasY <= shopCoord.y + shopCoord.height
      ) {
        // Find the item and check if it can be purchased
        const item = availableShopItems.find(
          (item) => item.id === shopCoord.itemId
        );
        if (item && shopCoord.itemId === "magnet") {
          if (totalCoinsWallet >= item.price && magnetRoundsLeft === 0) {
            buyMagnetItem();
          }
        } else if (item && shopCoord.itemId === "goldMagnet") {
          if (totalCoinsWallet >= item.price && goldMagnetRoundsLeft === 0) {
            buyGoldMagnetItem();
          }
        } else if (item && shopCoord.itemId === "ghostShroom") {
          if (totalCoinsWallet >= item.price && ghostShroomCount === 0) {
            buyGhostShroomItem();
          }
        } else if (item && shopCoord.itemId === "springBoots") {
          if (totalCoinsWallet >= item.price && springBootsCount === 0) {
            buySpringBootsItem();
          }
        } else if (item && shopCoord.itemId === "miniNuke") {
          if (totalCoinsWallet >= item.price) {
            buyMiniNukeItem();
          }
        } else if (item && shopCoord.itemId === "nuke") {
          if (totalCoinsWallet >= item.price) {
            buyNukeItem();
          }
        } else if (item && shopCoord.itemId === "goldNuke") {
          if (totalCoinsWallet >= item.price) {
            buyGoldNukeItem();
          }
        } else if (item && shopCoord.itemId === "energyCape") {
          if (totalCoinsWallet >= item.price && energyCapeRoundsLeft === 0) {
            buyEnergyCapeItem();
          }
        }
        break;
      }
    }

    // If tapping outside the shop content area, close the shop
    const shopContentTop = 30;
    const shopContentBottom = 380; // Adjusted for new centered layout
    const shopContentLeft = canvas.width / 4;
    const shopContentRight = (3 * canvas.width) / 4;

    if (
      canvasY < shopContentTop ||
      canvasY > shopContentBottom ||
      canvasX < shopContentLeft ||
      canvasX > shopContentRight
    ) {
      showShop = false;
    }
    return; // Important: prevent any other touch handling when shop is open
  } else if (showLeaderboard) {
    // Close leaderboard when tapping on canvas
    showLeaderboard = false;
    return; // Important: prevent any other touch handling when leaderboard is open
  }

  // Priority 2: Check for pause button click (only when game is running and not paused)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    pauseButtonCoords.x &&
    canvasX >= pauseButtonCoords.x &&
    canvasX <= pauseButtonCoords.x + pauseButtonCoords.width &&
    canvasY >= pauseButtonCoords.y &&
    canvasY <= pauseButtonCoords.y + pauseButtonCoords.height
  ) {
    togglePause();
    return;
  }

  // Priority 2.5: Check for rocket button click (only when game is running, not paused, and has mini nukes)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasMiniNuke &&
    miniNukeCount > 0 &&
    !isRocketActive &&
    rocketButtonCoords.x &&
    canvasX >= rocketButtonCoords.x &&
    canvasX <= rocketButtonCoords.x + rocketButtonCoords.width &&
    canvasY >= rocketButtonCoords.y &&
    canvasY <= rocketButtonCoords.y + rocketButtonCoords.height
  ) {
    launchRocket();
    return;
  }

  // Priority 2b: Check for nuke button click during gameplay (touchstart for better responsiveness)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasNuke &&
    nukeCount > 0 &&
    !isRocketActive &&
    nukeButtonCoords.x &&
    canvasX >= nukeButtonCoords.x &&
    canvasX <= nukeButtonCoords.x + nukeButtonCoords.width &&
    canvasY >= nukeButtonCoords.y &&
    canvasY <= nukeButtonCoords.y + nukeButtonCoords.height
  ) {
    launchNuke();
    return;
  }

  // Priority 2c: Check for gold nuke button click during gameplay (touchstart for better responsiveness)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasGoldNuke &&
    goldNukeCount > 0 &&
    !isRocketActive &&
    goldNukeButtonCoords.x &&
    canvasX >= goldNukeButtonCoords.x &&
    canvasX <= goldNukeButtonCoords.x + goldNukeButtonCoords.width &&
    canvasY >= goldNukeButtonCoords.y &&
    canvasY <= goldNukeButtonCoords.y + goldNukeButtonCoords.height
  ) {
    launchGoldNuke();
    return;
  }

  // Priority 2d: Check for energy cape dash button click during gameplay
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasEnergyCape &&
    energyCapeRoundsLeft > 0 &&
    !energyCapeActive &&
    energyCapeReloadTimer <= 0 &&
    !isRocketActive &&
    energyCapeButtonCoords.x &&
    canvasX >= energyCapeButtonCoords.x &&
    canvasX <= energyCapeButtonCoords.x + energyCapeButtonCoords.width &&
    canvasY >= energyCapeButtonCoords.y &&
    canvasY <= energyCapeButtonCoords.y + energyCapeButtonCoords.height
  ) {
    activateDash();
    return;
  }

  // Priority 3: Check for in-canvas button clicks when game is over (handle on touchstart for better responsiveness)
  if (!gameRunning && showGameOverButtons && gameOverButtons.length > 0) {
    // Find the clicked button by checking from bottom to top (reverse order)
    // to handle any potential overlaps
    for (let i = gameOverButtons.length - 1; i >= 0; i--) {
      const button = gameOverButtons[i];
      if (
        canvasX >= button.x &&
        canvasX <= button.x + button.width &&
        canvasY >= button.y &&
        canvasY <= button.y + button.height
      ) {
        handleGameOverButtonClick(button.action);
        return;
      }
    }
  }

  // If game is over but buttons aren't shown yet, show them on tap
  if (!gameRunning && !showGameOverButtons) {
    showGameOverButtons = true;
    return;
  }

  // Priority 3: Normal game interactions (only when no overlays are open)
  if (!showAuthScreen && gameNameEntered) {
    isJumpHeld = true;
    jumpHoldTimer = 0;
    handleJump();
  }
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  isJumpHeld = false;
});

// Canvas click handler for desktop
canvas.addEventListener("click", (e) => {
  // Get accurate canvas coordinates
  const coords = getCanvasCoordinates(e.clientX, e.clientY);
  const canvasX = coords.x;
  const canvasY = coords.y;

  // Priority 1: Handle overlay screens (these should block all other interactions)
  if (showColorPalette) {
    // Check if click is on close button using stored coordinates
    if (
      canvasX >= closeButtonCoords.x &&
      canvasX <= closeButtonCoords.x + closeButtonCoords.size &&
      canvasY >= closeButtonCoords.y &&
      canvasY <= closeButtonCoords.y + closeButtonCoords.size
    ) {
      showColorPalette = false;
      return;
    }

    // Handle color selection clicks using stored coordinates
    for (let i = 0; i < colorGridCoords.length; i++) {
      const colorCoord = colorGridCoords[i];

      if (
        canvasX >= colorCoord.x &&
        canvasX <= colorCoord.x + colorCoord.width &&
        canvasY >= colorCoord.y &&
        canvasY <= colorCoord.y + colorCoord.height
      ) {
        selectCatColor(colorCoord.color);
        break;
      }
    }

    return; // Important: prevent any other click handling when color palette is open
  } else if (showShop) {
    // Check if click is on close button
    if (
      canvasX >= closeButtonCoords.x &&
      canvasX <= closeButtonCoords.x + closeButtonCoords.size &&
      canvasY >= closeButtonCoords.y &&
      canvasY <= closeButtonCoords.y + closeButtonCoords.size
    ) {
      showShop = false;
      return;
    }

    // Handle shop item selection clicks using stored coordinates
    for (let i = 0; i < shopGridCoords.length; i++) {
      const shopCoord = shopGridCoords[i];

      if (
        canvasX >= shopCoord.x &&
        canvasX <= shopCoord.x + shopCoord.width &&
        canvasY >= shopCoord.y &&
        canvasY <= shopCoord.y + shopCoord.height
      ) {
        // Find the item and check if it can be purchased
        const item = availableShopItems.find(
          (item) => item.id === shopCoord.itemId
        );
        if (item && shopCoord.itemId === "magnet") {
          if (totalCoinsWallet >= item.price && magnetRoundsLeft === 0) {
            buyMagnetItem();
          }
        } else if (item && shopCoord.itemId === "goldMagnet") {
          if (totalCoinsWallet >= item.price && goldMagnetRoundsLeft === 0) {
            buyGoldMagnetItem();
          }
        } else if (item && shopCoord.itemId === "ghostShroom") {
          if (totalCoinsWallet >= item.price && ghostShroomCount === 0) {
            buyGhostShroomItem();
          }
        } else if (item && shopCoord.itemId === "springBoots") {
          if (totalCoinsWallet >= item.price && springBootsCount === 0) {
            buySpringBootsItem();
          }
        } else if (item && shopCoord.itemId === "miniNuke") {
          if (totalCoinsWallet >= item.price) {
            buyMiniNukeItem();
          }
        } else if (item && shopCoord.itemId === "nuke") {
          if (totalCoinsWallet >= item.price) {
            buyNukeItem();
          }
        } else if (item && shopCoord.itemId === "goldNuke") {
          if (totalCoinsWallet >= item.price) {
            buyGoldNukeItem();
          }
        } else if (item && shopCoord.itemId === "energyCape") {
          if (totalCoinsWallet >= item.price && energyCapeRoundsLeft === 0) {
            buyEnergyCapeItem();
          }
        }
        break;
      }
    }

    // If clicking outside the shop content area, close the shop
    const shopContentTop = 30;
    const shopContentBottom = 380; // Adjusted for new centered layout
    const shopContentLeft = canvas.width / 4;
    const shopContentRight = (3 * canvas.width) / 4;

    if (
      canvasY < shopContentTop ||
      canvasY > shopContentBottom ||
      canvasX < shopContentLeft ||
      canvasX > shopContentRight
    ) {
      showShop = false;
    }
    return; // Important: prevent any other click handling when shop is open
  } else if (showLeaderboard) {
    // Close leaderboard when clicking on canvas
    showLeaderboard = false;
    return; // Important: prevent any other click handling when leaderboard is open
  }

  // Priority 2: Check for pause button click (only when game is running and not paused)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    pauseButtonCoords.x &&
    canvasX >= pauseButtonCoords.x &&
    canvasX <= pauseButtonCoords.x + pauseButtonCoords.width &&
    canvasY >= pauseButtonCoords.y &&
    canvasY <= pauseButtonCoords.y + pauseButtonCoords.height
  ) {
    togglePause();
    return;
  }

  // Priority 2.5: Check for rocket button click (only when game is running, not paused, and has mini nukes)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasMiniNuke &&
    miniNukeCount > 0 &&
    !isRocketActive &&
    rocketButtonCoords.x &&
    canvasX >= rocketButtonCoords.x &&
    canvasX <= rocketButtonCoords.x + rocketButtonCoords.width &&
    canvasY >= rocketButtonCoords.y &&
    canvasY <= rocketButtonCoords.y + rocketButtonCoords.height
  ) {
    launchRocket();
    return;
  }

  // Priority 2.6: Check for nuke button click (only when game is running, not paused, and has nukes)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasNuke &&
    nukeCount > 0 &&
    !isRocketActive &&
    nukeButtonCoords.x &&
    canvasX >= nukeButtonCoords.x &&
    canvasX <= nukeButtonCoords.x + nukeButtonCoords.width &&
    canvasY >= nukeButtonCoords.y &&
    canvasY <= nukeButtonCoords.y + nukeButtonCoords.height
  ) {
    launchNuke();
    return;
  }

  // Priority 2.7: Check for gold nuke button click (only when game is running, not paused, and has gold nukes)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasGoldNuke &&
    goldNukeCount > 0 &&
    !isRocketActive &&
    goldNukeButtonCoords.x &&
    canvasX >= goldNukeButtonCoords.x &&
    canvasX <= goldNukeButtonCoords.x + goldNukeButtonCoords.width &&
    canvasY >= goldNukeButtonCoords.y &&
    canvasY <= goldNukeButtonCoords.y + goldNukeButtonCoords.height
  ) {
    launchGoldNuke();
    return;
  }

  // Priority 2.8: Check for energy cape dash button click (only when game is running, not paused, and has energy cape)
  if (
    gameRunning &&
    gameStarted &&
    gameNameEntered &&
    !showAuthScreen &&
    !gamePaused &&
    hasEnergyCape &&
    energyCapeRoundsLeft > 0 &&
    !energyCapeActive &&
    energyCapeReloadTimer <= 0 &&
    !isRocketActive &&
    energyCapeButtonCoords.x &&
    canvasX >= energyCapeButtonCoords.x &&
    canvasX <= energyCapeButtonCoords.x + energyCapeButtonCoords.width &&
    canvasY >= energyCapeButtonCoords.y &&
    canvasY <= energyCapeButtonCoords.y + energyCapeButtonCoords.height
  ) {
    activateDash();
    return;
  }

  // Priority 3: Check for in-canvas button clicks when game is over
  if (!gameRunning && showGameOverButtons && gameOverButtons.length > 0) {
    for (const button of gameOverButtons) {
      if (
        canvasX >= button.x &&
        canvasX <= button.x + button.width &&
        canvasY >= button.y &&
        canvasY <= button.y + button.height
      ) {
        handleGameOverButtonClick(button.action);
        return;
      }
    }
  }

  // If game is over but buttons aren't shown yet, show them on click
  if (!gameRunning && !showGameOverButtons) {
    showGameOverButtons = true;
    return;
  }

  // Priority 3: Normal game interactions (only when no overlays are open)
  if (!showAuthScreen && gameNameEntered) {
    handleJump();
  }
});

// Handle in-canvas button clicks
function handleGameOverButtonClick(action) {
  switch (action) {
    case "playAgain":
      resetGame();
      break;
    case "leaderboard":
      handleLeaderboard();
      break;
    case "shop":
      handleShop();
      break;
    case "colorPalette":
      handleColorPalette();
      break;
    case "switchPlayer":
      handleSwitchPlayer();
      break;
  }
}

// Legacy mobile name input handling - removed in favor of authentication

function handleJump() {
  // Skip if authentication screen is showing
  if (showAuthScreen) {
    return;
  }

  if (!gameNameEntered) {
    // Wait for authentication to complete - do nothing
    return;
  } else if (!gameRunning) {
    // If game is over but buttons aren't shown yet, show them
    if (!showGameOverButtons) {
      showGameOverButtons = true;
    }
    // Don't restart the game automatically when buttons are shown
    // Player must click the "Play Again" button instead
  } else if (gamePaused) {
    // Resume game and jump at the same time
    gamePaused = false;
    player.vy = jumpPower;
  } else if (!gameStarted) {
    gameStarted = true;
    player.vy = jumpPower;
  } else {
    player.vy = jumpPower;
  }
}

function handleLeaderboard() {
  if (gameNameEntered) {
    // Always allow closing the leaderboard, but only allow opening if game is not running or not started
    if (showLeaderboard || !gameRunning || !gameStarted) {
      showLeaderboard = !showLeaderboard;
      showShop = false; // Close shop when opening leaderboard
      showColorPalette = false; // Close color palette when opening leaderboard
    }
  }
}

function handleShop() {
  if (gameNameEntered) {
    // Always allow closing the shop, but only allow opening if game is not running or not started
    if (showShop || !gameRunning || !gameStarted) {
      showShop = !showShop;
      showLeaderboard = false; // Close leaderboard when opening shop
      showColorPalette = false; // Close color palette when opening shop
    }
  }
}

function handleColorPalette() {
  if (gameNameEntered) {
    // Always allow closing the color palette, but only allow opening if game is not running or not started
    if (showColorPalette || !gameRunning || !gameStarted) {
      showColorPalette = !showColorPalette;
      showLeaderboard = false; // Close leaderboard when opening color palette
      showShop = false; // Close shop when opening color palette
    }
  }
}

function handleSwitchPlayer() {
  if (!gameRunning || !gameStarted) {
    // Use the authentication-based switch player function
    switchPlayerWithAuth();
  }
}

function handleRestart() {
  if (!gameRunning) {
    resetGame();
  }
}

// Update button visibility based on game state
// Prevent default touch behaviors
document.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
  },
  { passive: false }
);
document.addEventListener(
  "touchstart",
  function (e) {
    if (e.target === canvas) {
      e.preventDefault();
    }
  },
  { passive: false }
);
document.addEventListener(
  "touchend",
  function (e) {
    if (e.target === canvas) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// ===================== game.js =====================
// Web Audio API system for high-performance mobile audio
let audioContext = null;
let soundBuffers = {
  miniNuke: null,
  nuke: null,
  goldNuke: null,
  coin: null,
  boing: null,
};
let audioInitialized = false;
let masterGain = null;

// Initialize Web Audio API with user interaction (required for mobile)
async function initializeAudio() {
  if (!audioInitialized) {
    try {
      // Create AudioContext
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create master gain node for volume control
      masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      masterGain.gain.value = 0.7;

      // Load and decode audio files
      await Promise.all([
        loadAudioBuffer("sounds/boom.mp3", "miniNuke"),
        loadAudioBuffer("sounds/big-boom.mp3", "nuke"),
        loadAudioBuffer("sounds/big-boom.mp3", "goldNuke"), // Use same sound for gold nuke
        loadAudioBuffer("sounds/coin.mp3", "coin"),
        loadAudioBuffer("sounds/boing.mp3", "boing"),
      ]);

      audioInitialized = true;
      console.log("Web Audio API initialized successfully");
    } catch (error) {
      console.warn("Failed to initialize Web Audio API:", error);
      // Fallback to no audio
      audioInitialized = false;
    }
  }
}

// Load and decode audio buffer
async function loadAudioBuffer(url, key) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    soundBuffers[key] = audioBuffer;
  } catch (error) {
    console.warn(`Failed to load audio: ${url}`, error);
  }
}

// Play sound using Web Audio API
function playSound(soundKey, volume = 1.0) {
  if (!audioInitialized || !audioContext || !soundBuffers[soundKey]) {
    return;
  }

  try {
    // Resume audio context if suspended (mobile requirement)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Create source node
    const source = audioContext.createBufferSource();
    source.buffer = soundBuffers[soundKey];

    // Create gain node for individual sound volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    // Connect: source -> gain -> master -> destination
    source.connect(gainNode);
    gainNode.connect(masterGain);

    // Play the sound
    source.start(0);
  } catch (error) {
    // Silently handle errors to avoid performance impact
  }
}

// Play explosion sound with Web Audio API
function playExplosionSound(rocketType = "miniNuke") {
  if (!audioInitialized) {
    initializeAudio();
  }

  let soundKey = "miniNuke";
  if (rocketType === "nuke") {
    soundKey = "nuke";
  } else if (rocketType === "goldNuke") {
    soundKey = "goldNuke";
  }
  playSound(soundKey, 1.0);
}

// Play coin pickup sound with Web Audio API
function playCoinSound() {
  if (!audioInitialized) {
    initializeAudio();
  }

  playSound("coin", 0.8); // Slightly quieter for coin pickup
}

// Play boing sound with Web Audio API
function playBoingSound() {
  if (!audioInitialized) {
    initializeAudio();
  }

  playSound("boing", 1.0);
}

function spawnCoin() {
  let x, y, radius;
  let attempts = 0;
  const maxAttempts = 30; // Increased attempts
  let validPosition = false;

  // Determine coin type based on rarity first
  const rarity = Math.random();
  let type, value, color, strokeColor;

  if (rarity < 0.02) {
    // 2% chance for blue (super rare)
    type = "blue";
    value = 20;
    color = "#4169e1";
    strokeColor = "#1e3a8a";
    radius = 13;
  } else if (rarity < 0.1) {
    // 8% chance for red (rare)
    type = "red";
    value = 5;
    color = "#dc2626";
    strokeColor = "#991b1b";
    radius = 13;
  } else {
    // 90% chance for gold (common)
    type = "gold";
    value = 1;
    color = "#ffd700";
    strokeColor = "#b8860b";
    radius = 13;
  }

  // Try to find a position that doesn't collide with pipes
  while (!validPosition && attempts < maxAttempts) {
    x = canvas.width + Math.random() * 300; // Even wider spawn range
    y = Math.random() * (groundY - 140) + 70; // More conservative Y range
    attempts++;

    let collides = false;

    // Check collision with all existing obstacles
    for (let obstacle of obstacles) {
      // Add safety margin to collision detection
      const safetyMargin = 15;

      // Check if coin overlaps with top pipe (with safety margin)
      if (
        x + radius + safetyMargin > obstacle.x &&
        x - radius - safetyMargin < obstacle.x + obstacle.width &&
        y - radius - safetyMargin < obstacle.topHeight
      ) {
        collides = true;
        break;
      }

      // Check if coin overlaps with bottom pipe (with safety margin)
      if (
        x + radius + safetyMargin > obstacle.x &&
        x - radius - safetyMargin < obstacle.x + obstacle.width &&
        y + radius + safetyMargin > obstacle.bottomY
      ) {
        collides = true;
        break;
      }
    }

    // Additional check: ensure coin is not too close to ground or ceiling
    if (y - radius < 30 || y + radius > groundY - 30) {
      collides = true;
    }

    if (!collides) {
      validPosition = true;
    }

    // If we've tried many times, try a simpler approach
    if (attempts > 20 && !validPosition) {
      // Place coin far to the right where there are likely no obstacles
      x = canvas.width + 200 + Math.random() * 200;
      y = groundY / 2 + (Math.random() - 0.5) * 100; // Center area

      // Final collision check
      collides = false;
      for (let obstacle of obstacles) {
        if (
          x + radius > obstacle.x &&
          x - radius < obstacle.x + obstacle.width &&
          (y - radius < obstacle.topHeight || y + radius > obstacle.bottomY)
        ) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        validPosition = true;
      }
    }
  }

  // If we still couldn't find a valid position, place it very far right
  if (!validPosition) {
    x = canvas.width + 400;
    y = groundY / 2;
  }

  coins.push({ x, y, r: radius, type, value, color, strokeColor });
}

// Function to check and fix coins that ended up inside pipes
function validateCoinPositions() {
  for (let i = coins.length - 1; i >= 0; i--) {
    let coin = coins[i];
    let isInsidePipe = false;

    for (let obstacle of obstacles) {
      // Check if coin is inside top pipe
      if (
        coin.x + coin.r > obstacle.x &&
        coin.x - coin.r < obstacle.x + obstacle.width &&
        coin.y - coin.r < obstacle.topHeight
      ) {
        isInsidePipe = true;
        break;
      }

      // Check if coin is inside bottom pipe
      if (
        coin.x + coin.r > obstacle.x &&
        coin.x - coin.r < obstacle.x + obstacle.width &&
        coin.y + coin.r > obstacle.bottomY
      ) {
        isInsidePipe = true;
        break;
      }
    }

    if (isInsidePipe) {
      // Remove the problematic coin - don't immediately respawn to avoid loops
      coins.splice(i, 1);
    }
  }
}

// Obstacle generator
function spawnObstacle() {
  const gapSize = 150;
  const topHeight = Math.random() * 150 + 80;
  const bottomY = topHeight + gapSize;
  const bottomHeight = groundY - bottomY;

  obstacles.push({
    x: canvas.width,
    width: 40,
    topHeight: topHeight,
    bottomY: bottomY,
    bottomHeight: bottomHeight,
    passed: false,
  });
}

async function handleGameOver() {
  gameRunning = false;
  showGameOverButtons = false; // Start with just the game over message

  // Decrease magnet rounds if player has magnets
  if (
    hasMagnet ||
    hasGoldMagnet ||
    hasMiniNuke ||
    hasSpringBoots ||
    hasEnergyCape
  ) {
    const inventory = {};

    if (hasMagnet) {
      magnetRoundsLeft--;
      if (magnetRoundsLeft <= 0) {
        hasMagnet = false;
        magnetRoundsLeft = 0;
      }
      inventory.magnetRoundsLeft = magnetRoundsLeft;
    }

    if (hasGoldMagnet) {
      goldMagnetRoundsLeft--;
      if (goldMagnetRoundsLeft <= 0) {
        hasGoldMagnet = false;
        goldMagnetRoundsLeft = 0;
      }
      inventory.goldMagnetRoundsLeft = goldMagnetRoundsLeft;
    }

    if (hasSpringBoots) {
      springBootsCount = 0;
      hasSpringBoots = false;
      inventory.springBootsCount = 0;
    }

    if (hasEnergyCape) {
      energyCapeRoundsLeft = 0;
      hasEnergyCape = false;
      inventory.energyCapeRoundsLeft = 0;
    }

    // Always include mini nuke count (doesn't decrease on game over)
    inventory.miniNukeCount = miniNukeCount;

    // Always include nuke count (doesn't decrease on game over)
    inventory.nukeCount = nukeCount;

    // Always include gold nuke count (doesn't decrease on game over)
    inventory.goldNukeCount = goldNukeCount;

    // Save updated inventory
    await savePlayerInventory(currentSession.sessionToken, inventory);
  }

  // Use obstacle score for leaderboard (pipes cleared)
  if (obstacleScore > 0) {
    await addToLeaderboard(currentSession.sessionToken, obstacleScore);
  }

  // Update player's personal high score
  if (obstacleScore > playerHighScore) {
    playerHighScore = obstacleScore;
    await savePlayerHighScore(currentSession.sessionToken, playerHighScore);
  }
}

// Legacy function removed - authentication handles player identification

// Function to calculate dynamic game speed based on score
function calculateGameSpeed() {
  // Ensure obstacleScore is valid and within reasonable bounds
  const safeScore = Math.max(0, Math.min(obstacleScore, 1500)); // Cap at 1500 points for safety

  // Increase speed by 0.3 for every 75 points from the start
  const speedIncreaseIntervals = Math.floor(safeScore / 75);
  const speedIncrease = speedIncreaseIntervals * 0.3;
  const calculatedSpeed = baseGameSpeed + speedIncrease;

  // Add maximum speed cap to prevent unplayable speeds
  const maxGameSpeed = baseGameSpeed + 10.0; // Increased cap for more challenge
  const finalSpeed = Math.min(calculatedSpeed, maxGameSpeed);

  // Debug logging for speed spikes
  if (finalSpeed > baseGameSpeed + 2.0) {
    console.log(
      `Warning: High game speed detected. Score: ${obstacleScore}, Speed: ${finalSpeed.toFixed(
        2
      )}`
    );
  }

  return finalSpeed;
}

function resetGame() {
  player.x = 70;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  obstacleScore = 0;
  gameSpeed = baseGameSpeed; // Reset game speed to base speed

  // Extra safety check to ensure baseGameSpeed is valid
  if (baseGameSpeed <= 0 || baseGameSpeed > 10) {
    console.warn(
      `Invalid baseGameSpeed detected: ${baseGameSpeed}, resetting to 2.5`
    );
    baseGameSpeed = 2.5;
    gameSpeed = 2.5;
  }

  coins = [];
  obstacles = [];
  gameRunning = true;
  gameStarted = false;
  gamePaused = false; // Reset pause state
  showLeaderboard = false;
  showShop = false;
  showColorPalette = false; // Reset color palette state
  showGameOverButtons = false; // Reset game over button state
  switchingPlayer = false;
  obstacleSpawnTimer = 0;
  validationTimer = 0;
  isJumpHeld = false;
  jumpHoldTimer = 0;
  isRocketActive = false; // Reset rocket state
  rocket = null; // Clear rocket object
  explosion = null; // Clear explosion state
  lastExplosionType = null; // Reset last explosion type
  isGhostActive = false; // Reset ghost mode state
  ghostModeActivationTime = 0; // Reset ghost mode timer
  for (let i = 0; i < 3; i++) spawnCoin();
}

function switchPlayer() {
  // Use the new authentication-based switch player function
  switchPlayerWithAuth();
}

function update() {
  // Desktop keyboard controls
  if (!isMobile) {
    if (keys["KeyN"] && !gameRunning) {
      switchPlayer();
    }

    if (keys["KeyL"]) {
      if (gameNameEntered) {
        showLeaderboard = !showLeaderboard;
        showShop = false; // Close shop when opening leaderboard
        showColorPalette = false; // Close color palette when opening leaderboard
        keys["KeyL"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyS"]) {
      if (gameNameEntered && (!gameRunning || !gameStarted)) {
        showShop = !showShop;
        showLeaderboard = false; // Close leaderboard when opening shop
        showColorPalette = false; // Close color palette when opening shop
        keys["KeyS"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyB"]) {
      if (showShop) {
        buyMagnetItem();
        keys["KeyB"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyC"]) {
      if (gameNameEntered && (!gameRunning || !gameStarted)) {
        showColorPalette = !showColorPalette;
        showLeaderboard = false; // Close other menus
        showShop = false;
        keys["KeyC"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyP"]) {
      if (gameNameEntered && gameRunning && gameStarted) {
        togglePause();
        keys["KeyP"] = false; // Prevent key repeat
      }
    }

    if (keys["Space"] || keys["ArrowUp"]) {
      // Skip if authentication screen is showing
      if (showAuthScreen) {
        return;
      }

      if (!gameNameEntered) {
        // Wait for authentication to complete - do nothing
        return;
      } else if (!gameRunning) {
        // If game is over but buttons aren't shown yet, show them
        if (!showGameOverButtons) {
          showGameOverButtons = true;
        }
        // Don't restart the game automatically when buttons are shown
        // Player must click the "Play Again" button instead
      } else if (gamePaused) {
        // Resume game and jump at the same time
        gamePaused = false;
        player.vy = jumpPower;
      } else if (!gameStarted) {
        gameStarted = true;
        player.vy = jumpPower;
      } else {
        player.vy = jumpPower;
      }
    }

    // Handle any other key press to show game over buttons
    if (!gameRunning && !showGameOverButtons && gameNameEntered) {
      const anyKeyPressed = Object.values(keys).some((key) => key);
      if (anyKeyPressed) {
        showGameOverButtons = true;
        // Clear all keys to prevent immediate actions
        Object.keys(keys).forEach((key) => (keys[key] = false));
      }
    }
  }

  if (gameRunning && gameStarted) {
    // Mobile hold-to-jump logic
    if (isMobile && isJumpHeld) {
      jumpHoldTimer += deltaTime;
      if (jumpHoldTimer >= 83.33) {
        // Every ~83ms (equivalent to every 5 frames at 60fps)
        // Apply jump when holding
        player.vy = jumpPower * 0.8; // Slightly less powerful for continuous jumps
        jumpHoldTimer = 0;
      }
    }
  }

  if (!gameRunning) return;

  // Check if game is paused
  if (gamePaused) return;

  // Update rocket if active
  updateRocket();

  // Update energy cape cooldown
  if (energyCapeReloadTimer > 0) {
    energyCapeReloadTimer -= deltaTime;
  }

  // Update explosion if active
  updateExplosion();

  // Calculate delta time multiplier (1.0 at 60fps)
  const deltaMultiplier = deltaTime / targetFrameTime;

  // Only apply gravity and movement if game has started
  if (gameStarted) {
    if (energyCapeActive) {
      // Dash physics: fly forward/right, ignore gravity
      player.x += player.vx * deltaMultiplier;
      player.y += player.vy * deltaMultiplier; // Should be 0 usually

      // Cap x position to avoid going too far
      if (player.x > canvas.width * 0.7) {
        player.x = canvas.width * 0.7;
      }
    } else {
      // Normal physics
      // If player is ahead of normal position (after dash), drift back
      if (player.x > 70) {
        player.x -= 3 * deltaMultiplier; // Drift back speed
        if (player.x < 70) player.x = 70;
      }

      // Gravity (frame-rate independent)
      player.vy += gravity * deltaMultiplier;
      player.y += player.vy * deltaMultiplier;
    }
  }

  // Ground collision
  if (player.y + player.h > groundY) {
    if (hasSpringBoots && springBootsCount > 0) {
      playBoingSound();
      player.vy = -16.3; // High vertical jump but safe from ceiling
      player.y = groundY - player.h - 10; // Immediate height boost
      console.log("Spring boots bounce!");
    } else if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
      // Activate ghost mode on first hit
      isGhostActive = true;
      ghostModeActivationTime = performance.now(); // Record activation time
      ghostShroomCount--;
      if (ghostShroomCount <= 0) {
        hasGhostShroom = false;
      }
      // Save updated inventory
      savePlayerInventory(currentSession.sessionToken, {
        magnetRoundsLeft: magnetRoundsLeft || 0,
        miniNukeCount: miniNukeCount,
        nukeCount: nukeCount,
        ghostShroomCount: ghostShroomCount,
      });
      console.log(
        "Ghost mode activated (ground hit)! Ghost shrooms left:",
        ghostShroomCount
      );
      // Bounce back up slightly to prevent getting stuck
      player.y = groundY - player.h;
      player.vy = -2;
    } else if (isGhostActive) {
      // Check if grace period has expired
      const timeSinceActivation = performance.now() - ghostModeActivationTime;
      if (timeSinceActivation > ghostModeGracePeriod) {
        // Grace period expired, trigger game over
        handleGameOver();
      } else {
        // During grace period, bounce back
        player.y = groundY - player.h;
        player.vy = -2;
      }
    } else {
      // No ghost shroom available
      handleGameOver();
    }
  }

  // Ceiling collision
  if (player.y < 0) {
    if (hasSpringBoots && springBootsCount > 0) {
      playBoingSound();
      player.vy = 16.3; // Bounce down
      player.y = 10; // Push away from ceiling
      console.log("Spring boots ceiling bounce!");
    } else if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
      // Activate ghost mode on first hit
      isGhostActive = true;
      ghostModeActivationTime = performance.now(); // Record activation time
      ghostShroomCount--;
      if (ghostShroomCount <= 0) {
        hasGhostShroom = false;
      }
      // Save updated inventory
      savePlayerInventory(currentSession.sessionToken, {
        magnetRoundsLeft: magnetRoundsLeft || 0,
        miniNukeCount: miniNukeCount,
        nukeCount: nukeCount,
        ghostShroomCount: ghostShroomCount,
      });
      console.log(
        "Ghost mode activated (ceiling hit)! Ghost shrooms left:",
        ghostShroomCount
      );
      // Bounce back down slightly to prevent getting stuck
      player.y = 0;
      player.vy = 2;
    } else if (isGhostActive) {
      // Check if grace period has expired
      const timeSinceActivation = performance.now() - ghostModeActivationTime;
      if (timeSinceActivation > ghostModeGracePeriod) {
        // Grace period expired, trigger game over
        handleGameOver();
      } else {
        // During grace period, bounce back
        player.y = 0;
        player.vy = 2;
      }
    } else {
      // No ghost shroom available
      handleGameOver();
    }
  }

  // Only move world objects if game has started
  if (gameStarted) {
    // Move obstacles (frame-rate independent)
    for (let obstacle of obstacles) {
      obstacle.x -= gameSpeed * deltaMultiplier;
    }

    // Move coins (frame-rate independent)
    for (let coin of coins) {
      coin.x -= gameSpeed * deltaMultiplier;
    }

    // Remove off-screen obstacles
    obstacles = obstacles.filter((obstacle) => obstacle.x > -obstacle.width);

    // Remove off-screen coins
    coins = coins.filter((coin) => coin.x > -coin.r);

    // Validate coin positions occasionally (every 1 second in real time)
    validationTimer += deltaTime;
    if (validationTimer > 1000) {
      // 1000ms = 1 second
      validateCoinPositions();
      validationTimer = 0;
    }

    // Spawn obstacles (every 2 seconds in real time)
    obstacleSpawnTimer += deltaTime;
    if (obstacleSpawnTimer > 2000) {
      // 2000ms = 2 seconds
      spawnObstacle();
      obstacleSpawnTimer = 0;
    }

    // Check coin collision
    for (let i = coins.length - 1; i >= 0; i--) {
      let coin = coins[i];
      let dx = player.x + player.w / 2 - coin.x;
      let dy = player.y + player.h / 2 - coin.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      // Magnet attraction (frame-rate independent)
      // Check for regular magnet first
      if (
        hasMagnet &&
        magnetRoundsLeft > 0 &&
        distance < magnetRadius &&
        distance > coin.r + player.w / 2
      ) {
        // Pull coin towards player with regular magnet
        const pullStrength = 0.7;
        const angle = Math.atan2(dy, dx);
        coin.x += Math.cos(angle) * pullStrength * gameSpeed * deltaMultiplier;
        coin.y += Math.sin(angle) * pullStrength * gameSpeed * deltaMultiplier;
      }
      // Check for gold magnet (stronger and wider range)
      else if (
        hasGoldMagnet &&
        goldMagnetRoundsLeft > 0 &&
        distance < goldMagnetRadius &&
        distance > coin.r + player.w / 2
      ) {
        // Pull coin towards player with gold magnet (stronger pull)
        const pullStrength = 1.4; // Double the strength of regular magnet
        const angle = Math.atan2(dy, dx);
        coin.x += Math.cos(angle) * pullStrength * gameSpeed * deltaMultiplier;
        coin.y += Math.sin(angle) * pullStrength * gameSpeed * deltaMultiplier;
      }

      // Collision detection
      if (distance < coin.r + player.w / 2) {
        coins.splice(i, 1);
        // Play coin pickup sound
        playCoinSound();
        // Add coin value directly to wallet
        totalCoinsWallet += coin.value;
        savePlayerWallet(currentSession.sessionToken, totalCoinsWallet);
        spawnCoin();
      }
    }

    // Check obstacle collision
    for (let obstacle of obstacles) {
      // Top pipe collision
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.w > obstacle.x &&
        player.y < obstacle.topHeight
      ) {
        if (energyCapeActive) {
          // Dash destroys the pipe!
          createExplosion(obstacle.x + obstacle.width / 2, obstacle.topHeight);
          playExplosionSound("miniNuke");

          // Move obstacle off-screen to be removed
          obstacle.x = -1000;

          // DO NOT consume touch immediately to allow passing through
          // energyCapeActive = false;

          console.log("Dash destroyed top pipe!");
          continue;
        } else if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
          // Activate ghost mode on first hit
          isGhostActive = true;
          ghostModeActivationTime = performance.now(); // Record activation time
          ghostShroomCount--;
          if (ghostShroomCount <= 0) {
            hasGhostShroom = false;
          }
          // Save updated inventory
          savePlayerInventory(currentSession.sessionToken, {
            magnetRoundsLeft: magnetRoundsLeft || 0,
            miniNukeCount: miniNukeCount,
            nukeCount: nukeCount,
            ghostShroomCount: ghostShroomCount,
          });
          console.log(
            "Ghost mode activated! Ghost shrooms left:",
            ghostShroomCount
          );
        } else if (isGhostActive) {
          // Check if grace period has expired
          const timeSinceActivation =
            performance.now() - ghostModeActivationTime;
          if (timeSinceActivation > ghostModeGracePeriod) {
            // Grace period expired, trigger game over
            handleGameOver();
          }
          // Otherwise, ignore collision during grace period
        } else {
          // No ghost shroom available
          handleGameOver();
        }
      }

      // Bottom pipe collision
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.w > obstacle.x &&
        player.y + player.h > obstacle.bottomY
      ) {
        if (energyCapeActive) {
          // Dash destroys the pipe!
          createExplosion(obstacle.x + obstacle.width / 2, obstacle.bottomY);
          playExplosionSound("miniNuke");

          // Move obstacle off-screen to be removed
          obstacle.x = -1000;

          // DO NOT consume dash immediately to allow passing through
          // energyCapeActive = false;

          console.log("Dash destroyed bottom pipe!");
          continue;
        } else if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
          // Activate ghost mode on first hit
          isGhostActive = true;
          ghostModeActivationTime = performance.now(); // Record activation time
          ghostShroomCount--;
          if (ghostShroomCount <= 0) {
            hasGhostShroom = false;
          }
          // Save updated inventory
          savePlayerInventory(currentSession.sessionToken, {
            magnetRoundsLeft: magnetRoundsLeft || 0,
            miniNukeCount: miniNukeCount,
            nukeCount: nukeCount,
            ghostShroomCount: ghostShroomCount,
          });
          console.log(
            "Ghost mode activated! Ghost shrooms left:",
            ghostShroomCount
          );
        } else if (isGhostActive) {
          // Check if grace period has expired
          const timeSinceActivation =
            performance.now() - ghostModeActivationTime;
          if (timeSinceActivation > ghostModeGracePeriod) {
            // Grace period expired, trigger game over
            handleGameOver();
          }
          // Otherwise, ignore collision during grace period
        } else {
          // No ghost shroom available
          handleGameOver();
        }
      }

      // Score when passing obstacle
      if (!obstacle.passed && player.x > obstacle.x + obstacle.width) {
        obstacle.passed = true;
        obstacleScore += 5;
        // Update game speed based on new score with safeguards
        const newSpeed = calculateGameSpeed();
        // Only update if the new speed is reasonable (prevent sudden spikes)
        if (newSpeed <= gameSpeed + 0.5) {
          gameSpeed = newSpeed;
        } else {
          console.warn(
            `Prevented speed spike: ${gameSpeed} → ${newSpeed}, keeping current speed`
          );
        }
      }
    }

    // Ensure there are always coins on screen
    const coinLimit =
      obstacleSpawnTimer < 0 && lastExplosionType === "goldNuke" ? 6 : 3;
    if (coins.length < coinLimit) {
      spawnCoin();
    }
  } // End of gameStarted condition
}

// Shop functions
async function buyMagnetItem() {
  const result = await buyMagnet(currentSession.sessionToken, totalCoinsWallet);
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    magnetRoundsLeft = result.inventory.magnetRoundsLeft;
    hasMagnet = magnetRoundsLeft > 0;
  }
}

async function buyGoldMagnetItem() {
  const result = await buyGoldMagnet(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    goldMagnetRoundsLeft = result.inventory.goldMagnetRoundsLeft;
    hasGoldMagnet = goldMagnetRoundsLeft > 0;
  }
}

async function buyMiniNukeItem() {
  const result = await buyMiniNuke(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    miniNukeCount = result.inventory.miniNukeCount;
    hasMiniNuke = miniNukeCount > 0;
  }
}

async function buyNukeItem() {
  const result = await buyNuke(currentSession.sessionToken, totalCoinsWallet);
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    nukeCount = result.inventory.nukeCount;
    hasNuke = nukeCount > 0;
  }
}

async function buyGoldNukeItem() {
  const result = await buyGoldNuke(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    goldNukeCount = result.inventory.goldNukeCount;
    hasGoldNuke = goldNukeCount > 0;
  }
}

async function buyGhostShroomItem() {
  const result = await buyGhostShroom(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    ghostShroomCount = result.inventory.ghostShroomCount;
    hasGhostShroom = ghostShroomCount > 0;
  }
}

async function buySpringBootsItem() {
  const result = await buySpringBoots(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    springBootsCount = result.inventory.springBootsCount;
    hasSpringBoots = springBootsCount > 0;
  }
}

async function buyEnergyCapeItem() {
  const result = await buyEnergyCape(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    energyCapeRoundsLeft = result.inventory.energyCapeRoundsLeft;
    hasEnergyCape = energyCapeRoundsLeft > 0;
  }
}

// Color palette functions
async function selectCatColor(colorName) {
  try {
    selectedCatColor = colorName;
    await savePlayerColor(currentSession.sessionToken, colorName);
    console.log("Color saved:", colorName);
  } catch (error) {
    console.error("Failed to save color:", error);
  }
}

// Pause function
function togglePause() {
  if (gameRunning && gameStarted) {
    gamePaused = !gamePaused;
  }
}

// Rocket functions
function launchRocket() {
  if (!hasMiniNuke || miniNukeCount <= 0 || isRocketActive) {
    return;
  }

  // Initialize rocket at player position
  rocket = {
    x: player.x + player.w,
    y: player.y + player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "miniNuke", // Track rocket type
  };

  isRocketActive = true;
  miniNukeCount--;

  // Save updated inventory
  savePlayerInventory(currentSession.sessionToken, {
    magnetRoundsLeft: magnetRoundsLeft || 0,
    miniNukeCount: miniNukeCount,
    nukeCount: nukeCount,
    goldNukeCount: goldNukeCount,
    ghostShroomCount: ghostShroomCount,
  });

  console.log("Mini nuke launched! Mini nukes left:", miniNukeCount);
}

function launchNuke() {
  if (!hasNuke || nukeCount <= 0 || isRocketActive) {
    return;
  }

  // Initialize nuke rocket at player position
  rocket = {
    x: player.x + player.w,
    y: player.y + player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "nuke", // Track rocket type
  };

  isRocketActive = true;
  nukeCount--;

  // Save updated inventory
  savePlayerInventory(currentSession.sessionToken, {
    magnetRoundsLeft: magnetRoundsLeft || 0,
    miniNukeCount: miniNukeCount,
    nukeCount: nukeCount,
    goldNukeCount: goldNukeCount,
    ghostShroomCount: ghostShroomCount,
  });

  console.log("Nuke launched! Nukes left:", nukeCount);
}

function launchGoldNuke() {
  if (!hasGoldNuke || goldNukeCount <= 0 || isRocketActive) {
    return;
  }

  // Initialize gold nuke rocket at player position
  rocket = {
    x: player.x + player.w,
    y: player.y + player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "goldNuke", // Track rocket type
  };

  isRocketActive = true;
  goldNukeCount--;

  // Save updated inventory
  savePlayerInventory(currentSession.sessionToken, {
    magnetRoundsLeft: magnetRoundsLeft || 0,
    miniNukeCount: miniNukeCount,
    nukeCount: nukeCount,
    goldNukeCount: goldNukeCount,
    ghostShroomCount: ghostShroomCount,
  });

  console.log("Gold Nuke launched! Gold Nukes left:", goldNukeCount);
}

function activateDash() {
  if (
    !hasEnergyCape ||
    energyCapeRoundsLeft <= 0 ||
    energyCapeReloadTimer > 0 ||
    isRocketActive ||
    energyCapeActive ||
    !gameStarted ||
    gamePaused
  ) {
    return;
  }

  energyCapeActive = true;
  energyCapeReloadTimer = energyCapeCooldown;

  // Apply initial boost
  player.vx = 15; // Fast forward speed
  player.vy = 0; // Float

  // Dash lasts for 500ms
  setTimeout(() => {
    energyCapeActive = false;
    // Note: We'll rely on update loop to handle deceleration/return
  }, 500);

  // Play a sound? Maybe the small explosion sound?
  playExplosionSound("miniNuke");
  console.log("Energy Cape Dash activated!");
}

function updateRocket() {
  if (!isRocketActive || !rocket) {
    return;
  }

  // Move rocket to the right
  rocket.x += rocket.speed * gameSpeed * (deltaTime / targetFrameTime);

  // Check if rocket reached the end of the screen
  if (rocket.x >= canvas.width) {
    // Create explosion at the edge of the screen
    createExplosion(canvas.width - 50, rocket.y + 12.5); // Center explosion on rocket
    explodeRocket();
  }
}

function createExplosion(x, y) {
  const isNuke = rocket && rocket.type === "nuke";
  const isGoldNuke = rocket && rocket.type === "goldNuke";

  let particleCount = 20;
  let maxVelocity = 2;
  let maxSize = 6;
  let duration = 500;
  let maxRadius = 80;

  if (isNuke) {
    particleCount = 60;
    maxVelocity = 6;
    maxSize = 18;
    duration = 1000;
    maxRadius = 240;
  } else if (isGoldNuke) {
    particleCount = 100; // Even more particles
    maxVelocity = 8;
    maxSize = 22;
    duration = 1500;
    maxRadius = 320;
  }

  const particles = [];

  // Create explosion particles
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * maxVelocity, // Random velocity in x direction
      vy: (Math.random() - 0.5) * maxVelocity, // Random velocity in y direction
      size: Math.random() * maxSize + 2, // Random size
      color: {
        r: 255,
        g: Math.floor(Math.random() * 100 + 100), // Yellow to red
        b: Math.floor(Math.random() * 50), // Little to no blue
      },
    });
  }

  explosion = {
    x: x,
    y: y,
    timer: 0,
    duration: duration,
    maxRadius: maxRadius,
    particles: particles,
  };
}

function updateExplosion() {
  if (!explosion) {
    return;
  }

  explosion.timer += deltaTime;

  // Remove explosion when done
  if (explosion.timer >= explosion.duration) {
    explosion = null;
  }
}

function explodeRocket() {
  if (!isRocketActive) {
    return;
  }

  const isNuke = rocket && rocket.type === "nuke";
  const isGoldNuke = rocket && rocket.type === "goldNuke";

  // Store explosion type for coin spawning logic
  lastExplosionType = rocket.type;

  // Play appropriate explosion sound based on rocket type
  playExplosionSound(rocket.type);

  let maxPipesToRemove = 3;
  let delayTime = -4000;

  if (isNuke) {
    maxPipesToRemove = 10;
    delayTime = -8000;
  } else if (isGoldNuke) {
    maxPipesToRemove = 20;
    delayTime = -16000; // Even longer clear path
  }

  const playerRightEdge = player.x + player.w;

  // Find and remove pipes that are ahead of the player (x position greater than player)
  const pipesAhead = obstacles
    .map((obstacle, index) => ({ obstacle, index }))
    .filter(({ obstacle }) => obstacle.x > playerRightEdge)
    .sort((a, b) => a.obstacle.x - b.obstacle.x); // Sort by x position (closest first)

  // Remove the pipes ahead (in reverse order to maintain array indices)
  const pipesToRemove = pipesAhead.slice(0, maxPipesToRemove);
  pipesToRemove
    .sort((a, b) => b.index - a.index) // Sort by index in reverse order
    .forEach(({ index }) => {
      obstacles.splice(index, 1);
    });

  const pipesRemovedCount = pipesToRemove.length;

  // Reset obstacle spawn timer to create a longer clear path
  obstacleSpawnTimer = delayTime;

  // Create delayed point awards for the full potential points (regardless of pipes actually removed)
  const pointDelay = Math.abs(delayTime) / maxPipesToRemove; // Divide delay evenly across max potential pipes

  for (let i = 0; i < maxPipesToRemove; i++) {
    setTimeout(() => {
      obstacleScore += 5; // Award 5 points per pipe

      // Update game speed based on new score with safeguards
      const newSpeed = calculateGameSpeed();
      // Only update if the new speed is reasonable (prevent sudden spikes)
      if (newSpeed <= gameSpeed + 0.5) {
        gameSpeed = newSpeed;
      } else {
        console.warn(
          `Prevented speed spike: ${gameSpeed} → ${newSpeed}, keeping current speed`
        );
      }

      let explosionName = "mini nuke";
      if (isNuke) explosionName = "nuke";
      if (isGoldNuke) explosionName = "gold nuke";

      console.log(
        `Awarded 5 points from ${explosionName} explosion (${
          i + 1
        }/${maxPipesToRemove})`
      );
    }, pointDelay * (i + 1));
  }

  let explosionName = "Mini nuke";
  if (isNuke) explosionName = "Nuke";
  if (isGoldNuke) explosionName = "Gold nuke";

  console.log(
    `${explosionName} exploded! Removed ${pipesRemovedCount} pipes, delayed spawning, will award ${
      pipesRemovedCount * 5
    } points over time`
  );

  // Reset rocket state
  isRocketActive = false;
  rocket = null;

  // Update inventory state
  if (miniNukeCount <= 0) {
    hasMiniNuke = false;
  }
  if (nukeCount <= 0) {
    hasNuke = false;
  }
  if (goldNukeCount <= 0) {
    hasGoldNuke = false;
  }
}

// ===================== draw.js =====================
// Function to draw a button
function drawButton(text, x, y, width, height, color) {
  // Button background
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  // Button border
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Button text
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, x + width / 2, y + height / 2 + 5);
}

function draw() {
  // Fill entire canvas with black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw cloudy background image for sky area
  if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    // Draw the background image tiled/stretched to fill the sky area
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, groundY);
  } else {
    // Fallback to solid color if image isn't loaded yet
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, groundY);
  }

  // Draw ground
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Draw obstacles (pipes) - Mario-style
  for (let obstacle of obstacles) {
    // Mario-style pipe colors
    const pipeGreen = "#228B22";
    const pipeDarkGreen = "#006400";
    const pipeHighlight = "#32CD32";
    const pipeShadow = "#1F5F1F";

    // Top pipe
    drawMarioPipe(obstacle.x, 0, obstacle.width, obstacle.topHeight, true);

    // Bottom pipe
    drawMarioPipe(
      obstacle.x,
      obstacle.bottomY,
      obstacle.width,
      obstacle.bottomHeight,
      false
    );
  }

  // Draw player
  if (isGhostActive) {
    // Check if we're in grace period
    const timeSinceActivation = performance.now() - ghostModeActivationTime;
    const inGracePeriod = timeSinceActivation <= ghostModeGracePeriod;

    // Draw ghost cat when in ghost mode
    if (
      ghostCatImage &&
      ghostCatImage.complete &&
      ghostCatImage.naturalHeight !== 0
    ) {
      // Add pulsing transparency during grace period
      if (inGracePeriod) {
        const pulse = Math.sin(timeSinceActivation / 100) * 0.2 + 0.6; // Pulse between 0.4 and 0.8
        ctx.globalAlpha = pulse;

        // Add glow effect during grace period
        ctx.shadowColor = "#88ff88";
        ctx.shadowBlur = 15;
      } else {
        ctx.globalAlpha = 0.7;
      }

      ctx.drawImage(ghostCatImage, player.x, player.y, player.w, player.h);
      ctx.globalAlpha = 1.0; // Reset alpha
      ctx.shadowBlur = 0; // Reset shadow
    } else {
      // Fallback to semi-transparent rectangle
      if (inGracePeriod) {
        const pulse = Math.sin(timeSinceActivation / 100) * 0.2 + 0.5;
        ctx.fillStyle = `rgba(200, 200, 255, ${pulse})`;
      } else {
        ctx.fillStyle = "rgba(200, 200, 255, 0.5)";
      }
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }
  } else if (
    catImages[selectedCatColor] &&
    catImages[selectedCatColor].complete &&
    catImages[selectedCatColor].naturalHeight !== 0
  ) {
    // Draw cat image if loaded
    ctx.drawImage(
      catImages[selectedCatColor],
      player.x,
      player.y,
      player.w,
      player.h
    );
  } else {
    // Fallback to colored rectangle if image not loaded
    ctx.fillStyle = gameRunning ? "#ff0" : "#f00";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // Draw energy cape if equipped (on top of player)
  if (hasEnergyCape && energyCapeRoundsLeft > 0 && !isGhostActive) {
    if (
      energyCapeImage &&
      energyCapeImage.complete &&
      energyCapeImage.naturalWidth > 0
    ) {
      // Draw cape on top of player
      // Adjust position to align with cat's back
      ctx.drawImage(energyCapeImage, player.x - 18, player.y - 5, 45, 45);
    }
  }

  // Draw coins
  for (let coin of coins) {
    // Add glow effect for rare coins
    if (coin.type === "red" || coin.type === "blue") {
      ctx.shadowColor = coin.color;
      ctx.shadowBlur = 10;
    }

    // Get the appropriate coin image based on type
    let coinImage;
    if (coin.type === "blue") {
      coinImage = blueCoinImage;
    } else if (coin.type === "red") {
      coinImage = redCoinImage;
    } else {
      coinImage = yellowCoinImage; // gold/yellow
    }

    // Draw coin image if loaded, otherwise fallback to circle
    if (coinImage.complete && coinImage.naturalWidth > 0) {
      // Calculate image size (twice the radius for diameter)
      const imageSize = coin.r * 2;
      ctx.drawImage(
        coinImage,
        coin.x - coin.r, // Center the image
        coin.y - coin.r,
        imageSize,
        imageSize
      );
    } else {
      // Fallback to circle if image not loaded
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
      ctx.fillStyle = coin.color;
      ctx.fill();
      ctx.strokeStyle = coin.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  // Draw rocket if active
  if (isRocketActive && rocket) {
    // Draw rocket trail
    ctx.fillStyle = "rgba(255, 165, 0, 0.6)"; // Orange trail
    ctx.fillRect(rocket.x - 20, rocket.y + 5, 20, 10);

    // Determine which image to use based on rocket type
    let rocketImage = miniNukeImage;
    if (rocket.type === "nuke") {
      rocketImage = nukeImage;
    } else if (rocket.type === "goldNuke") {
      rocketImage = goldNukeImage;
    }

    // Draw rocket image if loaded, otherwise use rectangle
    if (rocketImage && rocketImage.complete && rocketImage.naturalWidth > 0) {
      const rocketSize = 25;
      ctx.drawImage(rocketImage, rocket.x, rocket.y, rocketSize, rocketSize);
    } else {
      // Fallback rocket
      ctx.fillStyle = "#32CD32"; // Green color
      ctx.fillRect(rocket.x, rocket.y, 25, 15);
      // Add simple rocket tip
      ctx.beginPath();
      ctx.moveTo(rocket.x + 25, rocket.y + 7.5);
      ctx.lineTo(rocket.x + 35, rocket.y + 7.5);
      ctx.strokeStyle = "#228B22";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // Draw explosion if active
  if (explosion) {
    const progress = explosion.timer / explosion.duration;
    const maxRadius = explosion.maxRadius;
    const currentRadius = maxRadius * progress;

    // Draw multiple explosion rings
    for (let i = 0; i < 3; i++) {
      const ringProgress = Math.max(0, progress - i * 0.2);
      const ringRadius = maxRadius * ringProgress;
      const alpha = Math.max(0, 1 - ringProgress);

      if (ringRadius > 0) {
        // Outer explosion ring (orange/red)
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, ringRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${100 - i * 30}, 0, ${alpha * 0.6})`;
        ctx.fill();

        // Inner explosion ring (yellow/white)
        if (ringRadius > 10) {
          ctx.beginPath();
          ctx.arc(explosion.x, explosion.y, ringRadius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, ${100 + i * 50}, ${alpha * 0.8})`;
          ctx.fill();
        }
      }
    }

    // Draw explosion particles
    for (let particle of explosion.particles) {
      const particleProgress = explosion.timer / explosion.duration;
      const alpha = Math.max(0, 1 - particleProgress);

      ctx.beginPath();
      ctx.arc(
        particle.x + particle.vx * particleProgress * 100,
        particle.y + particle.vy * particleProgress * 100,
        particle.size * (1 - particleProgress * 0.5),
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
      ctx.fill();
    }
  }

  // Draw UI
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText("High Score: " + playerHighScore, canvas.width - 20, 25);
  ctx.fillText("💰 Wallet: " + totalCoinsWallet, canvas.width - 20, 45);

  // Show magnet status if active
  let uiLineOffset = 65;
  if (hasMagnet && magnetRoundsLeft > 0) {
    // Draw red magnet image
    if (
      redMagnetImage &&
      redMagnetImage.complete &&
      redMagnetImage.naturalWidth > 0
    ) {
      const imageSize = 16;
      const imageX =
        canvas.width -
        20 -
        ctx.measureText(" " + magnetRoundsLeft + " rounds").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(redMagnetImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(
        magnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    } else {
      // Fallback to emoji
      ctx.fillText(
        "🧲 " + magnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    }
    uiLineOffset += 20;
  }

  if (hasGoldMagnet && goldMagnetRoundsLeft > 0) {
    // Draw gold magnet image
    if (
      goldMagnetImage &&
      goldMagnetImage.complete &&
      goldMagnetImage.naturalWidth > 0
    ) {
      const imageSize = 16;
      const imageX =
        canvas.width -
        20 -
        ctx.measureText(" " + goldMagnetRoundsLeft + " rounds").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(goldMagnetImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(
        goldMagnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    } else {
      // Fallback to emoji
      ctx.fillText(
        "🟡 " + goldMagnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    }
    uiLineOffset += 20;
  }

  // Show ghost shroom status if active or in ghost mode
  if ((hasGhostShroom && ghostShroomCount > 0) || isGhostActive) {
    // Draw ghost shroom image
    if (
      ghostShroomImage &&
      ghostShroomImage.complete &&
      ghostShroomImage.naturalWidth > 0
    ) {
      const imageSize = 16;
      const text = isGhostActive ? "GHOST MODE!" : ghostShroomCount + " left";
      const imageX =
        canvas.width - 20 - ctx.measureText(" " + text).width - imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(ghostShroomImage, imageX, imageY, imageSize, imageSize);

      // Add glow effect when ghost mode is active
      if (isGhostActive) {
        ctx.shadowColor = "#88ff88";
        ctx.shadowBlur = 10;
      }

      ctx.fillText(text, canvas.width - 20, uiLineOffset);

      // Reset shadow
      ctx.shadowBlur = 0;
    } else {
      // Fallback to emoji
      const text = isGhostActive
        ? "👻 GHOST MODE!"
        : "👻 " + ghostShroomCount + " left";

      // Add glow effect when ghost mode is active
      if (isGhostActive) {
        ctx.shadowColor = "#88ff88";
        ctx.shadowBlur = 10;
      }

      ctx.fillText(text, canvas.width - 20, uiLineOffset);

      // Reset shadow
      ctx.shadowBlur = 0;
    }
    uiLineOffset += 20;
  }

  // Show spring boots status if active
  if (hasSpringBoots && springBootsCount > 0) {
    // Draw spring boots image
    if (
      springBootsImage &&
      springBootsImage.complete &&
      springBootsImage.naturalWidth > 0
    ) {
      const imageSize = 16;
      const imageX =
        canvas.width -
        20 -
        ctx.measureText(" " + springBootsCount + " left").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(springBootsImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(springBootsCount + " left", canvas.width - 20, uiLineOffset);
    } else {
      // Fallback to emoji
      ctx.fillText(
        "👢 " + springBootsCount + " left",
        canvas.width - 20,
        uiLineOffset
      );
    }
    uiLineOffset += 20;
  }

  // Draw pause button (only when game is running and started)
  if (gameRunning && gameStarted && gameNameEntered && !showAuthScreen) {
    const buttonSize = 30; // Size for the emoji area
    const buttonX = canvas.width - buttonSize - 15;
    const buttonY = uiLineOffset;

    // Store button coordinates for click detection
    pauseButtonCoords = {
      x: buttonX,
      y: buttonY,
      width: buttonSize,
      height: buttonSize,
    };

    // Just draw the emoji (no background or border)
    ctx.fillStyle = "#fff";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      gamePaused ? "▶️" : "⏸️",
      buttonX + buttonSize / 2,
      buttonY + buttonSize / 2 + 8
    );

    // Reset action button coordinates
    rocketButtonCoords = {};
    nukeButtonCoords = {};
    goldNukeButtonCoords = {};
    energyCapeButtonCoords = {};

    // Draw action buttons (bottom bar)
    // Ground area starts at groundY and goes to canvas.height (~80px height)
    const actionBtnSize = 50;
    const actionBtnGap = 15;
    const actionBtnY = groundY + (canvas.height - groundY - actionBtnSize) / 2;

    // We will lay them out from Right to Left, starting near the right edge
    let currentActionX = canvas.width - 20 - actionBtnSize;

    // Helper function to draw an action button slot
    const drawActionSlot = (
      image,
      fallbackEmoji,
      count,
      isActive,
      isCooldown,
      cooldownProgress
    ) => {
      // Draw background box
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent dark background
      ctx.fillRect(currentActionX, actionBtnY, actionBtnSize, actionBtnSize);

      // Draw border
      ctx.strokeStyle = isActive ? "#FFFF00" : "#FFFFFF"; // Yellow if active, White otherwise
      ctx.lineWidth = 2;
      ctx.strokeRect(currentActionX, actionBtnY, actionBtnSize, actionBtnSize);

      // Draw image or emoji
      if (image && image.complete && image.naturalWidth > 0) {
        const imgSize = actionBtnSize - 10;
        ctx.drawImage(
          image,
          currentActionX + 5,
          actionBtnY + 5,
          imgSize,
          imgSize
        );
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          fallbackEmoji,
          currentActionX + actionBtnSize / 2,
          actionBtnY + actionBtnSize / 2 + 8
        );
      }

      // Draw count badge
      if (count !== undefined && count !== null) {
        const countText = count + "x";
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "right";
        // Shadow for better visibility
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.fillText(
          countText,
          currentActionX + actionBtnSize - 5,
          actionBtnY + actionBtnSize - 5
        );
        ctx.shadowBlur = 0; // Reset shadow
        ctx.textAlign = "left"; // Reset defaults
      }

      // Draw cooldown overlay
      if (isCooldown && cooldownProgress > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.beginPath();
        ctx.moveTo(
          currentActionX + actionBtnSize / 2,
          actionBtnY + actionBtnSize / 2
        );
        ctx.arc(
          currentActionX + actionBtnSize / 2,
          actionBtnY + actionBtnSize / 2,
          actionBtnSize / 2,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * cooldownProgress
        );
        ctx.lineTo(
          currentActionX + actionBtnSize / 2,
          actionBtnY + actionBtnSize / 2
        );
        ctx.fill();
      }

      // Return coordinates for click detection
      const coords = {
        x: currentActionX,
        y: actionBtnY,
        width: actionBtnSize,
        height: actionBtnSize,
      };

      // Move X to the left for the next button
      currentActionX -= actionBtnSize + actionBtnGap;

      return coords;
    };

    // Draw buttons from Right to Left

    // 1. Energy Cape (Rightmost)
    if (hasEnergyCape && energyCapeRoundsLeft > 0) {
      energyCapeButtonCoords = drawActionSlot(
        energyCapeImage,
        "⚡",
        energyCapeRoundsLeft,
        energyCapeActive,
        energyCapeReloadTimer > 0 || isRocketActive,
        energyCapeReloadTimer > 0
          ? energyCapeReloadTimer / energyCapeCooldown
          : isRocketActive
          ? 1
          : 0
      );
    }

    // 2. Gold Nuke
    if (hasGoldNuke && goldNukeCount > 0) {
      goldNukeButtonCoords = drawActionSlot(
        goldNukeImage,
        "☢️",
        goldNukeCount,
        false,
        isRocketActive,
        isRocketActive ? 1 : 0
      );
    }

    // 3. Nuke
    if (hasNuke && nukeCount > 0) {
      nukeButtonCoords = drawActionSlot(
        nukeImage,
        "💥",
        nukeCount,
        false,
        isRocketActive,
        isRocketActive ? 1 : 0
      );
    }

    // 4. Mini Nuke (Leftmost)
    if (hasMiniNuke && miniNukeCount > 0) {
      rocketButtonCoords = drawActionSlot(
        miniNukeImage,
        "🚀",
        miniNukeCount,
        false,
        isRocketActive,
        isRocketActive ? 1 : 0
      );
    }

    // Reset text alignment and font size
    ctx.textAlign = "right";
    ctx.font = "16px Arial"; // Reset font size back to normal
  }

  // Reset text properties for score display
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff"; // Reset to white for score text
  ctx.fillText("Score: " + obstacleScore, 20, 25);

  // Add shadow to online count for better contrast
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText("👥 Online: " + onlineCount, 20, groundY - 10); // Bottom left corner

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Pause overlay
  if (gamePaused && gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "18px Arial";
    if (isMobile) {
      ctx.fillText(
        "Tap to resume and jump",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    } else {
      ctx.fillText(
        "Press SPACE to resume and jump",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }

    ctx.textAlign = "left";
    return; // Don't draw other overlays when paused
  }

  // Game over message
  if (!gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = "18px Arial";
    ctx.fillText(
      `Final Score: ${obstacleScore}`,
      canvas.width / 2,
      canvas.height / 2 - 20
    );
    ctx.fillText(
      `💰 Total Wallet: ${totalCoinsWallet}`,
      canvas.width / 2,
      canvas.height / 2 + 5
    );

    if (!showGameOverButtons) {
      // Show "tap to continue" message
      ctx.font = "16px Arial";
      if (isMobile) {
        ctx.fillText(
          "Tap to continue",
          canvas.width / 2,
          canvas.height / 2 + 50
        );
      } else {
        ctx.fillText(
          "Press any key to continue",
          canvas.width / 2,
          canvas.height / 2 + 50
        );
      }
    } else {
      // Clear previous buttons
      gameOverButtons = [];

      // Draw in-canvas buttons
      const buttonWidth = 140;
      const buttonHeight = isMobile ? 55 : 35; // Even taller buttons on mobile
      const buttonSpacing = isMobile ? 55 : 50; // Spacing = height to eliminate gaps

      // Position buttons to match visual expectations on mobile
      // Move buttons UP significantly to align with where they visually appear
      const startY = isMobile ? 250 : canvas.height / 2 + 10;

      // Play Again button
      const playAgainY = startY;
      drawButton(
        "🔄 Play Again",
        canvas.width / 2 - buttonWidth / 2,
        playAgainY,
        buttonWidth,
        buttonHeight,
        "#4CAF50"
      );
      gameOverButtons.push({
        x: canvas.width / 2 - buttonWidth / 2,
        y: playAgainY,
        width: buttonWidth,
        height: buttonHeight,
        action: "playAgain",
      });

      // Leaderboard button
      const leaderboardY = startY + buttonSpacing;
      drawButton(
        "🏆 Leaderboard",
        canvas.width / 2 - buttonWidth / 2,
        leaderboardY,
        buttonWidth,
        buttonHeight,
        "#2196F3"
      );
      gameOverButtons.push({
        x: canvas.width / 2 - buttonWidth / 2,
        y: leaderboardY,
        width: buttonWidth,
        height: buttonHeight,
        action: "leaderboard",
      });

      // Shop button
      const shopY = startY + buttonSpacing * 2;
      drawButton(
        "🛒 Shop",
        canvas.width / 2 - buttonWidth / 2,
        shopY,
        buttonWidth,
        buttonHeight,
        "#FF9800"
      );
      gameOverButtons.push({
        x: canvas.width / 2 - buttonWidth / 2,
        y: shopY,
        width: buttonWidth,
        height: buttonHeight,
        action: "shop",
      });

      // Color Palette button
      const colorPaletteY = startY + buttonSpacing * 3;
      drawButton(
        "🎨 Colors",
        canvas.width / 2 - buttonWidth / 2,
        colorPaletteY,
        buttonWidth,
        buttonHeight,
        "#E91E63"
      );
      gameOverButtons.push({
        x: canvas.width / 2 - buttonWidth / 2,
        y: colorPaletteY,
        width: buttonWidth,
        height: buttonHeight,
        action: "colorPalette",
      });

      // Switch Player button
      const switchPlayerY = startY + buttonSpacing * 4;
      drawButton(
        "👤 Switch Player",
        canvas.width / 2 - buttonWidth / 2,
        switchPlayerY,
        buttonWidth,
        buttonHeight,
        "#9C27B0"
      );
      gameOverButtons.push({
        x: canvas.width / 2 - buttonWidth / 2,
        y: switchPlayerY,
        width: buttonWidth,
        height: buttonHeight,
        action: "switchPlayer",
      });
    }

    ctx.textAlign = "left";
  }

  // Authentication screen
  if (showAuthScreen) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Welcome to Flappy Cat!",
      canvas.width / 2,
      canvas.height / 2 - 100
    );

    ctx.font = "20px Arial";
    ctx.fillText(
      "Please login or sign up to play",
      canvas.width / 2,
      canvas.height / 2 - 20
    );
    ctx.fillText(
      "and save your progress!",
      canvas.width / 2,
      canvas.height / 2 + 10
    );

    ctx.textAlign = "left";
    return; // Don't draw game elements during authentication
  }

  // Skip legacy name entry if using authentication
  if (!gameNameEntered && !showAuthScreen && authMode !== "authenticated") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Please use the login form to continue",
      canvas.width / 2,
      canvas.height / 2
    );

    ctx.textAlign = "left";
    return;
  }

  // Start message
  if (!gameStarted && gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Ready, ${playerName}?`,
      canvas.width / 2,
      canvas.height / 2 - 20
    );
    ctx.font = "20px Arial";
    if (isMobile) {
      ctx.fillText(
        "Tap screen to Start!",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    } else {
      ctx.fillText(
        "Press SPACE to Start!",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }
    if (!isMobile) {
      ctx.fillText(
        "Press L to view Leaderboard",
        canvas.width / 2,
        canvas.height / 2 + 45
      );
      ctx.fillText(
        "Press N to Switch Player",
        canvas.width / 2,
        canvas.height / 2 + 70
      );
      ctx.fillText(
        "Press S to open Shop",
        canvas.width / 2,
        canvas.height / 2 + 95
      );
      ctx.fillText(
        "Press C for Color Palette",
        canvas.width / 2,
        canvas.height / 2 + 120
      );
    }
    ctx.textAlign = "left";
  }

  // Leaderboard overlay
  if (showLeaderboard) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏆 LEADERBOARD 🏆", canvas.width / 2, 50);

    ctx.font = "16px Arial";
    const startY = 90;
    const lineHeight = 25;
    const catSize = 18; // Small cat icon size

    for (let i = 0; i < Math.min(leaderboard.length, 20); i++) {
      const entry = leaderboard[i];
      const y = startY + i * lineHeight;
      const rank = i + 1;
      const medal =
        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;

      // Get player's cat color (default to gray if not available)
      const playerColor = entry.color || "gray";

      // Calculate positions for medal, cat, and text
      const centerX = canvas.width / 2;
      const textWidth = ctx.measureText(
        `${medal} ${entry.name} - ${entry.score}`
      ).width;
      const startX = centerX - textWidth / 2;

      // Draw medal first
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(medal, startX, y);

      // Measure medal width to position cat after it
      const medalWidth = ctx.measureText(medal + " ").width;

      // Draw tiny cat icon after the medal
      if (catImages[playerColor] && catImages[playerColor].complete) {
        const catX = startX + medalWidth;
        const catY = y - catSize / 2 - 5; // Center vertically with text
        ctx.drawImage(catImages[playerColor], catX, catY, catSize, catSize);
      }

      // Draw the rest of the text (name and score) after the cat
      const nameScoreText = ` ${entry.name} - ${entry.score}`;
      const nameX = startX + medalWidth + catSize + 4; // 4px padding after cat
      ctx.fillText(nameScoreText, nameX, y);
    }

    // Reset text alignment for the close instruction
    ctx.textAlign = "center";
    ctx.font = "18px Arial";
    if (isMobile) {
      // No text on mobile for leaderboard close instruction
    } else {
      ctx.fillText("Press L to close", canvas.width / 2, canvas.height - 50);
    }
    ctx.textAlign = "left";
  }

  // Shop overlay
  if (showShop) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🛒 SHOP 🛒", canvas.width / 2, 50);

    ctx.font = "16px Arial";
    ctx.fillText(
      `💰 Your Wallet: ${totalCoinsWallet} coins`,
      canvas.width / 2,
      80
    );

    // Draw close button (X) in top right corner - bigger for mobile
    const closeButtonSize = isMobile ? 50 : 30;
    const closeButtonX = canvas.width - closeButtonSize - 10;
    const closeButtonY = 10;

    // Store close button coordinates for click detection
    closeButtonCoords = {
      x: closeButtonX,
      y: closeButtonY,
      size: closeButtonSize,
    };

    // Close button background
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);

    // Close button border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      closeButtonX,
      closeButtonY,
      closeButtonSize,
      closeButtonSize
    );

    // Close button X
    ctx.fillStyle = "#fff";
    ctx.font = isMobile ? "30px Arial" : "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "✕",
      closeButtonX + closeButtonSize / 2,
      closeButtonY + closeButtonSize / 2 + (isMobile ? 10 : 7)
    );

    // Draw shop items grid with 4-column layout like color palette
    // Grid configuration - exactly like color palette
    const itemsPerRow = 4;

    // Use fixed canvas dimensions for calculation (mobile = 400px wide)
    const baseCanvasWidth = isMobile ? 400 : canvas.width;
    const itemSize = isMobile ? 65 : 60;
    const spacingX = isMobile ? 85 : 80;
    const spacingY = isMobile ? 130 : 120; // Increased vertical spacing to prevent overlap
    const touchPadding = isMobile ? 15 : 5;

    // Calculate grid positioning based on logical canvas size
    const totalGridWidth = itemsPerRow * spacingX;
    const startX = baseCanvasWidth / 2 - totalGridWidth / 2 + spacingX / 2;
    const startY = 120;

    // Clear the shop grid coordinates array
    shopGridCoords = [];

    for (let i = 0; i < availableShopItems.length; i++) {
      const item = availableShopItems[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      // Calculate exact positions
      const x = startX + col * spacingX - itemSize / 2;
      const y = startY + row * spacingY - itemSize / 2;

      // Store coordinates for click detection with larger touch area
      shopGridCoords.push({
        itemId: item.id,
        itemName: item.name,
        x: x - touchPadding,
        y: y - touchPadding,
        width: itemSize + touchPadding * 2,
        height: itemSize + touchPadding * 2,
      });

      // Determine if item can be purchased
      const canAfford = totalCoinsWallet >= item.price;
      const isOwned =
        (item.id === "magnet" && magnetRoundsLeft > 0) ||
        (item.id === "goldMagnet" && goldMagnetRoundsLeft > 0) ||
        (item.id === "ghostShroom" && ghostShroomCount > 0) ||
        (item.id === "springBoots" && springBootsCount > 0) ||
        (item.id === "miniNuke" && miniNukeCount > 0) ||
        (item.id === "nuke" && nukeCount > 0) ||
        (item.id === "goldNuke" && goldNukeCount > 0) ||
        (item.id === "energyCape" && energyCapeRoundsLeft > 0);

      // Draw item box background with better colors
      if (isOwned) {
        ctx.fillStyle = "#4CAF50"; // Green if owned
      } else if (canAfford) {
        ctx.fillStyle = "#2196F3"; // Blue if affordable
      } else {
        ctx.fillStyle = "#424242"; // Dark gray if can't afford
      }
      ctx.fillRect(x, y, itemSize, itemSize);

      // Draw selection/status border
      if (isOwned) {
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 2, y - 2, itemSize + 4, itemSize + 4);
      } else if (canAfford) {
        ctx.strokeStyle = "#FFD700"; // Gold border if can afford
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 1, y - 1, itemSize + 2, itemSize + 2);
      } else {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, itemSize, itemSize);
      }

      // Draw item icon (image instead of emoji when available)
      let itemImage = null;
      if (item.id === "magnet") {
        itemImage = redMagnetImage;
      } else if (item.id === "goldMagnet") {
        itemImage = goldMagnetImage;
      } else if (item.id === "ghostShroom") {
        itemImage = ghostShroomImage;
      } else if (item.id === "springBoots") {
        itemImage = springBootsImage;
      } else if (item.id === "miniNuke") {
        itemImage = miniNukeImage;
      } else if (item.id === "nuke") {
        itemImage = nukeImage;
      } else if (item.id === "goldNuke") {
        itemImage = goldNukeImage;
      } else if (item.id === "energyCape") {
        itemImage = energyCapeImage;
      }

      if (itemImage && itemImage.complete && itemImage.naturalWidth > 0) {
        // Draw item image
        const imageSize = isMobile ? 36 : 42; // Quite a bit bigger than before (was 24/28)
        const imageX = x + itemSize / 2 - imageSize / 2;
        const imageY = y + itemSize / 2 - imageSize / 2;
        ctx.drawImage(itemImage, imageX, imageY, imageSize, imageSize);
      } else {
        // Fallback to emoji if image not loaded
        ctx.fillStyle = "#fff";
        ctx.font = isMobile ? "32px Arial" : "36px Arial";
        ctx.textAlign = "center";
        const iconText = item.name.split(" ")[0]; // Get the emoji part
        ctx.fillText(
          iconText,
          x + itemSize / 2,
          y + itemSize / 2 + (isMobile ? 10 : 12)
        );
      }

      // Draw item name below the box
      ctx.fillStyle = "#fff";
      ctx.font = isMobile ? "10px Arial" : "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        item.name.substring(2), // Remove emoji from name
        x + itemSize / 2,
        y + itemSize + 15
      );

      // Draw price below name
      ctx.font = isMobile ? "9px Arial" : "10px Arial";
      ctx.fillText(`💰 ${item.price}`, x + itemSize / 2, y + itemSize + 28);

      // Draw status indicator
      if (isOwned) {
        ctx.fillStyle = "#4CAF50";
        ctx.font = isMobile ? "8px Arial" : "9px Arial";
        let statusText = "✓ Owned";
        if (item.id === "magnet") {
          statusText = `✓ ${magnetRoundsLeft} left`;
        } else if (item.id === "goldMagnet") {
          statusText = `✓ ${goldMagnetRoundsLeft} left`;
        } else if (item.id === "ghostShroom") {
          statusText = `✓ ${ghostShroomCount} left`;
        } else if (item.id === "springBoots") {
          statusText = `✓ ${springBootsCount} left`;
        } else if (item.id === "miniNuke") {
          statusText = `✓ ${miniNukeCount} left`;
        } else if (item.id === "nuke") {
          statusText = `✓ ${nukeCount} left`;
        } else if (item.id === "energyCape") {
          statusText = `✓ ${energyCapeRoundsLeft} left`;
        } else if (item.id === "goldNuke") {
          statusText = `✓ ${goldNukeCount} left`;
        }
        ctx.fillText(statusText, x + itemSize / 2, y + itemSize + 40);
      } else if (!canAfford) {
        ctx.fillStyle = "#FF6B6B";
        ctx.font = isMobile ? "8px Arial" : "9px Arial";
        ctx.fillText("Need more coins", x + itemSize / 2, y + itemSize + 40);
      }
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    if (isMobile) {
      ctx.fillText("Tap an item to buy", canvas.width / 2, canvas.height - 50);
    } else {
      ctx.fillText(
        "Click an item to buy",
        canvas.width / 2,
        canvas.height - 50
      );
    }
    ctx.textAlign = "left";
  }

  // Color palette overlay
  if (showColorPalette) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎨 COLOR PALETTE 🎨", canvas.width / 2, 50);

    // Draw close button (X) in top right corner - bigger for mobile
    const closeButtonSize = isMobile ? 50 : 30; // Even bigger for mobile
    const closeButtonX = canvas.width - closeButtonSize - 10;
    const closeButtonY = 10;

    // Store close button coordinates for click detection
    closeButtonCoords = {
      x: closeButtonX,
      y: closeButtonY,
      size: closeButtonSize,
    };

    // Close button background
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);

    // Close button border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      closeButtonX,
      closeButtonY,
      closeButtonSize,
      closeButtonSize
    );

    // Close button X
    ctx.fillStyle = "#fff";
    ctx.font = isMobile ? "30px Arial" : "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "✕",
      closeButtonX + closeButtonSize / 2,
      closeButtonY + closeButtonSize / 2 + (isMobile ? 10 : 7)
    );

    ctx.font = "16px Arial";
    ctx.fillText("Choose your cat color", canvas.width / 2, 80);

    // Draw color grid with fixed positioning for consistent coordinates
    const colorsPerRow = 4;

    // Use fixed canvas dimensions for calculation (mobile = 400px wide)
    const baseCanvasWidth = isMobile ? 400 : canvas.width;
    const colorSize = isMobile ? 65 : 60;
    const spacing = isMobile ? 85 : 80;
    const touchPadding = isMobile ? 15 : 5; // Generous touch area on mobile

    // Calculate grid positioning based on logical canvas size
    const totalGridWidth = colorsPerRow * spacing;
    const startX = baseCanvasWidth / 2 - totalGridWidth / 2 + spacing / 2;
    const startY = 120;

    // Clear the color grid coordinates array
    colorGridCoords = [];

    for (let i = 0; i < availableColors.length; i++) {
      const color = availableColors[i];
      const row = Math.floor(i / colorsPerRow);
      const col = i % colorsPerRow;

      // Calculate exact positions
      const x = startX + col * spacing - colorSize / 2;
      const y = startY + row * spacing - colorSize / 2;

      // Store coordinates for click detection with larger touch area
      colorGridCoords.push({
        color: color.name,
        x: x - touchPadding,
        y: y - touchPadding,
        width: colorSize + touchPadding * 2,
        height: colorSize + touchPadding * 2,
      });

      // Draw color preview box
      if (catImages[color.name] && catImages[color.name].complete) {
        // Draw cat image as preview
        ctx.drawImage(catImages[color.name], x, y, colorSize, colorSize);
      } else {
        // Fallback colored rectangle
        ctx.fillStyle = getColorHex(color.name);
        ctx.fillRect(x, y, colorSize, colorSize);
      }

      // Draw selection border
      if (selectedCatColor === color.name) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 2, y - 2, colorSize + 4, colorSize + 4);
      } else {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, colorSize, colorSize);
      }

      // Draw color name
      ctx.fillStyle = "#fff";
      ctx.font = isMobile ? "12px Arial" : "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(color.displayName, x + colorSize / 2, y + colorSize + 15);
    }

    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Tap a color to select", canvas.width / 2, canvas.height - 50);
    ctx.textAlign = "left";
  }
}

// Mario-style pipe drawing function
function drawMarioPipe(x, y, width, height, isTop) {
  const rimHeight = 20;
  const pipeBodyHeight = isTop ? height - rimHeight : height - rimHeight;
  const pipeBodyY = isTop ? y : y + rimHeight;
  const rimY = isTop ? height - rimHeight : y;
  const rimWidth = width + 8; // Slightly wider rim
  const rimX = x - 4;

  // Main pipe colors
  const pipeGreen = "#228B22";
  const pipeDarkGreen = "#006400";
  const pipeHighlight = "#32CD32";
  const pipeShadow = "#1F5F1F";

  // Draw pipe rim (the lip/opening)
  ctx.fillStyle = pipeGreen;
  ctx.fillRect(rimX, rimY, rimWidth, rimHeight);

  // Rim highlights and shadows for 3D effect
  ctx.fillStyle = pipeHighlight;
  ctx.fillRect(rimX, rimY, rimWidth, 3); // Top highlight
  ctx.fillRect(rimX, rimY, 3, rimHeight); // Left highlight

  ctx.fillStyle = pipeShadow;
  ctx.fillRect(rimX, rimY + rimHeight - 3, rimWidth, 3); // Bottom shadow
  ctx.fillRect(rimX + rimWidth - 3, rimY, 3, rimHeight); // Right shadow

  // Draw main pipe body
  ctx.fillStyle = pipeGreen;
  ctx.fillRect(x, pipeBodyY, width, pipeBodyHeight);

  // Pipe body highlights and shadows
  ctx.fillStyle = pipeHighlight;
  ctx.fillRect(x, pipeBodyY, 4, pipeBodyHeight); // Left highlight strip

  ctx.fillStyle = pipeShadow;
  ctx.fillRect(x + width - 4, pipeBodyY, 4, pipeBodyHeight); // Right shadow strip

  // Add vertical highlight lines for texture
  ctx.fillStyle = pipeHighlight;
  for (let i = 12; i < width - 12; i += 8) {
    ctx.fillRect(x + i, pipeBodyY, 1, pipeBodyHeight);
  }

  // Dark border around everything
  ctx.strokeStyle = pipeDarkGreen;
  ctx.lineWidth = 2;
  ctx.strokeRect(rimX, rimY, rimWidth, rimHeight); // Rim border
  ctx.strokeRect(x, pipeBodyY, width, pipeBodyHeight); // Body border

  // Inner rim shadow for depth
  if (isTop) {
    ctx.fillStyle = pipeShadow;
    ctx.fillRect(rimX + 2, rimY + rimHeight - 6, rimWidth - 4, 4);
  } else {
    ctx.fillStyle = pipeHighlight;
    ctx.fillRect(rimX + 2, rimY + 2, rimWidth - 4, 4);
  }
}

// Helper function to get hex color for fallback rectangles
function getColorHex(colorName) {
  const colorMap = {
    gray: "#808080",
    blue: "#0066FF",
    brown: "#8B4513",
    cyan: "#00FFFF",
    fire: "#FF4500",
    galaxy: "#663399",
    green: "#00FF00",
    ice: "#B0E0E6",
    lime: "#32CD32",
    magenta: "#FF00FF",
    orange: "#FFA500",
    pink: "#FFC0CB",
    purple: "#800080",
    rainbow: "#FF69B4",
    red: "#FF0000",
    yellow: "#FFFF00",
  };
  return colorMap[colorName] || "#808080";
}

// ===================== main.js =====================
// Authentication setup
setupAuthentication();

// Initialize authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Check for existing session
    const session = loadSession();
    if (session) {
      const isValid = await validateSession(session.sessionToken);
      if (isValid) {
        currentSession = session;
        authMode = "authenticated";
        playerName = session.username;
        showAuthScreen = false;

        // Set game state flags properly
        gameNameEntered = true;
        nameInputActive = false;

        await initializeGameData();
        startHeartbeat(session.sessionToken); // Start tracking online status
        startGame();
        return;
      } else {
        // Invalid session, clear it
        clearSession();
      }
    }

    // No valid session, show auth form
    showAuthScreen = true;
    authMode = "login";
    showAuthForm();
  } catch (error) {
    console.error("Auth initialization error:", error);
    showAuthScreen = true;
    authMode = "login";
    showAuthForm();
  }

  // Update online count periodically
  updateOnlineCount();
  setInterval(updateOnlineCount, 30000); // Update every 30 seconds
});

// Add window close detection to properly log out user
window.addEventListener("beforeunload", (event) => {
  if (currentSession && currentSession.sessionToken) {
    // Use sendBeacon with proper content type for logout on page close
    const blob = new Blob(
      [
        JSON.stringify({
          sessionToken: currentSession.sessionToken,
        }),
      ],
      { type: "application/json" }
    );

    navigator.sendBeacon("/api/auth/logout-beacon", blob);
  }
});

// Also handle visibility change (tab switching, minimizing)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && currentSession) {
    // Tab became visible again, send heartbeat
    updateOnlineCount();
  }
});

async function updateOnlineCount() {
  try {
    console.log("Calling getOnlineCount...");
    const count = await getOnlineCount();
    onlineCount = count;
    console.log("Updated onlineCount to:", onlineCount);
  } catch (error) {
    console.error("Failed to get online count:", error);
  }
}

function setupAuthentication() {
  const authForm = document.getElementById("authForm");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const authToggleBtn = document.getElementById("authToggleBtn");
  const authToggleText = document.getElementById("authToggleText");
  const authError = document.getElementById("authError");

  // Toggle between login and signup
  authToggleBtn.addEventListener("click", () => {
    if (authMode === "login") {
      authMode = "signup";
      loginBtn.style.display = "none";
      signupBtn.style.display = "block";
      authToggleText.textContent = "Already have an account?";
      authToggleBtn.textContent = "Login here";
    } else {
      authMode = "login";
      loginBtn.style.display = "block";
      signupBtn.style.display = "none";
      authToggleText.textContent = "Don't have an account?";
      authToggleBtn.textContent = "Sign up here";
    }
    clearAuthError();
  });

  // Login button
  loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!validateAuthInput(username, password)) return;

    try {
      setAuthLoading(true);
      const session = await loginPlayer(username, password);
      if (session) {
        saveSession(session);
        currentSession = session;
        playerName = username;
        authMode = "authenticated";
        showAuthScreen = false;

        // Set game state flags properly
        gameNameEntered = true;
        nameInputActive = false;

        hideAuthForm();
        await initializeGameData();
        startHeartbeat(session.sessionToken); // Start heartbeat
        startGame();
      }
    } catch (error) {
      showAuthError(error.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  });

  // Signup button
  signupBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!validateAuthInput(username, password)) return;

    try {
      setAuthLoading(true);
      const session = await signupPlayer(username, password);
      if (session) {
        saveSession(session);
        currentSession = session;
        playerName = username;
        authMode = "authenticated";
        showAuthScreen = false;

        // Set game state flags properly
        gameNameEntered = true;
        nameInputActive = false;

        hideAuthForm();
        await initializeGameData();
        startGame();
      }
    } catch (error) {
      showAuthError(error.message || "Signup failed");
    } finally {
      setAuthLoading(false);
    }
  });

  // Enter key handling
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      if (authMode === "login") {
        loginBtn.click();
      } else {
        signupBtn.click();
      }
    }
  });

  // Clear error when typing
  usernameInput.addEventListener("input", clearAuthError);
  passwordInput.addEventListener("input", clearAuthError);
}

function validateAuthInput(username, password) {
  clearAuthError();

  if (!username || username.length < 3) {
    showAuthError("Username must be at least 3 characters");
    return false;
  }

  if (!password || password.length < 6) {
    showAuthError("Password must be at least 6 characters");
    return false;
  }

  return true;
}

function showAuthForm() {
  const authForm = document.getElementById("authForm");
  const nameInput = document.getElementById("nameInput");
  const usernameInput = document.getElementById("usernameInput");

  authForm.style.display = "block";
  nameInput.style.display = "none";

  // Focus username input
  setTimeout(() => {
    usernameInput.focus();
  }, 100);
}

function hideAuthForm() {
  const authForm = document.getElementById("authForm");
  authForm.style.display = "none";
  clearAuthInputs();
}

function clearAuthInputs() {
  document.getElementById("usernameInput").value = "";
  document.getElementById("passwordInput").value = "";
  clearAuthError();
}

function showAuthError(message) {
  const authError = document.getElementById("authError");
  authError.textContent = message;
}

function clearAuthError() {
  const authError = document.getElementById("authError");
  authError.textContent = "";
}

function setAuthLoading(loading) {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");

  loginBtn.disabled = loading;
  signupBtn.disabled = loading;
  usernameInput.disabled = loading;
  passwordInput.disabled = loading;

  if (loading) {
    loginBtn.textContent = "Logging in...";
    signupBtn.textContent = "Signing up...";
  } else {
    loginBtn.textContent = "Login";
    signupBtn.textContent = "Sign Up";
  }
}

function startGame() {
  // Initialize game with authentication complete
  for (let i = 0; i < 3; i++) spawnCoin();

  // Initialize delta time
  lastTime = performance.now();

  function gameLoop(currentTime) {
    // Calculate delta time
    deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Normalize delta time to target frame time (prevents huge jumps)
    deltaTime = Math.min(deltaTime, targetFrameTime * 3);

    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}

// Updated switch player function for authentication
async function switchPlayerWithAuth() {
  try {
    // Logout current session properly
    if (currentSession && currentSession.sessionToken) {
      await logout(currentSession.sessionToken);
    }

    currentSession = null;

    // Reset game state
    resetGameForNewPlayer();

    // Show auth form for new login
    showAuthScreen = true;
    authMode = "login";
    showAuthForm();
  } catch (error) {
    console.error("Error switching player:", error);
  }
}

function resetGameForNewPlayer() {
  // Reset all player-specific data
  playerName = "";
  totalCoinsWallet = 0;
  playerHighScore = 0;
  hasMagnet = false;
  magnetRoundsLeft = 0;
  hasMiniNuke = false;
  miniNukeCount = 0;
  hasNuke = false;
  nukeCount = 0;
  hasGhostShroom = false;
  ghostShroomCount = 0;
  hasEnergyCape = false;
  energyCapeRoundsLeft = 0;
  energyCapeActive = false;
  energyCapeReloadTimer = 0;
  isGhostActive = false;
  ghostModeActivationTime = 0;
  isRocketActive = false;
  rocket = null;
  explosion = null;
  selectedCatColor = "gray"; // Reset to default color

  // Reset UI states
  showLeaderboard = false;
  showShop = false;
  showColorPalette = false;
  switchingPlayer = false;

  // Clear leaderboard data
  leaderboard = [];
}

