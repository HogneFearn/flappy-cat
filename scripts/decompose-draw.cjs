// One-shot: decompose draw() in src/draw.ts by moving the bodies of the large,
// no-early-return overlay/button blocks into named helper functions. Uses the TS
// AST so braces inside strings/template literals are handled correctly. The
// `if (cond) { ... }` control flow stays in draw(); only the block *body* moves.
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "draw.ts");
const text = fs.readFileSync(FILE, "utf8");
const sf = ts.createSourceFile(FILE, text, ts.ScriptTarget.ES2020, true);

// Target if-blocks keyed by the 1-based source line of the `if`.
const TARGETS = {
  418: "drawActionButtons",
  655: "drawGameOverScreen",
  848: "drawStartMessage",
  900: "drawLeaderboardOverlay",
  964: "drawShopOverlay",
  1190: "drawColorPaletteOverlay",
};

const found = []; // { name, ifNode, block }
function visit(node) {
  if (ts.isIfStatement(node)) {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    if (TARGETS[line] && ts.isBlock(node.thenStatement)) {
      found.push({ name: TARGETS[line], block: node.thenStatement, line });
    }
  }
  ts.forEachChild(node, visit);
}
visit(sf);

const missing = Object.keys(TARGETS).filter(
  (ln) => !found.some((f) => String(f.line) === ln)
);
if (missing.length) throw new Error("if not found at lines: " + missing.join(", "));

const helpers = [];
const edits = [];
for (const f of found) {
  const block = f.block;
  const innerStart = block.getStart(sf) + 1; // after '{'
  const innerEnd = block.getEnd() - 1; // before '}'
  const body = text.slice(innerStart, innerEnd);
  helpers.push(`function ${f.name}() {${body}}`);
  edits.push({
    start: innerStart,
    end: innerEnd,
    newText: `\n    ${f.name}();\n  `,
  });
}

// Apply body replacements from end to start.
edits.sort((a, b) => b.start - a.start);
let out = text;
for (const e of edits) {
  out = out.slice(0, e.start) + e.newText + out.slice(e.end);
}

// Append helper declarations at end of file (function decls hoist).
out = out.trimEnd() + "\n\n" + helpers.join("\n\n") + "\n";

fs.writeFileSync(FILE, out);
console.log("Extracted helpers:", found.map((f) => f.name).join(", "));
