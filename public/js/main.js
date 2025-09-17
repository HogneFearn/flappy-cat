// Authentication setup
setupAuthentication();

// Initialize authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Check for existing session
    const session = loadSession();
    if (session) {
      const isValid = await validateSession(session.sessionToken);
      if (isValid) {
        currentSession = session;
        authMode = "authenticated";
        playerName = session.username;
        showAuthScreen = false;

        // Set game state flags properly
        gameNameEntered = true;
        nameInputActive = false;

        await initializeGameData();
        startHeartbeat(session.sessionToken); // Start tracking online status
        startGame();
        return;
      } else {
        // Invalid session, clear it
        clearSession();
      }
    }

    // No valid session, show auth form
    showAuthScreen = true;
    authMode = "login";
    showAuthForm();
  } catch (error) {
    console.error("Auth initialization error:", error);
    showAuthScreen = true;
    authMode = "login";
    showAuthForm();
  }

  // Update online count periodically
  updateOnlineCount();
  setInterval(updateOnlineCount, 30000); // Update every 30 seconds
});

// Add window close detection to properly log out user
window.addEventListener("beforeunload", (event) => {
  if (currentSession && currentSession.sessionToken) {
    // Use sendBeacon with proper content type for logout on page close
    const blob = new Blob(
      [
        JSON.stringify({
          sessionToken: currentSession.sessionToken,
        }),
      ],
      { type: "application/json" }
    );

    navigator.sendBeacon("/api/auth/logout-beacon", blob);
  }
});

// Also handle visibility change (tab switching, minimizing)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && currentSession) {
    // Tab became visible again, send heartbeat
    updateOnlineCount();
  }
});

async function updateOnlineCount() {
  try {
    console.log("Calling getOnlineCount...");
    const count = await getOnlineCount();
    onlineCount = count;
    console.log("Updated onlineCount to:", onlineCount);
  } catch (error) {
    console.error("Failed to get online count:", error);
  }
}

function setupAuthentication() {
  const authForm = document.getElementById("authForm");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const authToggleBtn = document.getElementById("authToggleBtn");
  const authToggleText = document.getElementById("authToggleText");
  const authError = document.getElementById("authError");

  // Toggle between login and signup
  authToggleBtn.addEventListener("click", () => {
    if (authMode === "login") {
      authMode = "signup";
      loginBtn.style.display = "none";
      signupBtn.style.display = "block";
      authToggleText.textContent = "Already have an account?";
      authToggleBtn.textContent = "Login here";
    } else {
      authMode = "login";
      loginBtn.style.display = "block";
      signupBtn.style.display = "none";
      authToggleText.textContent = "Don't have an account?";
      authToggleBtn.textContent = "Sign up here";
    }
    clearAuthError();
  });

  // Login button
  loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!validateAuthInput(username, password)) return;

    try {
      setAuthLoading(true);
      const session = await loginPlayer(username, password);
      if (session) {
        saveSession(session);
        currentSession = session;
        playerName = username;
        authMode = "authenticated";
        showAuthScreen = false;

        // Set game state flags properly
        gameNameEntered = true;
        nameInputActive = false;

        hideAuthForm();
        await initializeGameData();
        startHeartbeat(session.sessionToken); // Start heartbeat
        startGame();
      }
    } catch (error) {
      showAuthError(error.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  });

  // Signup button
  signupBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!validateAuthInput(username, password)) return;

    try {
      setAuthLoading(true);
      const session = await signupPlayer(username, password);
      if (session) {
        saveSession(session);
        currentSession = session;
        playerName = username;
        authMode = "authenticated";
        showAuthScreen = false;

        // Set game state flags properly
        gameNameEntered = true;
        nameInputActive = false;

        hideAuthForm();
        await initializeGameData();
        startGame();
      }
    } catch (error) {
      showAuthError(error.message || "Signup failed");
    } finally {
      setAuthLoading(false);
    }
  });

  // Enter key handling
  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      if (authMode === "login") {
        loginBtn.click();
      } else {
        signupBtn.click();
      }
    }
  });

  // Clear error when typing
  usernameInput.addEventListener("input", clearAuthError);
  passwordInput.addEventListener("input", clearAuthError);
}

function validateAuthInput(username, password) {
  clearAuthError();

  if (!username || username.length < 3) {
    showAuthError("Username must be at least 3 characters");
    return false;
  }

  if (!password || password.length < 6) {
    showAuthError("Password must be at least 6 characters");
    return false;
  }

  return true;
}

function showAuthForm() {
  const authForm = document.getElementById("authForm");
  const nameInput = document.getElementById("nameInput");
  const usernameInput = document.getElementById("usernameInput");

  authForm.style.display = "block";
  nameInput.style.display = "none";

  // Focus username input
  setTimeout(() => {
    usernameInput.focus();
  }, 100);
}

function hideAuthForm() {
  const authForm = document.getElementById("authForm");
  authForm.style.display = "none";
  clearAuthInputs();
}

function clearAuthInputs() {
  document.getElementById("usernameInput").value = "";
  document.getElementById("passwordInput").value = "";
  clearAuthError();
}

function showAuthError(message) {
  const authError = document.getElementById("authError");
  authError.textContent = message;
}

function clearAuthError() {
  const authError = document.getElementById("authError");
  authError.textContent = "";
}

function setAuthLoading(loading) {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");

  loginBtn.disabled = loading;
  signupBtn.disabled = loading;
  usernameInput.disabled = loading;
  passwordInput.disabled = loading;

  if (loading) {
    loginBtn.textContent = "Logging in...";
    signupBtn.textContent = "Signing up...";
  } else {
    loginBtn.textContent = "Login";
    signupBtn.textContent = "Sign Up";
  }
}

function startGame() {
  // Initialize game with authentication complete
  for (let i = 0; i < 3; i++) spawnCoin();

  // Initialize delta time
  lastTime = performance.now();

  function gameLoop(currentTime) {
    // Calculate delta time
    deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Normalize delta time to target frame time (prevents huge jumps)
    deltaTime = Math.min(deltaTime, targetFrameTime * 3);

    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
}

// Updated switch player function for authentication
async function switchPlayerWithAuth() {
  try {
    // Logout current session properly
    if (currentSession && currentSession.sessionToken) {
      await logout(currentSession.sessionToken);
    }

    currentSession = null;

    // Reset game state
    resetGameForNewPlayer();

    // Show auth form for new login
    showAuthScreen = true;
    authMode = "login";
    showAuthForm();
  } catch (error) {
    console.error("Error switching player:", error);
  }
}

function resetGameForNewPlayer() {
  // Reset all player-specific data
  playerName = "";
  totalCoinsWallet = 0;
  playerHighScore = 0;
  hasMagnet = false;
  magnetRoundsLeft = 0;
  hasMiniNuke = false;
  miniNukeCount = 0;
  hasNuke = false;
  nukeCount = 0;
  isRocketActive = false;
  rocket = null;
  explosion = null;
  selectedCatColor = "gray"; // Reset to default color

  // Reset UI states
  showLeaderboard = false;
  showShop = false;
  showColorPalette = false;
  switchingPlayer = false;

  // Clear leaderboard data
  leaderboard = [];
}
