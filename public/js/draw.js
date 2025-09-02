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
      ctx.fillText("S - Open Shop", canvas.width / 2, canvas.height / 2 + 100);
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
      "Attracts coins from 3x distance",
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
