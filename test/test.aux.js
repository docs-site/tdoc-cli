/**
 * 汇总测试入口：依次运行全部测试脚本并汇总结果
 * 运行：node test/test.aux.js
 *
 * 覆盖的命令：
 *   辅助工具：
 *   - tree          （test.tree.js）
 *   - img           （test.img.js）
 *   - sidebar       （test.sidebar.js）
 *   - git-submodule （test.git-submodule.js）
 *   站点与项目初始化：
 *   - init          （test.init.js，离线）
 *   - mist docs     （test.mist-docs.js，离线）
 *   - mist init     （test.mist-init.js，需要网络克隆模板，不可用时自动跳过）
 */

const path = require("path");
const { spawnSync } = require("child_process");

// 各命令对应的测试脚本
const suites = [
  "test.tree.js",
  "test.img.js",
  "test.sidebar.js",
  "test.git-submodule.js",
  "test.init.js",
  "test.mist-docs.js",
  "test.mist-init.js"
];

console.log("🧪 tdoc 命令测试（辅助工具 + 站点与项目初始化）\n");

const failedSuites = [];

for (const suite of suites) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`📦 运行测试套件: ${suite}`);
  console.log("=".repeat(50));

  const res = spawnSync(process.execPath, [path.join(__dirname, suite)], {
    stdio: "inherit",
    encoding: "utf8"
  });

  if (res.status !== 0) {
    failedSuites.push(suite);
  }
}

console.log(`\n${"=".repeat(50)}`);
if (failedSuites.length > 0) {
  console.log(`❌ 有 ${failedSuites.length} 个测试套件失败: ${failedSuites.join(", ")}`);
  process.exit(1);
} else {
  console.log(`🎉 全部 ${suites.length} 个测试套件通过`);
  process.exit(0);
}
