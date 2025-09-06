// Function to draw a button
function drawButton(text, x, y, width, height, color) {
  // Button background
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  // Button border
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Button text
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, x + width / 2, y + height / 2 + 5);
}

function draw() {
  // Fill entire canvas with black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw cloudy background image for sky area
  if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    // Draw the background image tiled/stretched to fill the sky area
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, groundY);
  } else {
    // Fallback to solid color if image isn't loaded yet
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, groundY);
  }

  // Draw ground
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Draw obstacles (pipes) - Mario-style
  for (let obstacle of obstacles) {
    // Mario-style pipe colors
    const pipeGreen = "#228B22";
    const pipeDarkGreen = "#006400";
    const pipeHighlight = "#32CD32";
    const pipeShadow = "#1F5F1F";

    // Top pipe
    drawMarioPipe(obstacle.x, 0, obstacle.width, obstacle.topHeight, true);

    // Bottom pipe
    drawMarioPipe(
      obstacle.x,
      obstacle.bottomY,
      obstacle.width,
      obstacle.bottomHeight,
      false
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

    // Get the appropriate coin image based on type
    let coinImage;
    if (coin.type === "blue") {
      coinImage = blueCoinImage;
    } else if (coin.type === "red") {
      coinImage = redCoinImage;
    } else {
      coinImage = yellowCoinImage; // gold/yellow
    }

    // Draw coin image if loaded, otherwise fallback to circle
    if (coinImage.complete && coinImage.naturalWidth > 0) {
      // Calculate image size (twice the radius for diameter)
      const imageSize = coin.r * 2;
      ctx.drawImage(
        coinImage,
        coin.x - coin.r, // Center the image
        coin.y - coin.r,
        imageSize,
        imageSize
      );
    } else {
      // Fallback to circle if image not loaded
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
      ctx.fillStyle = coin.color;
      ctx.fill();
      ctx.strokeStyle = coin.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  // Draw UI
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText("High Score: " + playerHighScore, canvas.width - 20, 25);
  ctx.fillText("💰 Wallet: " + totalCoinsWallet, canvas.width - 20, 45);

  // Show magnet status if active
  if (hasMagnet && magnetRoundsLeft > 0) {
    ctx.fillText(
      "🧲 Magnet: " + magnetRoundsLeft + " rounds",
      canvas.width - 20,
      65
    );
  }

  ctx.textAlign = "left";
  ctx.fillText("Score: " + obstacleScore, 20, 25);

  // Add shadow to online count for better contrast
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText("👥 Online: " + onlineCount, 20, groundY - 10); // Bottom left corner

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

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

    // Clear previous buttons
    gameOverButtons = [];

    // Draw in-canvas buttons
    const buttonWidth = 140;
    const buttonHeight = isMobile ? 55 : 35; // Even taller buttons on mobile
    const buttonSpacing = isMobile ? 55 : 50; // Spacing = height to eliminate gaps

    // Position buttons to match visual expectations on mobile
    // Move buttons UP significantly to align with where they visually appear
    const startY = isMobile ? 250 : canvas.height / 2 + 10;

    // Play Again button
    const playAgainY = startY;
    drawButton(
      "🔄 Play Again",
      canvas.width / 2 - buttonWidth / 2,
      playAgainY,
      buttonWidth,
      buttonHeight,
      "#4CAF50"
    );
    gameOverButtons.push({
      x: canvas.width / 2 - buttonWidth / 2,
      y: playAgainY,
      width: buttonWidth,
      height: buttonHeight,
      action: "playAgain",
    });

    // Leaderboard button
    const leaderboardY = startY + buttonSpacing;
    drawButton(
      "🏆 Leaderboard",
      canvas.width / 2 - buttonWidth / 2,
      leaderboardY,
      buttonWidth,
      buttonHeight,
      "#2196F3"
    );
    gameOverButtons.push({
      x: canvas.width / 2 - buttonWidth / 2,
      y: leaderboardY,
      width: buttonWidth,
      height: buttonHeight,
      action: "leaderboard",
    });

    // Shop button
    const shopY = startY + buttonSpacing * 2;
    drawButton(
      "🛒 Shop",
      canvas.width / 2 - buttonWidth / 2,
      shopY,
      buttonWidth,
      buttonHeight,
      "#FF9800"
    );
    gameOverButtons.push({
      x: canvas.width / 2 - buttonWidth / 2,
      y: shopY,
      width: buttonWidth,
      height: buttonHeight,
      action: "shop",
    });

    // Switch Player button
    const switchPlayerY = startY + buttonSpacing * 3;
    drawButton(
      "👤 Switch Player",
      canvas.width / 2 - buttonWidth / 2,
      switchPlayerY,
      buttonWidth,
      buttonHeight,
      "#9C27B0"
    );
    gameOverButtons.push({
      x: canvas.width / 2 - buttonWidth / 2,
      y: switchPlayerY,
      width: buttonWidth,
      height: buttonHeight,
      action: "switchPlayer",
    });

    ctx.textAlign = "left";
  }

  // Authentication screen
  if (showAuthScreen) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Welcome to Flappy Cat!",
      canvas.width / 2,
      canvas.height / 2 - 100
    );

    ctx.font = "20px Arial";
    ctx.fillText(
      "Please login or sign up to play",
      canvas.width / 2,
      canvas.height / 2 - 20
    );
    ctx.fillText(
      "and save your progress!",
      canvas.width / 2,
      canvas.height / 2 + 10
    );

    ctx.textAlign = "left";
    return; // Don't draw game elements during authentication
  }

  // Skip legacy name entry if using authentication
  if (!gameNameEntered && !showAuthScreen && authMode !== "authenticated") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Please use the login form to continue",
      canvas.width / 2,
      canvas.height / 2
    );

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
      ctx.fillText(
        "Press S to open Shop",
        canvas.width / 2,
        canvas.height / 2 + 95
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
    if (isMobile) {
      ctx.fillText(
        "Tap the Leaderboard button to close",
        canvas.width / 2,
        canvas.height - 50
      );
    } else {
      ctx.fillText("Press L to close", canvas.width / 2, canvas.height - 50);
    }
    ctx.textAlign = "left";
  }

  // Shop overlay
  if (showShop) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🛒 SHOP 🛒", canvas.width / 2, 50);

    ctx.font = "16px Arial";
    ctx.fillText(
      `💰 Your Wallet: ${totalCoinsWallet} coins`,
      canvas.width / 2,
      80
    );

    // Magnet item
    const magnetY = 130;
    ctx.font = "20px Arial";
    ctx.fillText("🧲 Coin Magnet", canvas.width / 2, magnetY);

    ctx.font = "16px Arial";
    ctx.fillText(
      "Attracts coins from 7x distance",
      canvas.width / 2,
      magnetY + 25
    );
    ctx.fillText("Lasts for 3 game rounds", canvas.width / 2, magnetY + 45);
    ctx.fillText("💰 Cost: 200 coins", canvas.width / 2, magnetY + 65);

    if (magnetRoundsLeft > 0) {
      ctx.fillStyle = "#90EE90";
      ctx.fillText(
        `✓ Owned (${magnetRoundsLeft} rounds left)`,
        canvas.width / 2,
        magnetY + 85
      );
      ctx.fillStyle = "#fff";
    } else if (totalCoinsWallet >= 200) {
      ctx.fillStyle = "#90EE90";
      if (isMobile) {
        ctx.fillText("Tap here to Buy!", canvas.width / 2, magnetY + 85);
      } else {
        ctx.fillText("Press B to Buy!", canvas.width / 2, magnetY + 85);
      }
      ctx.fillStyle = "#fff";
    } else {
      ctx.fillStyle = "#FF6B6B";
      ctx.fillText("Not enough coins", canvas.width / 2, magnetY + 85);
      ctx.fillStyle = "#fff";
    }

    ctx.font = "18px Arial";
    if (isMobile) {
      ctx.fillText(
        "Tap the Shop button to close",
        canvas.width / 2,
        canvas.height - 50
      );
    } else {
      ctx.fillText("Press S to close", canvas.width / 2, canvas.height - 50);
    }
    ctx.textAlign = "left";
  }
}

// Mario-style pipe drawing function
function drawMarioPipe(x, y, width, height, isTop) {
  const rimHeight = 20;
  const pipeBodyHeight = isTop ? height - rimHeight : height - rimHeight;
  const pipeBodyY = isTop ? y : y + rimHeight;
  const rimY = isTop ? height - rimHeight : y;
  const rimWidth = width + 8; // Slightly wider rim
  const rimX = x - 4;

  // Main pipe colors
  const pipeGreen = "#228B22";
  const pipeDarkGreen = "#006400";
  const pipeHighlight = "#32CD32";
  const pipeShadow = "#1F5F1F";

  // Draw pipe rim (the lip/opening)
  ctx.fillStyle = pipeGreen;
  ctx.fillRect(rimX, rimY, rimWidth, rimHeight);

  // Rim highlights and shadows for 3D effect
  ctx.fillStyle = pipeHighlight;
  ctx.fillRect(rimX, rimY, rimWidth, 3); // Top highlight
  ctx.fillRect(rimX, rimY, 3, rimHeight); // Left highlight

  ctx.fillStyle = pipeShadow;
  ctx.fillRect(rimX, rimY + rimHeight - 3, rimWidth, 3); // Bottom shadow
  ctx.fillRect(rimX + rimWidth - 3, rimY, 3, rimHeight); // Right shadow

  // Draw main pipe body
  ctx.fillStyle = pipeGreen;
  ctx.fillRect(x, pipeBodyY, width, pipeBodyHeight);

  // Pipe body highlights and shadows
  ctx.fillStyle = pipeHighlight;
  ctx.fillRect(x, pipeBodyY, 4, pipeBodyHeight); // Left highlight strip

  ctx.fillStyle = pipeShadow;
  ctx.fillRect(x + width - 4, pipeBodyY, 4, pipeBodyHeight); // Right shadow strip

  // Add vertical highlight lines for texture
  ctx.fillStyle = pipeHighlight;
  for (let i = 12; i < width - 12; i += 8) {
    ctx.fillRect(x + i, pipeBodyY, 1, pipeBodyHeight);
  }

  // Dark border around everything
  ctx.strokeStyle = pipeDarkGreen;
  ctx.lineWidth = 2;
  ctx.strokeRect(rimX, rimY, rimWidth, rimHeight); // Rim border
  ctx.strokeRect(x, pipeBodyY, width, pipeBodyHeight); // Body border

  // Inner rim shadow for depth
  if (isTop) {
    ctx.fillStyle = pipeShadow;
    ctx.fillRect(rimX + 2, rimY + rimHeight - 6, rimWidth - 4, 4);
  } else {
    ctx.fillStyle = pipeHighlight;
    ctx.fillRect(rimX + 2, rimY + 2, rimWidth - 4, 4);
  }
}
