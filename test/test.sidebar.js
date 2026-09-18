/**
 * 测试脚本：tdoc sidebar 命令功能测试
 * 测试所需的目录和文件均在本脚本内创建，每次运行前会重建沙箱目录
 * 运行：node test/test.sidebar.js
 *
 * 覆盖场景：
 *   1. 默认扫描当前目录，生成 _sidebar.md（README/index/隐藏目录/空目录被排除）
 *   2. -L 限制扫描深度
 *   3. -d 指定扫描目录（_sidebar.md 始终生成在当前工作目录）
 *
 * 已知行为：目录缩进用 Tab，目录链接带尾部 /，文件名去掉 .md 后缀
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// CLI 入口（bin 启动器最终加载 dist/index.js，等价于全局 tdoc 命令）
const CLI = path.join(__dirname, "..", "bin", "tdoc-cli.js");

// 测试沙箱目录
const testDir = path.join(__dirname, "test-sidebar");
const sandbox = path.join(testDir, "sidebar-sandbox");

// 沙箱目录结构
const files = {
  "README.md": "# README（应被排除）",
  "index.md": "# index（应被排除）",
  "top.md": "# top",
  "docs/guide.md": "# guide",
  "docs/deep/inner.md": "# inner",
  "docs/assets/a.png": "png",
  "docs/img/x.md": "# x（img 目录应被排除）",
  ".github/w.md": "# w（.github 应被排除）",
  ".docsify/y.md": "# y（.docsify 应被排除）"
};

let passed = 0;
let failed = 0;

/**
 * 断言辅助函数
 */
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ""}`);
  }
}

/**
 * 运行 tdoc 子命令并返回结果
 */
function runTdoc(args, cwd) {
  const res = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  const stripAnsi = (s) => s.replace(/\x1B\[[0-9;]*m/g, "");
  return {
    status: res.status,
    stdout: stripAnsi(res.stdout || ""),
    stderr: stripAnsi(res.stderr || "")
  };
}

/**
 * 重建沙箱目录并创建测试文件
 */
function setup() {
  fs.rmSync(testDir, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(sandbox, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
}

/**
 * 删除已生成的侧边栏文件，保证用例之间互不影响
 */
function cleanSidebar() {
  const p = path.join(process.cwd(), "_sidebar.md");
  if (fs.existsSync(p)) fs.rmSync(p);
}

/**
 * 读取指定目录下的 _sidebar.md 内容
 */
function readSidebar(dir) {
  const p = path.join(dir, "_sidebar.md");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

/**
 * 用例 1：默认扫描当前目录
 */
function testDefault() {
  console.log("\n▶ 用例1：默认扫描当前目录生成 _sidebar.md");
  cleanSidebar();
  const res = runTdoc(["sidebar"], sandbox);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("输出成功提示", res.stdout.includes("Sidebar generated successfully!"));

  const content = readSidebar(sandbox);
  check("_sidebar.md 生成在当前工作目录", content !== null);
  if (content === null) return;

  const lines = content.split("\n");
  check("首两行为首页和目录链接", lines[0] === "- [📂 首页](/)" && lines[1] === "- [📂 目录](/_sidebar.md)");
  check("列出子目录 docs", content.includes("- [📂 docs](/docs/)"));
  check("列出嵌套目录 deep（带 Tab 缩进）", content.includes("\t- [📂 deep](/docs/deep/)"));
  check("列出深层文件 inner", content.includes("\t\t- [📝 inner](/docs/deep/inner.md)"));
  check("列出文件 guide", content.includes("\t- [📝 guide](/docs/guide.md)"));
  check("列出顶层文件 top（去 .md 后缀）", content.includes("- [📝 top](/top.md)"));

  check("排除 README.md", !content.includes("README"));
  check("排除 index.md", !content.includes("index.md"));
  check("排除空目录 empty-dir", !content.includes("empty-dir"));
  check("排除只含非 md 文件的目录 assets", !content.includes("assets"));
  check("排除 img 目录及其内容", !content.includes("img") && !content.includes("x.md"));
  check("排除 .github 目录", !content.includes(".github") && !content.includes("w.md"));
  check("排除 .docsify 目录", !content.includes(".docsify") && !content.includes("y.md"));
}

/**
 * 用例 2：-L 限制扫描深度
 * 当前实现中 -L 1 会列出第 0 层和第 1 层条目，第 2 层不再输出
 */
function testDepth() {
  console.log("\n▶ 用例2：-L 1 限制扫描深度");
  cleanSidebar();
  const res = runTdoc(["sidebar", "-L", "1"], sandbox);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);

  const content = readSidebar(sandbox);
  check("_sidebar.md 正常生成", content !== null);
  if (content === null) return;

  check("仍列出第 1 层目录 docs", content.includes("- [📂 docs](/docs/)"));
  check("仍列出第 1 层文件 guide", content.includes("\t- [📝 guide](/docs/guide.md)"));
  check("不列出第 2 层文件 inner", !content.includes("inner.md"));
}

/**
 * 用例 3：-d 指定扫描目录，输出仍写到当前工作目录
 */
function testDirectoryOption() {
  console.log("\n▶ 用例3：-d 指定扫描目录");
  cleanSidebar();
  const res = runTdoc(["sidebar", "-d", "sidebar-sandbox"], testDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);

  const content = readSidebar(testDir);
  check("_sidebar.md 生成在当前工作目录", content !== null);
  if (content === null) return;

  check("扫描的是 -d 指定的目录", content.includes("- [📂 docs](/docs/)") && content.includes("- [📝 top](/top.md)"));
  check("排除规则同样生效", !content.includes("README") && !content.includes("x.md"));
}

/**
 * 主函数
 */
function main() {
  console.log("🧪 tdoc sidebar 命令测试开始");
  setup();
  testDefault();
  testDepth();
  testDirectoryOption();

  console.log("\n──────────────────────────────");
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`📁 沙箱目录保留在: ${testDir}（可手动检查）`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
