// ===================== config.js =====================
import {
  audioInitialized,
  initializeAudio,
  playExplosionSound,
  playCoinSound,
  playBoingSound,
} from "./audio";
import {
  targetFPS,
  targetFrameTime,
  availableShopItems,
  availableColors,
  catImages,
  catImage,
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
import { canvas, ctx, resizeCanvas, getCanvasCoordinates } from "./dom";

// ===================== canvas.js =====================

import {
  apiRequest,
  signupPlayer,
  loginPlayer,
  validateSession,
  saveSession,
  loadSession,
  clearSession,
  loadPlayerWallet,
  savePlayerWallet,
  loadLeaderboard,
  addToLeaderboard,
  loadHighScore,
  saveHighScore,
  loadPlayerInventory,
  savePlayerInventory,
  buyMagnet,
  buyGoldMagnet,
  buyMiniNuke,
  buyNuke,
  buyGoldNuke,
  buyGhostShroom,
  buySpringBoots,
  buyEnergyCape,
  loadPlayerHighScore,
  savePlayerHighScore,
  getPlayerHighScore,
  checkPlayerHasMagnet,
  initializeGameData,
  startHeartbeat,
  stopHeartbeat,
  getOnlineCount,
  logout,
  getPlayerColor,
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
    state.isJumpHeld = true;
    state.jumpHoldTimer = 0;
    handleJump();
  }
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  state.isJumpHeld = false;
});

// Canvas click handler for desktop
canvas.addEventListener("click", (e) => {
  // Get accurate canvas coordinates
  const coords = getCanvasCoordinates(e.clientX, e.clientY);
  const canvasX = coords.x;
  const canvasY = coords.y;

  // Priority 1: Handle overlay screens (these should block all other interactions)
  if (state.showColorPalette) {
    // Check if click is on close button using stored coordinates
    if (
      canvasX >= state.closeButtonCoords.x &&
      canvasX <= state.closeButtonCoords.x + state.closeButtonCoords.size &&
      canvasY >= state.closeButtonCoords.y &&
      canvasY <= state.closeButtonCoords.y + state.closeButtonCoords.size
    ) {
      state.showColorPalette = false;
      return;
    }

    // Handle color selection clicks using stored coordinates
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

    return; // Important: prevent any other click handling when color palette is open
  } else if (state.showShop) {
    // Check if click is on close button
    if (
      canvasX >= state.closeButtonCoords.x &&
      canvasX <= state.closeButtonCoords.x + state.closeButtonCoords.size &&
      canvasY >= state.closeButtonCoords.y &&
      canvasY <= state.closeButtonCoords.y + state.closeButtonCoords.size
    ) {
      state.showShop = false;
      return;
    }

    // Handle shop item selection clicks using stored coordinates
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
      state.showShop = false;
    }
    return; // Important: prevent any other click handling when shop is open
  } else if (state.showLeaderboard) {
    // Close leaderboard when clicking on canvas
    state.showLeaderboard = false;
    return; // Important: prevent any other click handling when leaderboard is open
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

  // Priority 2.6: Check for nuke button click (only when game is running, not paused, and has nukes)
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

  // Priority 2.7: Check for gold nuke button click (only when game is running, not paused, and has gold nukes)
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

  // Priority 2.8: Check for energy cape dash button click (only when game is running, not paused, and has energy cape)
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

  // Priority 3: Check for in-canvas button clicks when game is over
  if (!state.gameRunning && state.showGameOverButtons && state.gameOverButtons.length > 0) {
    for (const button of state.gameOverButtons) {
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
  if (!state.gameRunning && !state.showGameOverButtons) {
    state.showGameOverButtons = true;
    return;
  }

  // Priority 3: Normal game interactions (only when no overlays are open)
  if (!state.showAuthScreen && state.gameNameEntered) {
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
    const inventory = {};

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

  // Ground collision
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

  // Ceiling collision
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

  // Only move world objects if game has started
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
  } // End of gameStarted condition
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
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, state.groundY);
  } else {
    // Fallback to solid color if image isn't loaded yet
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, state.groundY);
  }

  // Draw ground
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, state.groundY, canvas.width, canvas.height - state.groundY);

  // Draw obstacles (pipes) - Mario-style
  for (let obstacle of state.obstacles) {
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
  if (state.isGhostActive) {
    // Check if we're in grace period
    const timeSinceActivation = performance.now() - state.ghostModeActivationTime;
    const inGracePeriod = timeSinceActivation <= state.ghostModeGracePeriod;

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

      ctx.drawImage(ghostCatImage, state.player.x, state.player.y, state.player.w, state.player.h);
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
      ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
    }
  } else if (
    catImages[state.selectedCatColor] &&
    catImages[state.selectedCatColor].complete &&
    catImages[state.selectedCatColor].naturalHeight !== 0
  ) {
    // Draw cat image if loaded
    ctx.drawImage(
      catImages[state.selectedCatColor],
      state.player.x,
      state.player.y,
      state.player.w,
      state.player.h
    );
  } else {
    // Fallback to colored rectangle if image not loaded
    ctx.fillStyle = state.gameRunning ? "#ff0" : "#f00";
    ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
  }

  // Draw energy cape if equipped (on top of player)
  if (state.hasEnergyCape && state.energyCapeRoundsLeft > 0 && !state.isGhostActive) {
    if (
      energyCapeImage &&
      energyCapeImage.complete &&
      energyCapeImage.naturalWidth > 0
    ) {
      // Draw cape on top of player
      // Adjust position to align with cat's back
      ctx.drawImage(energyCapeImage, state.player.x - 18, state.player.y - 5, 45, 45);
    }
  }

  // Draw coins
  for (let coin of state.coins) {
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
  if (state.isRocketActive && state.rocket) {
    // Draw rocket trail
    ctx.fillStyle = "rgba(255, 165, 0, 0.6)"; // Orange trail
    ctx.fillRect(state.rocket.x - 20, state.rocket.y + 5, 20, 10);

    // Determine which image to use based on rocket type
    let rocketImage = miniNukeImage;
    if (state.rocket.type === "nuke") {
      rocketImage = nukeImage;
    } else if (state.rocket.type === "goldNuke") {
      rocketImage = goldNukeImage;
    }

    // Draw rocket image if loaded, otherwise use rectangle
    if (rocketImage && rocketImage.complete && rocketImage.naturalWidth > 0) {
      const rocketSize = 25;
      ctx.drawImage(rocketImage, state.rocket.x, state.rocket.y, rocketSize, rocketSize);
    } else {
      // Fallback rocket
      ctx.fillStyle = "#32CD32"; // Green color
      ctx.fillRect(state.rocket.x, state.rocket.y, 25, 15);
      // Add simple rocket tip
      ctx.beginPath();
      ctx.moveTo(state.rocket.x + 25, state.rocket.y + 7.5);
      ctx.lineTo(state.rocket.x + 35, state.rocket.y + 7.5);
      ctx.strokeStyle = "#228B22";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // Draw explosion if active
  if (state.explosion) {
    const progress = state.explosion.timer / state.explosion.duration;
    const maxRadius = state.explosion.maxRadius;
    const currentRadius = maxRadius * progress;

    // Draw multiple explosion rings
    for (let i = 0; i < 3; i++) {
      const ringProgress = Math.max(0, progress - i * 0.2);
      const ringRadius = maxRadius * ringProgress;
      const alpha = Math.max(0, 1 - ringProgress);

      if (ringRadius > 0) {
        // Outer explosion ring (orange/red)
        ctx.beginPath();
        ctx.arc(state.explosion.x, state.explosion.y, ringRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${100 - i * 30}, 0, ${alpha * 0.6})`;
        ctx.fill();

        // Inner explosion ring (yellow/white)
        if (ringRadius > 10) {
          ctx.beginPath();
          ctx.arc(state.explosion.x, state.explosion.y, ringRadius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, ${100 + i * 50}, ${alpha * 0.8})`;
          ctx.fill();
        }
      }
    }

    // Draw explosion particles
    for (let particle of state.explosion.particles) {
      const particleProgress = state.explosion.timer / state.explosion.duration;
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
  ctx.fillText("High Score: " + state.playerHighScore, canvas.width - 20, 25);
  ctx.fillText("💰 Wallet: " + state.totalCoinsWallet, canvas.width - 20, 45);

  // Show magnet status if active
  let uiLineOffset = 65;
  if (state.hasMagnet && state.magnetRoundsLeft > 0) {
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
        ctx.measureText(" " + state.magnetRoundsLeft + " rounds").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(redMagnetImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(
        state.magnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    } else {
      // Fallback to emoji
      ctx.fillText(
        "🧲 " + state.magnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    }
    uiLineOffset += 20;
  }

  if (state.hasGoldMagnet && state.goldMagnetRoundsLeft > 0) {
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
        ctx.measureText(" " + state.goldMagnetRoundsLeft + " rounds").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(goldMagnetImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(
        state.goldMagnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    } else {
      // Fallback to emoji
      ctx.fillText(
        "🟡 " + state.goldMagnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    }
    uiLineOffset += 20;
  }

  // Show ghost shroom status if active or in ghost mode
  if ((state.hasGhostShroom && state.ghostShroomCount > 0) || state.isGhostActive) {
    // Draw ghost shroom image
    if (
      ghostShroomImage &&
      ghostShroomImage.complete &&
      ghostShroomImage.naturalWidth > 0
    ) {
      const imageSize = 16;
      const text = state.isGhostActive ? "GHOST MODE!" : state.ghostShroomCount + " left";
      const imageX =
        canvas.width - 20 - ctx.measureText(" " + text).width - imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(ghostShroomImage, imageX, imageY, imageSize, imageSize);

      // Add glow effect when ghost mode is active
      if (state.isGhostActive) {
        ctx.shadowColor = "#88ff88";
        ctx.shadowBlur = 10;
      }

      ctx.fillText(text, canvas.width - 20, uiLineOffset);

      // Reset shadow
      ctx.shadowBlur = 0;
    } else {
      // Fallback to emoji
      const text = state.isGhostActive
        ? "👻 GHOST MODE!"
        : "👻 " + state.ghostShroomCount + " left";

      // Add glow effect when ghost mode is active
      if (state.isGhostActive) {
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
  if (state.hasSpringBoots && state.springBootsCount > 0) {
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
        ctx.measureText(" " + state.springBootsCount + " left").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(springBootsImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(state.springBootsCount + " left", canvas.width - 20, uiLineOffset);
    } else {
      // Fallback to emoji
      ctx.fillText(
        "👢 " + state.springBootsCount + " left",
        canvas.width - 20,
        uiLineOffset
      );
    }
    uiLineOffset += 20;
  }

  // Draw pause button (only when game is running and started)
  if (state.gameRunning && state.gameStarted && state.gameNameEntered && !state.showAuthScreen) {
    const buttonSize = 30; // Size for the emoji area
    const buttonX = canvas.width - buttonSize - 15;
    const buttonY = uiLineOffset;

    // Store button coordinates for click detection
    state.pauseButtonCoords = {
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
      state.gamePaused ? "▶️" : "⏸️",
      buttonX + buttonSize / 2,
      buttonY + buttonSize / 2 + 8
    );

    // Reset action button coordinates
    state.rocketButtonCoords = {};
    state.nukeButtonCoords = {};
    state.goldNukeButtonCoords = {};
    state.energyCapeButtonCoords = {};

    // Draw action buttons (bottom bar)
    // Ground area starts at groundY and goes to canvas.height (~80px height)
    const actionBtnSize = 50;
    const actionBtnGap = 15;
    const actionBtnY = state.groundY + (canvas.height - state.groundY - actionBtnSize) / 2;

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
    if (state.hasEnergyCape && state.energyCapeRoundsLeft > 0) {
      state.energyCapeButtonCoords = drawActionSlot(
        energyCapeImage,
        "⚡",
        state.energyCapeRoundsLeft,
        state.energyCapeActive,
        state.energyCapeReloadTimer > 0 || state.isRocketActive,
        state.energyCapeReloadTimer > 0
          ? state.energyCapeReloadTimer / state.energyCapeCooldown
          : state.isRocketActive
          ? 1
          : 0
      );
    }

    // 2. Gold Nuke
    if (state.hasGoldNuke && state.goldNukeCount > 0) {
      state.goldNukeButtonCoords = drawActionSlot(
        goldNukeImage,
        "☢️",
        state.goldNukeCount,
        false,
        state.isRocketActive,
        state.isRocketActive ? 1 : 0
      );
    }

    // 3. Nuke
    if (state.hasNuke && state.nukeCount > 0) {
      state.nukeButtonCoords = drawActionSlot(
        nukeImage,
        "💥",
        state.nukeCount,
        false,
        state.isRocketActive,
        state.isRocketActive ? 1 : 0
      );
    }

    // 4. Mini Nuke (Leftmost)
    if (state.hasMiniNuke && state.miniNukeCount > 0) {
      state.rocketButtonCoords = drawActionSlot(
        miniNukeImage,
        "🚀",
        state.miniNukeCount,
        false,
        state.isRocketActive,
        state.isRocketActive ? 1 : 0
      );
    }

    // Reset text alignment and font size
    ctx.textAlign = "right";
    ctx.font = "16px Arial"; // Reset font size back to normal
  }

  // Reset text properties for score display
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff"; // Reset to white for score text
  ctx.fillText("Score: " + state.obstacleScore, 20, 25);

  // Add shadow to online count for better contrast
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText("👥 Online: " + state.onlineCount, 20, state.groundY - 10); // Bottom left corner

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Pause overlay
  if (state.gamePaused && state.gameRunning) {
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
  if (!state.gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = "18px Arial";
    ctx.fillText(
      `Final Score: ${state.obstacleScore}`,
      canvas.width / 2,
      canvas.height / 2 - 20
    );
    ctx.fillText(
      `💰 Total Wallet: ${state.totalCoinsWallet}`,
      canvas.width / 2,
      canvas.height / 2 + 5
    );

    if (!state.showGameOverButtons) {
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
      state.gameOverButtons = [];

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
      state.gameOverButtons.push({
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
      state.gameOverButtons.push({
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
      state.gameOverButtons.push({
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
      state.gameOverButtons.push({
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
      state.gameOverButtons.push({
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
  if (state.showAuthScreen) {
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
  if (!state.gameNameEntered && !state.showAuthScreen && state.authMode !== "authenticated") {
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
  if (!state.gameStarted && state.gameRunning) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Ready, ${state.playerName}?`,
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
  if (state.showLeaderboard) {
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

    for (let i = 0; i < Math.min(state.leaderboard.length, 20); i++) {
      const entry = state.leaderboard[i];
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
  if (state.showShop) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🛒 SHOP 🛒", canvas.width / 2, 50);

    ctx.font = "16px Arial";
    ctx.fillText(
      `💰 Your Wallet: ${state.totalCoinsWallet} coins`,
      canvas.width / 2,
      80
    );

    // Draw close button (X) in top right corner - bigger for mobile
    const closeButtonSize = isMobile ? 50 : 30;
    const closeButtonX = canvas.width - closeButtonSize - 10;
    const closeButtonY = 10;

    // Store close button coordinates for click detection
    state.closeButtonCoords = {
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
    state.shopGridCoords = [];

    for (let i = 0; i < availableShopItems.length; i++) {
      const item = availableShopItems[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      // Calculate exact positions
      const x = startX + col * spacingX - itemSize / 2;
      const y = startY + row * spacingY - itemSize / 2;

      // Store coordinates for click detection with larger touch area
      state.shopGridCoords.push({
        itemId: item.id,
        itemName: item.name,
        x: x - touchPadding,
        y: y - touchPadding,
        width: itemSize + touchPadding * 2,
        height: itemSize + touchPadding * 2,
      });

      // Determine if item can be purchased
      const canAfford = state.totalCoinsWallet >= item.price;
      const isOwned =
        (item.id === "magnet" && state.magnetRoundsLeft > 0) ||
        (item.id === "goldMagnet" && state.goldMagnetRoundsLeft > 0) ||
        (item.id === "ghostShroom" && state.ghostShroomCount > 0) ||
        (item.id === "springBoots" && state.springBootsCount > 0) ||
        (item.id === "miniNuke" && state.miniNukeCount > 0) ||
        (item.id === "nuke" && state.nukeCount > 0) ||
        (item.id === "goldNuke" && state.goldNukeCount > 0) ||
        (item.id === "energyCape" && state.energyCapeRoundsLeft > 0);

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
          statusText = `✓ ${state.magnetRoundsLeft} left`;
        } else if (item.id === "goldMagnet") {
          statusText = `✓ ${state.goldMagnetRoundsLeft} left`;
        } else if (item.id === "ghostShroom") {
          statusText = `✓ ${state.ghostShroomCount} left`;
        } else if (item.id === "springBoots") {
          statusText = `✓ ${state.springBootsCount} left`;
        } else if (item.id === "miniNuke") {
          statusText = `✓ ${state.miniNukeCount} left`;
        } else if (item.id === "nuke") {
          statusText = `✓ ${state.nukeCount} left`;
        } else if (item.id === "energyCape") {
          statusText = `✓ ${state.energyCapeRoundsLeft} left`;
        } else if (item.id === "goldNuke") {
          statusText = `✓ ${state.goldNukeCount} left`;
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
  if (state.showColorPalette) {
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
    state.closeButtonCoords = {
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
    state.colorGridCoords = [];

    for (let i = 0; i < availableColors.length; i++) {
      const color = availableColors[i];
      const row = Math.floor(i / colorsPerRow);
      const col = i % colorsPerRow;

      // Calculate exact positions
      const x = startX + col * spacing - colorSize / 2;
      const y = startY + row * spacing - colorSize / 2;

      // Store coordinates for click detection with larger touch area
      state.colorGridCoords.push({
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
      if (state.selectedCatColor === color.name) {
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
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
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

