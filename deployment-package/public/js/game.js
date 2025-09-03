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
    radius = 10;
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

  // Decrease magnet rounds if player has magnet
  if (hasMagnet) {
    magnetRoundsLeft--;
    if (magnetRoundsLeft <= 0) {
      hasMagnet = false;
      magnetRoundsLeft = 0;
    }
    // Save updated inventory
    const inventory = { magnetRoundsLeft };
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
  // Increase speed by 0.3 for every 75 points from the start
  const speedIncreaseIntervals = Math.floor(obstacleScore / 75);
  const speedIncrease = speedIncreaseIntervals * 0.3;
  return baseGameSpeed + speedIncrease;
}

function resetGame() {
  player.x = 70;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  obstacleScore = 0;
  gameSpeed = baseGameSpeed; // Reset game speed to base speed
  coins = [];
  obstacles = [];
  gameRunning = true;
  gameStarted = false;
  showLeaderboard = false;
  showShop = false;
  switchingPlayer = false;
  obstacleSpawnTimer = 0;
  validationTimer = 0;
  isJumpHeld = false;
  jumpHoldTimer = 0;
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
        keys["KeyL"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyS"]) {
      if (gameNameEntered && (!gameRunning || !gameStarted)) {
        showShop = !showShop;
        showLeaderboard = false; // Close leaderboard when opening shop
        keys["KeyS"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyB"]) {
      if (showShop) {
        buyMagnetItem();
        keys["KeyB"] = false; // Prevent key repeat
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

    // Validate coin positions occasionally (every 60 frames = 1 second at 60fps)
    validationTimer++;
    if (validationTimer > 60) {
      validateCoinPositions();
      validationTimer = 0;
    }

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
      let distance = Math.sqrt(dx * dx + dy * dy);

      // Magnet attraction
      if (
        hasMagnet &&
        distance < magnetRadius &&
        distance > coin.r + player.w / 2
      ) {
        // Pull coin towards player
        const pullStrength = 0.7;
        const angle = Math.atan2(dy, dx);
        coin.x += Math.cos(angle) * pullStrength * gameSpeed;
        coin.y += Math.sin(angle) * pullStrength * gameSpeed;
      }

      // Collision detection
      if (distance < coin.r + player.w / 2) {
        coins.splice(i, 1);
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
        obstacleScore += 5;
        // Update game speed based on new score
        gameSpeed = calculateGameSpeed();
      }
    }

    // Ensure there are always coins on screen
    if (coins.length < 3) {
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

// Draw UI
ctx.fillStyle = "#fff";
ctx.font = "16px Arial";
ctx.textAlign = "right";
ctx.fillText("High Score: " + playerHighScore, canvas.width - 20, 25);
ctx.fillText("💰 Wallet: " + totalCoinsWallet, canvas.width - 20, 45);
ctx.fillText("👥 Online: " + onlineCount, canvas.width - 20, 65); // Add this line

ctx.textAlign = "left";
ctx.fillText("Score: " + obstacleScore, 20, 25);
