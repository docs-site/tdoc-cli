/**
 * 测试脚本：tdoc mist docs 命令功能测试
 * 测试所需的目录和文件均在本脚本内创建，每次运行前会重建沙箱目录
 * 运行：node test/test.mist-docs.js
 *
 * 覆盖场景：
 *   1. sdoc 目录模式：备份 src/sdoc 下所有 Office 文档（保持相对目录结构）
 *   2. 数字开头目录模式：无 sdoc 时备份 src 下数字开头（01.xxx / 01-xxx）目录
 *   3. 两种源都找不到时报错退出
 *   4. 重复执行：已备份的文件被覆盖，统计数量不变（幂等）
 *
 * 注意：必须始终使用 -b 指定沙箱内的备份目录，避免命令默认写入
 * %USERPROFILE%\OneDrive\sumu-docs 下的真实备份位置。
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// CLI 入口（bin 启动器最终加载 dist/index.js，等价于全局 tdoc 命令）
const CLI = path.join(__dirname, "..", "bin", "tdoc-cli.js");

// 测试沙箱目录
const testDir = path.join(__dirname, "test-mist-docs");

// 命令支持的备份扩展名（与 src/mist/cmd_docs.ts 的 TARGET_EXTENSIONS 对应）
const TARGET_EXTS = [".xmind", ".pptx", ".ppt", ".vsdx", ".docx", ".doc", ".xls", ".xlsx", ".excalidraw", ".drawio"];

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
  const res = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8", timeout: 60000 });
  const stripAnsi = (s) => s.replace(/\x1B\[[0-9;]*m/g, "");
  return {
    status: res.status,
    stdout: stripAnsi(res.stdout || ""),
    stderr: stripAnsi(res.stderr || "")
  };
}

/**
 * 在指定工程目录下创建文件（自动建父目录）
 */
function writeFile(base, rel, content = "test") {
  const full = path.join(base, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
}

/**
 * 用例 1/4：sdoc 目录模式备份 + 重复执行幂等
 */
function testSdocMode() {
  console.log("\n▶ 用例1：sdoc 目录模式备份");
  const proj = path.join(testDir, "proj-sdoc");
  const backup = path.join(testDir, "backup-sdoc");
  writeFile(proj, "src/sdoc/01-笔记/aaa.docx");
  writeFile(proj, "src/sdoc/01-笔记/bbb.pptx");
  writeFile(proj, "src/sdoc/01-笔记/notes.md"); // 非目标类型，不备份
  writeFile(proj, "src/sdoc/02-图纸/ccc.vsdx");
  writeFile(proj, "src/sdoc/02-图纸/deep/ddd.xmind"); // 深层嵌套
  writeFile(proj, "src/sdoc/02-图纸/eee.drawio");
  writeFile(proj, "src/sdoc/02-图纸/fff.excalidraw");
  writeFile(proj, "src/sdoc/02-图纸/ggg.xlsx");
  writeFile(proj, "src/sdoc/03-旧文档/old.doc");
  writeFile(proj, "other/hhh.doc"); // sdoc 之外，不备份

  const res = runTdoc(["mist", "docs", "-b", backup], proj);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("检测到 sdoc 目录", res.stdout.includes("检测到 sdoc 目录"));
  check("统计找到 8 个目标文件", res.stdout.includes("找到目标文件: 8 个"), res.stdout);
  check("统计成功备份 8 个", res.stdout.includes("成功备份文件: 8 个"));
  check("输出备份完成提示", res.stdout.includes("Office 文档备份完成"));

  // 相对目录结构应保持一致
  for (const rel of [
    "01-笔记/aaa.docx",
    "01-笔记/bbb.pptx",
    "02-图纸/ccc.vsdx",
    "02-图纸/deep/ddd.xmind",
    "02-图纸/eee.drawio",
    "02-图纸/fff.excalidraw",
    "02-图纸/ggg.xlsx",
    "03-旧文档/old.doc"
  ]) {
    check(`备份包含 ${rel}`, fs.existsSync(path.join(backup, rel)));
  }
  check("md 文件不备份", !fs.existsSync(path.join(backup, "01-笔记/notes.md")));
  check("sdoc 之外的文件不备份", !fs.existsSync(path.join(backup, "hhh.doc")));

  console.log("\n▶ 用例4：重复执行覆盖备份（幂等）");
  const res2 = runTdoc(["mist", "docs", "-b", backup], proj);
  check("退出码为 0", res2.status === 0, `status=${res2.status}`);
  check("覆盖后统计仍为 8 个", res2.stdout.includes("成功备份文件: 8 个"));
}

/**
 * 用例 2：数字开头目录模式（无 sdoc）
 */
function testNumberedDirsMode() {
  console.log("\n▶ 用例2：无 sdoc 时备份 src 下数字开头目录");
  const proj = path.join(testDir, "proj-numbered");
  const backup = path.join(testDir, "backup-numbered");
  writeFile(proj, "src/01-文档/aaa.docx");
  writeFile(proj, "src/02-素材/sub/bbb.pptx"); // 数字目录下的子目录
  writeFile(proj, "src/10-其他/ccc.xmind");
  writeFile(proj, "src/xx-非数字/ddd.doc"); // 非数字开头，不检测
  writeFile(proj, "README.md");

  const res = runTdoc(["mist", "docs", "-b", backup], proj);
  check("退出码为 0", res.status === 0, `status=${res.status}\n${res.stdout}${res.stderr}`);
  check("检测到 3 个数字开头目录", res.stdout.includes("检测到 3 个数字开头目录"), res.stdout);
  check("统计成功备份 3 个", res.stdout.includes("成功备份文件: 3 个"));

  // 以 src 为基础路径保留目录结构
  check("备份包含 01-文档/aaa.docx", fs.existsSync(path.join(backup, "01-文档/aaa.docx")));
  check("备份包含 02-素材/sub/bbb.pptx", fs.existsSync(path.join(backup, "02-素材/sub/bbb.pptx")));
  check("备份包含 10-其他/ccc.xmind", fs.existsSync(path.join(backup, "10-其他/ccc.xmind")));
  check("非数字开头目录不备份", !fs.existsSync(path.join(backup, "xx-非数字/ddd.doc")));
}

/**
 * 用例 3：既无 sdoc 也无数字开头目录
 */
function testNoSource() {
  console.log("\n▶ 用例3：无可用源目录时报错退出");
  const proj = path.join(testDir, "proj-empty");
  writeFile(proj, "src/普通目录/aaa.docx");
  writeFile(proj, "README.md");

  const res = runTdoc(["mist", "docs", "-b", path.join(testDir, "backup-empty")], proj);
  check("退出码非 0", res.status !== 0, `status=${res.status}`);
  check("输出报错信息", (res.stdout + res.stderr).includes("未找到 sdoc 目录"));
}

/**
 * 主函数
 */
function main() {
  console.log("🧪 tdoc mist docs 命令测试开始");
  fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });

  testSdocMode();
  testNumberedDirsMode();
  testNoSource();

  console.log("\n──────────────────────────────");
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`📁 沙箱目录保留在: ${testDir}（可手动检查）`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
