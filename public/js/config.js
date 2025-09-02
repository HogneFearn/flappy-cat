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

// Cat image
const catImage = new Image();
catImage.src = "cat.png";

// Mobile detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
