/**
 * 测试脚本：tdoc tree 命令功能测试
 * 测试所需的目录和文件均在本脚本内创建，每次运行前会重建沙箱目录
 * 运行：node test/test.tree.js
 *
 * 覆盖场景：
 *   1. 默认递归列出所有层级并统计目录/文件数量
 *   2. -L 限制最大递归深度
 *   3. -i 忽略指定目录（仅顶层，见 src/system/tree.ts 的已知行为）
 *   4. 目录不存在时的报错退出
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// CLI 入口（bin 启动器最终加载 dist/index.js，等价于全局 tdoc 命令）
const CLI = path.join(__dirname, "..", "bin", "tdoc-cli.js");

// 测试沙箱目录
const testDir = path.join(__dirname, "test-tree");
const sandbox = path.join(testDir, "tree-sandbox");

// 测试用的目录结构：{ 相对路径: 类型 }
const structure = {
  "a.txt": "file",
  "dir1": "dir",
  "dir1/b.txt": "file",
  "dir1/sub": "dir",
  "dir1/sub/c.txt": "file",
  "dir2": "dir",
  "dir2/d.txt": "file",
  "ignored": "dir",
  "ignored/e.txt": "file"
};

let passed = 0;
let failed = 0;

/**
 * 断言辅助函数
 * @param {string} name 用例名称
 * @param {boolean} cond 断言条件
 * @param {string} detail 失败时的补充信息
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
 * @param {string} [cwd] 工作目录
 * @returns {{status: number, stdout: string, stderr: string}}
 */
function runTdoc(args, cwd = testDir) {
  const res = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  // 去掉 ANSI 颜色码，方便断言（picocolors 在 Windows 管道下也可能着色）
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
  fs.mkdirSync(sandbox, { recursive: true });
  for (const [rel, type] of Object.entries(structure)) {
    const full = path.join(sandbox, rel);
    if (type === "dir") {
      fs.mkdirSync(full, { recursive: true });
    } else {
      fs.writeFileSync(full, `${rel}\n`, "utf8");
    }
  }
}

/**
 * 用例 1：默认递归列出全部层级
 */
function testDefault() {
  console.log("\n▶ 用例1：默认递归输出全部层级");
  const res = runTdoc(["tree", "tree-sandbox"]);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("首行为根目录名 tree-sandbox", res.stdout.startsWith("tree-sandbox"));
  for (const name of ["a.txt", "dir1", "dir2", "ignored", "b.txt", "c.txt", "d.txt", "e.txt"]) {
    check(`输出包含 ${name}`, res.stdout.includes(name));
  }
  check(
    "统计为 4 directories, 5 files",
    res.stdout.includes("4 directories, 5 files"),
    `实际末尾输出: ...${res.stdout.trimEnd().slice(-80)}`
  );
}

/**
 * 用例 2：-L 1 限制深度，只列出顶层
 */
function testLevel() {
  console.log("\n▶ 用例2：-L 1 只列出顶层");
  const res = runTdoc(["tree", "tree-sandbox", "-L", "1"]);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("包含顶层目录 dir1", res.stdout.includes("dir1"));
  check("包含顶层文件 a.txt", res.stdout.includes("a.txt"));
  check("不包含第二层文件 b.txt", !res.stdout.includes("b.txt"));
  check(
    "统计为 3 directories, 1 files",
    res.stdout.includes("3 directories, 1 files"),
    `实际末尾输出: ...${res.stdout.trimEnd().slice(-80)}`
  );
}

/**
 * 用例 3：-i 忽略指定目录
 * 注意：当前实现中 ignore 只对顶层生效（递归调用未透传 ignoreDirs）
 */
function testIgnore() {
  console.log("\n▶ 用例3：-i ignored 忽略顶层目录");
  const res = runTdoc(["tree", "tree-sandbox", "-i", "ignored"]);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("不包含顶层目录 ignored", !res.stdout.includes("ignored"));
  check("不包含其中的 e.txt", !res.stdout.includes("e.txt"));
  check("其余目录正常输出（含 b.txt）", res.stdout.includes("b.txt"));
  check(
    "统计为 3 directories, 4 files",
    res.stdout.includes("3 directories, 4 files"),
    `实际末尾输出: ...${res.stdout.trimEnd().slice(-80)}`
  );
}

/**
 * 用例 4：目录不存在时报错退出
 */
function testInvalidDir() {
  console.log("\n▶ 用例4：目录不存在时报错退出");
  const res = runTdoc(["tree", "tree-sandbox/not-exist"]);
  check("退出码非 0", res.status !== 0, `status=${res.status}`);
  const output = res.stdout + res.stderr;
  check("输出报错信息", output.includes("执行tree命令出错"), `实际输出: ${output.trim()}`);
}

/**
 * 主函数
 */
function main() {
  console.log("🧪 tdoc tree 命令测试开始");
  setup();
  testDefault();
  testLevel();
  testIgnore();
  testInvalidDir();

  console.log("\n──────────────────────────────");
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`📁 沙箱目录保留在: ${sandbox}（可手动检查）`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
