// Controls
let keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

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
    // Check if touch is in magnet buy area (around where "Press B to Buy!" text is)
    const magnetBuyY = 215; // magnetY (130) + 85
    if (
      canvasY >= magnetBuyY - 20 &&
      canvasY <= magnetBuyY + 20 &&
      canvasX >= canvas.width / 4 &&
      canvasX <= (3 * canvas.width) / 4 &&
      totalCoinsWallet >= 200 &&
      magnetRoundsLeft === 0
    ) {
      buyMagnetItem();
    } else {
      // If tapping outside the shop content area, close the shop
      // Shop content spans roughly from y=30 to y=230
      const shopContentTop = 30;
      const shopContentBottom = 250;
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
    }
    return; // Important: prevent any other touch handling when shop is open
  } else if (showLeaderboard) {
    // Close leaderboard when tapping on canvas
    showLeaderboard = false;
    return; // Important: prevent any other touch handling when leaderboard is open
  }

  // Priority 2: Check for in-canvas button clicks when game is over (handle on touchstart for better responsiveness)
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
    // Check if click is in magnet buy area (around where "Press B to Buy!" text is)
    const magnetBuyY = 215; // magnetY (130) + 85
    if (
      canvasY >= magnetBuyY - 20 &&
      canvasY <= magnetBuyY + 20 &&
      canvasX >= canvas.width / 4 &&
      canvasX <= (3 * canvas.width) / 4 &&
      totalCoinsWallet >= 200 &&
      magnetRoundsLeft === 0
    ) {
      buyMagnetItem();
    } else {
      // If clicking outside the shop content area, close the shop
      // Shop content spans roughly from y=30 to y=230
      const shopContentTop = 30;
      const shopContentBottom = 250;
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
    }
    return; // Important: prevent any other click handling when shop is open
  } else if (showLeaderboard) {
    // Close leaderboard when clicking on canvas
    showLeaderboard = false;
    return; // Important: prevent any other click handling when leaderboard is open
  }

  // Priority 2: Check for in-canvas button clicks when game is over
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
