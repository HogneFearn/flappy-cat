// One-shot: dedupe the near-identical canvas "touchstart" and "click" handlers in
// src/main.ts into a single handleCanvasPointer(canvasX, canvasY, isTouch). The
// two bodies are identical except: coordinate source (handled in the slim wrappers),
// the final jump block (isJumpHeld only on touch), and the game-over button loop
// order (reverse vs forward) which is equivalent because the stacked buttons never
// overlap. We keep the touchstart body (reverse loop) for both.
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "main.ts");
const text = fs.readFileSync(FILE, "utf8");
const sf = ts.createSourceFile(FILE, text, ts.ScriptTarget.ES2020, true);

function isCanvasListener(node, type) {
  return (
    ts.isExpressionStatement(node) &&
    ts.isCallExpression(node.expression) &&
    ts.isPropertyAccessExpression(node.expression.expression) &&
    node.expression.expression.expression.getText(sf) === "canvas" &&
    node.expression.expression.name.text === "addEventListener" &&
    node.expression.arguments[0] &&
    node.expression.arguments[0].text === type
  );
}

let touchStart, click;
for (const stmt of sf.statements) {
  if (isCanvasListener(stmt, "touchstart")) touchStart = stmt;
  if (isCanvasListener(stmt, "click")) click = stmt;
}
if (!touchStart || !click) throw new Error("handlers not found");

// touchstart arrow body text between its braces.
const arrow = touchStart.expression.arguments[1];
const bodyBlock = arrow.body; // Block
const bodyText = text.slice(bodyBlock.getStart(sf) + 1, bodyBlock.getEnd() - 1);

// Take the shared portion from "// Priority 1" onward.
const sharedStartIdx = bodyText.indexOf("// Priority 1: Handle overlay screens");
if (sharedStartIdx < 0) throw new Error("shared marker not found");
let shared = bodyText.slice(sharedStartIdx);

// Transform the touchstart-specific final block to branch on isTouch.
const finalTouch =
  "// Priority 3: Normal game interactions (only when no overlays are open)\n" +
  "  if (!state.showAuthScreen && state.gameNameEntered) {\n" +
  "    state.isJumpHeld = true;\n" +
  "    state.jumpHoldTimer = 0;\n" +
  "    handleJump();\n" +
  "  }";
const finalShared =
  "// Priority 3: Normal game interactions (only when no overlays are open)\n" +
  "  if (!state.showAuthScreen && state.gameNameEntered) {\n" +
  "    if (isTouch) {\n" +
  "      state.isJumpHeld = true;\n" +
  "      state.jumpHoldTimer = 0;\n" +
  "    }\n" +
  "    handleJump();\n" +
  "  }";
if (!shared.includes(finalTouch)) throw new Error("final touch block not matched");
shared = shared.replace(finalTouch, finalShared);

const helper =
  "function handleCanvasPointer(canvasX, canvasY, isTouch) {\n  " +
  shared.trimEnd() +
  "\n}\n\n" +
  'canvas.addEventListener("touchstart", (e) => {\n' +
  "  e.preventDefault();\n\n" +
  "  // Initialize audio system on first user interaction\n" +
  "  if (!audioInitialized) {\n    initializeAudio();\n  }\n\n" +
  "  const coords = getCanvasCoordinates(\n" +
  "    e.touches[0].clientX,\n    e.touches[0].clientY\n  );\n" +
  "  handleCanvasPointer(coords.x, coords.y, true);\n" +
  "});\n\n" +
  'canvas.addEventListener("touchend", (e) => {\n' +
  "  e.preventDefault();\n  state.isJumpHeld = false;\n});\n\n" +
  "// Canvas click handler for desktop\n" +
  'canvas.addEventListener("click", (e) => {\n' +
  "  const coords = getCanvasCoordinates(e.clientX, e.clientY);\n" +
  "  handleCanvasPointer(coords.x, coords.y, false);\n" +
  "});";

// Replace the whole region [touchStart.start, click.end] with the helper + wrappers.
const start = touchStart.getStart(sf);
const end = click.getEnd();
const out = text.slice(0, start) + helper + text.slice(end);
fs.writeFileSync(FILE, out);
console.log("Unified touch/click handlers into handleCanvasPointer.");
