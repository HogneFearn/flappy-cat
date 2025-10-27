// Game variables
let player = { x: 70, y: 300, w: 35, h: 35, vx: 0, vy: 0, onGround: false };
let gravity = 0.2;
let jumpPower = -3.5;
let gameSpeed = 2.5;
let baseGameSpeed = 2.5; // Store the original game speed

// Delta time variables for consistent frame rate
let lastTime = 0;
let deltaTime = 0;
const targetFPS = 60;
const targetFrameTime = 1000 / targetFPS; // 16.67ms for 60fps
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
let obstacleSpawnTimer = 0; // Now in milliseconds
let validationTimer = 0; // Now in milliseconds
let jumpHoldTimer = 0; // Now in milliseconds
let playerName = "";
let inputName = "";
let inputPassword = "";
let showLeaderboard = false;
let switchingPlayer = false;
let leaderboard = []; // Will be loaded from API instead of localStorage
let showGameOverButtons = false; // Controls whether to show buttons after game over screen
let gamePaused = false; // Controls whether the game is paused
let pauseButtonCoords = {}; // Store pause button coordinates for click detection

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
let hasGoldMagnet = false;
let goldMagnetRoundsLeft = 0;
let goldMagnetRadius = 280; // Greater radius than regular magnet
let goldMagnetPullSpeed = 2; // Faster pull speed
let hasMiniNuke = false;
let miniNukeCount = 0;
let hasNuke = false;
let nukeCount = 0;
let isRocketActive = false;
let rocket = null; // Will store rocket position and animation data
let rocketButtonCoords = {}; // Store rocket button coordinates for click detection
let nukeButtonCoords = {}; // Store nuke button coordinates for click detection
let explosion = null; // Will store explosion animation data
let shopGridCoords = []; // Will store the exact coordinates of each shop item button

// Shop items configuration
let availableShopItems = [
  {
    id: "magnet",
    name: "🧲 Coin Magnet",
    price: 200,
    description: "Attracts coins from 7x distance",
    duration: "3 rounds",
  },
  {
    id: "goldMagnet",
    name: "🟡 Gold Magnet",
    price: 700,
    description: "Stronger magnet with faster pull",
    duration: "1 round",
  },
  {
    id: "miniNuke",
    name: "🚀 Mini Nuke",
    price: 500,
    description: "Clears 3 pipe sets (+15 points)",
    duration: "1 use",
  },
  {
    id: "nuke",
    name: "💥 Nuke",
    price: 1000,
    description: "Clears 10 pipe sets (+50 points)",
    duration: "1 use",
  },
];

// Color palette variables
let showColorPalette = false;
let selectedCatColor = "gray"; // Default color
let colorGridCoords = []; // Will store the exact coordinates of each color button
let closeButtonCoords = { x: 0, y: 0, size: 0 }; // Will store close button coordinates
let availableColors = [
  { name: "gray", displayName: "Gray", filename: "cat.png" },
  { name: "blue", displayName: "Blue", filename: "cat_blue.png" },
  { name: "brown", displayName: "Brown", filename: "cat_brown.png" },
  { name: "cyan", displayName: "Cyan", filename: "cat_cyan.png" },
  { name: "fire", displayName: "Fire", filename: "cat_fire.png" },
  { name: "galaxy", displayName: "Galaxy", filename: "cat_galaxy.png" },
  { name: "green", displayName: "Green", filename: "cat_green.png" },
  { name: "ice", displayName: "Ice", filename: "cat_ice.png" },
  { name: "lime", displayName: "Lime", filename: "cat_lime.png" },
  { name: "magenta", displayName: "Magenta", filename: "cat_magenta.png" },
  { name: "orange", displayName: "Orange", filename: "cat_orange.png" },
  { name: "pink", displayName: "Pink", filename: "cat_pink.png" },
  { name: "purple", displayName: "Purple", filename: "cat_purple.png" },
  { name: "rainbow", displayName: "Rainbow", filename: "cat_rainbow.png" },
  { name: "red", displayName: "Red", filename: "cat_red.png" },
  { name: "yellow", displayName: "Yellow", filename: "cat_yellow.png" },
];

// Cat images - load all color variants
const catImages = {};
availableColors.forEach((color) => {
  catImages[color.name] = new Image();
  catImages[color.name].src = color.filename;
});

// For backward compatibility
const catImage = catImages.gray;

// Background image
const backgroundImage = new Image();
backgroundImage.src = "cloudy-background.png";

// Coin images
const yellowCoinImage = new Image();
yellowCoinImage.src = "yellow_coin.png";

const redCoinImage = new Image();
redCoinImage.src = "red_coin.png";

const blueCoinImage = new Image();
blueCoinImage.src = "blue_coin.png";

// Magnet images
const redMagnetImage = new Image();
redMagnetImage.src = "red-magnet.png";

const goldMagnetImage = new Image();
goldMagnetImage.src = "gold-magnet.png";

// Mini nuke image
const miniNukeImage = new Image();
miniNukeImage.src = "mini-nuke.png";

// Nuke image
const nukeImage = new Image();
nukeImage.src = "nuke.png";

// Mobile detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// In-canvas button system for game over screen
let gameOverButtons = [];
