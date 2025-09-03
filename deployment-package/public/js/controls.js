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

// Mobile Controls
const leaderboardBtn = document.getElementById("leaderboardBtn");
const shopBtn = document.getElementById("shopBtn");
const switchPlayerBtn = document.getElementById("switchPlayerBtn");
const restartBtn = document.getElementById("restartBtn");
const nameInput = document.getElementById("nameInput");

// Hold-to-jump functionality
let isJumpHeld = false;
let jumpHoldTimer = 0;

// Touch/click handlers for mobile buttons
// Use only touchend for mobile to avoid double triggering
leaderboardBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleLeaderboard();
});
leaderboardBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleLeaderboard();
});

shopBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleShop();
});
shopBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleShop();
});

switchPlayerBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleSwitchPlayer();
});
switchPlayerBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleSwitchPlayer();
});

restartBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleRestart();
});
restartBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleRestart();
});

// Canvas touch handler for all game interactions
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (showShop) {
    // Check if touch is in shop buy button area (rough approximation)
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;

    // Scale touch coordinates to canvas coordinates
    const canvasX = (touchX / rect.width) * canvas.width;
    const canvasY = (touchY / rect.height) * canvas.height;

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
      const shopContentTop = 50;
      const shopContentBottom = canvas.height - 50;
      if (canvasY < shopContentTop || canvasY > shopContentBottom) {
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

  // Get touch coordinates relative to canvas
  const rect = canvas.getBoundingClientRect();
  const touch = e.changedTouches[0]; // Use changedTouches for touchend
  const touchX = touch.clientX - rect.left;
  const touchY = touch.clientY - rect.top;

  // Scale touch coordinates to canvas coordinates
  const canvasX = (touchX / rect.width) * canvas.width;
  const canvasY = (touchY / rect.height) * canvas.height;

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
});

// Canvas click handler for desktop
canvas.addEventListener("click", (e) => {
  // Get click coordinates relative to canvas
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Check for in-canvas button clicks when game is over
  if (!gameRunning && gameOverButtons.length > 0) {
    for (const button of gameOverButtons) {
      if (
        clickX >= button.x &&
        clickX <= button.x + button.width &&
        clickY >= button.y &&
        clickY <= button.y + button.height
      ) {
        handleGameOverButtonClick(button.action);
        return;
      }
    }
  }

  if (showShop || showLeaderboard) {
    // Close overlays when clicking on canvas
    showShop = false;
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
      switchPlayer();
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
function updateMobileButtons() {
  // Reset all button classes first
  [leaderboardBtn, shopBtn, switchPlayerBtn, restartBtn].forEach((btn) => {
    if (btn) {
      btn.classList.remove("active");
    }
  });

  if (!gameNameEntered || showAuthScreen) {
    // During authentication - hide all buttons
    leaderboardBtn.style.display = "none";
    shopBtn.style.display = "none";
    switchPlayerBtn.style.display = "none";
    restartBtn.style.display = "none";
  } else if (!gameRunning) {
    // Game over - show leaderboard, shop, and switch player buttons
    leaderboardBtn.style.display = "block";
    shopBtn.style.display = "block";
    switchPlayerBtn.style.display = "block";
    restartBtn.style.display = "none";

    // Apply active state to open overlays
    if (showLeaderboard) leaderboardBtn.classList.add("active");
    if (showShop) shopBtn.classList.add("active");
  } else if (!gameStarted) {
    // Ready screen - show leaderboard, shop, and switch player buttons
    leaderboardBtn.style.display = "block";
    shopBtn.style.display = "block";
    switchPlayerBtn.style.display = "block";
    restartBtn.style.display = "none";

    // Apply active state to open overlays
    if (showLeaderboard) leaderboardBtn.classList.add("active");
    if (showShop) shopBtn.classList.add("active");
  } else if (showShop || showLeaderboard) {
    // During gameplay but with overlays open - show relevant buttons for closing
    leaderboardBtn.style.display = showLeaderboard ? "block" : "none";
    shopBtn.style.display = showShop ? "block" : "none";
    switchPlayerBtn.style.display = "none";
    restartBtn.style.display = "none";

    // Apply active state to open overlays
    if (showLeaderboard) leaderboardBtn.classList.add("active");
    if (showShop) shopBtn.classList.add("active");
  } else {
    // During normal gameplay - hide all buttons since canvas handles everything
    leaderboardBtn.style.display = "none";
    shopBtn.style.display = "none";
    switchPlayerBtn.style.display = "none";
    restartBtn.style.display = "none";
  }

  // Ensure visible buttons are properly styled
  [leaderboardBtn, shopBtn, switchPlayerBtn, restartBtn].forEach((btn) => {
    if (btn && btn.style.display === "block") {
      // Make sure the button is actually visible and clickable
      btn.style.pointerEvents = "auto";
      btn.style.opacity = "1";
    }
  });
}

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
