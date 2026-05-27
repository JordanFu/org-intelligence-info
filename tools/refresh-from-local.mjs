import fs from "node:fs";
import path from "node:path";

const publicRoot = process.cwd();
const sourceRoot = path.resolve(publicRoot, "../research/private-industry-bigtech-watch");
const today = new Date().toISOString().slice(0, 10);

const allowed = [
  "framework.html",
  "framework.md",
  "daily-log/2026-05-26.html",
  "daily-log/2026-05-26.md",
  "daily-log/2026-05-27.html",
  "daily-log/2026-05-27.md",
  "reports/2026-05-26-first-run-current-state.html",
  "reports/2026-05-26-first-run-current-state.md",
  "reports/2026-05-26-org-intelligence-sample.html",
  "reports/2026-05-26-org-intelligence-sample.md",
];

function copy(relativePath) {
  const source = path.join(sourceRoot, relativePath);
  const target = path.join(publicRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  let text = fs.readFileSync(source, "utf8");
  text = text.replace(/知音楼\/石墨/g, "账号态内部链接");
  fs.writeFileSync(target, text);
}

function assertSafe() {
  const forbidden = [
    /\/Users\//,
    /talodteam/i,
    /ANYSEARCH_API_KEY/i,
    /api[_-]?key/i,
    /password/i,
    /secret/i,
    /source-channels\.private/i,
    /local-reference-structured/i,
    /附：行业绩效/,
    /知音楼/,
    /石墨/,
  ];

  const files = walk(publicRoot).filter((file) => {
    return !file.includes(`${path.sep}.git${path.sep}`) && !file.includes(`${path.sep}tools${path.sep}`);
  });
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(text)) {
        throw new Error(`Public safety check failed: ${path.relative(publicRoot, file)} matched ${pattern}`);
      }
    }
  }
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (entry.isFile()) return [full];
    return [];
  });
}

for (const file of allowed) copy(file);

const indexPath = path.join(publicRoot, "index.html");
let index = fs.readFileSync(indexPath, "utf8");
index = index.replace(/更新：\d{4}-\d{2}-\d{2}/, `更新：${today}`);
fs.writeFileSync(indexPath, index);

assertSafe();
console.log(`Refreshed organization intelligence public mirror at ${today}`);
