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
  showGameOverButtons = false; // Start with just the game over message

  // Decrease magnet rounds if player has magnets
  if (hasMagnet || hasGoldMagnet) {
    const inventory = {};

    if (hasMagnet) {
      magnetRoundsLeft--;
      if (magnetRoundsLeft <= 0) {
        hasMagnet = false;
        magnetRoundsLeft = 0;
      }
      inventory.magnetRoundsLeft = magnetRoundsLeft;
    }

    if (hasGoldMagnet) {
      goldMagnetRoundsLeft--;
      if (goldMagnetRoundsLeft <= 0) {
        hasGoldMagnet = false;
        goldMagnetRoundsLeft = 0;
      }
      inventory.goldMagnetRoundsLeft = goldMagnetRoundsLeft;
    }

    // Save updated inventory
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
  // Ensure obstacleScore is valid and within reasonable bounds
  const safeScore = Math.max(0, Math.min(obstacleScore, 1500)); // Cap at 1500 points for safety

  // Increase speed by 0.3 for every 75 points from the start
  const speedIncreaseIntervals = Math.floor(safeScore / 75);
  const speedIncrease = speedIncreaseIntervals * 0.3;
  const calculatedSpeed = baseGameSpeed + speedIncrease;

  // Add maximum speed cap to prevent unplayable speeds
  const maxGameSpeed = baseGameSpeed + 10.0; // Increased cap for more challenge
  const finalSpeed = Math.min(calculatedSpeed, maxGameSpeed);

  // Debug logging for speed spikes
  if (finalSpeed > baseGameSpeed + 2.0) {
    console.log(
      `Warning: High game speed detected. Score: ${obstacleScore}, Speed: ${finalSpeed.toFixed(
        2
      )}`
    );
  }

  return finalSpeed;
}

function resetGame() {
  player.x = 70;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  obstacleScore = 0;
  gameSpeed = baseGameSpeed; // Reset game speed to base speed

  // Extra safety check to ensure baseGameSpeed is valid
  if (baseGameSpeed <= 0 || baseGameSpeed > 10) {
    console.warn(
      `Invalid baseGameSpeed detected: ${baseGameSpeed}, resetting to 2.5`
    );
    baseGameSpeed = 2.5;
    gameSpeed = 2.5;
  }

  coins = [];
  obstacles = [];
  gameRunning = true;
  gameStarted = false;
  gamePaused = false; // Reset pause state
  showLeaderboard = false;
  showShop = false;
  showColorPalette = false; // Reset color palette state
  showGameOverButtons = false; // Reset game over button state
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
        showColorPalette = false; // Close color palette when opening leaderboard
        keys["KeyL"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyS"]) {
      if (gameNameEntered && (!gameRunning || !gameStarted)) {
        showShop = !showShop;
        showLeaderboard = false; // Close leaderboard when opening shop
        showColorPalette = false; // Close color palette when opening shop
        keys["KeyS"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyB"]) {
      if (showShop) {
        buyMagnetItem();
        keys["KeyB"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyC"]) {
      if (gameNameEntered && (!gameRunning || !gameStarted)) {
        showColorPalette = !showColorPalette;
        showLeaderboard = false; // Close other menus
        showShop = false;
        keys["KeyC"] = false; // Prevent key repeat
      }
    }

    if (keys["KeyP"]) {
      if (gameNameEntered && gameRunning && gameStarted) {
        togglePause();
        keys["KeyP"] = false; // Prevent key repeat
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
        // If game is over but buttons aren't shown yet, show them
        if (!showGameOverButtons) {
          showGameOverButtons = true;
        }
        // Don't restart the game automatically when buttons are shown
        // Player must click the "Play Again" button instead
      } else if (gamePaused) {
        // Resume game and jump at the same time
        gamePaused = false;
        player.vy = jumpPower;
      } else if (!gameStarted) {
        gameStarted = true;
        player.vy = jumpPower;
      } else {
        player.vy = jumpPower;
      }
    }

    // Handle any other key press to show game over buttons
    if (!gameRunning && !showGameOverButtons && gameNameEntered) {
      const anyKeyPressed = Object.values(keys).some((key) => key);
      if (anyKeyPressed) {
        showGameOverButtons = true;
        // Clear all keys to prevent immediate actions
        Object.keys(keys).forEach((key) => (keys[key] = false));
      }
    }
  }

  if (gameRunning && gameStarted) {
    // Mobile hold-to-jump logic
    if (isMobile && isJumpHeld) {
      jumpHoldTimer += deltaTime;
      if (jumpHoldTimer >= 83.33) {
        // Every ~83ms (equivalent to every 5 frames at 60fps)
        // Apply jump when holding
        player.vy = jumpPower * 0.8; // Slightly less powerful for continuous jumps
        jumpHoldTimer = 0;
      }
    }
  }

  if (!gameRunning) return;

  // Check if game is paused
  if (gamePaused) return;

  // Calculate delta time multiplier (1.0 at 60fps)
  const deltaMultiplier = deltaTime / targetFrameTime;

  // Only apply gravity and movement if game has started
  if (gameStarted) {
    // Gravity (frame-rate independent)
    player.vy += gravity * deltaMultiplier;
    player.y += player.vy * deltaMultiplier;
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
    // Move obstacles (frame-rate independent)
    for (let obstacle of obstacles) {
      obstacle.x -= gameSpeed * deltaMultiplier;
    }

    // Move coins (frame-rate independent)
    for (let coin of coins) {
      coin.x -= gameSpeed * deltaMultiplier;
    }

    // Remove off-screen obstacles
    obstacles = obstacles.filter((obstacle) => obstacle.x > -obstacle.width);

    // Remove off-screen coins
    coins = coins.filter((coin) => coin.x > -coin.r);

    // Validate coin positions occasionally (every 1 second in real time)
    validationTimer += deltaTime;
    if (validationTimer > 1000) {
      // 1000ms = 1 second
      validateCoinPositions();
      validationTimer = 0;
    }

    // Spawn obstacles (every 2 seconds in real time)
    obstacleSpawnTimer += deltaTime;
    if (obstacleSpawnTimer > 2000) {
      // 2000ms = 2 seconds
      spawnObstacle();
      obstacleSpawnTimer = 0;
    }

    // Check coin collision
    for (let i = coins.length - 1; i >= 0; i--) {
      let coin = coins[i];
      let dx = player.x + player.w / 2 - coin.x;
      let dy = player.y + player.h / 2 - coin.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      // Magnet attraction (frame-rate independent)
      // Check for regular magnet first
      if (
        hasMagnet &&
        magnetRoundsLeft > 0 &&
        distance < magnetRadius &&
        distance > coin.r + player.w / 2
      ) {
        // Pull coin towards player with regular magnet
        const pullStrength = 0.7;
        const angle = Math.atan2(dy, dx);
        coin.x += Math.cos(angle) * pullStrength * gameSpeed * deltaMultiplier;
        coin.y += Math.sin(angle) * pullStrength * gameSpeed * deltaMultiplier;
      }
      // Check for gold magnet (stronger and wider range)
      else if (
        hasGoldMagnet &&
        goldMagnetRoundsLeft > 0 &&
        distance < goldMagnetRadius &&
        distance > coin.r + player.w / 2
      ) {
        // Pull coin towards player with gold magnet (stronger pull)
        const pullStrength = 1.4; // Double the strength of regular magnet
        const angle = Math.atan2(dy, dx);
        coin.x += Math.cos(angle) * pullStrength * gameSpeed * deltaMultiplier;
        coin.y += Math.sin(angle) * pullStrength * gameSpeed * deltaMultiplier;
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
        // Update game speed based on new score with safeguards
        const newSpeed = calculateGameSpeed();
        // Only update if the new speed is reasonable (prevent sudden spikes)
        if (newSpeed <= gameSpeed + 0.5) {
          gameSpeed = newSpeed;
        } else {
          console.warn(
            `Prevented speed spike: ${gameSpeed} → ${newSpeed}, keeping current speed`
          );
        }
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

async function buyGoldMagnetItem() {
  const result = await buyGoldMagnet(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    goldMagnetRoundsLeft = result.inventory.goldMagnetRoundsLeft;
    hasGoldMagnet = goldMagnetRoundsLeft > 0;
  }
}

// Color palette functions
async function selectCatColor(colorName) {
  try {
    selectedCatColor = colorName;
    await savePlayerColor(currentSession.sessionToken, colorName);
    console.log("Color saved:", colorName);
  } catch (error) {
    console.error("Failed to save color:", error);
  }
}

// Pause function
function togglePause() {
  if (gameRunning && gameStarted) {
    gamePaused = !gamePaused;
  }
}
