// Controls
let keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  // Handle text input when name input is active (desktop only)
  if (nameInputActive && !isMobile) {
    if (e.key === "Enter") {
      // Confirm name entry
      if (inputName.trim() !== "") {
        playerName = inputName.trim();
      } else {
        playerName = "Anonymous";
      }

      // Load this player's wallet
      loadPlayerWallet(playerName).then((wallet) => {
        totalCoinsWallet = wallet;
      });

      gameNameEntered = true;
      nameInputActive = false;
      inputName = "";
    } else if (e.key === "Backspace") {
      // Remove last character
      inputName = inputName.slice(0, -1);
    } else if (e.key.length === 1 && inputName.length < 12) {
      // Add character (limit to 12 characters)
      inputName += e.key;
    }
    e.preventDefault(); // Prevent default browser behavior
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
leaderboardBtn.addEventListener("touchstart", handleLeaderboard);
leaderboardBtn.addEventListener("click", handleLeaderboard);

shopBtn.addEventListener("touchstart", handleShop);
shopBtn.addEventListener("click", handleShop);

switchPlayerBtn.addEventListener("touchstart", handleSwitchPlayer);
switchPlayerBtn.addEventListener("click", handleSwitchPlayer);

restartBtn.addEventListener("touchstart", handleRestart);
restartBtn.addEventListener("click", handleRestart);

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
    }
  } else if (!showLeaderboard && !nameInputActive) {
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
  if (!showLeaderboard && !showShop && !nameInputActive) {
    handleJump();
  }
});

// Mobile name input event listeners
nameInput.addEventListener("input", (e) => {
  inputName = e.target.value;
});

nameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    confirmPlayerName();
  }
});

nameInput.addEventListener("blur", () => {
  if (inputName.trim().length > 0) {
    confirmPlayerName();
  }
});

function confirmPlayerName() {
  if (inputName.trim().length > 0) {
    playerName = inputName.trim();
  } else {
    playerName = "Anonymous";
  }

  // Load this player's wallet
  loadPlayerWallet(playerName).then((wallet) => {
    totalCoinsWallet = wallet;
  });

  // Load this player's inventory
  loadPlayerInventory(playerName).then((inventory) => {
    magnetRoundsLeft = inventory.magnetRoundsLeft || 0;
    hasMagnet = magnetRoundsLeft > 0;
  });

  gameNameEntered = true;
  nameInputActive = false;
  nameInput.style.display = "none";
  resetGame();
}

function handleJump() {
  if (!gameNameEntered) {
    if (!nameInputActive) {
      getPlayerName();
    }
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
    showLeaderboard = !showLeaderboard;
    showShop = false; // Close shop when opening leaderboard
  }
}

function handleShop() {
  if (gameNameEntered && (!gameRunning || !gameStarted)) {
    showShop = !showShop;
    showLeaderboard = false; // Close leaderboard when opening shop
  }
}

function handleSwitchPlayer() {
  if (!gameRunning || !gameStarted) {
    switchPlayer();
  }
}

function handleRestart() {
  if (!gameRunning) {
    resetGame();
  }
}

// Update button visibility based on game state
function updateMobileButtons() {
  if (!gameNameEntered || nameInputActive) {
    // During name entry - hide all buttons
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
  } else if (!gameStarted) {
    // Ready screen - show leaderboard, shop, and switch player buttons
    leaderboardBtn.style.display = "block";
    shopBtn.style.display = "block";
    switchPlayerBtn.style.display = "block";
    restartBtn.style.display = "none";
  } else {
    // During gameplay - hide all buttons since canvas handles everything
    leaderboardBtn.style.display = "none";
    shopBtn.style.display = "none";
    switchPlayerBtn.style.display = "none";
    restartBtn.style.display = "none";
  }

  // Always ensure buttons are properly styled when visible
  [leaderboardBtn, shopBtn, switchPlayerBtn, restartBtn].forEach((btn) => {
    if (btn.style.display !== "none") {
      btn.style.display = "block";
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
