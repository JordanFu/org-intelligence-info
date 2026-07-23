import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const refreshScript = path.join(toolsDir, "refresh-from-local.mjs");

function runRefreshWith(content) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "public-safety-"));
  const publicRoot = path.join(fixtureRoot, "public");
  const sourceRoot = path.join(fixtureRoot, "research", "private-industry-bigtech-watch");

  fs.mkdirSync(path.join(publicRoot, "tools"), { recursive: true });
  fs.mkdirSync(path.join(sourceRoot, "daily-log"), { recursive: true });
  fs.copyFileSync(refreshScript, path.join(publicRoot, "tools", "refresh-from-local.mjs"));
  fs.writeFileSync(path.join(sourceRoot, "framework.html"), "<p>public framework</p>");
  fs.writeFileSync(path.join(sourceRoot, "framework.md"), "public framework");
  fs.writeFileSync(path.join(sourceRoot, "daily-log", "2026-07-23.html"), content);

  try {
    execFileSync(process.execPath, ["tools/refresh-from-local.mjs"], {
      cwd: publicRoot,
      encoding: "utf8",
      stdio: "pipe",
    });
    return null;
  } catch (error) {
    return error;
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

test("allows public undersecretary URLs", () => {
  const error = runRefreshWith(
    '<a href="https://energy.gov/undersecretary/science">public source</a>',
  );

  assert.equal(error, null);
});

for (const unsafeText of ["secret", "API_SECRET", "client-secret"]) {
  test(`rejects sensitive marker: ${unsafeText}`, () => {
    const error = runRefreshWith(`<p>${unsafeText}</p>`);

    assert.notEqual(error, null);
    assert.match(error.stderr, /matched .*secret/i);
  });
}
