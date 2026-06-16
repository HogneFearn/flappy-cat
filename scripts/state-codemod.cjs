// One-shot codemod: move the shared mutable game globals out of src/main.ts into
// a single `state` object (src/state.ts) and qualify every *reference* to those
// globals as `state.X`. Uses the TypeScript type checker so it is scope-aware:
// object-literal keys, property accesses, and shadowing locals/params are left
// untouched. Run with: node scripts/state-codemod.cjs
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "main.ts");
const STATE_FILE = path.join(__dirname, "..", "src", "state.ts");

// The exact set of top-level mutable globals to relocate into `state`.
const TARGET_NAMES = new Set([
  // config.js game/auth/shop/color state
  "player", "gravity", "jumpPower", "gameSpeed", "baseGameSpeed",
  "lastTime", "deltaTime", "coins", "obstacles", "obstacleScore",
  "totalCoinsWallet", "onlineCount", "playerHighScore", "gameRunning",
  "gameStarted", "gameNameEntered", "nameInputActive", "obstacleSpawnTimer",
  "validationTimer", "jumpHoldTimer", "playerName", "inputName", "inputPassword",
  "showLeaderboard", "switchingPlayer", "leaderboard", "showGameOverButtons",
  "gamePaused", "pauseButtonCoords", "authMode", "showAuthScreen", "authError",
  "currentSession", "showShop", "hasMagnet", "magnetRoundsLeft", "magnetRadius",
  "hasGoldMagnet", "goldMagnetRoundsLeft", "goldMagnetRadius", "goldMagnetPullSpeed",
  "hasMiniNuke", "miniNukeCount", "hasNuke", "nukeCount", "hasGoldNuke",
  "goldNukeCount", "hasGhostShroom", "ghostShroomCount", "hasSpringBoots",
  "springBootsCount", "hasEnergyCape", "energyCapeRoundsLeft", "energyCapeActive",
  "energyCapeReloadTimer", "energyCapeCooldown", "energyCapeButtonCoords",
  "isGhostActive", "ghostModeActivationTime", "ghostModeGracePeriod",
  "isRocketActive", "rocket", "rocketButtonCoords", "nukeButtonCoords",
  "goldNukeButtonCoords", "springBootsButtonCoords", "explosion",
  "lastExplosionType", "shopGridCoords", "showColorPalette", "selectedCatColor",
  "colorGridCoords", "closeButtonCoords", "gameOverButtons",
  // canvas.js
  "groundY",
  // controls.js
  "keys", "isJumpHeld",
]);

const program = ts.createProgram([FILE], {
  allowJs: true,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  noResolve: false,
});
const checker = program.getTypeChecker();
const sf = program.getSourceFile(FILE);
const text = sf.text;

// 1) Find the top-level declarations to relocate, capture their symbols,
//    statement ranges (for deletion), and initializer text (for state.ts).
const targetSymbols = new Set();
const deletions = []; // { start, end }
const stateFields = []; // { name, init }

for (const stmt of sf.statements) {
  if (!ts.isVariableStatement(stmt)) continue;
  // Only top-level statements with a single declaration we care about.
  const decls = stmt.declarationList.declarations;
  const allTargets = decls.every(
    (d) => ts.isIdentifier(d.name) && TARGET_NAMES.has(d.name.text)
  );
  const anyTarget = decls.some(
    (d) => ts.isIdentifier(d.name) && TARGET_NAMES.has(d.name.text)
  );
  if (!anyTarget) continue;
  if (!allTargets) {
    throw new Error(
      "Mixed target/non-target in one statement at " + stmt.getStart(sf)
    );
  }
  for (const d of decls) {
    const sym = checker.getSymbolAtLocation(d.name);
    if (sym) targetSymbols.add(sym);
    stateFields.push({
      name: d.name.text,
      init: d.initializer ? d.initializer.getText(sf) : "undefined",
    });
  }
  // Delete the full statement plus its trailing newline.
  let end = stmt.getEnd();
  while (end < text.length && (text[end] === "\n" || text[end] === "\r")) end++;
  deletions.push({ start: stmt.getStart(sf), end });
}

// 2) Walk all identifiers; qualify references that resolve to a target symbol.
const edits = []; // { start, end, newText }
function visit(node) {
  if (ts.isIdentifier(node)) {
    const sym = checker.getSymbolAtLocation(node);
    if (sym && targetSymbols.has(sym)) {
      const p = node.parent;
      // Skip the binding name in the original declarations (deleted separately).
      const isDeclName = ts.isVariableDeclaration(p) && p.name === node;
      // Skip property access: obj.NAME
      const isPropAccessName =
        ts.isPropertyAccessExpression(p) && p.name === node;
      // Skip object-literal key: { NAME: ... }
      const isPropAssignKey =
        ts.isPropertyAssignment(p) && p.name === node;
      // Shorthand { NAME } -> { NAME: state.NAME }
      const isShorthand =
        ts.isShorthandPropertyAssignment(p) && p.name === node;
      if (isShorthand) {
        edits.push({
          start: node.getStart(sf),
          end: node.getEnd(),
          newText: node.text + ": state." + node.text,
        });
      } else if (!isDeclName && !isPropAccessName && !isPropAssignKey) {
        edits.push({
          start: node.getStart(sf),
          end: node.getEnd(),
          newText: "state." + node.text,
        });
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(sf);

// 3) Apply deletions + edits from end to start so offsets stay valid.
const ops = [
  ...deletions.map((d) => ({ ...d, newText: "" })),
  ...edits,
].sort((a, b) => b.start - a.start);

let out = text;
for (const op of ops) {
  out = out.slice(0, op.start) + op.newText + out.slice(op.end);
}

// 4) Emit state.ts.
const stateOut =
  "// Centralized mutable game state. A single shared object preserves the exact\n" +
  "// \"everyone mutates the same globals\" semantics the game relies on, while making\n" +
  "// the dependency explicit and importable by every module.\n" +
  "export const state = {\n" +
  stateFields.map((f) => `  ${f.name}: ${f.init},`).join("\n") +
  "\n};\n";

fs.writeFileSync(STATE_FILE, stateOut);
fs.writeFileSync(FILE, out);

console.log("Relocated fields:", stateFields.length);
console.log("Reference edits:", edits.length);
console.log("Deleted statements:", deletions.length);
