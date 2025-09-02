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
let totalCoinsWallet = 0; // Will be loaded when player name is set
let obstacleHighscore = 0; // Will be loaded from API instead of localStorage
let gameRunning = true;
let gameStarted = false;
let gameNameEntered = false;
let nameInputActive = false;
let obstacleSpawnTimer = 0;
let playerName = "";
let inputName = "";
let showLeaderboard = false;
let switchingPlayer = false;
let leaderboard = []; // Will be loaded from API instead of localStorage

// API helper functions
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    return null;
  }
}

// Player wallet functions (now using API instead of localStorage)
async function loadPlayerWallet(playerName) {
  const result = await apiRequest(
    `/api/player/${encodeURIComponent(playerName)}/wallet`
  );
  return result ? result.wallet : 0;
}

async function savePlayerWallet(playerName, coins) {
  await apiRequest(`/api/player/${encodeURIComponent(playerName)}/wallet`, {
    method: "POST",
    body: JSON.stringify({ wallet: coins }),
  });
}

// Leaderboard functions (now using API instead of localStorage)
async function loadLeaderboard() {
  const result = await apiRequest("/api/leaderboard");
  return result || [];
}

async function addToLeaderboard(name, score) {
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

  // Save to API instead of localStorage
  await apiRequest("/api/leaderboard", {
    method: "POST",
    body: JSON.stringify({ playerName: name, score }),
  });

  // Reload leaderboard after adding score
  leaderboard = await loadLeaderboard();
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

// Initialize game data from API
async function initializeGameData() {
  obstacleHighscore = await loadHighScore();
  leaderboard = await loadLeaderboard();
}

// Call initialization
initializeGameData();

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
  loadPlayerWallet(playerName).then((wallet) => {
    totalCoinsWallet = wallet;
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

function spawnCoin() {
  const x = canvas.width + Math.random() * 150;
  const y = Math.random() * (groundY - 120) + 60;

  // Determine coin type based on rarity
  const rarity = Math.random();
  let type, value, color, strokeColor, radius;

  if (rarity < 0.02) {
    // 2% chance for blue (super rare)
    type = "blue";
    value = 20;
    color = "#4169e1";
    strokeColor = "#1e3a8a";
    radius = 14; // Larger for super rare
  } else if (rarity < 0.1) {
    // 8% chance for red (rare)
    type = "red";
    value = 5;
    color = "#dc2626";
    strokeColor = "#991b1b";
    radius = 12; // Slightly larger for rare
  } else {
    // 90% chance for gold (common)
    type = "gold";
    value = 1;
    color = "#ffd700";
    strokeColor = "#b8860b";
    radius = 10; // Normal size
  }

  coins.push({ x, y, r: radius, type, value, color, strokeColor });
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

async function addToLeaderboard(name, score) {
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

  // Save to API instead of localStorage
  await apiRequest("/api/leaderboard", {
    method: "POST",
    body: JSON.stringify({ playerName: name, score }),
  });

  // Reload leaderboard after adding score
  leaderboard = await loadLeaderboard();
}

async function handleGameOver() {
  gameRunning = false;

  // Use obstacle score for leaderboard (pipes cleared)
  if (obstacleScore > 0) {
    await addToLeaderboard(playerName, obstacleScore);
  }

  // Update obstacle highscore (main highscore)
  if (obstacleScore > obstacleHighscore) {
    obstacleHighscore = obstacleScore;
    await saveHighScore(obstacleHighscore);
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
  coins = [];
  obstacles = [];
  gameRunning = true;
  gameStarted = false;
  showLeaderboard = false;
  switchingPlayer = false;
  obstacleSpawnTimer = 0;
  isJumpHeld = false;
  jumpHoldTimer = 0;
  for (let i = 0; i < 3; i++) spawnCoin();
}

function switchPlayer() {
  // Reset to name entry state
  gameNameEntered = false;
  nameInputActive = false;
  switchingPlayer = false;
  showLeaderboard = false;
  inputName = "";
  playerName = "";
  totalCoinsWallet = 0;

  if (isMobile) {
    nameInput.style.display = "block";
    nameInput.value = "";
    nameInput.focus();
    nameInputActive = true;
  }

  resetGame();
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
        keys["KeyL"] = false; // Prevent key repeat
      }
    }

    if (keys["Space"] || keys["ArrowUp"]) {
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
  }

  if (gameRunning && gameStarted) {
    // Mobile hold-to-jump logic
    if (isMobile && isJumpHeld) {
      jumpHoldTimer++;
      if (jumpHoldTimer % 5 === 0) {
        // Apply jump every 5 frames when holding
        player.vy = jumpPower * 0.8; // Slightly less powerful for continuous jumps
      }
    }
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
    // Move obstacles
    for (let obstacle of obstacles) {
      obstacle.x -= gameSpeed;
    }

    // Move coins
    for (let coin of coins) {
      coin.x -= gameSpeed;
    }

    // Remove off-screen obstacles
    obstacles = obstacles.filter((obstacle) => obstacle.x > -obstacle.width);

    // Remove off-screen coins
    coins = coins.filter((coin) => coin.x > -coin.r);

    // Spawn obstacles
    obstacleSpawnTimer++;
    if (obstacleSpawnTimer > 120) {
      // Spawn every 2 seconds at 60fps
      spawnObstacle();
      obstacleSpawnTimer = 0;
    }

    // Check coin collision
    for (let i = coins.length - 1; i >= 0; i--) {
      let coin = coins[i];
      let dx = player.x + player.w / 2 - coin.x;
      let dy = player.y + player.h / 2 - coin.y;
      if (Math.sqrt(dx * dx + dy * dy) < coin.r + player.w / 2) {
        coins.splice(i, 1);
        // Add coin value directly to wallet
        totalCoinsWallet += coin.value;
        savePlayerWallet(playerName, totalCoinsWallet);
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
        handleGameOver();
      }

      // Bottom pipe collision
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.w > obstacle.x &&
        player.y + player.h > obstacle.bottomY
      ) {
        handleGameOver();
      }

      // Score when passing obstacle
      if (!obstacle.passed && player.x > obstacle.x + obstacle.width) {
        obstacle.passed = true;
        obstacleScore++;
      }
    }

    // Ensure there are always coins on screen
    if (coins.length < 3) {
      spawnCoin();
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
    // Add glow effect for rare coins
    if (coin.type === "red" || coin.type === "blue") {
      ctx.shadowColor = coin.color;
      ctx.shadowBlur = 10;
    }

    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fillStyle = coin.color;
    ctx.fill();
    ctx.strokeStyle = coin.strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  // Draw UI
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText("High Score: " + obstacleHighscore, canvas.width - 20, 25);
  ctx.fillText("💰 Wallet: " + totalCoinsWallet, canvas.width - 20, 45);

  ctx.textAlign = "left";
  ctx.fillText("Score: " + obstacleScore, 20, 25);

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
