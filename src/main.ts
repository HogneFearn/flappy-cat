// ===================== config.js =====================
import {
  audioInitialized,
  initializeAudio,
  playExplosionSound,
  playCoinSound,
  playBoingSound,
} from "./audio";
import {
  targetFrameTime,
  availableShopItems,
  availableColors,
  catImages,
  backgroundImage,
  yellowCoinImage,
  redCoinImage,
  blueCoinImage,
  redMagnetImage,
  goldMagnetImage,
  miniNukeImage,
  nukeImage,
  goldNukeImage,
  ghostShroomImage,
  springBootsImage,
  ghostCatImage,
  energyCapeImage,
  isMobile,
} from "./assets";
import { state } from "./state";
import { canvas, ctx, getCanvasCoordinates } from "./dom";

// ===================== canvas.js =====================

import {
  signupPlayer,
  loginPlayer,
  validateSession,
  saveSession,
  loadSession,
  clearSession,
  savePlayerWallet,
  addToLeaderboard,
  savePlayerInventory,
  buyMagnet,
  buyGoldMagnet,
  buyMiniNuke,
  buyNuke,
  buyGoldNuke,
  buyGhostShroom,
  buySpringBoots,
  buyEnergyCape,
  savePlayerHighScore,
  initializeGameData,
  startHeartbeat,
  getOnlineCount,
  logout,
  savePlayerColor,
} from "./api";

// ===================== controls.js =====================
// Controls
document.addEventListener("keydown", (e) => {
  state.keys[e.code] = true;

  // Initialize audio system on first user interaction
  if (!audioInitialized) {
    initializeAudio();
  }

  // Skip input handling if authentication screen is showing
  if (state.showAuthScreen) {
    return;
  }
});
document.addEventListener("keyup", (e) => (state.keys[e.code] = false));

// Canvas touch handler for all game interactions
function handleCanvasPointer(canvasX, canvasY, isTouch) {
  // Priority 1: Handle overlay screens (these should block all other interactions)
  if (state.showColorPalette) {
    // Check if touch is on close button using stored coordinates
    if (
      canvasX >= state.closeButtonCoords.x &&
      canvasX <= state.closeButtonCoords.x + state.closeButtonCoords.size &&
      canvasY >= state.closeButtonCoords.y &&
      canvasY <= state.closeButtonCoords.y + state.closeButtonCoords.size
    ) {
      state.showColorPalette = false;
      return;
    }

    // Handle color selection touches using stored coordinates
    for (let i = 0; i < state.colorGridCoords.length; i++) {
      const colorCoord = state.colorGridCoords[i];

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
  } else if (state.showShop) {
    // Check if touch is on close button
    if (
      canvasX >= state.closeButtonCoords.x &&
      canvasX <= state.closeButtonCoords.x + state.closeButtonCoords.size &&
      canvasY >= state.closeButtonCoords.y &&
      canvasY <= state.closeButtonCoords.y + state.closeButtonCoords.size
    ) {
      state.showShop = false;
      return;
    }

    // Handle shop item selection touches using stored coordinates
    for (let i = 0; i < state.shopGridCoords.length; i++) {
      const shopCoord = state.shopGridCoords[i];

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
          if (state.totalCoinsWallet >= item.price && state.magnetRoundsLeft === 0) {
            buyMagnetItem();
          }
        } else if (item && shopCoord.itemId === "goldMagnet") {
          if (state.totalCoinsWallet >= item.price && state.goldMagnetRoundsLeft === 0) {
            buyGoldMagnetItem();
          }
        } else if (item && shopCoord.itemId === "ghostShroom") {
          if (state.totalCoinsWallet >= item.price && state.ghostShroomCount === 0) {
            buyGhostShroomItem();
          }
        } else if (item && shopCoord.itemId === "springBoots") {
          if (state.totalCoinsWallet >= item.price && state.springBootsCount === 0) {
            buySpringBootsItem();
          }
        } else if (item && shopCoord.itemId === "miniNuke") {
          if (state.totalCoinsWallet >= item.price) {
            buyMiniNukeItem();
          }
        } else if (item && shopCoord.itemId === "nuke") {
          if (state.totalCoinsWallet >= item.price) {
            buyNukeItem();
          }
        } else if (item && shopCoord.itemId === "goldNuke") {
          if (state.totalCoinsWallet >= item.price) {
            buyGoldNukeItem();
          }
        } else if (item && shopCoord.itemId === "energyCape") {
          if (state.totalCoinsWallet >= item.price && state.energyCapeRoundsLeft === 0) {
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
      state.showShop = false;
    }
    return; // Important: prevent any other touch handling when shop is open
  } else if (state.showLeaderboard) {
    // Close leaderboard when tapping on canvas
    state.showLeaderboard = false;
    return; // Important: prevent any other touch handling when leaderboard is open
  }

  // Priority 2: Check for pause button click (only when game is running and not paused)
  if (
    state.gameRunning &&
    state.gameStarted &&
    state.gameNameEntered &&
    !state.showAuthScreen &&
    !state.gamePaused &&
    state.pauseButtonCoords.x &&
    canvasX >= state.pauseButtonCoords.x &&
    canvasX <= state.pauseButtonCoords.x + state.pauseButtonCoords.width &&
    canvasY >= state.pauseButtonCoords.y &&
    canvasY <= state.pauseButtonCoords.y + state.pauseButtonCoords.height
  ) {
    togglePause();
    return;
  }

  // Priority 2.5: Check for rocket button click (only when game is running, not paused, and has mini nukes)
  if (
    state.gameRunning &&
    state.gameStarted &&
    state.gameNameEntered &&
    !state.showAuthScreen &&
    !state.gamePaused &&
    state.hasMiniNuke &&
    state.miniNukeCount > 0 &&
    !state.isRocketActive &&
    state.rocketButtonCoords.x &&
    canvasX >= state.rocketButtonCoords.x &&
    canvasX <= state.rocketButtonCoords.x + state.rocketButtonCoords.width &&
    canvasY >= state.rocketButtonCoords.y &&
    canvasY <= state.rocketButtonCoords.y + state.rocketButtonCoords.height
  ) {
    launchRocket();
    return;
  }

  // Priority 2b: Check for nuke button click during gameplay (touchstart for better responsiveness)
  if (
    state.gameRunning &&
    state.gameStarted &&
    state.gameNameEntered &&
    !state.showAuthScreen &&
    !state.gamePaused &&
    state.hasNuke &&
    state.nukeCount > 0 &&
    !state.isRocketActive &&
    state.nukeButtonCoords.x &&
    canvasX >= state.nukeButtonCoords.x &&
    canvasX <= state.nukeButtonCoords.x + state.nukeButtonCoords.width &&
    canvasY >= state.nukeButtonCoords.y &&
    canvasY <= state.nukeButtonCoords.y + state.nukeButtonCoords.height
  ) {
    launchNuke();
    return;
  }

  // Priority 2c: Check for gold nuke button click during gameplay (touchstart for better responsiveness)
  if (
    state.gameRunning &&
    state.gameStarted &&
    state.gameNameEntered &&
    !state.showAuthScreen &&
    !state.gamePaused &&
    state.hasGoldNuke &&
    state.goldNukeCount > 0 &&
    !state.isRocketActive &&
    state.goldNukeButtonCoords.x &&
    canvasX >= state.goldNukeButtonCoords.x &&
    canvasX <= state.goldNukeButtonCoords.x + state.goldNukeButtonCoords.width &&
    canvasY >= state.goldNukeButtonCoords.y &&
    canvasY <= state.goldNukeButtonCoords.y + state.goldNukeButtonCoords.height
  ) {
    launchGoldNuke();
    return;
  }

  // Priority 2d: Check for energy cape dash button click during gameplay
  if (
    state.gameRunning &&
    state.gameStarted &&
    state.gameNameEntered &&
    !state.showAuthScreen &&
    !state.gamePaused &&
    state.hasEnergyCape &&
    state.energyCapeRoundsLeft > 0 &&
    !state.energyCapeActive &&
    state.energyCapeReloadTimer <= 0 &&
    !state.isRocketActive &&
    state.energyCapeButtonCoords.x &&
    canvasX >= state.energyCapeButtonCoords.x &&
    canvasX <= state.energyCapeButtonCoords.x + state.energyCapeButtonCoords.width &&
    canvasY >= state.energyCapeButtonCoords.y &&
    canvasY <= state.energyCapeButtonCoords.y + state.energyCapeButtonCoords.height
  ) {
    activateDash();
    return;
  }

  // Priority 3: Check for in-canvas button clicks when game is over (handle on touchstart for better responsiveness)
  if (!state.gameRunning && state.showGameOverButtons && state.gameOverButtons.length > 0) {
    // Find the clicked button by checking from bottom to top (reverse order)
    // to handle any potential overlaps
    for (let i = state.gameOverButtons.length - 1; i >= 0; i--) {
      const button = state.gameOverButtons[i];
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
  if (!state.gameRunning && !state.showGameOverButtons) {
    state.showGameOverButtons = true;
    return;
  }

  // Priority 3: Normal game interactions (only when no overlays are open)
  if (!state.showAuthScreen && state.gameNameEntered) {
    if (isTouch) {
      state.isJumpHeld = true;
      state.jumpHoldTimer = 0;
    }
    handleJump();
  }
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  // Initialize audio system on first user interaction
  if (!audioInitialized) {
    initializeAudio();
  }

  const coords = getCanvasCoordinates(
    e.touches[0].clientX,
    e.touches[0].clientY
  );
  handleCanvasPointer(coords.x, coords.y, true);
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  state.isJumpHeld = false;
});

// Canvas click handler for desktop
canvas.addEventListener("click", (e) => {
  const coords = getCanvasCoordinates(e.clientX, e.clientY);
  handleCanvasPointer(coords.x, coords.y, false);
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
  if (state.showAuthScreen) {
    return;
  }

  if (!state.gameNameEntered) {
    // Wait for authentication to complete - do nothing
    return;
  } else if (!state.gameRunning) {
    // If game is over but buttons aren't shown yet, show them
    if (!state.showGameOverButtons) {
      state.showGameOverButtons = true;
    }
    // Don't restart the game automatically when buttons are shown
    // Player must click the "Play Again" button instead
  } else if (state.gamePaused) {
    // Resume game and jump at the same time
    state.gamePaused = false;
    state.player.vy = state.jumpPower;
  } else if (!state.gameStarted) {
    state.gameStarted = true;
    state.player.vy = state.jumpPower;
  } else {
    state.player.vy = state.jumpPower;
  }
}

function handleLeaderboard() {
  if (state.gameNameEntered) {
    // Always allow closing the leaderboard, but only allow opening if game is not running or not started
    if (state.showLeaderboard || !state.gameRunning || !state.gameStarted) {
      state.showLeaderboard = !state.showLeaderboard;
      state.showShop = false; // Close shop when opening leaderboard
      state.showColorPalette = false; // Close color palette when opening leaderboard
    }
  }
}

function handleShop() {
  if (state.gameNameEntered) {
    // Always allow closing the shop, but only allow opening if game is not running or not started
    if (state.showShop || !state.gameRunning || !state.gameStarted) {
      state.showShop = !state.showShop;
      state.showLeaderboard = false; // Close leaderboard when opening shop
      state.showColorPalette = false; // Close color palette when opening shop
    }
  }
}

function handleColorPalette() {
  if (state.gameNameEntered) {
    // Always allow closing the color palette, but only allow opening if game is not running or not started
    if (state.showColorPalette || !state.gameRunning || !state.gameStarted) {
      state.showColorPalette = !state.showColorPalette;
      state.showLeaderboard = false; // Close leaderboard when opening color palette
      state.showShop = false; // Close shop when opening color palette
    }
  }
}

function handleSwitchPlayer() {
  if (!state.gameRunning || !state.gameStarted) {
    // Use the authentication-based switch player function
    switchPlayerWithAuth();
  }
}

function handleRestart() {
  if (!state.gameRunning) {
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
    y = Math.random() * (state.groundY - 140) + 70; // More conservative Y range
    attempts++;

    let collides = false;

    // Check collision with all existing obstacles
    for (let obstacle of state.obstacles) {
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
    if (y - radius < 30 || y + radius > state.groundY - 30) {
      collides = true;
    }

    if (!collides) {
      validPosition = true;
    }

    // If we've tried many times, try a simpler approach
    if (attempts > 20 && !validPosition) {
      // Place coin far to the right where there are likely no obstacles
      x = canvas.width + 200 + Math.random() * 200;
      y = state.groundY / 2 + (Math.random() - 0.5) * 100; // Center area

      // Final collision check
      collides = false;
      for (let obstacle of state.obstacles) {
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
    y = state.groundY / 2;
  }

  state.coins.push({ x, y, r: radius, type, value, color, strokeColor });
}

// Function to check and fix coins that ended up inside pipes
function validateCoinPositions() {
  for (let i = state.coins.length - 1; i >= 0; i--) {
    let coin = state.coins[i];
    let isInsidePipe = false;

    for (let obstacle of state.obstacles) {
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
      state.coins.splice(i, 1);
    }
  }
}

// Obstacle generator
function spawnObstacle() {
  const gapSize = 150;
  const topHeight = Math.random() * 150 + 80;
  const bottomY = topHeight + gapSize;
  const bottomHeight = state.groundY - bottomY;

  state.obstacles.push({
    x: canvas.width,
    width: 40,
    topHeight: topHeight,
    bottomY: bottomY,
    bottomHeight: bottomHeight,
    passed: false,
  });
}

async function handleGameOver() {
  state.gameRunning = false;
  state.showGameOverButtons = false; // Start with just the game over message

  // Decrease magnet rounds if player has magnets
  if (
    state.hasMagnet ||
    state.hasGoldMagnet ||
    state.hasMiniNuke ||
    state.hasSpringBoots ||
    state.hasEnergyCape
  ) {
    const inventory: Record<string, number> = {};

    if (state.hasMagnet) {
      state.magnetRoundsLeft--;
      if (state.magnetRoundsLeft <= 0) {
        state.hasMagnet = false;
        state.magnetRoundsLeft = 0;
      }
      inventory.magnetRoundsLeft = state.magnetRoundsLeft;
    }

    if (state.hasGoldMagnet) {
      state.goldMagnetRoundsLeft--;
      if (state.goldMagnetRoundsLeft <= 0) {
        state.hasGoldMagnet = false;
        state.goldMagnetRoundsLeft = 0;
      }
      inventory.goldMagnetRoundsLeft = state.goldMagnetRoundsLeft;
    }

    if (state.hasSpringBoots) {
      state.springBootsCount = 0;
      state.hasSpringBoots = false;
      inventory.springBootsCount = 0;
    }

    if (state.hasEnergyCape) {
      state.energyCapeRoundsLeft = 0;
      state.hasEnergyCape = false;
      inventory.energyCapeRoundsLeft = 0;
    }

    // Always include mini nuke count (doesn't decrease on game over)
    inventory.miniNukeCount = state.miniNukeCount;

    // Always include nuke count (doesn't decrease on game over)
    inventory.nukeCount = state.nukeCount;

    // Always include gold nuke count (doesn't decrease on game over)
    inventory.goldNukeCount = state.goldNukeCount;

    // Save updated inventory
    await savePlayerInventory(state.currentSession.sessionToken, inventory);
  }

  // Use obstacle score for leaderboard (pipes cleared)
  if (state.obstacleScore > 0) {
    await addToLeaderboard(state.currentSession.sessionToken, state.obstacleScore);
  }

  // Update player's personal high score
  if (state.obstacleScore > state.playerHighScore) {
    state.playerHighScore = state.obstacleScore;
    await savePlayerHighScore(state.currentSession.sessionToken, state.playerHighScore);
  }
}

// Legacy function removed - authentication handles player identification

// Function to calculate dynamic game speed based on score
function calculateGameSpeed() {
  // Ensure obstacleScore is valid and within reasonable bounds
  const safeScore = Math.max(0, Math.min(state.obstacleScore, 1500)); // Cap at 1500 points for safety

  // Increase speed by 0.3 for every 75 points from the start
  const speedIncreaseIntervals = Math.floor(safeScore / 75);
  const speedIncrease = speedIncreaseIntervals * 0.3;
  const calculatedSpeed = state.baseGameSpeed + speedIncrease;

  // Add maximum speed cap to prevent unplayable speeds
  const maxGameSpeed = state.baseGameSpeed + 10.0; // Increased cap for more challenge
  const finalSpeed = Math.min(calculatedSpeed, maxGameSpeed);

  // Debug logging for speed spikes
  if (finalSpeed > state.baseGameSpeed + 2.0) {
    console.log(
      `Warning: High game speed detected. Score: ${state.obstacleScore}, Speed: ${finalSpeed.toFixed(
        2
      )}`
    );
  }

  return finalSpeed;
}

function resetGame() {
  state.player.x = 70;
  state.player.y = 300;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = false;
  state.obstacleScore = 0;
  state.gameSpeed = state.baseGameSpeed; // Reset game speed to base speed

  // Extra safety check to ensure baseGameSpeed is valid
  if (state.baseGameSpeed <= 0 || state.baseGameSpeed > 10) {
    console.warn(
      `Invalid baseGameSpeed detected: ${state.baseGameSpeed}, resetting to 2.5`
    );
    state.baseGameSpeed = 2.5;
    state.gameSpeed = 2.5;
  }

  state.coins = [];
  state.obstacles = [];
  state.gameRunning = true;
  state.gameStarted = false;
  state.gamePaused = false; // Reset pause state
  state.showLeaderboard = false;
  state.showShop = false;
  state.showColorPalette = false; // Reset color palette state
  state.showGameOverButtons = false; // Reset game over button state
  state.switchingPlayer = false;
  state.obstacleSpawnTimer = 0;
  state.validationTimer = 0;
  state.isJumpHeld = false;
  state.jumpHoldTimer = 0;
  state.isRocketActive = false; // Reset rocket state
  state.rocket = null; // Clear rocket object
  state.explosion = null; // Clear explosion state
  state.lastExplosionType = null; // Reset last explosion type
  state.isGhostActive = false; // Reset ghost mode state
  state.ghostModeActivationTime = 0; // Reset ghost mode timer
  for (let i = 0; i < 3; i++) spawnCoin();
}

function switchPlayer() {
  // Use the new authentication-based switch player function
  switchPlayerWithAuth();
}

function update() {
  // Desktop keyboard controls
  if (!isMobile) {
    if (state.keys["KeyN"] && !state.gameRunning) {
      switchPlayer();
    }

    if (state.keys["KeyL"]) {
      if (state.gameNameEntered) {
        state.showLeaderboard = !state.showLeaderboard;
        state.showShop = false; // Close shop when opening leaderboard
        state.showColorPalette = false; // Close color palette when opening leaderboard
        state.keys["KeyL"] = false; // Prevent key repeat
      }
    }

    if (state.keys["KeyS"]) {
      if (state.gameNameEntered && (!state.gameRunning || !state.gameStarted)) {
        state.showShop = !state.showShop;
        state.showLeaderboard = false; // Close leaderboard when opening shop
        state.showColorPalette = false; // Close color palette when opening shop
        state.keys["KeyS"] = false; // Prevent key repeat
      }
    }

    if (state.keys["KeyB"]) {
      if (state.showShop) {
        buyMagnetItem();
        state.keys["KeyB"] = false; // Prevent key repeat
      }
    }

    if (state.keys["KeyC"]) {
      if (state.gameNameEntered && (!state.gameRunning || !state.gameStarted)) {
        state.showColorPalette = !state.showColorPalette;
        state.showLeaderboard = false; // Close other menus
        state.showShop = false;
        state.keys["KeyC"] = false; // Prevent key repeat
      }
    }

    if (state.keys["KeyP"]) {
      if (state.gameNameEntered && state.gameRunning && state.gameStarted) {
        togglePause();
        state.keys["KeyP"] = false; // Prevent key repeat
      }
    }

    if (state.keys["Space"] || state.keys["ArrowUp"]) {
      // Skip if authentication screen is showing
      if (state.showAuthScreen) {
        return;
      }

      if (!state.gameNameEntered) {
        // Wait for authentication to complete - do nothing
        return;
      } else if (!state.gameRunning) {
        // If game is over but buttons aren't shown yet, show them
        if (!state.showGameOverButtons) {
          state.showGameOverButtons = true;
        }
        // Don't restart the game automatically when buttons are shown
        // Player must click the "Play Again" button instead
      } else if (state.gamePaused) {
        // Resume game and jump at the same time
        state.gamePaused = false;
        state.player.vy = state.jumpPower;
      } else if (!state.gameStarted) {
        state.gameStarted = true;
        state.player.vy = state.jumpPower;
      } else {
        state.player.vy = state.jumpPower;
      }
    }

    // Handle any other key press to show game over buttons
    if (!state.gameRunning && !state.showGameOverButtons && state.gameNameEntered) {
      const anyKeyPressed = Object.values(state.keys).some((key) => key);
      if (anyKeyPressed) {
        state.showGameOverButtons = true;
        // Clear all keys to prevent immediate actions
        Object.keys(state.keys).forEach((key) => (state.keys[key] = false));
      }
    }
  }

  if (state.gameRunning && state.gameStarted) {
    // Mobile hold-to-jump logic
    if (isMobile && state.isJumpHeld) {
      state.jumpHoldTimer += state.deltaTime;
      if (state.jumpHoldTimer >= 83.33) {
        // Every ~83ms (equivalent to every 5 frames at 60fps)
        // Apply jump when holding
        state.player.vy = state.jumpPower * 0.8; // Slightly less powerful for continuous jumps
        state.jumpHoldTimer = 0;
      }
    }
  }

  if (!state.gameRunning) return;

  // Check if game is paused
  if (state.gamePaused) return;

  // Update rocket if active
  updateRocket();

  // Update energy cape cooldown
  if (state.energyCapeReloadTimer > 0) {
    state.energyCapeReloadTimer -= state.deltaTime;
  }

  // Update explosion if active
  updateExplosion();

  // Calculate delta time multiplier (1.0 at 60fps)
  const deltaMultiplier = state.deltaTime / targetFrameTime;

  // Only apply gravity and movement if game has started
  applyPlayerPhysics(deltaMultiplier);

  // Ground collision
  handleGroundCollision();

  // Ceiling collision
  handleCeilingCollision();

  // Only move world objects if game has started
  updateWorld(deltaMultiplier); // End of gameStarted condition
}

// Shop functions
async function buyMagnetItem() {
  const result = await buyMagnet(state.currentSession.sessionToken, state.totalCoinsWallet);
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.magnetRoundsLeft = result.inventory.magnetRoundsLeft;
    state.hasMagnet = state.magnetRoundsLeft > 0;
  }
}

async function buyGoldMagnetItem() {
  const result = await buyGoldMagnet(
    state.currentSession.sessionToken,
    state.totalCoinsWallet
  );
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.goldMagnetRoundsLeft = result.inventory.goldMagnetRoundsLeft;
    state.hasGoldMagnet = state.goldMagnetRoundsLeft > 0;
  }
}

async function buyMiniNukeItem() {
  const result = await buyMiniNuke(
    state.currentSession.sessionToken,
    state.totalCoinsWallet
  );
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.miniNukeCount = result.inventory.miniNukeCount;
    state.hasMiniNuke = state.miniNukeCount > 0;
  }
}

async function buyNukeItem() {
  const result = await buyNuke(state.currentSession.sessionToken, state.totalCoinsWallet);
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.nukeCount = result.inventory.nukeCount;
    state.hasNuke = state.nukeCount > 0;
  }
}

async function buyGoldNukeItem() {
  const result = await buyGoldNuke(
    state.currentSession.sessionToken,
    state.totalCoinsWallet
  );
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.goldNukeCount = result.inventory.goldNukeCount;
    state.hasGoldNuke = state.goldNukeCount > 0;
  }
}

async function buyGhostShroomItem() {
  const result = await buyGhostShroom(
    state.currentSession.sessionToken,
    state.totalCoinsWallet
  );
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.ghostShroomCount = result.inventory.ghostShroomCount;
    state.hasGhostShroom = state.ghostShroomCount > 0;
  }
}

async function buySpringBootsItem() {
  const result = await buySpringBoots(
    state.currentSession.sessionToken,
    state.totalCoinsWallet
  );
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.springBootsCount = result.inventory.springBootsCount;
    state.hasSpringBoots = state.springBootsCount > 0;
  }
}

async function buyEnergyCapeItem() {
  const result = await buyEnergyCape(
    state.currentSession.sessionToken,
    state.totalCoinsWallet
  );
  if (result.success) {
    state.totalCoinsWallet = result.newWallet;
    state.energyCapeRoundsLeft = result.inventory.energyCapeRoundsLeft;
    state.hasEnergyCape = state.energyCapeRoundsLeft > 0;
  }
}

// Color palette functions
async function selectCatColor(colorName) {
  try {
    state.selectedCatColor = colorName;
    await savePlayerColor(state.currentSession.sessionToken, colorName);
    console.log("Color saved:", colorName);
  } catch (error) {
    console.error("Failed to save color:", error);
  }
}

// Pause function
function togglePause() {
  if (state.gameRunning && state.gameStarted) {
    state.gamePaused = !state.gamePaused;
  }
}

// Rocket functions
function launchRocket() {
  if (!state.hasMiniNuke || state.miniNukeCount <= 0 || state.isRocketActive) {
    return;
  }

  // Initialize rocket at player position
  state.rocket = {
    x: state.player.x + state.player.w,
    y: state.player.y + state.player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "miniNuke", // Track rocket type
  };

  state.isRocketActive = true;
  state.miniNukeCount--;

  // Save updated inventory
  savePlayerInventory(state.currentSession.sessionToken, {
    magnetRoundsLeft: state.magnetRoundsLeft || 0,
    miniNukeCount: state.miniNukeCount,
    nukeCount: state.nukeCount,
    goldNukeCount: state.goldNukeCount,
    ghostShroomCount: state.ghostShroomCount,
  });

  console.log("Mini nuke launched! Mini nukes left:", state.miniNukeCount);
}

function launchNuke() {
  if (!state.hasNuke || state.nukeCount <= 0 || state.isRocketActive) {
    return;
  }

  // Initialize nuke rocket at player position
  state.rocket = {
    x: state.player.x + state.player.w,
    y: state.player.y + state.player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "nuke", // Track rocket type
  };

  state.isRocketActive = true;
  state.nukeCount--;

  // Save updated inventory
  savePlayerInventory(state.currentSession.sessionToken, {
    magnetRoundsLeft: state.magnetRoundsLeft || 0,
    miniNukeCount: state.miniNukeCount,
    nukeCount: state.nukeCount,
    goldNukeCount: state.goldNukeCount,
    ghostShroomCount: state.ghostShroomCount,
  });

  console.log("Nuke launched! Nukes left:", state.nukeCount);
}

function launchGoldNuke() {
  if (!state.hasGoldNuke || state.goldNukeCount <= 0 || state.isRocketActive) {
    return;
  }

  // Initialize gold nuke rocket at player position
  state.rocket = {
    x: state.player.x + state.player.w,
    y: state.player.y + state.player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "goldNuke", // Track rocket type
  };

  state.isRocketActive = true;
  state.goldNukeCount--;

  // Save updated inventory
  savePlayerInventory(state.currentSession.sessionToken, {
    magnetRoundsLeft: state.magnetRoundsLeft || 0,
    miniNukeCount: state.miniNukeCount,
    nukeCount: state.nukeCount,
    goldNukeCount: state.goldNukeCount,
    ghostShroomCount: state.ghostShroomCount,
  });

  console.log("Gold Nuke launched! Gold Nukes left:", state.goldNukeCount);
}

function activateDash() {
  if (
    !state.hasEnergyCape ||
    state.energyCapeRoundsLeft <= 0 ||
    state.energyCapeReloadTimer > 0 ||
    state.isRocketActive ||
    state.energyCapeActive ||
    !state.gameStarted ||
    state.gamePaused
  ) {
    return;
  }

  state.energyCapeActive = true;
  state.energyCapeReloadTimer = state.energyCapeCooldown;

  // Apply initial boost
  state.player.vx = 15; // Fast forward speed
  state.player.vy = 0; // Float

  // Dash lasts for 500ms
  setTimeout(() => {
    state.energyCapeActive = false;
    // Note: We'll rely on update loop to handle deceleration/return
  }, 500);

  // Play a sound? Maybe the small explosion sound?
  playExplosionSound("miniNuke");
  console.log("Energy Cape Dash activated!");
}

function updateRocket() {
  if (!state.isRocketActive || !state.rocket) {
    return;
  }

  // Move rocket to the right
  state.rocket.x += state.rocket.speed * state.gameSpeed * (state.deltaTime / targetFrameTime);

  // Check if rocket reached the end of the screen
  if (state.rocket.x >= canvas.width) {
    // Create explosion at the edge of the screen
    createExplosion(canvas.width - 50, state.rocket.y + 12.5); // Center explosion on rocket
    explodeRocket();
  }
}

function createExplosion(x, y) {
  const isNuke = state.rocket && state.rocket.type === "nuke";
  const isGoldNuke = state.rocket && state.rocket.type === "goldNuke";

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

  state.explosion = {
    x: x,
    y: y,
    timer: 0,
    duration: duration,
    maxRadius: maxRadius,
    particles: particles,
  };
}

function updateExplosion() {
  if (!state.explosion) {
    return;
  }

  state.explosion.timer += state.deltaTime;

  // Remove explosion when done
  if (state.explosion.timer >= state.explosion.duration) {
    state.explosion = null;
  }
}

function explodeRocket() {
  if (!state.isRocketActive) {
    return;
  }

  const isNuke = state.rocket && state.rocket.type === "nuke";
  const isGoldNuke = state.rocket && state.rocket.type === "goldNuke";

  // Store explosion type for coin spawning logic
  state.lastExplosionType = state.rocket.type;

  // Play appropriate explosion sound based on rocket type
  playExplosionSound(state.rocket.type);

  let maxPipesToRemove = 3;
  let delayTime = -4000;

  if (isNuke) {
    maxPipesToRemove = 10;
    delayTime = -8000;
  } else if (isGoldNuke) {
    maxPipesToRemove = 20;
    delayTime = -16000; // Even longer clear path
  }

  const playerRightEdge = state.player.x + state.player.w;

  // Find and remove pipes that are ahead of the player (x position greater than player)
  const pipesAhead = state.obstacles
    .map((obstacle, index) => ({ obstacle, index }))
    .filter(({ obstacle }) => obstacle.x > playerRightEdge)
    .sort((a, b) => a.obstacle.x - b.obstacle.x); // Sort by x position (closest first)

  // Remove the pipes ahead (in reverse order to maintain array indices)
  const pipesToRemove = pipesAhead.slice(0, maxPipesToRemove);
  pipesToRemove
    .sort((a, b) => b.index - a.index) // Sort by index in reverse order
    .forEach(({ index }) => {
      state.obstacles.splice(index, 1);
    });

  const pipesRemovedCount = pipesToRemove.length;

  // Reset obstacle spawn timer to create a longer clear path
  state.obstacleSpawnTimer = delayTime;

  // Create delayed point awards for the full potential points (regardless of pipes actually removed)
  const pointDelay = Math.abs(delayTime) / maxPipesToRemove; // Divide delay evenly across max potential pipes

  for (let i = 0; i < maxPipesToRemove; i++) {
    setTimeout(() => {
      state.obstacleScore += 5; // Award 5 points per pipe

      // Update game speed based on new score with safeguards
      const newSpeed = calculateGameSpeed();
      // Only update if the new speed is reasonable (prevent sudden spikes)
      if (newSpeed <= state.gameSpeed + 0.5) {
        state.gameSpeed = newSpeed;
      } else {
        console.warn(
          `Prevented speed spike: ${state.gameSpeed} → ${newSpeed}, keeping current speed`
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
  state.isRocketActive = false;
  state.rocket = null;

  // Update inventory state
  if (state.miniNukeCount <= 0) {
    state.hasMiniNuke = false;
  }
  if (state.nukeCount <= 0) {
    state.hasNuke = false;
  }
  if (state.goldNukeCount <= 0) {
    state.hasGoldNuke = false;
  }
}

import { draw } from "./draw";

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
        state.currentSession = session;
        state.authMode = "authenticated";
        state.playerName = session.username;
        state.showAuthScreen = false;

        // Set game state flags properly
        state.gameNameEntered = true;
        state.nameInputActive = false;

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
    state.showAuthScreen = true;
    state.authMode = "login";
    showAuthForm();
  } catch (error) {
    console.error("Auth initialization error:", error);
    state.showAuthScreen = true;
    state.authMode = "login";
    showAuthForm();
  }

  // Update online count periodically
  updateOnlineCount();
  setInterval(updateOnlineCount, 30000); // Update every 30 seconds
});

// Add window close detection to properly log out user
window.addEventListener("beforeunload", (event) => {
  if (state.currentSession && state.currentSession.sessionToken) {
    // Use sendBeacon with proper content type for logout on page close
    const blob = new Blob(
      [
        JSON.stringify({
          sessionToken: state.currentSession.sessionToken,
        }),
      ],
      { type: "application/json" }
    );

    navigator.sendBeacon("/api/auth/logout-beacon", blob);
  }
});

// Also handle visibility change (tab switching, minimizing)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.currentSession) {
    // Tab became visible again, send heartbeat
    updateOnlineCount();
  }
});

async function updateOnlineCount() {
  try {
    console.log("Calling getOnlineCount...");
    const count = await getOnlineCount();
    state.onlineCount = count;
    console.log("Updated onlineCount to:", state.onlineCount);
  } catch (error) {
    console.error("Failed to get online count:", error);
  }
}

function setupAuthentication() {
  const authForm = document.getElementById("authForm");
  const usernameInput = document.getElementById("usernameInput") as HTMLInputElement;
  const passwordInput = document.getElementById("passwordInput") as HTMLInputElement;
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const authToggleBtn = document.getElementById("authToggleBtn");
  const authToggleText = document.getElementById("authToggleText");
  const authError = document.getElementById("authError");

  // Toggle between login and signup
  authToggleBtn.addEventListener("click", () => {
    if (state.authMode === "login") {
      state.authMode = "signup";
      loginBtn.style.display = "none";
      signupBtn.style.display = "block";
      authToggleText.textContent = "Already have an account?";
      authToggleBtn.textContent = "Login here";
    } else {
      state.authMode = "login";
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
        state.currentSession = session;
        state.playerName = username;
        state.authMode = "authenticated";
        state.showAuthScreen = false;

        // Set game state flags properly
        state.gameNameEntered = true;
        state.nameInputActive = false;

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
        state.currentSession = session;
        state.playerName = username;
        state.authMode = "authenticated";
        state.showAuthScreen = false;

        // Set game state flags properly
        state.gameNameEntered = true;
        state.nameInputActive = false;

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
      if (state.authMode === "login") {
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
  (document.getElementById("usernameInput") as HTMLInputElement).value = "";
  (document.getElementById("passwordInput") as HTMLInputElement).value = "";
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
  const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
  const signupBtn = document.getElementById("signupBtn") as HTMLButtonElement;
  const usernameInput = document.getElementById("usernameInput") as HTMLInputElement;
  const passwordInput = document.getElementById("passwordInput") as HTMLInputElement;

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
  state.lastTime = performance.now();

  function gameLoop(currentTime) {
    // Calculate delta time
    state.deltaTime = currentTime - state.lastTime;
    state.lastTime = currentTime;

    // Normalize delta time to target frame time (prevents huge jumps)
    state.deltaTime = Math.min(state.deltaTime, targetFrameTime * 3);

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
    if (state.currentSession && state.currentSession.sessionToken) {
      await logout(state.currentSession.sessionToken);
    }

    state.currentSession = null;

    // Reset game state
    resetGameForNewPlayer();

    // Show auth form for new login
    state.showAuthScreen = true;
    state.authMode = "login";
    showAuthForm();
  } catch (error) {
    console.error("Error switching player:", error);
  }
}

function resetGameForNewPlayer() {
  // Reset all player-specific data
  state.playerName = "";
  state.totalCoinsWallet = 0;
  state.playerHighScore = 0;
  state.hasMagnet = false;
  state.magnetRoundsLeft = 0;
  state.hasMiniNuke = false;
  state.miniNukeCount = 0;
  state.hasNuke = false;
  state.nukeCount = 0;
  state.hasGhostShroom = false;
  state.ghostShroomCount = 0;
  state.hasEnergyCape = false;
  state.energyCapeRoundsLeft = 0;
  state.energyCapeActive = false;
  state.energyCapeReloadTimer = 0;
  state.isGhostActive = false;
  state.ghostModeActivationTime = 0;
  state.isRocketActive = false;
  state.rocket = null;
  state.explosion = null;
  state.selectedCatColor = "gray"; // Reset to default color

  // Reset UI states
  state.showLeaderboard = false;
  state.showShop = false;
  state.showColorPalette = false;
  state.switchingPlayer = false;

  // Clear leaderboard data
  state.leaderboard = [];
}

function applyPlayerPhysics(deltaMultiplier) {
  if (state.gameStarted) {
    if (state.energyCapeActive) {
      // Dash physics: fly forward/right, ignore gravity
      state.player.x += state.player.vx * deltaMultiplier;
      state.player.y += state.player.vy * deltaMultiplier; // Should be 0 usually

      // Cap x position to avoid going too far
      if (state.player.x > canvas.width * 0.7) {
        state.player.x = canvas.width * 0.7;
      }
    } else {
      // Normal physics
      // If player is ahead of normal position (after dash), drift back
      if (state.player.x > 70) {
        state.player.x -= 3 * deltaMultiplier; // Drift back speed
        if (state.player.x < 70) state.player.x = 70;
      }

      // Gravity (frame-rate independent)
      state.player.vy += state.gravity * deltaMultiplier;
      state.player.y += state.player.vy * deltaMultiplier;
    }
  }
}

function handleGroundCollision() {
  if (state.player.y + state.player.h > state.groundY) {
    if (state.hasSpringBoots && state.springBootsCount > 0) {
      playBoingSound();
      state.player.vy = -16.3; // High vertical jump but safe from ceiling
      state.player.y = state.groundY - state.player.h - 10; // Immediate height boost
      console.log("Spring boots bounce!");
    } else if (state.hasGhostShroom && state.ghostShroomCount > 0 && !state.isGhostActive) {
      // Activate ghost mode on first hit
      state.isGhostActive = true;
      state.ghostModeActivationTime = performance.now(); // Record activation time
      state.ghostShroomCount--;
      if (state.ghostShroomCount <= 0) {
        state.hasGhostShroom = false;
      }
      // Save updated inventory
      savePlayerInventory(state.currentSession.sessionToken, {
        magnetRoundsLeft: state.magnetRoundsLeft || 0,
        miniNukeCount: state.miniNukeCount,
        nukeCount: state.nukeCount,
        ghostShroomCount: state.ghostShroomCount,
      });
      console.log(
        "Ghost mode activated (ground hit)! Ghost shrooms left:",
        state.ghostShroomCount
      );
      // Bounce back up slightly to prevent getting stuck
      state.player.y = state.groundY - state.player.h;
      state.player.vy = -2;
    } else if (state.isGhostActive) {
      // Check if grace period has expired
      const timeSinceActivation = performance.now() - state.ghostModeActivationTime;
      if (timeSinceActivation > state.ghostModeGracePeriod) {
        // Grace period expired, trigger game over
        handleGameOver();
      } else {
        // During grace period, bounce back
        state.player.y = state.groundY - state.player.h;
        state.player.vy = -2;
      }
    } else {
      // No ghost shroom available
      handleGameOver();
    }
  }
}

function handleCeilingCollision() {
  if (state.player.y < 0) {
    if (state.hasSpringBoots && state.springBootsCount > 0) {
      playBoingSound();
      state.player.vy = 16.3; // Bounce down
      state.player.y = 10; // Push away from ceiling
      console.log("Spring boots ceiling bounce!");
    } else if (state.hasGhostShroom && state.ghostShroomCount > 0 && !state.isGhostActive) {
      // Activate ghost mode on first hit
      state.isGhostActive = true;
      state.ghostModeActivationTime = performance.now(); // Record activation time
      state.ghostShroomCount--;
      if (state.ghostShroomCount <= 0) {
        state.hasGhostShroom = false;
      }
      // Save updated inventory
      savePlayerInventory(state.currentSession.sessionToken, {
        magnetRoundsLeft: state.magnetRoundsLeft || 0,
        miniNukeCount: state.miniNukeCount,
        nukeCount: state.nukeCount,
        ghostShroomCount: state.ghostShroomCount,
      });
      console.log(
        "Ghost mode activated (ceiling hit)! Ghost shrooms left:",
        state.ghostShroomCount
      );
      // Bounce back down slightly to prevent getting stuck
      state.player.y = 0;
      state.player.vy = 2;
    } else if (state.isGhostActive) {
      // Check if grace period has expired
      const timeSinceActivation = performance.now() - state.ghostModeActivationTime;
      if (timeSinceActivation > state.ghostModeGracePeriod) {
        // Grace period expired, trigger game over
        handleGameOver();
      } else {
        // During grace period, bounce back
        state.player.y = 0;
        state.player.vy = 2;
      }
    } else {
      // No ghost shroom available
      handleGameOver();
    }
  }
}

function updateWorld(deltaMultiplier) {
  if (state.gameStarted) {
    // Move obstacles (frame-rate independent)
    for (let obstacle of state.obstacles) {
      obstacle.x -= state.gameSpeed * deltaMultiplier;
    }

    // Move coins (frame-rate independent)
    for (let coin of state.coins) {
      coin.x -= state.gameSpeed * deltaMultiplier;
    }

    // Remove off-screen obstacles
    state.obstacles = state.obstacles.filter((obstacle) => obstacle.x > -obstacle.width);

    // Remove off-screen coins
    state.coins = state.coins.filter((coin) => coin.x > -coin.r);

    // Validate coin positions occasionally (every 1 second in real time)
    state.validationTimer += state.deltaTime;
    if (state.validationTimer > 1000) {
      // 1000ms = 1 second
      validateCoinPositions();
      state.validationTimer = 0;
    }

    // Spawn obstacles (every 2 seconds in real time)
    state.obstacleSpawnTimer += state.deltaTime;
    if (state.obstacleSpawnTimer > 2000) {
      // 2000ms = 2 seconds
      spawnObstacle();
      state.obstacleSpawnTimer = 0;
    }

    // Check coin collision
    for (let i = state.coins.length - 1; i >= 0; i--) {
      let coin = state.coins[i];
      let dx = state.player.x + state.player.w / 2 - coin.x;
      let dy = state.player.y + state.player.h / 2 - coin.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      // Magnet attraction (frame-rate independent)
      // Check for regular magnet first
      if (
        state.hasMagnet &&
        state.magnetRoundsLeft > 0 &&
        distance < state.magnetRadius &&
        distance > coin.r + state.player.w / 2
      ) {
        // Pull coin towards player with regular magnet
        const pullStrength = 0.7;
        const angle = Math.atan2(dy, dx);
        coin.x += Math.cos(angle) * pullStrength * state.gameSpeed * deltaMultiplier;
        coin.y += Math.sin(angle) * pullStrength * state.gameSpeed * deltaMultiplier;
      }
      // Check for gold magnet (stronger and wider range)
      else if (
        state.hasGoldMagnet &&
        state.goldMagnetRoundsLeft > 0 &&
        distance < state.goldMagnetRadius &&
        distance > coin.r + state.player.w / 2
      ) {
        // Pull coin towards player with gold magnet (stronger pull)
        const pullStrength = 1.4; // Double the strength of regular magnet
        const angle = Math.atan2(dy, dx);
        coin.x += Math.cos(angle) * pullStrength * state.gameSpeed * deltaMultiplier;
        coin.y += Math.sin(angle) * pullStrength * state.gameSpeed * deltaMultiplier;
      }

      // Collision detection
      if (distance < coin.r + state.player.w / 2) {
        state.coins.splice(i, 1);
        // Play coin pickup sound
        playCoinSound();
        // Add coin value directly to wallet
        state.totalCoinsWallet += coin.value;
        savePlayerWallet(state.currentSession.sessionToken, state.totalCoinsWallet);
        spawnCoin();
      }
    }

    // Check obstacle collision
    for (let obstacle of state.obstacles) {
      // Top pipe collision
      if (
        state.player.x < obstacle.x + obstacle.width &&
        state.player.x + state.player.w > obstacle.x &&
        state.player.y < obstacle.topHeight
      ) {
        if (state.energyCapeActive) {
          // Dash destroys the pipe!
          createExplosion(obstacle.x + obstacle.width / 2, obstacle.topHeight);
          playExplosionSound("miniNuke");

          // Move obstacle off-screen to be removed
          obstacle.x = -1000;

          // DO NOT consume touch immediately to allow passing through
          // energyCapeActive = false;

          console.log("Dash destroyed top pipe!");
          continue;
        } else if (state.hasGhostShroom && state.ghostShroomCount > 0 && !state.isGhostActive) {
          // Activate ghost mode on first hit
          state.isGhostActive = true;
          state.ghostModeActivationTime = performance.now(); // Record activation time
          state.ghostShroomCount--;
          if (state.ghostShroomCount <= 0) {
            state.hasGhostShroom = false;
          }
          // Save updated inventory
          savePlayerInventory(state.currentSession.sessionToken, {
            magnetRoundsLeft: state.magnetRoundsLeft || 0,
            miniNukeCount: state.miniNukeCount,
            nukeCount: state.nukeCount,
            ghostShroomCount: state.ghostShroomCount,
          });
          console.log(
            "Ghost mode activated! Ghost shrooms left:",
            state.ghostShroomCount
          );
        } else if (state.isGhostActive) {
          // Check if grace period has expired
          const timeSinceActivation =
            performance.now() - state.ghostModeActivationTime;
          if (timeSinceActivation > state.ghostModeGracePeriod) {
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
        state.player.x < obstacle.x + obstacle.width &&
        state.player.x + state.player.w > obstacle.x &&
        state.player.y + state.player.h > obstacle.bottomY
      ) {
        if (state.energyCapeActive) {
          // Dash destroys the pipe!
          createExplosion(obstacle.x + obstacle.width / 2, obstacle.bottomY);
          playExplosionSound("miniNuke");

          // Move obstacle off-screen to be removed
          obstacle.x = -1000;

          // DO NOT consume dash immediately to allow passing through
          // energyCapeActive = false;

          console.log("Dash destroyed bottom pipe!");
          continue;
        } else if (state.hasGhostShroom && state.ghostShroomCount > 0 && !state.isGhostActive) {
          // Activate ghost mode on first hit
          state.isGhostActive = true;
          state.ghostModeActivationTime = performance.now(); // Record activation time
          state.ghostShroomCount--;
          if (state.ghostShroomCount <= 0) {
            state.hasGhostShroom = false;
          }
          // Save updated inventory
          savePlayerInventory(state.currentSession.sessionToken, {
            magnetRoundsLeft: state.magnetRoundsLeft || 0,
            miniNukeCount: state.miniNukeCount,
            nukeCount: state.nukeCount,
            ghostShroomCount: state.ghostShroomCount,
          });
          console.log(
            "Ghost mode activated! Ghost shrooms left:",
            state.ghostShroomCount
          );
        } else if (state.isGhostActive) {
          // Check if grace period has expired
          const timeSinceActivation =
            performance.now() - state.ghostModeActivationTime;
          if (timeSinceActivation > state.ghostModeGracePeriod) {
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
      if (!obstacle.passed && state.player.x > obstacle.x + obstacle.width) {
        obstacle.passed = true;
        state.obstacleScore += 5;
        // Update game speed based on new score with safeguards
        const newSpeed = calculateGameSpeed();
        // Only update if the new speed is reasonable (prevent sudden spikes)
        if (newSpeed <= state.gameSpeed + 0.5) {
          state.gameSpeed = newSpeed;
        } else {
          console.warn(
            `Prevented speed spike: ${state.gameSpeed} → ${newSpeed}, keeping current speed`
          );
        }
      }
    }

    // Ensure there are always coins on screen
    const coinLimit =
      state.obstacleSpawnTimer < 0 && state.lastExplosionType === "goldNuke" ? 6 : 3;
    if (state.coins.length < coinLimit) {
      spawnCoin();
    }
  }
}
