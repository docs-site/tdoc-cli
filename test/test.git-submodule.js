/**
 * 测试脚本：tdoc git-submodule 命令功能测试
 * 测试所需的目录、文件和 git 仓库均在本脚本内创建，每次运行前会重建沙箱目录
 * 运行：node test/test.git-submodule.js
 *
 * 覆盖场景：
 *   1. 未指定目录 / 目录不存在 / 非 git 仓库时的报错退出
 *   2. git 仓库中没有 .gitmodules 时的提示
 *   3. .gitmodules 中的 SSH URL 转换为 HTTPS（已有 HTTPS 的保持不变）
 *   4. .gitmodules 全部为 HTTPS URL 时提示无需修改
 */

const fs = require("fs");
const path = require("path");
const { spawnSync, execSync } = require("child_process");

// CLI 入口（bin 启动器最终加载 dist/index.js，等价于全局 tdoc 命令）
const CLI = path.join(__dirname, "..", "bin", "tdoc-cli.js");

// 测试沙箱目录
const testDir = path.join(__dirname, "test-git-submodule");

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
 * @param {string[]} args 子命令参数
 * @param {string} cwd 工作目录
 * @param {Object} [extraEnv] 额外的环境变量
 */
function runTdoc(args, cwd, extraEnv = {}) {
  const res = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv }
  });
  const stripAnsi = (s) => s.replace(/\x1B\[[0-9;]*m/g, "");
  return {
    status: res.status,
    stdout: stripAnsi(res.stdout || ""),
    stderr: stripAnsi(res.stderr || "")
  };
}

/**
 * 在沙箱中初始化一个 git 仓库，写入初始文件并提交
 */
function initGitRepo(repo, initialFiles) {
  fs.mkdirSync(repo, { recursive: true });
  execSync("git init -q -b main", { cwd: repo });
  execSync("git config core.autocrlf false", { cwd: repo });
  execSync('git config user.name "test"', { cwd: repo });
  execSync('git config user.email "test@test.com"', { cwd: repo });
  for (const [rel, content] of Object.entries(initialFiles)) {
    const full = path.join(repo, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  execSync("git add -A", { cwd: repo });
  execSync("git commit -qm init", { cwd: repo });
}

/**
 * 用例 1：异常参数
 */
function testInvalidArgs() {
  console.log("\n▶ 用例1：异常参数报错退出");
  let res = runTdoc(["git-submodule"], testDir);
  check("未指定目录时退出码非 0", res.status !== 0, `status=${res.status}`);
  check("未指定目录时输出提示", (res.stdout + res.stderr).includes("请指定要检查的目录"));

  res = runTdoc(["git-submodule", path.join(testDir, "no-such-dir")], testDir);
  check("目录不存在时退出码非 0", res.status !== 0, `status=${res.status}`);
  check("目录不存在时输出提示", (res.stdout + res.stderr).includes("不存在"));

  // 沙箱本身位于 tdoc-cli 仓库内，git rev-parse 会向上找到父仓库；
  // 用 GIT_CEILING_DIRECTORIES 禁止向上穿越，模拟"仓库外目录"的真实场景
  res = runTdoc(["git-submodule", path.join(testDir, "not-a-repo")], testDir, {
    GIT_CEILING_DIRECTORIES: path.resolve(testDir)
  });
  check("非 git 仓库时退出码非 0", res.status !== 0, `status=${res.status}`);
  check("非 git 仓库时输出提示", (res.stdout + res.stderr).includes("不是git仓库"));
}

/**
 * 用例 2：git 仓库中没有 .gitmodules
 */
function testNoSubmodules() {
  console.log("\n▶ 用例2：git 仓库中没有 .gitmodules");
  const repo = path.join(testDir, "empty-repo");
  initGitRepo(repo, { "README.md": "# empty\n" });

  const res = runTdoc(["git-submodule", repo], testDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("输出没有找到子模块", res.stdout.includes("没有找到子模块"));
}

/**
 * 用例 3：SSH URL 转换为 HTTPS（混合场景）
 */
function testSshConvert() {
  console.log("\n▶ 用例3：SSH URL 转换为 HTTPS");
  const repo = path.join(testDir, "ssh-repo");
  initGitRepo(repo, {
    ".gitmodules": [
      '[submodule "lib1"]',
      "\tpath = lib1",
      "\turl = git@github.com:user1/repo1.git",
      '[submodule "lib2"]',
      "\tpath = lib2",
      "\turl = https://github.com/user2/repo2.git",
      '[submodule "lib3"]',
      "\tpath = lib3",
      "\turl = git@github.com:user3/repo3.git"
    ].join("\n")
  });
  const gitmodulesPath = path.join(repo, ".gitmodules");
  const before = fs.readFileSync(gitmodulesPath, "utf8");

  const res = runTdoc(["git-submodule", repo], testDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("输出发现子模块提示", res.stdout.includes("发现子模块，开始检查URL"));
  check("输出转换过程（--->）", res.stdout.includes("git@github.com:user1/repo1.git ---> https://github.com/user1/repo1.git"));
  check("输出更新完成提示", res.stdout.includes("子模块URL已更新"));

  const after = fs.readFileSync(gitmodulesPath, "utf8");
  check("SSH URL 已写入为 HTTPS", after.includes("url = https://github.com/user1/repo1.git"));
  check("第二个 SSH URL 同样转换", after.includes("url = https://github.com/user3/repo3.git"));
  check("原 HTTPS URL 保持不变", after.includes("url = https://github.com/user2/repo2.git"));
  check("文件中不再有 SSH URL", !after.includes("git@github.com"));
  check("未涉及的行不被改动", before.includes('[submodule "lib2"]') === after.includes('[submodule "lib2"]'));
}

/**
 * 用例 4：全部是 HTTPS URL，无需修改
 */
function testHttpsNoChange() {
  console.log("\n▶ 用例4：全部为 HTTPS URL 时无需修改");
  const repo = path.join(testDir, "https-repo");
  const gitmodulesContent = [
    '[submodule "lib2"]',
    "\tpath = lib2",
    "\turl = https://github.com/user2/repo2.git"
  ].join("\n");
  initGitRepo(repo, { ".gitmodules": gitmodulesContent });
  const gitmodulesPath = path.join(repo, ".gitmodules");

  const res = runTdoc(["git-submodule", repo], testDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("输出无需修改提示", res.stdout.includes("没有需要修改的子模块URL"));
  check("文件内容未被改动", fs.readFileSync(gitmodulesPath, "utf8") === gitmodulesContent);
}

/**
 * 主函数
 */
function main() {
  console.log("🧪 tdoc git-submodule 命令测试开始");
  // 每次运行前重建沙箱
  fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });
  fs.mkdirSync(path.join(testDir, "not-a-repo"), { recursive: true });

  testInvalidArgs();
  testNoSubmodules();
  testSshConvert();
  testHttpsNoChange();

  console.log("\n──────────────────────────────");
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`📁 沙箱目录保留在: ${testDir}（可手动检查）`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
