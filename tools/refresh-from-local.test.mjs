import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const refreshScript = path.join(toolsDir, "refresh-from-local.mjs");

function runRefreshWith(content, fileName = "2026-07-23.html") {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "public-safety-"));
  const publicRoot = path.join(fixtureRoot, "public");
  const sourceRoot = path.join(fixtureRoot, "research", "private-industry-bigtech-watch");
  const relativePath = path.join("daily-log", fileName);

  fs.mkdirSync(path.join(publicRoot, "tools"), { recursive: true });
  fs.mkdirSync(path.join(sourceRoot, "daily-log"), { recursive: true });
  fs.copyFileSync(refreshScript, path.join(publicRoot, "tools", "refresh-from-local.mjs"));
  fs.writeFileSync(path.join(sourceRoot, "framework.html"), "<p>public framework</p>");
  fs.writeFileSync(path.join(sourceRoot, "framework.md"), "public framework");
  fs.writeFileSync(path.join(sourceRoot, relativePath), content);

  try {
    execFileSync(process.execPath, ["tools/refresh-from-local.mjs"], {
      cwd: publicRoot,
      encoding: "utf8",
      stdio: "pipe",
    });
    return {
      error: null,
      output: fs.readFileSync(path.join(publicRoot, relativePath), "utf8"),
    };
  } catch (error) {
    return { error, output: null };
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

test("allows public undersecretary URLs", () => {
  const { error } = runRefreshWith(
    '<a href="https://energy.gov/undersecretary/science">public source</a>',
  );

  assert.equal(error, null);
});

for (const unsafeText of ["secret", "API_SECRET", "client-secret"]) {
  test(`rejects sensitive marker: ${unsafeText}`, () => {
    const { error } = runRefreshWith(`<p>${unsafeText}</p>`);

    assert.notEqual(error, null);
    assert.match(error.stderr, /matched .*secret/i);
  });
}

for (const [fileName, content] of [
  [
    "2026-08-07.html",
    '<ul><li><strong>二次验证入口</strong>：使用本地私有入口 <code>research/private-industry-bigtech-watch/index.html</code>；密码沿用用户已指定的本地密码。</li><li>公开结论</li></ul>',
  ],
  [
    "2026-08-07.md",
    '- **二次验证入口**：使用本地私有入口 `research/private-industry-bigtech-watch/index.html`；密码沿用用户已指定的本地密码。\n- 公开结论\n',
  ],
]) {
  test(`strips private verification entry from ${path.extname(fileName)}`, () => {
    const { error, output } = runRefreshWith(content, fileName);

    assert.equal(error, null);
    assert.doesNotMatch(output, /二次验证入口|private-industry-bigtech-watch|密码/);
    assert.match(output, /公开结论/);
  });
}
