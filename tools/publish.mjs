import { execFileSync } from "node:child_process";
import path from "node:path";

const publicRoot = process.cwd();
const workspaceRoot = path.resolve(publicRoot, "..");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

run("node", ["research/private-industry-bigtech-watch/tools/render-report-html.mjs"], { cwd: workspaceRoot });
run("node", ["tools/refresh-from-local.mjs"]);

const status = run("git", ["status", "--short"]);
if (!status) {
  console.log("No organization intelligence changes to publish.");
  process.exit(0);
}

run("git", ["add", "."]);
run("git", ["commit", "-m", `Sync organization intelligence ${new Date().toISOString().slice(0, 10)}`]);
run("git", ["push"]);

console.log("Published organization intelligence changes to GitHub Pages.");
