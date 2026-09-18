/**
 * 测试脚本：tdoc img 命令功能测试
 * 测试所需的目录、文件和 git 仓库均在本脚本内创建，每次运行前会重建沙箱目录
 * 运行：node test/test.img.js
 *
 * 覆盖场景：
 *   1. 单文件默认模式：相对图片路径添加 ./ 前缀（markdown 语法 + HTML img 标签）
 *   2. --debug 模式输出处理统计
 *   3. 单文件 -t 转换模式：相对路径转换为 OSS 绝对 URL（需要 git 仓库）
 *   4. 目录模式 -d：只处理 git 修改/新增的、位于目标目录直属层级的 .md 文件
 *   5. 目录模式 -d -a：递归处理子目录中的文件
 *   6. 无参数 / 文件不存在时的报错退出
 *
 * 说明：文档中只会出现 http 链接和相对路径两种图片引用，不覆盖本地绝对路径场景。
 */

const fs = require("fs");
const path = require("path");
const { spawnSync, execSync } = require("child_process");

// CLI 入口（bin 启动器最终加载 dist/index.js，等价于全局 tdoc 命令）
const CLI = path.join(__dirname, "..", "bin", "tdoc-cli.js");

// 测试沙箱目录
const testDir = path.join(__dirname, "test-img");
const singleDir = path.join(testDir, "single"); // 单文件模式（无需 git）
const ossRepoDir = path.join(testDir, "oss-repo"); // git 仓库沙箱（-t 转换模式）
const statusRepoDir = path.join(testDir, "img-repo"); // git 仓库沙箱（-d 目录模式）

const OSS_BASE = "https://fanhua-picture.oss-cn-hangzhou.aliyuncs.com/";

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
 * 在沙箱中初始化一个 git 仓库，写入初始文件并提交
 * @param {string} repo 仓库目录
 * @param {Object<string, string>} initialFiles 相对路径 -> 内容，至少一个文件
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
 * 用例 1：单文件默认模式
 */
function testSingleFile() {
  console.log("\n▶ 用例1：单文件默认模式（相对路径加 ./ 前缀）");
  const mdPath = path.join(singleDir, "single.md");
  fs.mkdirSync(singleDir, { recursive: true });
  // 故意不带末尾换行，验证处理后会补上
  fs.writeFileSync(
    mdPath,
    [
      "# 标题",
      "![rel](pic.png)",
      "![dot](./dot.png)",
      "![http](https://example.com/a.png)",
      "![nested](sub/dir/pic.png)",
      '<img src="html.png">',
      '<img src="https://example.com/b.png">',
      '<img src="h.png" class="x">'
    ].join("\n"),
    "utf8"
  );

  const res = runTdoc(["img", "single.md"], singleDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("输出处理完成提示", res.stdout.includes("图片路径处理完成"));

  const out = fs.readFileSync(mdPath, "utf8");
  check("相对路径加 ./ 前缀", out.includes("![rel](./pic.png)"));
  check("嵌套相对路径加 ./ 前缀", out.includes("![nested](./sub/dir/pic.png)"));
  check("./ 开头的路径不重复添加", out.includes("![dot](./dot.png)"));
  check("http 图片不处理", out.includes("![http](https://example.com/a.png)"));
  check("HTML 相对 src 加 ./ 前缀", out.includes('<img src="./html.png">'));
  check("HTML 带属性的标签正常处理", out.includes('<img src="./h.png" class="x">'));
  check("HTML http src 不处理", out.includes('<img src="https://example.com/b.png">'));
  check("文件末尾补了换行", out.endsWith("\n"));
}

/**
 * 用例 2：--debug 输出统计信息
 */
function testDebug() {
  console.log("\n▶ 用例2：--debug 输出处理统计");
  const mdPath = path.join(singleDir, "debug.md");
  fs.writeFileSync(mdPath, "![a](a.png)\n![b](b.png)\n", "utf8");

  const res = runTdoc(["img", "debug.md", "--debug"], singleDir);
  check("退出码为 0", res.status === 0, `status=${res.status}`);
  check("输出检测统计", res.stdout.includes("共检测到 2 个图片链接"), res.stdout);
  check("输出优化统计", res.stdout.includes("优化了 2 个相对路径"), res.stdout);
}

/**
 * 用例 3：单文件 -t 转换为 OSS 绝对路径（需要 git 仓库）
 */
function testTransform() {
  console.log("\n▶ 用例3：-t 转换为 OSS 绝对路径");
  initGitRepo(ossRepoDir, {
    "docs/t.md": ["![rel](imgs/pic1.png)", "![dot](./imgs/dot.png)", "![http](https://example.com/a.png)"].join(
      "\n"
    )
  });
  const mdPath = path.join(ossRepoDir, "docs", "t.md");

  const res = runTdoc(["img", "docs/t.md", "-t"], ossRepoDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);

  const out = fs.readFileSync(mdPath, "utf8");
  check("相对路径转为 OSS URL", out.includes(`${OSS_BASE}oss-repo/docs/imgs/pic1.png`), out);
  check("./ 开头路径转换时去掉 ./", out.includes(`${OSS_BASE}oss-repo/docs/imgs/dot.png`));
  check("http 图片保持不变", out.includes("![http](https://example.com/a.png)"));
}

/**
 * 用例 4/5：目录模式 -d 与递归 -a
 * git 状态设计：
 *   docs/base.md     已提交、无改动 → 不处理
 *   docs/mod.md      已提交、后被修改 → 处理
 *   docs/new2.md     未跟踪新文件 → 处理
 *   docs/sub/nested.md 已提交、后被修改 → 仅 -a 递归时处理
 *   new1.md          仓库根下的未跟踪文件 → 不属于 docs，不处理
 */
function testDirectoryMode() {
  console.log("\n▶ 用例4：目录模式 -d（只处理目标目录直属的改动文件）");
  initGitRepo(statusRepoDir, {
    "docs/base.md": "# base\n![base](base.png)\n",
    "docs/mod.md": "# mod\n![mod](mod.png)\n",
    "docs/sub/nested.md": "# nested\n![nested](nested.png)\n"
  });
  // 提交后再制造改动和新增
  fs.writeFileSync(path.join(statusRepoDir, "docs", "mod.md"), "# mod 改动\n![mod](mod.png)\n", "utf8");
  fs.writeFileSync(path.join(statusRepoDir, "docs", "sub", "nested.md"), "# nested 改动\n![nested](nested.png)\n", "utf8");
  fs.writeFileSync(path.join(statusRepoDir, "docs", "new2.md"), "# new2\n![new](new.png)\n", "utf8");
  fs.writeFileSync(path.join(statusRepoDir, "new1.md"), "# new1\n![new1](new1.png)\n", "utf8");

  let res = runTdoc(["img", "-d", "docs"], statusRepoDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("待处理列表包含 new2.md", res.stdout.includes("new2.md"), res.stdout);
  check("待处理列表包含 mod.md", res.stdout.includes("mod.md"));

  check("修改过的 mod.md 被处理", fs.readFileSync(path.join(statusRepoDir, "docs", "mod.md"), "utf8").includes("./mod.png"));
  check("新增的 new2.md 被处理", fs.readFileSync(path.join(statusRepoDir, "docs", "new2.md"), "utf8").includes("./new.png"));
  check(
    "无改动的 base.md 不被处理",
    fs.readFileSync(path.join(statusRepoDir, "docs", "base.md"), "utf8").includes("![base](base.png)")
  );
  check(
    "根目录的 new1.md 不被处理",
    fs.readFileSync(path.join(statusRepoDir, "new1.md"), "utf8").includes("![new1](new1.png)")
  );

  console.log("\n▶ 用例5：-d -a 递归处理子目录");
  res = runTdoc(["img", "-d", "docs", "-a"], statusRepoDir);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check(
    "子目录的 nested.md 被递归处理",
    fs.readFileSync(path.join(statusRepoDir, "docs", "sub", "nested.md"), "utf8").includes("./nested.png")
  );
  check(
    "已处理过的 mod.md 不被二次修改（幂等）",
    fs.readFileSync(path.join(statusRepoDir, "docs", "mod.md"), "utf8").includes("![mod](./mod.png)")
  );
}

/**
 * 用例 6：异常参数
 */
function testInvalidArgs() {
  console.log("\n▶ 用例6：异常参数报错退出");
  let res = runTdoc(["img"], testDir);
  check("无参数时退出码非 0", res.status !== 0, `status=${res.status}`);
  check("无参数时输出提示", (res.stdout + res.stderr).includes("请提供文件路径或目录路径"));

  res = runTdoc(["img", "not-exist.md"], singleDir);
  check("文件不存在时退出码非 0", res.status !== 0, `status=${res.status}`);
}

/**
 * 主函数
 */
function main() {
  console.log("🧪 tdoc img 命令测试开始");
  // 每次运行前重建沙箱（img-repo 会被多个用例共用，按顺序创建）
  fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(singleDir, { recursive: true });

  testSingleFile();
  testDebug();
  testTransform(); // 内部自建 oss-repo 仓库
  testDirectoryMode(); // 内部自建 img-repo 仓库
  testInvalidArgs();

  console.log("\n──────────────────────────────");
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`📁 沙箱目录保留在: ${testDir}（可手动检查）`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
