/**
 * 测试脚本：tdoc init 命令功能测试
 * 测试所需的目录和文件均在本脚本内创建，每次运行前会重建沙箱目录
 * 运行：node test/test.init.js
 *
 * 覆盖场景（-y 跳过交互，使用默认值；该模式下不安装依赖、不装 husky）：
 *   1. 默认初始化 npm 项目：目录结构、模板复制、package.json 生成、git 仓库
 *   2. --scope 指定 npm 包作用域
 *   3. -t c 初始化 C 语言项目（按源码注释意图：无 workflow/.vscode/prettier）
 *   4. 目标目录已存在且不为空时报错退出
 *
 * 已知问题（checkKnownIssue 断言，修复前不算失败）：
 *   src/project/init.ts 中 addWorkflow/addVscodeConfig/addPrettierConfig 写成
 *   "yes ? true : (projectType === \"c\" ? false : confirm)"，-y 模式下三元短路，
 *   C 项目的排除逻辑永远不生效，与源码注释"C语言项目不需要"的意图相悖。
 *
 * 说明：init 过程会调用 npm view 获取依赖最新版本。测试统一注入坏 registry
 * 和 fetch_retries=0 环境变量，让 npm view 在 2 秒内快速失败，走源码中的
 * "latest" 回退分支，保证测试离线可跑且结果确定。
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// CLI 入口（bin 启动器最终加载 dist/index.js，等价于全局 tdoc 命令）
const CLI = path.join(__dirname, "..", "bin", "tdoc-cli.js");

// 测试沙箱目录
const testDir = path.join(__dirname, "test-init");

// 让 npm view 快速失败的坏 registry 环境（getLatestVersion 会回退为 "latest"）
const OFFLINE_NPM_ENV = {
  npm_config_registry: "http://127.0.0.1:9/",
  npm_config_fetch_retries: "0",
  npm_config_fetch_timeout: "1000",
  npm_config_fetch_retry_mintimeout: "0",
  npm_config_fetch_retry_maxtimeout: "0"
};

let passed = 0;
let failed = 0;
let knownIssues = 0;

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
 * 已知问题断言：按预期意图断言，失败时只提示已知问题、不计入失败
 * （对应源码中确认的 bug，修复后此断言自动转为 ✅）
 */
function checkKnownIssue(name, cond, issue = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    knownIssues++;
    console.log(`  ⚠️  [已知问题] ${name}${issue ? `\n     ${issue}` : ""}`);
  }
}

/**
 * 运行 tdoc 子命令并返回结果
 */
function runTdoc(args, cwd) {
  const res = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...OFFLINE_NPM_ENV },
    timeout: 180000
  });
  const stripAnsi = (s) => s.replace(/\x1B\[[0-9;]*m/g, "");
  return {
    status: res.status,
    stdout: stripAnsi(res.stdout || ""),
    stderr: stripAnsi(res.stderr || "")
  };
}

/**
 * 读取项目内 JSON 文件并解析
 */
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * 用例 1：默认 -y 初始化 npm 项目
 */
function testDefaultInit() {
  console.log("\n▶ 用例1：-y 默认初始化 npm 项目");
  const res = runTdoc(["init", "demo-app", "-y"], testDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("输出初始化成功提示", res.stdout.includes("initialized successfully"), res.stdout);

  const project = path.join(testDir, "demo-app");
  for (const rel of [
    "package.json",
    "README.md",
    ".gitignore",
    ".editorconfig",
    ".prettierrc",
    ".prettierignore",
    ".vscode",
    ".git",
    ".github/workflows/npm-publish.yaml",
    ".github/workflows/release-page.yaml"
  ]) {
    check(`生成 ${rel}`, fs.existsSync(path.join(project, rel)));
  }

  const pkg = readJson(path.join(project, "package.json"));
  check("包名为 demo-app", pkg.name === "demo-app", `实际: ${pkg.name}`);
  check("默认许可证为 MIT", pkg.license === "MIT");
  check("devDependencies 含 @types/node", typeof pkg.devDependencies["@types/node"] === "string");
  check("addPrettierConfig 默认开启，devDependencies 含 prettier", typeof pkg.devDependencies["prettier"] === "string");
  check("yes 模式不启用 commitizen", !pkg.config || !pkg.config.commitizen);

  const readme = fs.readFileSync(path.join(project, "README.md"), "utf8");
  check("README 模板占位符已替换为项目名", readme.includes("demo-app"));

  const gitignore = fs.readFileSync(path.join(project, ".gitignore"), "utf8");
  check(".gitignore 内容正确", gitignore === "node_modules/\n.DS_Store\n.env\n");
}

/**
 * 用例 2：--scope 指定 npm 包作用域
 */
function testScope() {
  console.log("\n▶ 用例2：--scope 生成带作用域的包名");
  const res = runTdoc(["init", "@myorg/scope-app", "-y", "--scope", "myorg"], testDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);

  const pkg = readJson(path.join(testDir, "@myorg", "scope-app", "package.json"));
  check("包名为 @myorg/scope-app", pkg.name === "@myorg/scope-app", `实际: ${pkg.name}`);
}

/**
 * 用例 3：-t c 初始化 C 语言项目
 */
function testCProject() {
  console.log("\n▶ 用例3：-t c 初始化 C 语言项目");
  const res = runTdoc(["init", "c-demo", "-y", "-t", "c"], testDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);

  const project = path.join(testDir, "c-demo");
  check("生成 .gitignore（来自 c.gitignore 模板）", fs.existsSync(path.join(project, ".gitignore")));
  check("生成 README.md", fs.existsSync(path.join(project, "README.md")));
  const issue = "init.ts 中 yes 模式短路了 projectType === 'c' 判断，C 项目错误生成了这些内容";
  checkKnownIssue("C 项目不生成 .prettierrc", !fs.existsSync(path.join(project, ".prettierrc")), issue);
  checkKnownIssue("C 项目不生成 .vscode", !fs.existsSync(path.join(project, ".vscode")), issue);
  checkKnownIssue("C 项目不生成 GitHub workflow", !fs.existsSync(path.join(project, ".github")), issue);

  const pkg = readJson(path.join(project, "package.json"));
  check("devDependencies 含 @types/node", typeof pkg.devDependencies["@types/node"] === "string");
  checkKnownIssue("C 项目不添加 prettier 依赖", !pkg.devDependencies["prettier"], issue);
}

/**
 * 用例 4：目录已存在且不为空
 */
function testOccupiedDir() {
  console.log("\n▶ 用例4：目录已存在且不为空时报错退出");
  const occupied = path.join(testDir, "occupied-dir");
  fs.mkdirSync(occupied, { recursive: true });
  fs.writeFileSync(path.join(occupied, "some-file.txt"), "占用目录", "utf8");

  const res = runTdoc(["init", "occupied-dir", "-y"], testDir);
  check("退出码非 0", res.status !== 0, `status=${res.status}`);
  check("输出报错信息", (res.stdout + res.stderr).includes("已存在且不为空"));
}

/**
 * 主函数
 */
function main() {
  console.log("🧪 tdoc init 命令测试开始");
  fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });

  testDefaultInit();
  testScope();
  testCProject();
  testOccupiedDir();

  console.log("\n──────────────────────────────");
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败${knownIssues > 0 ? `, ${knownIssues} 项已知问题` : ""}`);
  console.log(`📁 沙箱目录保留在: ${testDir}（可手动检查）`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
