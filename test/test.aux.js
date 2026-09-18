/**
 * 汇总测试入口：依次运行辅助工具的全部测试脚本并汇总结果
 * 运行：node test/test.aux.js
 *
 * 当前覆盖的辅助工具命令：
 *   - tree          （test.tree.js）
 *   - img           （test.img.js）
 *   - sidebar       （test.sidebar.js）
 *   - git-submodule （test.git-submodule.js）
 */

const path = require("path");
const { spawnSync } = require("child_process");

// 各命令对应的测试脚本
const suites = ["test.tree.js", "test.img.js", "test.sidebar.js", "test.git-submodule.js"];

console.log("🧪 tdoc 辅助工具命令测试（tree / img / sidebar / git-submodule）\n");

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
