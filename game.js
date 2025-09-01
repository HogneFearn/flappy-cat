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
    // For mobile, use full screen dimensions
    const maxWidth = Math.min(window.innerWidth, 414); // Max iPhone Pro Max width
    const maxHeight = Math.min(window.innerHeight, 896); // Max iPhone Pro Max height

    // Maintain aspect ratio similar to original (400x600)
    const aspectRatio = 400 / 600;

    if (maxWidth / maxHeight > aspectRatio) {
      // Screen is wider than our ratio, constrain by height
      canvas.height = maxHeight;
      canvas.width = maxHeight * aspectRatio;
    } else {
      // Screen is taller than our ratio, constrain by width
      canvas.width = maxWidth;
      canvas.height = maxWidth / aspectRatio;
    }
  } else {
    // For desktop, keep reasonable size
    canvas.width = 600;
    canvas.height = 800;
  }

  // Update ground position based on new height
  groundY = canvas.height - 80;
}

// Initialize canvas size
resizeCanvas();

// Resize on window resize
window.addEventListener("resize", resizeCanvas);

// Load cat image
const catImage = new Image();
catImage.src = "cat.png"; // You'll need to provide this file

// Game variables
let player = { x: 70, y: 300, w: 35, h: 35, vx: 0, vy: 0, onGround: false };
let gravity = 0.2;
let jumpPower = -3.5;
let gameSpeed = 2.5;
let coins = [];
let obstacles = [];
let obstacleScore = 0;
let coinsCollectedThisGame = 0;
let totalCoinsWallet = 0; // Will be loaded when player name is set
let obstacleHighscore = localStorage.getItem("flappyObstacleHighscore") || 0;
let gameRunning = true;
let gameStarted = false;
let gameNameEntered = false;
let nameInputActive = false;
let obstacleSpawnTimer = 0;
let playerName = "";
let inputName = "";
let showLeaderboard = false;
let switchingPlayer = false;
let leaderboard = JSON.parse(localStorage.getItem("flappyLeaderboard") || "[]");

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
      totalCoinsWallet = loadPlayerWallet(playerName);

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
let isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Mobile button elements
const leaderboardBtn = document.getElementById("leaderboardBtn");
const switchPlayerBtn = document.getElementById("switchPlayerBtn");
const restartBtn = document.getElementById("restartBtn");
const nameInput = document.getElementById("nameInput");

// Hold-to-jump functionality
let isJumpHeld = false;
let jumpHoldTimer = 0;

// Touch/click handlers for mobile buttons
leaderboardBtn.addEventListener("touchstart", handleLeaderboard);
leaderboardBtn.addEventListener("click", handleLeaderboard);

switchPlayerBtn.addEventListener("touchstart", handleSwitchPlayer);
switchPlayerBtn.addEventListener("click", handleSwitchPlayer);

restartBtn.addEventListener("touchstart", handleRestart);
restartBtn.addEventListener("click", handleRestart);

// Canvas touch handler for all game interactions
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (!showLeaderboard && !nameInputActive) {
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
  if (!showLeaderboard && !nameInputActive) {
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
  totalCoinsWallet = loadPlayerWallet(playerName);

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
    switchPlayerBtn.style.display = "none";
    restartBtn.style.display = "none";
  } else if (!gameRunning) {
    // Game over - show leaderboard and switch player buttons
    leaderboardBtn.style.display = "block";
    switchPlayerBtn.style.display = "block";
    restartBtn.style.display = "none";
  } else if (!gameStarted) {
    // Ready screen - show leaderboard and switch player buttons
    leaderboardBtn.style.display = "block";
    switchPlayerBtn.style.display = "block";
    restartBtn.style.display = "none";
  } else {
    // During gameplay - hide all buttons since canvas handles everything
    leaderboardBtn.style.display = "none";
    switchPlayerBtn.style.display = "none";
    restartBtn.style.display = "none";
  }

  // Always ensure buttons are properly styled when visible
  [leaderboardBtn, switchPlayerBtn, restartBtn].forEach((btn) => {
    if (btn.style.display !== "none") {
      btn.style.display = "block";
    }
  });
} // Prevent default touch behaviors
document.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);

document.addEventListener("touchstart", (e) => {
  if (e.target === document.body || e.target === canvas) {
    e.preventDefault();
  }
});

// Platform (groundY is set dynamically in resizeCanvas function)
// groundY is declared at the top of the file

// Coin generator
function spawnCoin() {
  const x = canvas.width + Math.random() * 150;
  const y = Math.random() * (groundY - 120) + 60;
  coins.push({ x, y, r: 10 });
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

for (let i = 0; i < 3; i++) spawnCoin();

// Player wallet functions
function getPlayerWalletKey(playerName) {
  return `flappyCoins_${playerName}`;
}

function loadPlayerWallet(playerName) {
  const walletKey = getPlayerWalletKey(playerName);
  return parseInt(localStorage.getItem(walletKey) || "0");
}

function savePlayerWallet(playerName, coins) {
  const walletKey = getPlayerWalletKey(playerName);
  localStorage.setItem(walletKey, coins.toString());
}

// Leaderboard functions
function addToLeaderboard(name, score) {
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
  localStorage.setItem("flappyLeaderboard", JSON.stringify(leaderboard));
}

function handleGameOver() {
  gameRunning = false;

  // Add coins to player's persistent wallet
  totalCoinsWallet += coinsCollectedThisGame;
  savePlayerWallet(playerName, totalCoinsWallet);

  // Use obstacle score for leaderboard (pipes cleared)
  if (obstacleScore > 0) {
    addToLeaderboard(playerName, obstacleScore);
  }

  // Update obstacle highscore (main highscore)
  if (obstacleScore > obstacleHighscore) {
    obstacleHighscore = obstacleScore;
    localStorage.setItem("flappyObstacleHighscore", obstacleHighscore);
  }
}

function getPlayerName() {
  nameInputActive = true;
  inputName = "";

  // Show and focus the input field for mobile
  if (isMobile) {
    nameInput.style.display = "block";
    nameInput.value = "";
    nameInput.focus();
  }
}

function resetGame() {
  player.x = 70;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  obstacleScore = 0;
  coinsCollectedThisGame = 0;
  coins = [];
  obstacles = [];
  gameRunning = true;
  gameStarted = false;
  showLeaderboard = false;
  switchingPlayer = false;
  obstacleSpawnTimer = 0;
  for (let i = 0; i < 3; i++) spawnCoin();
}

function switchPlayer() {
  // Reset to name entry state
  gameNameEntered = false;
  nameInputActive = false;
  switchingPlayer = false;
  inputName = "";
  playerName = "";
  nameInput.style.display = "none"; // Hide mobile input field
  resetGame();
}

function update() {
  // Handle name entry before starting the game
  if (!gameNameEntered) {
    if (keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) {
      getPlayerName();
    }
    return;
  }

  // Handle held jump for mobile
  if (isJumpHeld && gameRunning && gameStarted) {
    jumpHoldTimer++;
    // Allow continuous jumping while held, but with a slight delay
    if (jumpHoldTimer % 8 === 0) {
      player.vy = jumpPower;
    }
  }

  // Jump controls and restart
  if (keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) {
    if (!gameRunning) {
      // Restart game if it's over
      resetGame();
      return;
    }
    if (!gameStarted) gameStarted = true;
    player.vy = jumpPower;
  }

  // Switch player with 'N' key (both during game over and ready screen)
  if (keys["KeyN"] && (!gameRunning || !gameStarted)) {
    switchPlayer();
    keys["KeyN"] = false;
    return;
  }

  // Toggle leaderboard with 'L' key
  if (keys["KeyL"]) {
    showLeaderboard = !showLeaderboard;
    keys["KeyL"] = false; // Prevent repeated toggling
  }

  if (!gameRunning) return;

  // Only apply gravity and movement if game has started
  if (gameStarted) {
    // Gravity
    player.vy += gravity;
    player.y += player.vy;
  }

  // Ground collision
  if (player.y + player.h > groundY) {
    handleGameOver();
  }

  // Ceiling collision
  if (player.y < 0) {
    handleGameOver();
  }

  // Only move world objects if game has started
  if (gameStarted) {
    // Move coins left (simulate player moving right)
    for (let i = coins.length - 1; i >= 0; i--) {
      coins[i].x -= gameSpeed;
      if (coins[i].x < -50) {
        coins.splice(i, 1);
        spawnCoin();
      }
    }

    // Move obstacles left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= gameSpeed;

      // Score when passing obstacle
      if (
        !obstacles[i].passed &&
        obstacles[i].x + obstacles[i].width < player.x
      ) {
        obstacles[i].passed = true;
        obstacleScore += 5;
      }

      // Remove obstacles that are off screen
      if (obstacles[i].x < -obstacles[i].width) {
        obstacles.splice(i, 1);
      }
    }

    // Spawn new obstacles
    obstacleSpawnTimer++;
    if (obstacleSpawnTimer > 120) {
      // Spawn every 2 seconds at 60fps
      spawnObstacle();
      obstacleSpawnTimer = 0;
    }

    // Coin collision
    for (let i = coins.length - 1; i >= 0; i--) {
      let coin = coins[i];
      let dx = player.x + player.w / 2 - coin.x;
      let dy = player.y + player.h / 2 - coin.y;
      if (Math.sqrt(dx * dx + dy * dy) < coin.r + player.w / 2) {
        coins.splice(i, 1);
        coinsCollectedThisGame += 1;
        spawnCoin();
      }
    }

    // Obstacle collision
    for (let obstacle of obstacles) {
      // Check collision with top pipe
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.w > obstacle.x &&
        player.y < obstacle.topHeight
      ) {
        handleGameOver();
      }

      // Check collision with bottom pipe
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.w > obstacle.x &&
        player.y + player.h > obstacle.bottomY
      ) {
        handleGameOver();
      }
    }
  } // End of gameStarted condition
}

function draw() {
  // Fill entire canvas with black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw sky area (playable area background)
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, groundY);

  // Draw ground
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Draw obstacles (pipes)
  ctx.fillStyle = "#228B22";
  for (let obstacle of obstacles) {
    // Top pipe
    ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.topHeight);
    // Bottom pipe
    ctx.fillRect(
      obstacle.x,
      obstacle.bottomY,
      obstacle.width,
      obstacle.bottomHeight
    );

    // Pipe borders
    ctx.strokeStyle = "#006400";
    ctx.lineWidth = 3;
    ctx.strokeRect(obstacle.x, 0, obstacle.width, obstacle.topHeight);
    ctx.strokeRect(
      obstacle.x,
      obstacle.bottomY,
      obstacle.width,
      obstacle.bottomHeight
    );
  }

  // Draw player
  if (catImage.complete && catImage.naturalHeight !== 0) {
    // Draw cat image if loaded
    ctx.drawImage(catImage, player.x, player.y, player.w, player.h);
  } else {
    // Fallback to colored rectangle if image not loaded
    ctx.fillStyle = gameRunning ? "#ff0" : "#f00";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // Draw coins
  for (let coin of coins) {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.strokeStyle = "#b8860b";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw UI
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText("High Score: " + obstacleHighscore, canvas.width - 20, 25);
  ctx.fillText("💰 Wallet: " + totalCoinsWallet, canvas.width - 20, 45);

  ctx.textAlign = "left";
  ctx.fillText("Score: " + obstacleScore, 20, 25);
  ctx.fillText("Coins: " + coinsCollectedThisGame, 20, 45);

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
      `Coins Collected: ${coinsCollectedThisGame}`,
      canvas.width / 2,
      canvas.height / 2 + 5
    );

    ctx.font = "16px Arial";
    if (isMobile) {
      ctx.fillText(
        "Tap screen to Play Again",
        canvas.width / 2,
        canvas.height / 2 + 40
      );
    } else {
      ctx.fillText(
        "SPACE - Play Again",
        canvas.width / 2,
        canvas.height / 2 + 40
      );
      ctx.fillText(
        "N - Switch/New Player",
        canvas.width / 2,
        canvas.height / 2 + 60
      );
      ctx.fillText(
        "L - View Leaderboard",
        canvas.width / 2,
        canvas.height / 2 + 80
      );
    }

    ctx.textAlign = "left";
  }

  // Name entry screen
  if (!gameNameEntered) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Welcome to Cat Flappy!",
      canvas.width / 2,
      canvas.height / 2 - 100
    );

    if (!nameInputActive) {
      ctx.font = "20px Arial";
      if (isMobile) {
        ctx.fillText(
          "Tap screen to enter your name",
          canvas.width / 2,
          canvas.height / 2 - 20
        );
      } else {
        ctx.fillText(
          "Press SPACE to enter your name",
          canvas.width / 2,
          canvas.height / 2 - 20
        );
      }
      ctx.fillText(
        "and join the leaderboard!",
        canvas.width / 2,
        canvas.height / 2 + 10
      );
    } else if (!isMobile) {
      // Only show canvas input for desktop users
      ctx.font = "20px Arial";
      ctx.fillText(
        "Enter your name:",
        canvas.width / 2,
        canvas.height / 2 - 40
      );

      // Draw input box
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      const boxWidth = 250;
      const boxHeight = 40;
      const boxX = canvas.width / 2 - boxWidth / 2;
      const boxY = canvas.height / 2 - 20;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // Draw input text
      ctx.fillStyle = "#fff";
      ctx.font = "18px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        inputName + (Date.now() % 1000 < 500 ? "|" : ""),
        boxX + 10,
        boxY + 25
      );

      // Instructions
      ctx.textAlign = "center";
      ctx.font = "16px Arial";
      ctx.fillText(
        "Press ENTER to confirm",
        canvas.width / 2,
        canvas.height / 2 + 40
      );
      ctx.fillText(
        "BACKSPACE to delete",
        canvas.width / 2,
        canvas.height / 2 + 60
      );
    }

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

    for (let i = 0; i < Math.min(leaderboard.length, 20); i++) {
      const entry = leaderboard[i];
      const y = startY + i * lineHeight;
      const rank = i + 1;
      const medal =
        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;

      ctx.fillText(
        `${medal} ${entry.name} - ${entry.score}`,
        canvas.width / 2,
        y
      );
    }

    ctx.font = "18px Arial";
    ctx.fillText("Press L to close", canvas.width / 2, canvas.height - 50);
    ctx.textAlign = "left";
  }
}

function gameLoop() {
  update();
  draw();
  updateMobileButtons();
  requestAnimationFrame(gameLoop);
}
gameLoop();
