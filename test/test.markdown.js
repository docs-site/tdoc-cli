/**
 * 测试脚本：创建目录结构并生成 path-map.js 文件
 * 用于测试 tdoc m:m 命令在不同目录下的功能
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 解析命令行参数
const args = process.argv.slice(2);
const testType = args[0] || "src"; // 默认测试 src 目录

// 定义测试目录路径
const testDir = path.join(__dirname, "test-markdown");
const srcDir = path.join(testDir, "src");
const sdocDir = path.join(testDir, "sdoc");

// 根据测试类型设置配置
const testConfig =
  testType === "sdoc"
    ? {
        baseDir: sdocDir,
        generateMapCmd: "node ../../bin/tdoc-cli.js m:m -d sdoc",
        generateDocBasePath: "sdoc"
      }
    : {
        baseDir: srcDir,
        generateMapCmd: "node ../../bin/tdoc-cli.js m:m -d src",
        generateDocBasePath: "src"
      };

// 创建子目录配置
const dirConfig = [
  { path: "00.example", map: "example" },
  { path: "10.开发", map: "dev" },
  { path: "00.example/01.测试", map: "test" },
  { path: "00.example/10.配置", map: "config" }
];

/**
 * 创建测试目录结构
 */
function createTestDirectories() {
  console.log(`📁 创建${testType}测试目录结构...`);

  // 创建测试根目录
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // 创建基础目录
  if (!fs.existsSync(testConfig.baseDir)) {
    fs.mkdirSync(testConfig.baseDir, { recursive: true });
  }

  // 创建子目录
  dirConfig.forEach((dir) => {
    const fullPath = path.join(testConfig.baseDir, dir.path);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 已创建目录: ${dir.path}`);
    }
  });

  console.log("✅ 目录结构创建完成");
}

/**
 * 生成 path-map.js 文件
 */
function generatePathMap() {
  console.log("🔄 生成 path-map.js 文件...");
  try {
    // 使用 execSync 运行命令，设置 cwd 为测试目录
    execSync(testConfig.generateMapCmd, {
      cwd: testDir,
      stdio: "inherit"
    });
    console.log("✅ path-map.js 文件生成完成");
  } catch (error) {
    console.error("❌ 生成 path-map.js 文件时出错:", error.message);
    process.exit(1);
  }
}

/**
 * 修改 path-map.js 文件，更新映射值
 */
function updatePathMap() {
  console.log("🔄 修改 path-map.js 文件...");
  try {
    const pathMapPath = path.join(testConfig.baseDir, "path-map.js");
    let pathMapContent = fs.readFileSync(pathMapPath, "utf8");

    // 将映射值更新为 dirConfig 数组中的值
    dirConfig.forEach((dir) => {
      const dirName = path.basename(dir.path);
      const mappedValue = dir.map || "default";
      const regex = new RegExp(`"${dirName}":\\s*"[^"]*"`, "g");
      pathMapContent = pathMapContent.replace(regex, `"${dirName}": "${mappedValue}"`);
    });

    // 写入修改后的内容
    fs.writeFileSync(pathMapPath, pathMapContent, "utf8");
    console.log("✅ path-map.js 文件修改完成");
  } catch (error) {
    console.error("❌ 修改 path-map.js 文件时出错:", error.message);
  }
}

/**
 * 在每个目录中生成文档
 */
function generateDocsInDirs() {
  console.log("📄 在每个目录中生成文档...");

  dirConfig.forEach((dir) => {
    const dirPath = path.join(testConfig.generateDocBasePath, dir.path);
    console.log(`📁 在目录中生成文档: ${dirPath}`);

    try {
      // 创建 index 文档
      console.log("  📄 创建 index 文档...");
      execSync(`node ../../bin/tdoc-cli.js m:n -m -d ${dirPath} index`, {
        cwd: testDir,
        stdio: "inherit"
      });

      // 创建 LV001 文档
      console.log("  📄 创建 LV001 文档...");
      execSync(`node ../../bin/tdoc-cli.js m:n -m -d ${dirPath} LV001`, {
        cwd: testDir,
        stdio: "inherit"
      });

      console.log(`  ✅ 文档生成完成: ${dirPath}`);
    } catch (error) {
      console.error(`  ❌ 在目录中生成文档时出错: ${dirPath}`, error.message);
    }
  });
}

/**
 * 在每个目录中创建空白文档
 */
function createBlankDocsInDirs() {
  console.log("📄 在每个目录中创建空白文档...");

  dirConfig.forEach((dir) => {
    const dirPath = path.join(testConfig.baseDir, dir.path);

    // 创建指定名称的空白文档
    const blankDocs = ["LV100-add.md", "LV101-add.md"];
    blankDocs.forEach((doc) => {
      const docPath = path.join(dirPath, doc);
      if (!fs.existsSync(docPath)) {
        // 创建只包含文档名称的空白文档
        fs.writeFileSync(docPath, `# ${path.parse(doc).name}\n\n这是空白文档 ${doc} 的内容。`, "utf8");
        console.log(`  📄 已创建空白文档: ${docPath}`);
      }
    });
  });

  console.log("✅ 空白文档创建完成");
}

/**
 * 使用 tdoc m:a -d 命令为现有文档添加 frontmatter
 */
function addFrontmatterToDocs() {
  console.log("🔄 为现有文档添加 frontmatter...");

  // 为每个目录分别执行命令
  dirConfig.forEach((dir) => {
    const dirPath = path.join(testConfig.generateDocBasePath, dir.path);
    console.log(`  📁 为目录添加 frontmatter: ${dirPath}`);

    try {
      // 使用 execSync 运行命令，设置 cwd 为测试目录
      const addFrontmatterCmd = `node ../../bin/tdoc-cli.js m:a -m -d ${dirPath}`;
      execSync(addFrontmatterCmd, {
        cwd: testDir,
        stdio: "inherit"
      });
      console.log(`  ✅ frontmatter 添加完成: ${dirPath}`);
    } catch (error) {
      console.error(`  ❌ 为目录添加 frontmatter 时出错: ${dirPath}`, error.message);
    }
  });

  console.log("✅ 所有目录的 frontmatter 添加完成");
}

/**
 * 主函数
 */
function main() {
  // 创建测试目录结构
  createTestDirectories();

  // 生成 path-map.js 文件
  generatePathMap();

  // 修改 path-map.js 文件
  updatePathMap();

  // 在每个目录中生成文档
  generateDocsInDirs();

  // 在每个目录中创建空白文档
  createBlankDocsInDirs();

  // 为现有文档添加 frontmatter
  addFrontmatterToDocs();

  console.log("🎉 测试脚本执行完成");
}

// 执行主函数
main();
