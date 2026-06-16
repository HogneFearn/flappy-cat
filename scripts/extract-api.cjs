// One-shot: extract the api.js section out of src/main.ts into src/api.ts.
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "src", "main.ts");
const API_FILE = path.join(__dirname, "..", "src", "api.ts");

const text = fs.readFileSync(FILE, "utf8");
const startMarker = "// ===================== api.js =====================\n";
const endMarker = "// ===================== controls.js =====================";
const startIdx = text.indexOf(startMarker) + startMarker.length;
const endIdx = text.indexOf(endMarker);
if (startIdx < startMarker.length || endIdx < 0) throw new Error("markers not found");

let section = text.slice(startIdx, endIdx).trimEnd() + "\n";

// Collect exported function names (top-level declarations begin at column 0).
const names = [];
section = section.replace(
  /^(async function|function) (\w+)/gm,
  (m, kw, name) => {
    names.push(name);
    return "export " + kw + " " + name;
  }
);

const apiOut =
  'import { state } from "./state";\n\n' + section;
fs.writeFileSync(API_FILE, apiOut);

// Build the import statement for main.ts.
const importStmt =
  "import {\n" +
  names.map((n) => "  " + n + ",").join("\n") +
  '\n} from "./api";\n';

// Replace the whole api section (including its marker) with the import.
const before = text.slice(0, text.indexOf(startMarker));
const after = text.slice(endIdx);
const newMain = before + importStmt + "\n" + after;
fs.writeFileSync(FILE, newMain);

console.log("Exported api functions:", names.length);
console.log(names.join(", "));
