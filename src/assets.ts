// Frame timing constants
const targetFPS = 60;
export const targetFrameTime = 1000 / targetFPS; // 16.67ms for 60fps

// Shop items configuration
export const availableShopItems = [
  {
    id: "magnet",
    name: "🧲 Coin Magnet",
    price: 200,
    description: "Attracts coins from 7x distance",
    duration: "3 rounds",
  },
  {
    id: "miniNuke",
    name: "🚀 Mini Nuke",
    price: 350,
    description: "Clears 3 pipe sets (+15 points)",
    duration: "1 use",
  },
  {
    id: "springBoots",
    name: "👢 Spring Boots",
    price: 550,
    description: "Super jump on ground hit",
    duration: "1 round",
  },
  {
    id: "ghostShroom",
    name: "👻 Ghost Shroom",
    price: 650,
    description: "Survive one obstacle hit",
    duration: "1 use",
  },
  {
    id: "goldMagnet",
    name: "🟡 Gold Magnet",
    price: 750,
    description: "Stronger magnet with faster pull",
    duration: "1 round",
  },
  {
    id: "nuke",
    name: "💥 Nuke",
    price: 1000,
    description: "Clears 10 pipe sets (+50 points)",
    duration: "1 use",
  },
  {
    id: "goldNuke",
    name: "☢️ Gold Nuke",
    price: 2450,
    description: "Clears 20 pipes + 2x coins",
    duration: "1 use",
  },
  {
    id: "energyCape",
    name: "⚡ Energy Cape",
    price: 1750,
    description: "Dash through pipes! 4s cooldown",
    duration: "1 round",
  },
];

// Color palette options
export const availableColors = [
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
export const catImages: Record<string, HTMLImageElement> = {};
availableColors.forEach((color) => {
  catImages[color.name] = new Image();
  catImages[color.name].src = color.filename;
});

// For backward compatibility
const catImage = catImages.gray;

// Background image
export const backgroundImage = new Image();
backgroundImage.src = "cloudy-background.png";

// Coin images
export const yellowCoinImage = new Image();
yellowCoinImage.src = "yellow_coin.png";

export const redCoinImage = new Image();
redCoinImage.src = "red_coin.png";

export const blueCoinImage = new Image();
blueCoinImage.src = "blue_coin.png";

// Magnet images
export const redMagnetImage = new Image();
redMagnetImage.src = "red-magnet.png";

export const goldMagnetImage = new Image();
goldMagnetImage.src = "gold-magnet.png";

// Mini nuke image
export const miniNukeImage = new Image();
miniNukeImage.src = "mini-nuke.png";

// Nuke image
export const nukeImage = new Image();
nukeImage.src = "nuke.png";

// Gold Nuke image
export const goldNukeImage = new Image();
goldNukeImage.src = "gold_nuke.png";

// Ghost shroom image
export const ghostShroomImage = new Image();
ghostShroomImage.src = "ghost_shroom.png";

// Spring boots image
export const springBootsImage = new Image();
springBootsImage.src = "spring_boots.png";

// Ghost cat image
export const ghostCatImage = new Image();
ghostCatImage.src = "ghost_cat.png";

// Energy Cape image
export const energyCapeImage = new Image();
energyCapeImage.src = "energy_cape.png";

// Mobile detection
export const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
