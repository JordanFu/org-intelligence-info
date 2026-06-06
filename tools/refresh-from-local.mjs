import fs from "node:fs";
import path from "node:path";

const publicRoot = process.cwd();
const sourceRoot = path.resolve(publicRoot, "../research/private-industry-bigtech-watch");
const today = new Date().toISOString().slice(0, 10);

const fixedFiles = [
  "framework.html",
  "framework.md",
];

function listPublicFiles(dir) {
  const fullDir = path.join(sourceRoot, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs
    .readdirSync(fullDir)
    .filter((name) => /\.(html|md)$/.test(name))
    .sort()
    .map((name) => `${dir}/${name}`);
}

function copy(relativePath) {
  const source = path.join(sourceRoot, relativePath);
  const target = path.join(publicRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  let text = fs.readFileSync(source, "utf8");
  text = stripPrivateAccessGate(text);
  text = text.replace(/知音楼\/石墨/g, "账号态内部链接");
  fs.writeFileSync(target, text);
}

function stripPrivateAccessGate(text) {
  return text.replace(/<!-- PRIVATE_ACCESS_GATE_START -->[\s\S]*?<!-- PRIVATE_ACCESS_GATE_END -->/g, "");
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

const files = [
  ...fixedFiles,
  ...listPublicFiles("daily-log"),
  ...listPublicFiles("reports"),
];

for (const file of files) copy(file);

const dailyDates = [...new Set(files
  .filter((file) => file.startsWith("daily-log/") && file.endsWith(".html"))
  .map((file) => file.match(/(\d{4}-\d{2}-\d{2})/)?.[1])
  .filter(Boolean))]
  .sort()
  .reverse();

const reportFiles = files
  .filter((file) => file.startsWith("reports/") && file.endsWith(".html"))
  .sort()
  .reverse();

fs.writeFileSync(path.join(publicRoot, "index.html"), renderIndex(dailyDates, reportFiles));

assertSafe();
console.log(`Refreshed organization intelligence public mirror at ${today}`);

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dailyTitle(date) {
  if (date === "2026-05-26") return `${date} 首轮扫描`;
  return `${date} 组织情报信息`;
}

function dailySummary(date) {
  if (date === "2026-05-29") return "最新公开组织机制信号、证据链、反向解释、适用边界与入库判断。";
  if (date === "2026-05-28") return "大厂与 AI 原生组织变化的公开信号整理，保留证据等级与待验证问题。";
  if (date === "2026-05-27") return "腾讯 AI 组织归属、Anthropic Labs / Product 分工、OpenAI 治理结构等信号的机制化整理。";
  return "互联网大厂与 AI 原生组织的公开信号、证据等级、观察池与入库判断。";
}

function reportTitle(file) {
  if (file.includes("first-run-current-state")) return "2026-05-26 首轮深度报告";
  if (file.includes("org-intelligence-sample")) return "组织情报信息示例";
  return path.basename(file, ".html");
}

function reportSummary(file) {
  if (file.includes("first-run-current-state")) return "围绕组织扁平化、人才密度、职级岗位、绩效激励四个主题整理的企业现状研究。";
  if (file.includes("org-intelligence-sample")) return "展示机制信号、证据链、反向解释、适用边界和待验证问题的报告结构。";
  return "阶段性组织情报信息报告。";
}

function card(title, summary, htmlPath, mdPath) {
  return `      <article class="card">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(summary)}</p>
        </div>
        <div class="links">
          <a class="btn" href="./${htmlPath}">阅读版</a>
          <a class="btn secondary" href="./${mdPath}">Markdown</a>
        </div>
      </article>`;
}

function renderIndex(dates, reports) {
  const dailyCards = [
    ...dates.map((date) => card(dailyTitle(date), dailySummary(date), `daily-log/${date}.html`, `daily-log/${date}.md`)),
    card("组织情报信息研究框架", "公司范围、主题维度、证据等级、颗粒度要求和公开处理边界。", "framework.html", "framework.md"),
  ].join("\n");

  const reportCards = reports.map((file) => {
    const md = file.replace(/\.html$/, ".md");
    return card(reportTitle(file), reportSummary(file), file, md);
  }).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>组织情报信息</title>
  <style>
    :root { --bg:#f7f8f6; --surface:#fff; --text:#17211e; --muted:#65716c; --line:#dce3df; --teal:#157a6e; --amber:#b87318; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--text); line-height:1.7; }
    main { width:min(1120px,calc(100% - 32px)); margin:0 auto; padding:34px 0 48px; }
    .hero { border:1px solid var(--line); border-radius:8px; background:linear-gradient(180deg,#fff 0%,#edf7f4 100%); padding:28px; margin-bottom:16px; }
    .kicker { color:var(--teal); font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    h1 { margin:6px 0 8px; font-size:clamp(34px,5vw,54px); line-height:1.08; }
    h2 { margin:28px 0 12px; font-size:22px; }
    p { color:var(--muted); margin:0; }
    .meta { margin-top:14px; display:flex; flex-wrap:wrap; gap:8px; }
    .pill { display:inline-flex; align-items:center; min-height:30px; padding:0 10px; border-radius:999px; background:#fff; border:1px solid var(--line); color:var(--muted); font-size:13px; font-weight:650; }
    .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .card { border:1px solid var(--line); border-radius:8px; background:var(--surface); padding:18px; box-shadow:0 8px 22px rgba(23,33,30,.045); min-height:180px; display:flex; flex-direction:column; justify-content:space-between; }
    .card strong { display:block; font-size:18px; line-height:1.35; margin-bottom:8px; }
    .card p { font-size:14px; }
    .links { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
    a.btn { display:inline-flex; align-items:center; justify-content:center; min-height:36px; padding:0 12px; border-radius:8px; background:var(--teal); color:#fff; text-decoration:none; font-size:13px; font-weight:760; }
    a.secondary { background:#e7ece9; color:var(--text); }
    .notice { border-left:4px solid var(--amber); background:#fff8ec; padding:14px 16px; border-radius:8px; color:#755116; margin:16px 0 22px; }
    .notice p { color:#755116; }
    footer { color:var(--muted); font-size:13px; margin-top:28px; padding-top:18px; border-top:1px solid var(--line); }
    @media (max-width:880px) { .grid { grid-template-columns:1fr; } .hero { padding:22px; } }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="kicker">Organization Intelligence</div>
      <h1>组织情报信息</h1>
      <p>面向组织机制研究的公开阅读页。这里保留已脱敏、可分享的日报、阶段报告与研究框架；不包含私有渠道索引、本地参考文档、原始检索归档或未脱敏材料。</p>
      <div class="meta">
        <span class="pill">每日自动同步</span>
        <span class="pill">只呈现结论与证据</span>
        <span class="pill">不替用户做决策</span>
        <span class="pill">更新：${today}</span>
      </div>
    </section>
    <div class="notice"><p>公开页只用于分享阅读。涉及内部链接、访谈口径、私有渠道、桌面原始文档和待核验材料的内容保留在本地私有知识源。</p></div>
    <h2>最新日报</h2>
    <section class="grid">
${dailyCards}
    </section>
    <h2>阶段报告</h2>
    <section class="grid">
${reportCards}
    </section>
    <footer>Public mirror of the local organization intelligence knowledge source. Private material is intentionally excluded.</footer>
  </main>
</body>
</html>
`;
}
