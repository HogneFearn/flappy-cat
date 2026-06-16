import { state } from "./state";

export const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

// Responsive canvas sizing
export function resizeCanvas() {
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobileDevice) {
    // For mobile, use a fixed logical size that scales well
    canvas.width = 400;
    canvas.height = 600;

    // Set CSS size to fill screen while maintaining aspect ratio
    const maxWidth = Math.min(window.innerWidth * 0.95, 414);
    const maxHeight = Math.min(window.innerHeight * 0.95, 896);

    const aspectRatio = 400 / 600;

    let cssWidth, cssHeight;
    if (maxWidth / maxHeight > aspectRatio) {
      // Screen is wider than our ratio, constrain by height
      cssHeight = maxHeight;
      cssWidth = maxHeight * aspectRatio;
    } else {
      // Screen is taller than our ratio, constrain by width
      cssWidth = maxWidth;
      cssHeight = maxWidth / aspectRatio;
    }

    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
  } else {
    // For desktop, use larger fixed size
    canvas.width = 600;
    canvas.height = 800;
    canvas.style.width = "600px";
    canvas.style.height = "800px";
  }

  // Update ground position based on canvas height (not CSS height)
  state.groundY = canvas.height - 80;
}

// Initialize canvas size
resizeCanvas();

// Resize on window resize
window.addEventListener("resize", resizeCanvas);

// Helper function to get accurate canvas coordinates from screen coordinates
export function getCanvasCoordinates(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();

  // Calculate the scale factors
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Convert screen coordinates to canvas coordinates
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;

  return {
    x: Math.round(canvasX), // Round to avoid floating point precision issues
    y: Math.round(canvasY),
  };
}
