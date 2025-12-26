// Web Audio API system for high-performance mobile audio
let audioContext = null;
let soundBuffers = {
  miniNuke: null,
  nuke: null,
  goldNuke: null,
  coin: null,
};
let audioInitialized = false;
let masterGain = null;

// Initialize Web Audio API with user interaction (required for mobile)
async function initializeAudio() {
  if (!audioInitialized) {
    try {
      // Create AudioContext
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create master gain node for volume control
      masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      masterGain.gain.value = 0.7;

      // Load and decode audio files
      await Promise.all([
        loadAudioBuffer("sounds/boom.mp3", "miniNuke"),
        loadAudioBuffer("sounds/big-boom.mp3", "nuke"),
        loadAudioBuffer("sounds/big-boom.mp3", "goldNuke"), // Use same sound for gold nuke
        loadAudioBuffer("sounds/coin.mp3", "coin"),
      ]);

      audioInitialized = true;
      console.log("Web Audio API initialized successfully");
    } catch (error) {
      console.warn("Failed to initialize Web Audio API:", error);
      // Fallback to no audio
      audioInitialized = false;
    }
  }
}

// Load and decode audio buffer
async function loadAudioBuffer(url, key) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    soundBuffers[key] = audioBuffer;
  } catch (error) {
    console.warn(`Failed to load audio: ${url}`, error);
  }
}

// Play sound using Web Audio API
function playSound(soundKey, volume = 1.0) {
  if (!audioInitialized || !audioContext || !soundBuffers[soundKey]) {
    return;
  }

  try {
    // Resume audio context if suspended (mobile requirement)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Create source node
    const source = audioContext.createBufferSource();
    source.buffer = soundBuffers[soundKey];

    // Create gain node for individual sound volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    // Connect: source -> gain -> master -> destination
    source.connect(gainNode);
    gainNode.connect(masterGain);

    // Play the sound
    source.start(0);
  } catch (error) {
    // Silently handle errors to avoid performance impact
  }
}

// Play explosion sound with Web Audio API
function playExplosionSound(rocketType = "miniNuke") {
  if (!audioInitialized) {
    initializeAudio();
  }

  let soundKey = "miniNuke";
  if (rocketType === "nuke") {
    soundKey = "nuke";
  } else if (rocketType === "goldNuke") {
    soundKey = "goldNuke";
  }
  playSound(soundKey, 1.0);
}

// Play coin pickup sound with Web Audio API
function playCoinSound() {
  if (!audioInitialized) {
    initializeAudio();
  }

  playSound("coin", 0.8); // Slightly quieter for coin pickup
}

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
  if (hasMagnet || hasGoldMagnet || hasMiniNuke) {
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

    // Always include mini nuke count (doesn't decrease on game over)
    inventory.miniNukeCount = miniNukeCount;

    // Always include nuke count (doesn't decrease on game over)
    inventory.nukeCount = nukeCount;

    // Always include gold nuke count (doesn't decrease on game over)
    inventory.goldNukeCount = goldNukeCount;

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
  isRocketActive = false; // Reset rocket state
  rocket = null; // Clear rocket object
  explosion = null; // Clear explosion state
  lastExplosionType = null; // Reset last explosion type
  isGhostActive = false; // Reset ghost mode state
  ghostModeActivationTime = 0; // Reset ghost mode timer
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

  // Update rocket if active
  updateRocket();

  // Update explosion if active
  updateExplosion();

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
    if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
      // Activate ghost mode on first hit
      isGhostActive = true;
      ghostModeActivationTime = performance.now(); // Record activation time
      ghostShroomCount--;
      if (ghostShroomCount <= 0) {
        hasGhostShroom = false;
      }
      // Save updated inventory
      savePlayerInventory(currentSession.sessionToken, {
        magnetRoundsLeft: magnetRoundsLeft || 0,
        miniNukeCount: miniNukeCount,
        nukeCount: nukeCount,
        ghostShroomCount: ghostShroomCount,
      });
      console.log(
        "Ghost mode activated (ground hit)! Ghost shrooms left:",
        ghostShroomCount
      );
      // Bounce back up slightly to prevent getting stuck
      player.y = groundY - player.h;
      player.vy = -2;
    } else if (isGhostActive) {
      // Check if grace period has expired
      const timeSinceActivation = performance.now() - ghostModeActivationTime;
      if (timeSinceActivation > ghostModeGracePeriod) {
        // Grace period expired, trigger game over
        handleGameOver();
      } else {
        // During grace period, bounce back
        player.y = groundY - player.h;
        player.vy = -2;
      }
    } else {
      // No ghost shroom available
      handleGameOver();
    }
  }

  // Ceiling collision
  if (player.y < 0) {
    if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
      // Activate ghost mode on first hit
      isGhostActive = true;
      ghostModeActivationTime = performance.now(); // Record activation time
      ghostShroomCount--;
      if (ghostShroomCount <= 0) {
        hasGhostShroom = false;
      }
      // Save updated inventory
      savePlayerInventory(currentSession.sessionToken, {
        magnetRoundsLeft: magnetRoundsLeft || 0,
        miniNukeCount: miniNukeCount,
        nukeCount: nukeCount,
        ghostShroomCount: ghostShroomCount,
      });
      console.log(
        "Ghost mode activated (ceiling hit)! Ghost shrooms left:",
        ghostShroomCount
      );
      // Bounce back down slightly to prevent getting stuck
      player.y = 0;
      player.vy = 2;
    } else if (isGhostActive) {
      // Check if grace period has expired
      const timeSinceActivation = performance.now() - ghostModeActivationTime;
      if (timeSinceActivation > ghostModeGracePeriod) {
        // Grace period expired, trigger game over
        handleGameOver();
      } else {
        // During grace period, bounce back
        player.y = 0;
        player.vy = 2;
      }
    } else {
      // No ghost shroom available
      handleGameOver();
    }
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
        // Play coin pickup sound
        playCoinSound();
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
        if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
          // Activate ghost mode on first hit
          isGhostActive = true;
          ghostModeActivationTime = performance.now(); // Record activation time
          ghostShroomCount--;
          if (ghostShroomCount <= 0) {
            hasGhostShroom = false;
          }
          // Save updated inventory
          savePlayerInventory(currentSession.sessionToken, {
            magnetRoundsLeft: magnetRoundsLeft || 0,
            miniNukeCount: miniNukeCount,
            nukeCount: nukeCount,
            ghostShroomCount: ghostShroomCount,
          });
          console.log(
            "Ghost mode activated! Ghost shrooms left:",
            ghostShroomCount
          );
        } else if (isGhostActive) {
          // Check if grace period has expired
          const timeSinceActivation =
            performance.now() - ghostModeActivationTime;
          if (timeSinceActivation > ghostModeGracePeriod) {
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
        player.x < obstacle.x + obstacle.width &&
        player.x + player.w > obstacle.x &&
        player.y + player.h > obstacle.bottomY
      ) {
        if (hasGhostShroom && ghostShroomCount > 0 && !isGhostActive) {
          // Activate ghost mode on first hit
          isGhostActive = true;
          ghostModeActivationTime = performance.now(); // Record activation time
          ghostShroomCount--;
          if (ghostShroomCount <= 0) {
            hasGhostShroom = false;
          }
          // Save updated inventory
          savePlayerInventory(currentSession.sessionToken, {
            magnetRoundsLeft: magnetRoundsLeft || 0,
            miniNukeCount: miniNukeCount,
            nukeCount: nukeCount,
            ghostShroomCount: ghostShroomCount,
          });
          console.log(
            "Ghost mode activated! Ghost shrooms left:",
            ghostShroomCount
          );
        } else if (isGhostActive) {
          // Check if grace period has expired
          const timeSinceActivation =
            performance.now() - ghostModeActivationTime;
          if (timeSinceActivation > ghostModeGracePeriod) {
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
    const coinLimit =
      obstacleSpawnTimer < 0 && lastExplosionType === "goldNuke" ? 6 : 3;
    if (coins.length < coinLimit) {
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

async function buyMiniNukeItem() {
  const result = await buyMiniNuke(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    miniNukeCount = result.inventory.miniNukeCount;
    hasMiniNuke = miniNukeCount > 0;
  }
}

async function buyNukeItem() {
  const result = await buyNuke(currentSession.sessionToken, totalCoinsWallet);
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    nukeCount = result.inventory.nukeCount;
    hasNuke = nukeCount > 0;
  }
}

async function buyGoldNukeItem() {
  const result = await buyGoldNuke(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    goldNukeCount = result.inventory.goldNukeCount;
    hasGoldNuke = goldNukeCount > 0;
  }
}

async function buyGhostShroomItem() {
  const result = await buyGhostShroom(
    currentSession.sessionToken,
    totalCoinsWallet
  );
  if (result.success) {
    totalCoinsWallet = result.newWallet;
    ghostShroomCount = result.inventory.ghostShroomCount;
    hasGhostShroom = ghostShroomCount > 0;
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

// Rocket functions
function launchRocket() {
  if (!hasMiniNuke || miniNukeCount <= 0 || isRocketActive) {
    return;
  }

  // Initialize rocket at player position
  rocket = {
    x: player.x + player.w,
    y: player.y + player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "miniNuke", // Track rocket type
  };

  isRocketActive = true;
  miniNukeCount--;

  // Save updated inventory
  savePlayerInventory(currentSession.sessionToken, {
    magnetRoundsLeft: magnetRoundsLeft || 0,
    miniNukeCount: miniNukeCount,
    nukeCount: nukeCount,
    goldNukeCount: goldNukeCount,
    ghostShroomCount: ghostShroomCount,
  });

  console.log("Mini nuke launched! Mini nukes left:", miniNukeCount);
}

function launchNuke() {
  if (!hasNuke || nukeCount <= 0 || isRocketActive) {
    return;
  }

  // Initialize nuke rocket at player position
  rocket = {
    x: player.x + player.w,
    y: player.y + player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "nuke", // Track rocket type
  };

  isRocketActive = true;
  nukeCount--;

  // Save updated inventory
  savePlayerInventory(currentSession.sessionToken, {
    magnetRoundsLeft: magnetRoundsLeft || 0,
    miniNukeCount: miniNukeCount,
    nukeCount: nukeCount,
    goldNukeCount: goldNukeCount,
    ghostShroomCount: ghostShroomCount,
  });

  console.log("Nuke launched! Nukes left:", nukeCount);
}

function launchGoldNuke() {
  if (!hasGoldNuke || goldNukeCount <= 0 || isRocketActive) {
    return;
  }

  // Initialize gold nuke rocket at player position
  rocket = {
    x: player.x + player.w,
    y: player.y + player.h / 2 - 7.5, // Center vertically with player
    speed: 8, // Fast movement speed
    type: "goldNuke", // Track rocket type
  };

  isRocketActive = true;
  goldNukeCount--;

  // Save updated inventory
  savePlayerInventory(currentSession.sessionToken, {
    magnetRoundsLeft: magnetRoundsLeft || 0,
    miniNukeCount: miniNukeCount,
    nukeCount: nukeCount,
    goldNukeCount: goldNukeCount,
    ghostShroomCount: ghostShroomCount,
  });

  console.log("Gold Nuke launched! Gold Nukes left:", goldNukeCount);
}

function updateRocket() {
  if (!isRocketActive || !rocket) {
    return;
  }

  // Move rocket to the right
  rocket.x += rocket.speed * gameSpeed * (deltaTime / targetFrameTime);

  // Check if rocket reached the end of the screen
  if (rocket.x >= canvas.width) {
    // Create explosion at the edge of the screen
    createExplosion(canvas.width - 50, rocket.y + 12.5); // Center explosion on rocket
    explodeRocket();
  }
}

function createExplosion(x, y) {
  const isNuke = rocket && rocket.type === "nuke";
  const isGoldNuke = rocket && rocket.type === "goldNuke";

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

  explosion = {
    x: x,
    y: y,
    timer: 0,
    duration: duration,
    maxRadius: maxRadius,
    particles: particles,
  };
}

function updateExplosion() {
  if (!explosion) {
    return;
  }

  explosion.timer += deltaTime;

  // Remove explosion when done
  if (explosion.timer >= explosion.duration) {
    explosion = null;
  }
}

function explodeRocket() {
  if (!isRocketActive) {
    return;
  }

  const isNuke = rocket && rocket.type === "nuke";
  const isGoldNuke = rocket && rocket.type === "goldNuke";

  // Store explosion type for coin spawning logic
  lastExplosionType = rocket.type;

  // Play appropriate explosion sound based on rocket type
  playExplosionSound(rocket.type);

  let maxPipesToRemove = 3;
  let delayTime = -4000;

  if (isNuke) {
    maxPipesToRemove = 10;
    delayTime = -8000;
  } else if (isGoldNuke) {
    maxPipesToRemove = 20;
    delayTime = -16000; // Even longer clear path
  }

  const playerRightEdge = player.x + player.w;

  // Find and remove pipes that are ahead of the player (x position greater than player)
  const pipesAhead = obstacles
    .map((obstacle, index) => ({ obstacle, index }))
    .filter(({ obstacle }) => obstacle.x > playerRightEdge)
    .sort((a, b) => a.obstacle.x - b.obstacle.x); // Sort by x position (closest first)

  // Remove the pipes ahead (in reverse order to maintain array indices)
  const pipesToRemove = pipesAhead.slice(0, maxPipesToRemove);
  pipesToRemove
    .sort((a, b) => b.index - a.index) // Sort by index in reverse order
    .forEach(({ index }) => {
      obstacles.splice(index, 1);
    });

  const pipesRemovedCount = pipesToRemove.length;

  // Reset obstacle spawn timer to create a longer clear path
  obstacleSpawnTimer = delayTime;

  // Create delayed point awards for the full potential points (regardless of pipes actually removed)
  const pointDelay = Math.abs(delayTime) / maxPipesToRemove; // Divide delay evenly across max potential pipes

  for (let i = 0; i < maxPipesToRemove; i++) {
    setTimeout(() => {
      obstacleScore += 5; // Award 5 points per pipe
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
  isRocketActive = false;
  rocket = null;

  // Update inventory state
  if (miniNukeCount <= 0) {
    hasMiniNuke = false;
  }
  if (nukeCount <= 0) {
    hasNuke = false;
  }
  if (goldNukeCount <= 0) {
    hasGoldNuke = false;
  }
}
