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
  if (
    catImages[selectedCatColor] &&
    catImages[selectedCatColor].complete &&
    catImages[selectedCatColor].naturalHeight !== 0
  ) {
    // Draw cat image if loaded
    ctx.drawImage(
      catImages[selectedCatColor],
      player.x,
      player.y,
      player.w,
      player.h
    );
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
  let uiLineOffset = 65;
  if (hasMagnet && magnetRoundsLeft > 0) {
    // Draw red magnet image
    if (
      redMagnetImage &&
      redMagnetImage.complete &&
      redMagnetImage.naturalWidth > 0
    ) {
      const imageSize = 16;
      const imageX =
        canvas.width -
        20 -
        ctx.measureText(" " + magnetRoundsLeft + " rounds").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(redMagnetImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(
        magnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    } else {
      // Fallback to emoji
      ctx.fillText(
        "🧲 " + magnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    }
    uiLineOffset += 20;
  }

  if (hasGoldMagnet && goldMagnetRoundsLeft > 0) {
    // Draw gold magnet image
    if (
      goldMagnetImage &&
      goldMagnetImage.complete &&
      goldMagnetImage.naturalWidth > 0
    ) {
      const imageSize = 16;
      const imageX =
        canvas.width -
        20 -
        ctx.measureText(" " + goldMagnetRoundsLeft + " rounds").width -
        imageSize;
      const imageY = uiLineOffset - 12; // Center vertically with text
      ctx.drawImage(goldMagnetImage, imageX, imageY, imageSize, imageSize);
      ctx.fillText(
        goldMagnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    } else {
      // Fallback to emoji
      ctx.fillText(
        "🟡 " + goldMagnetRoundsLeft + " rounds",
        canvas.width - 20,
        uiLineOffset
      );
    }
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

    if (!showGameOverButtons) {
      // Show "tap to continue" message
      ctx.font = "16px Arial";
      if (isMobile) {
        ctx.fillText(
          "Tap to continue",
          canvas.width / 2,
          canvas.height / 2 + 50
        );
      } else {
        ctx.fillText(
          "Press any key to continue",
          canvas.width / 2,
          canvas.height / 2 + 50
        );
      }
    } else {
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

      // Color Palette button
      const colorPaletteY = startY + buttonSpacing * 3;
      drawButton(
        "🎨 Colors",
        canvas.width / 2 - buttonWidth / 2,
        colorPaletteY,
        buttonWidth,
        buttonHeight,
        "#E91E63"
      );
      gameOverButtons.push({
        x: canvas.width / 2 - buttonWidth / 2,
        y: colorPaletteY,
        width: buttonWidth,
        height: buttonHeight,
        action: "colorPalette",
      });

      // Switch Player button
      const switchPlayerY = startY + buttonSpacing * 4;
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
    }

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
      ctx.fillText(
        "Press C for Color Palette",
        canvas.width / 2,
        canvas.height / 2 + 120
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
    const catSize = 18; // Small cat icon size

    for (let i = 0; i < Math.min(leaderboard.length, 20); i++) {
      const entry = leaderboard[i];
      const y = startY + i * lineHeight;
      const rank = i + 1;
      const medal =
        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;

      // Get player's cat color (default to gray if not available)
      const playerColor = entry.color || "gray";

      // Calculate positions for medal, cat, and text
      const centerX = canvas.width / 2;
      const textWidth = ctx.measureText(
        `${medal} ${entry.name} - ${entry.score}`
      ).width;
      const startX = centerX - textWidth / 2;

      // Draw medal first
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(medal, startX, y);

      // Measure medal width to position cat after it
      const medalWidth = ctx.measureText(medal + " ").width;

      // Draw tiny cat icon after the medal
      if (catImages[playerColor] && catImages[playerColor].complete) {
        const catX = startX + medalWidth;
        const catY = y - catSize / 2 - 5; // Center vertically with text
        ctx.drawImage(catImages[playerColor], catX, catY, catSize, catSize);
      }

      // Draw the rest of the text (name and score) after the cat
      const nameScoreText = ` ${entry.name} - ${entry.score}`;
      const nameX = startX + medalWidth + catSize + 4; // 4px padding after cat
      ctx.fillText(nameScoreText, nameX, y);
    }

    // Reset text alignment for the close instruction
    ctx.textAlign = "center";
    ctx.font = "18px Arial";
    if (isMobile) {
      // No text on mobile for leaderboard close instruction
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

    // Draw close button (X) in top right corner - bigger for mobile
    const closeButtonSize = isMobile ? 50 : 30;
    const closeButtonX = canvas.width - closeButtonSize - 10;
    const closeButtonY = 10;

    // Store close button coordinates for click detection
    closeButtonCoords = {
      x: closeButtonX,
      y: closeButtonY,
      size: closeButtonSize,
    };

    // Close button background
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);

    // Close button border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      closeButtonX,
      closeButtonY,
      closeButtonSize,
      closeButtonSize
    );

    // Close button X
    ctx.fillStyle = "#fff";
    ctx.font = isMobile ? "30px Arial" : "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "✕",
      closeButtonX + closeButtonSize / 2,
      closeButtonY + closeButtonSize / 2 + (isMobile ? 10 : 7)
    );

    // Draw shop items grid with 4-column layout like color palette
    // Grid configuration - exactly like color palette
    const itemsPerRow = 4;

    // Use fixed canvas dimensions for calculation (mobile = 400px wide)
    const baseCanvasWidth = isMobile ? 400 : canvas.width;
    const itemSize = isMobile ? 65 : 60;
    const spacing = isMobile ? 85 : 80;
    const touchPadding = isMobile ? 15 : 5;

    // Calculate grid positioning based on logical canvas size
    const totalGridWidth = itemsPerRow * spacing;
    const startX = baseCanvasWidth / 2 - totalGridWidth / 2 + spacing / 2;
    const startY = 120;

    // Clear the shop grid coordinates array
    shopGridCoords = [];

    for (let i = 0; i < availableShopItems.length; i++) {
      const item = availableShopItems[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      // Calculate exact positions
      const x = startX + col * spacing - itemSize / 2;
      const y = startY + row * spacing - itemSize / 2;

      // Store coordinates for click detection with larger touch area
      shopGridCoords.push({
        itemId: item.id,
        x: x - touchPadding,
        y: y - touchPadding,
        width: itemSize + touchPadding * 2,
        height: itemSize + touchPadding * 2,
      });

      // Determine if item can be purchased
      const canAfford = totalCoinsWallet >= item.price;
      const isOwned =
        (item.id === "magnet" && magnetRoundsLeft > 0) ||
        (item.id === "goldMagnet" && goldMagnetRoundsLeft > 0);

      // Draw item box background with better colors
      if (isOwned) {
        ctx.fillStyle = "#4CAF50"; // Green if owned
      } else if (canAfford) {
        ctx.fillStyle = "#2196F3"; // Blue if affordable
      } else {
        ctx.fillStyle = "#424242"; // Dark gray if can't afford
      }
      ctx.fillRect(x, y, itemSize, itemSize);

      // Draw selection/status border
      if (isOwned) {
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 2, y - 2, itemSize + 4, itemSize + 4);
      } else if (canAfford) {
        ctx.strokeStyle = "#FFD700"; // Gold border if can afford
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 1, y - 1, itemSize + 2, itemSize + 2);
      } else {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, itemSize, itemSize);
      }

      // Draw item icon (image instead of emoji)
      let magnetImage = null;
      if (item.id === "magnet") {
        magnetImage = redMagnetImage;
      } else if (item.id === "goldMagnet") {
        magnetImage = goldMagnetImage;
      }

      if (magnetImage && magnetImage.complete && magnetImage.naturalWidth > 0) {
        // Draw magnet image
        const imageSize = isMobile ? 24 : 28; // Smaller than the full box
        const imageX = x + itemSize / 2 - imageSize / 2;
        const imageY = y + itemSize / 2 - imageSize / 2;
        ctx.drawImage(magnetImage, imageX, imageY, imageSize, imageSize);
      } else {
        // Fallback to emoji if image not loaded
        ctx.fillStyle = "#fff";
        ctx.font = isMobile ? "32px Arial" : "36px Arial";
        ctx.textAlign = "center";
        const iconText = item.name.split(" ")[0]; // Get the emoji part
        ctx.fillText(
          iconText,
          x + itemSize / 2,
          y + itemSize / 2 + (isMobile ? 10 : 12)
        );
      }

      // Draw item name below the box
      ctx.fillStyle = "#fff";
      ctx.font = isMobile ? "10px Arial" : "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        item.name.substring(2), // Remove emoji from name
        x + itemSize / 2,
        y + itemSize + 15
      );

      // Draw price below name
      ctx.font = isMobile ? "9px Arial" : "10px Arial";
      ctx.fillText(`💰 ${item.price}`, x + itemSize / 2, y + itemSize + 28);

      // Draw status indicator
      if (isOwned) {
        ctx.fillStyle = "#4CAF50";
        ctx.font = isMobile ? "8px Arial" : "9px Arial";
        const roundsLeft =
          item.id === "magnet" ? magnetRoundsLeft : goldMagnetRoundsLeft;
        ctx.fillText(
          `✓ ${roundsLeft} left`,
          x + itemSize / 2,
          y + itemSize + 40
        );
      } else if (!canAfford) {
        ctx.fillStyle = "#FF6B6B";
        ctx.font = isMobile ? "8px Arial" : "9px Arial";
        ctx.fillText("Need more coins", x + itemSize / 2, y + itemSize + 40);
      }
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    if (isMobile) {
      ctx.fillText("Tap an item to buy", canvas.width / 2, canvas.height - 50);
    } else {
      ctx.fillText(
        "Click an item to buy",
        canvas.width / 2,
        canvas.height - 50
      );
    }
    ctx.textAlign = "left";
  }

  // Color palette overlay
  if (showColorPalette) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎨 COLOR PALETTE 🎨", canvas.width / 2, 50);

    // Draw close button (X) in top right corner - bigger for mobile
    const closeButtonSize = isMobile ? 50 : 30; // Even bigger for mobile
    const closeButtonX = canvas.width - closeButtonSize - 10;
    const closeButtonY = 10;

    // Store close button coordinates for click detection
    closeButtonCoords = {
      x: closeButtonX,
      y: closeButtonY,
      size: closeButtonSize,
    };

    // Close button background
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);

    // Close button border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      closeButtonX,
      closeButtonY,
      closeButtonSize,
      closeButtonSize
    );

    // Close button X
    ctx.fillStyle = "#fff";
    ctx.font = isMobile ? "30px Arial" : "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "✕",
      closeButtonX + closeButtonSize / 2,
      closeButtonY + closeButtonSize / 2 + (isMobile ? 10 : 7)
    );

    ctx.font = "16px Arial";
    ctx.fillText("Choose your cat color", canvas.width / 2, 80);

    // Draw color grid with fixed positioning for consistent coordinates
    const colorsPerRow = 4;

    // Use fixed canvas dimensions for calculation (mobile = 400px wide)
    const baseCanvasWidth = isMobile ? 400 : canvas.width;
    const colorSize = isMobile ? 65 : 60;
    const spacing = isMobile ? 85 : 80;
    const touchPadding = isMobile ? 15 : 5; // Generous touch area on mobile

    // Calculate grid positioning based on logical canvas size
    const totalGridWidth = colorsPerRow * spacing;
    const startX = baseCanvasWidth / 2 - totalGridWidth / 2 + spacing / 2;
    const startY = 120;

    // Clear the color grid coordinates array
    colorGridCoords = [];

    for (let i = 0; i < availableColors.length; i++) {
      const color = availableColors[i];
      const row = Math.floor(i / colorsPerRow);
      const col = i % colorsPerRow;

      // Calculate exact positions
      const x = startX + col * spacing - colorSize / 2;
      const y = startY + row * spacing - colorSize / 2;

      // Store coordinates for click detection with larger touch area
      colorGridCoords.push({
        color: color.name,
        x: x - touchPadding,
        y: y - touchPadding,
        width: colorSize + touchPadding * 2,
        height: colorSize + touchPadding * 2,
      });

      // Draw color preview box
      if (catImages[color.name] && catImages[color.name].complete) {
        // Draw cat image as preview
        ctx.drawImage(catImages[color.name], x, y, colorSize, colorSize);
      } else {
        // Fallback colored rectangle
        ctx.fillStyle = getColorHex(color.name);
        ctx.fillRect(x, y, colorSize, colorSize);
      }

      // Draw selection border
      if (selectedCatColor === color.name) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 2, y - 2, colorSize + 4, colorSize + 4);
      } else {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, colorSize, colorSize);
      }

      // Draw color name
      ctx.fillStyle = "#fff";
      ctx.font = isMobile ? "12px Arial" : "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(color.displayName, x + colorSize / 2, y + colorSize + 15);
    }

    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Tap a color to select", canvas.width / 2, canvas.height - 50);
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

// Helper function to get hex color for fallback rectangles
function getColorHex(colorName) {
  const colorMap = {
    gray: "#808080",
    blue: "#0066FF",
    brown: "#8B4513",
    cyan: "#00FFFF",
    fire: "#FF4500",
    galaxy: "#663399",
    green: "#00FF00",
    ice: "#B0E0E6",
    lime: "#32CD32",
    magenta: "#FF00FF",
    orange: "#FFA500",
    pink: "#FFC0CB",
    purple: "#800080",
    rainbow: "#FF69B4",
    red: "#FF0000",
    yellow: "#FFFF00",
  };
  return colorMap[colorName] || "#808080";
}
