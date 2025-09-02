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
    radius = 10;
  } else if (rarity < 0.1) {
    // 8% chance for red (rare)
    type = "red";
    value = 5;
    color = "#dc2626";
    strokeColor = "#991b1b";
    radius = 10;
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
