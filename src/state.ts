// Centralized mutable game state. A single shared object preserves the exact
// "everyone mutates the same globals" semantics the game relies on, while making
// the dependency explicit, importable, and type-checked by every module.

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

export interface Coin {
  x: number;
  y: number;
  r: number;
  type: string;
  value: number;
  color: string;
  strokeColor: string;
}

export interface Obstacle {
  x: number;
  width: number;
  topHeight: number;
  bottomY: number;
  bottomHeight: number;
  passed: boolean;
}

export interface Rocket {
  x: number;
  y: number;
  speed: number;
  type: string;
}

export interface Explosion {
  x: number;
  y: number;
  timer: number;
  duration: number;
  maxRadius: number;
  particles: any[];
}

export interface Session {
  sessionToken: string;
  username: string;
  [key: string]: any;
}

// Button hit-boxes are populated lazily by the renderer, so every field is optional.
export interface ButtonCoords {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface CloseButtonCoords {
  x: number;
  y: number;
  size: number;
}

export interface GameOverButton {
  x: number;
  y: number;
  width: number;
  height: number;
  action: string;
}

export interface ColorGridCoord {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface ShopGridCoord {
  x: number;
  y: number;
  width: number;
  height: number;
  itemId: string;
  itemName: string;
}

export interface State {
  player: Player;
  gravity: number;
  jumpPower: number;
  gameSpeed: number;
  baseGameSpeed: number;
  lastTime: number;
  deltaTime: number;
  coins: Coin[];
  obstacles: Obstacle[];
  obstacleScore: number;
  totalCoinsWallet: number;
  onlineCount: number;
  playerHighScore: number;
  gameRunning: boolean;
  gameStarted: boolean;
  gameNameEntered: boolean;
  nameInputActive: boolean;
  obstacleSpawnTimer: number;
  validationTimer: number;
  jumpHoldTimer: number;
  playerName: string;
  inputName: string;
  inputPassword: string;
  showLeaderboard: boolean;
  switchingPlayer: boolean;
  leaderboard: any[];
  showGameOverButtons: boolean;
  gamePaused: boolean;
  pauseButtonCoords: ButtonCoords;
  authMode: string;
  showAuthScreen: boolean;
  authError: string;
  currentSession: Session | null;
  showShop: boolean;
  hasMagnet: boolean;
  magnetRoundsLeft: number;
  magnetRadius: number;
  hasGoldMagnet: boolean;
  goldMagnetRoundsLeft: number;
  goldMagnetRadius: number;
  goldMagnetPullSpeed: number;
  hasMiniNuke: boolean;
  miniNukeCount: number;
  hasNuke: boolean;
  nukeCount: number;
  hasGoldNuke: boolean;
  goldNukeCount: number;
  hasGhostShroom: boolean;
  ghostShroomCount: number;
  hasSpringBoots: boolean;
  springBootsCount: number;
  hasEnergyCape: boolean;
  energyCapeRoundsLeft: number;
  energyCapeActive: boolean;
  energyCapeReloadTimer: number;
  energyCapeCooldown: number;
  energyCapeButtonCoords: ButtonCoords;
  isGhostActive: boolean;
  ghostModeActivationTime: number;
  ghostModeGracePeriod: number;
  isRocketActive: boolean;
  rocket: Rocket | null;
  rocketButtonCoords: ButtonCoords;
  nukeButtonCoords: ButtonCoords;
  goldNukeButtonCoords: ButtonCoords;
  springBootsButtonCoords: ButtonCoords;
  explosion: Explosion | null;
  lastExplosionType: string | null;
  shopGridCoords: ShopGridCoord[];
  showColorPalette: boolean;
  selectedCatColor: string;
  colorGridCoords: ColorGridCoord[];
  closeButtonCoords: CloseButtonCoords;
  gameOverButtons: GameOverButton[];
  groundY: number;
  keys: Record<string, boolean>;
  isJumpHeld: boolean;
}

export const state: State = {
  player: { x: 70, y: 300, w: 35, h: 35, vx: 0, vy: 0, onGround: false },
  gravity: 0.2,
  jumpPower: -3.5,
  gameSpeed: 2.5,
  baseGameSpeed: 2.5,
  lastTime: 0,
  deltaTime: 0,
  coins: [],
  obstacles: [],
  obstacleScore: 0,
  totalCoinsWallet: 0,
  onlineCount: 0,
  playerHighScore: 0,
  gameRunning: true,
  gameStarted: false,
  gameNameEntered: false,
  nameInputActive: false,
  obstacleSpawnTimer: 0,
  validationTimer: 0,
  jumpHoldTimer: 0,
  playerName: "",
  inputName: "",
  inputPassword: "",
  showLeaderboard: false,
  switchingPlayer: false,
  leaderboard: [],
  showGameOverButtons: false,
  gamePaused: false,
  pauseButtonCoords: {},
  authMode: "login",
  showAuthScreen: true,
  authError: "",
  currentSession: null,
  showShop: false,
  hasMagnet: false,
  magnetRoundsLeft: 0,
  magnetRadius: 250,
  hasGoldMagnet: false,
  goldMagnetRoundsLeft: 0,
  goldMagnetRadius: 280,
  goldMagnetPullSpeed: 2,
  hasMiniNuke: false,
  miniNukeCount: 0,
  hasNuke: false,
  nukeCount: 0,
  hasGoldNuke: false,
  goldNukeCount: 0,
  hasGhostShroom: false,
  ghostShroomCount: 0,
  hasSpringBoots: false,
  springBootsCount: 0,
  hasEnergyCape: false,
  energyCapeRoundsLeft: 0,
  energyCapeActive: false,
  energyCapeReloadTimer: 0,
  energyCapeCooldown: 4000,
  energyCapeButtonCoords: {},
  isGhostActive: false,
  ghostModeActivationTime: 0,
  ghostModeGracePeriod: 2000,
  isRocketActive: false,
  rocket: null,
  rocketButtonCoords: {},
  nukeButtonCoords: {},
  goldNukeButtonCoords: {},
  springBootsButtonCoords: {},
  explosion: null,
  lastExplosionType: null,
  shopGridCoords: [],
  showColorPalette: false,
  selectedCatColor: "gray",
  colorGridCoords: [],
  closeButtonCoords: { x: 0, y: 0, size: 0 },
  gameOverButtons: [],
  groundY: 520,
  keys: {},
  isJumpHeld: false,
};
