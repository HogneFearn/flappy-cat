// One-shot: decompose update() in src/main.ts by moving its large, no-early-return
// sub-blocks into named helper functions. Uses the TS AST (brace-safe) and matches
// blocks by structural signature so it survives line shifts. `deltaMultiplier` is a
// shared local declared earlier in update(); blocks that use it receive it as a param.
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "main.ts");
const text = fs.readFileSync(FILE, "utf8");
const sf = ts.createSourceFile(FILE, text, ts.ScriptTarget.ES2020, true);

// Locate function update() {}.
let updateFn = null;
function findUpdate(node) {
  if (
    ts.isFunctionDeclaration(node) &&
    node.name &&
    node.name.text === "update"
  ) {
    updateFn = node;
  }
  ts.forEachChild(node, findUpdate);
}
findUpdate(sf);
if (!updateFn || !updateFn.body) throw new Error("update() not found");

// Match top-level statements in update()'s body by signature.
const plans = []; // { name, param, node }
for (const stmt of updateFn.body.statements) {
  const t = text.slice(stmt.getStart(sf), stmt.getEnd());
  if (!ts.isIfStatement(stmt)) continue;
  if (t.startsWith("if (state.gameStarted)") && t.includes("state.gravity")) {
    plans.push({ name: "applyPlayerPhysics", param: true, node: stmt });
  } else if (t.startsWith("if (state.player.y + state.player.h > state.groundY)")) {
    plans.push({ name: "handleGroundCollision", param: false, node: stmt });
  } else if (t.startsWith("if (state.player.y < 0)")) {
    plans.push({ name: "handleCeilingCollision", param: false, node: stmt });
  } else if (t.startsWith("if (state.gameStarted)") && t.includes("state.obstacles =")) {
    plans.push({ name: "updateWorld", param: true, node: stmt });
  }
}

const expected = [
  "applyPlayerPhysics",
  "handleGroundCollision",
  "handleCeilingCollision",
  "updateWorld",
];
const got = plans.map((p) => p.name);
for (const e of expected) {
  if (!got.includes(e)) throw new Error("missing block: " + e);
}

// Build helpers and replace each statement with a call (end -> start).
const helpers = [];
const edits = [];
for (const p of plans) {
  const body = text.slice(p.node.getStart(sf), p.node.getEnd());
  const sig = p.param ? "deltaMultiplier" : "";
  const call = p.param ? `${p.name}(deltaMultiplier);` : `${p.name}();`;
  helpers.push(`function ${p.name}(${sig}) {\n  ${body}\n}`);
  edits.push({ start: p.node.getStart(sf), end: p.node.getEnd(), newText: call });
}

edits.sort((a, b) => b.start - a.start);
let out = text;
for (const e of edits) out = out.slice(0, e.start) + e.newText + out.slice(e.end);

// Insert helpers immediately after update()'s closing brace.
const insertAt = updateFn.getEnd() + (edits.reduce((acc) => acc, 0) * 0); // update end unchanged (edits are inside, before end shrinks it)
// Recompute update end in the edited string by locating the call we inserted last
// Simpler: append helpers right after the function by re-finding its text anchor.
const anchor = "} // End of gameStarted condition\n}";
// Fallback: append at end of file (function decls hoist within module scope anyway).
out = out.trimEnd() + "\n\n" + helpers.join("\n\n") + "\n";

fs.writeFileSync(FILE, out);
console.log("Extracted update helpers:", got.join(", "));
