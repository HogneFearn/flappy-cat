// Web Audio API system for high-performance mobile audio
let audioContext = null;
let soundBuffers = {
  miniNuke: null,
  nuke: null,
  goldNuke: null,
  coin: null,
  boing: null,
};
export let audioInitialized = false;
let masterGain = null;

// Initialize Web Audio API with user interaction (required for mobile)
export async function initializeAudio() {
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
        loadAudioBuffer("sounds/boing.mp3", "boing"),
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
export function playExplosionSound(rocketType = "miniNuke") {
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
export function playCoinSound() {
  if (!audioInitialized) {
    initializeAudio();
  }

  playSound("coin", 0.8); // Slightly quieter for coin pickup
}

// Play boing sound with Web Audio API
export function playBoingSound() {
  if (!audioInitialized) {
    initializeAudio();
  }

  playSound("boing", 1.0);
}
