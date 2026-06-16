// One-shot: extract the draw.js section out of src/main.ts into src/draw.ts.
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "src", "main.ts");
const OUT = path.join(__dirname, "..", "src", "draw.ts");

const text = fs.readFileSync(FILE, "utf8");
const startMarker = "// ===================== draw.js =====================\n";
const endMarker = "// ===================== main.js =====================";
const startIdx = text.indexOf(startMarker) + startMarker.length;
const endIdx = text.indexOf(endMarker);
if (startIdx < startMarker.length || endIdx < 0) throw new Error("markers not found");

let section = text.slice(startIdx, endIdx).trimEnd() + "\n";

const names = [];
section = section.replace(/^(async function|function) (\w+)/gm, (m, kw, name) => {
  names.push(name);
  return "export " + kw + " " + name;
});

const header =
  'import { state } from "./state";\n' +
  'import { canvas, ctx } from "./dom";\n' +
  "import {\n" +
  "  catImages,\n  backgroundImage,\n  yellowCoinImage,\n  redCoinImage,\n" +
  "  blueCoinImage,\n  redMagnetImage,\n  goldMagnetImage,\n  miniNukeImage,\n" +
  "  nukeImage,\n  goldNukeImage,\n  ghostShroomImage,\n  springBootsImage,\n" +
  "  ghostCatImage,\n  energyCapeImage,\n  isMobile,\n  availableShopItems,\n" +
  "  availableColors,\n" +
  '} from "./assets";\n\n';

fs.writeFileSync(OUT, header + section);

// main.ts only needs draw(); but export-all is fine. Import just what main uses.
const importStmt = 'import { draw } from "./draw";\n';
const before = text.slice(0, text.indexOf(startMarker));
const after = text.slice(endIdx);
fs.writeFileSync(FILE, before + importStmt + "\n" + after);

console.log("draw fns exported:", names.length, "->", names.join(", "));
