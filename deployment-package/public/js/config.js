// Game variables
let player = { x: 70, y: 300, w: 35, h: 35, vx: 0, vy: 0, onGround: false };
let gravity = 0.2;
let jumpPower = -3.5;
let gameSpeed = 2.5;
let baseGameSpeed = 2.5; // Store the original game speed
let coins = [];
let obstacles = [];
let obstacleScore = 0;
let totalCoinsWallet = 0; // Will be loaded when player name is set
let onlineCount = 0; // Online users count
let playerHighScore = 0; // Will be loaded from API for current player
let gameRunning = true;
let gameStarted = false;
let gameNameEntered = false;
let nameInputActive = false;
let obstacleSpawnTimer = 0;
let validationTimer = 0;
let playerName = "";
let inputName = "";
let inputPassword = "";
let showLeaderboard = false;
let switchingPlayer = false;
let leaderboard = []; // Will be loaded from API instead of localStorage

// Authentication variables
let authMode = "login"; // "login", "signup", or "authenticated"
let showAuthScreen = true;
let authError = "";
let currentSession = null;

// Shop variables
let showShop = false;
let hasMagnet = false;
let magnetRoundsLeft = 0;
let magnetRadius = 250;

// Cat image
const catImage = new Image();
catImage.src = "cat.png";

// Mobile detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
