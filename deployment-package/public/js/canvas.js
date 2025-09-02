const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Declare groundY before resizeCanvas function
let groundY = 520; // Default value, will be updated by resizeCanvas

// Responsive canvas sizing
function resizeCanvas() {
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobileDevice) {
    // For mobile, use full screen dimensions
    const maxWidth = Math.min(window.innerWidth, 414); // Max iPhone Pro Max width
    const maxHeight = Math.min(window.innerHeight, 896); // Max iPhone Pro Max height

    // Maintain aspect ratio similar to original (400x600)
    const aspectRatio = 400 / 600;

    if (maxWidth / maxHeight > aspectRatio) {
      // Screen is wider than our ratio, constrain by height
      canvas.height = maxHeight;
      canvas.width = maxHeight * aspectRatio;
    } else {
      // Screen is taller than our ratio, constrain by width
      canvas.width = maxWidth;
      canvas.height = maxWidth / aspectRatio;
    }
  } else {
    // For desktop, keep reasonable size
    canvas.width = 600;
    canvas.height = 800;
  }

  // Update ground position based on new height
  groundY = canvas.height - 80;
}

// Initialize canvas size
resizeCanvas();

// Resize on window resize
window.addEventListener("resize", resizeCanvas);
