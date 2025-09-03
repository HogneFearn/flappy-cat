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
let jumpHoldTimer = 0;

// Canvas touch handler for all game interactions
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  // Get touch coordinates
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  const touchY = e.touches[0].clientY - rect.top;

  // Use direct coordinate mapping accounting for canvas scaling
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = touchX * scaleX;
  const canvasY = touchY * scaleY;

  // Check for in-canvas button clicks when game is over (handle on touchstart for better responsiveness)
  if (!gameRunning && gameOverButtons.length > 0) {
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

  if (showShop) {
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
  } else if (showLeaderboard) {
    // Close leaderboard when tapping on canvas
    showLeaderboard = false;
  } else if (!showAuthScreen && gameNameEntered) {
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
  // Get click coordinates relative to canvas
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Use direct coordinate mapping accounting for canvas scaling
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = clickX * scaleX;
  const canvasY = clickY * scaleY;

  // Check for in-canvas button clicks when game is over
  if (!gameRunning && gameOverButtons.length > 0) {
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

  if (showShop) {
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
  } else if (showLeaderboard) {
    // Close leaderboard when clicking on canvas
    showLeaderboard = false;
  } else if (!showAuthScreen && gameNameEntered) {
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
    resetGame();
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
    }
  }
}

function handleShop() {
  if (gameNameEntered) {
    // Always allow closing the shop, but only allow opening if game is not running or not started
    if (showShop || !gameRunning || !gameStarted) {
      showShop = !showShop;
      showLeaderboard = false; // Close leaderboard when opening shop
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
