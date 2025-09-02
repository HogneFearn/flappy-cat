// Call initialization
initializeGameData();

for (let i = 0; i < 3; i++) spawnCoin();

function gameLoop() {
  update();
  draw();
  updateMobileButtons();
  requestAnimationFrame(gameLoop);
}
gameLoop();
