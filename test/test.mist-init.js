/**
 * 测试脚本：tdoc mist init 命令功能测试
 * 测试所需的目录均在本脚本内创建，每次运行前会重建沙箱目录
 * 运行：node test/test.mist-init.js
 *
 * 覆盖场景：
 *   1. 目录已存在且不为空时报错退出（离线）
 *   2. -y 完整初始化流程：从 GitHub 克隆 vitepress-theme-mist-docs 模板并完成配置替换
 *
 * 已知行为（-y 模式）：
 *   - 模板克隆后会删除 .git 并跳过 git init（源码中 git init 条件为 !yes && initGit）
 *   - installDeps 默认 false，不执行 npm install
 *   - 配置替换：base → '/<目录名>/'、math: false → true、启用 rewrites、
 *     .cnb.yml 与 deploy-docs.yml 中的模板仓库名替换为目录名
 *
 * 网络依赖：完整流程需要访问 GitHub（30 秒克隆超时）。脚本会先探测连通性，
 * 网络不可用时自动跳过用例 2，只跑离线用例，保证套件在任何环境可执行。
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// CLI 入口（bin 启动器最终加载 dist/index.js，等价于全局 tdoc 命令）
const CLI = path.join(__dirname, "..", "bin", "tdoc-cli.js");

// 模板仓库地址（与 src/mist/cmd_init.ts 一致）
const GITHUB_URL = "https://github.com/docs-site/vitepress-theme-mist-docs.git";

// 测试沙箱目录
const testDir = path.join(__dirname, "test-mist-init");

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
function runTdoc(args, cwd, timeout = 120000) {
  const res = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8", timeout });
  const stripAnsi = (s) => s.replace(/\x1B\[[0-9;]*m/g, "");
  return {
    status: res.status,
    stdout: stripAnsi(res.stdout || ""),
    stderr: stripAnsi(res.stderr || "")
  };
}

/**
 * 探测能否访问模板仓库（git ls-remote，20 秒超时）
 * @returns {boolean} 网络是否可用
 */
function networkAvailable() {
  const res = spawnSync("git", ["ls-remote", "--heads", GITHUB_URL], {
    encoding: "utf8",
    timeout: 20000,
    stdio: ["ignore", "pipe", "pipe"]
  });
  return res.status === 0;
}

/**
 * 用例 1：目录已存在且不为空（发生在克隆之前，可离线验证）
 */
function testOccupiedDir() {
  console.log("\n▶ 用例1：目录已存在且不为空时报错退出");
  const occupied = path.join(testDir, "occupied-site");
  fs.mkdirSync(occupied, { recursive: true });
  fs.writeFileSync(path.join(occupied, "some-file.txt"), "占用目录", "utf8");

  const res = runTdoc(["mist", "init", "occupied-site", "-y"], testDir);
  check("退出码非 0", res.status !== 0, `status=${res.status}`);
  check("输出报错信息", (res.stdout + res.stderr).includes("已存在且不为空"));
}

/**
 * 用例 2：-y 完整初始化流程（需要网络克隆模板）
 */
function testFullInit() {
  console.log("\n▶ 用例2：-y 完整初始化 Vitepress 站点（克隆模板）");
  const res = runTdoc(["mist", "init", "my-site", "-y"], testDir, 150000);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  if (res.status !== 0) return;

  check("输出初始化成功提示", res.stdout.includes("Vitepress站点初始化成功"));

  const project = path.join(testDir, "my-site");
  check("生成 package.json", fs.existsSync(path.join(project, "package.json")));
  check("生成 src/.vitepress/config.mts", fs.existsSync(path.join(project, "src", ".vitepress", "config.mts")));
  check("保留模板的 src/sdoc 目录", fs.existsSync(path.join(project, "src", "sdoc")));

  // config.mts 替换规则
  const config = fs.readFileSync(path.join(project, "src", ".vitepress", "config.mts"), "utf8");
  check("base 替换为目录名", config.includes("base: '/my-site/'"));
  check("开启数学公式支持（math: true）", config.includes("math: true") && !config.includes("math: false"));
  check("启用 rewrites 配置（取消注释）", config.includes("rewrites:") && !config.includes("// rewrites:"));
  check("yes 模式标题保持默认 Mist", config.includes('title: "Mist"'));

  // .cnb.yml 替换规则
  const cnb = fs.readFileSync(path.join(project, ".cnb.yml"), "utf8");
  check(".cnb.yml 中模板仓库名替换为目录名", cnb.includes("my-site") && !cnb.includes("vitepress-theme-mist-docs"));

  // deploy-docs.yml 替换规则（- 替换为 _）
  const workflow = fs.readFileSync(path.join(project, ".github", "workflows", "deploy-docs.yml"), "utf8");
  check(
    "workflow 事件类型替换为目录名",
    workflow.includes("trigger_deployment_my_site") && !workflow.includes("vitepress_theme_mist_docs")
  );

  // yes 模式行为
  check("克隆后解除与模板仓库的关联（无 .git）", !fs.existsSync(path.join(project, ".git")));
  check("yes 模式不安装依赖（无 node_modules）", !fs.existsSync(path.join(project, "node_modules")));
}

/**
 * 主函数
 */
function main() {
  console.log("🧪 tdoc mist init 命令测试开始");
  fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });

  testOccupiedDir();

  if (networkAvailable()) {
    testFullInit();
  } else {
    console.log("\n⚠️  无法访问 GitHub 模板仓库，跳过完整初始化流程用例（用例2）");
  }

  console.log("\n──────────────────────────────");
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`📁 沙箱目录保留在: ${testDir}（可手动检查）`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
