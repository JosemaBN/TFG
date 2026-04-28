import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const repoRoot = path.resolve(process.cwd());

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".cursor",
  ".next",
  ".vite",
  "coverage",
  "prisma/migrations",
  "src/generated",
  "frontend/node_modules",
  "frontend/dist",
]);

const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const CSS_EXTS = new Set([".css"]);
const HTML_EXTS = new Set([".html"]);

function shouldSkipDir(relPosix) {
  if (!relPosix) return false;
  const parts = relPosix.split("/");
  for (let i = 0; i < parts.length; i++) {
    const prefix = parts.slice(0, i + 1).join("/");
    if (SKIP_DIRS.has(parts[i]) || SKIP_DIRS.has(prefix)) return true;
  }
  return false;
}

function normalizeToPosix(p) {
  return p.split(path.sep).join("/");
}

async function walkFiles(dirAbs, relPosix = "") {
  if (shouldSkipDir(relPosix)) return [];
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });
  const out = [];
  for (const ent of entries) {
    const abs = path.join(dirAbs, ent.name);
    const relChildPosix = relPosix ? `${relPosix}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(abs, relChildPosix)));
    } else if (ent.isFile()) {
      out.push({ abs, relPosix: relChildPosix });
    }
  }
  return out;
}

function stripCssComments(text) {
  // Remove /* ... */ (including multiline)
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripHtmlComments(text) {
  // Remove <!-- ... --> (including multiline)
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

function stripTsJsComments(text, fileAbs) {
  const ext = path.extname(fileAbs).toLowerCase();
  const scriptKind =
    ext === ".tsx"
      ? ts.ScriptKind.TSX
      : ext === ".jsx"
        ? ts.ScriptKind.JSX
        : ext === ".js"
          ? ts.ScriptKind.JS
          : ts.ScriptKind.TS;

  const sourceFile = ts.createSourceFile(
    fileAbs,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: true,
  });

  return printer.printFile(sourceFile);
}

async function main() {
  const files = await walkFiles(repoRoot);
  let changed = 0;

  for (const f of files) {
    const ext = path.extname(f.abs).toLowerCase();
    if (!CODE_EXTS.has(ext) && !CSS_EXTS.has(ext) && !HTML_EXTS.has(ext)) continue;

    // Skip generated or lock files defensively even if extension matches
    const relPosix = normalizeToPosix(path.relative(repoRoot, f.abs));
    if (shouldSkipDir(relPosix)) continue;
    if (relPosix.endsWith("package-lock.json")) continue;

    const original = await fs.readFile(f.abs, "utf8");
    let next = original;

    if (CODE_EXTS.has(ext)) next = stripTsJsComments(original, f.abs);
    else if (CSS_EXTS.has(ext)) next = stripCssComments(original);
    else if (HTML_EXTS.has(ext)) next = stripHtmlComments(original);

    if (next !== original) {
      await fs.writeFile(f.abs, next, "utf8");
      changed++;
    }
  }

  process.stdout.write(`Archivos modificados: ${changed}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
