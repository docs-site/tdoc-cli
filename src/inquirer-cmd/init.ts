// 导入必要的模块
import { input, confirm, select } from "@inquirer/prompts";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { Command } from "commander";

// 定义默认依赖项
const devDependencies: string[] = ["@types/node"];
const dependencies: string[] = [];

// 定义用户配置接口
interface UserConfig {
  name: string;
  description: string;
  author: string;
  license: string;
  initGit: boolean;
  addWorkflow: boolean;
  addEditorConfig: boolean;
  addVscodeConfig: boolean;
  addPrettierConfig: boolean;
  installDeps: boolean;
}

/**
 * @brief 创建并验证项目目录结构
 * @param {string} [dirName] - 可选的项目目录名
 * @returns {string} 项目绝对路径
 * @throws 如果目录已存在且不为空则退出进程
 */
function createProjectDir(dirName?: string): string {
  // 解析项目绝对路径，如果没有指定目录名则使用当前目录
  const projectDir = path.resolve(dirName || "");

  // 检查目录是否已存在
  if (fs.existsSync(projectDir)) {
    // 如果目录存在，检查是否为空
    const files = fs.readdirSync(projectDir);
    if (files.length > 0) {
      // 目录不为空，报错并退出
      console.error(`❌ 目录 ${projectDir} 已存在且不为空`);
      process.exit(1);
    }
  } else {
    // 目录不存在，递归创建目录
    fs.mkdirSync(projectDir, { recursive: true });
  }

  return projectDir;
}

/**
 * @brief 收集用户项目配置输入
 * @param {string} [dirName] - 可选的项目目录名
 * @param {boolean} [yes=false] - 是否自动使用默认值
 * @param {string} [scope] - 可选的npm包作用域
 * @returns {Promise<Object>} 包含用户配置的对象
 */
async function collectUserInput(dirName?: string, yes = false, scope?: string) {
  // 自动模式使用默认值，否则通过交互式提示获取用户输入
  return {
    // 项目名称处理逻辑：
    // - 自动模式：使用目录名或默认值'my-project'，考虑作用域
    // - 交互模式：提示用户输入，并验证非空
    name: yes
      ? dirName
        ? path.basename(dirName)
        : "my-project"
      : await input({
          message: "Project name:",
          default:
            dirName && scope ? `@${scope}/${path.basename(dirName)}` : dirName ? path.basename(dirName) : undefined,
          validate: (input: string) => input.trim() !== "" || "Project name is required"
        }),
    description: yes
      ? ""
      : await input({
          message: "Project description:",
          default: ""
        }),
    author: yes
      ? ""
      : await input({
          message: "Author:",
          default: ""
        }),
    license: yes
      ? "MIT"
      : await select({
          message: "License:",
          choices: [
            { value: "MIT" },
            { value: "Apache-2.0" },
            { value: "GPL-3.0" },
            { value: "ISC" },
            { value: "Unlicense" }
          ],
          default: "MIT"
        }),
    initGit: yes
      ? true
      : await confirm({
          message: "Initialize git repository?",
          default: true
        }),
    addWorkflow: yes
      ? true
      : await confirm({
          message: "Add GitHub Actions workflow for auto-publish?",
          default: true
        }),
    addEditorConfig: yes
      ? true
      : await confirm({
          message: "Add .editorconfig configuration file?",
          default: true
        }),
    addVscodeConfig: yes
      ? true
      : await confirm({
          message: "Add .vscode project configuration?",
          default: true
        }),
    addPrettierConfig: yes
      ? true
      : await confirm({
          message: "Add Prettier configuration (will install prettier package)?",
          default: true
        }),
    installDeps: yes ? false : await confirmDependencies()
  };
}

/**
 * @brief 确认依赖安装选择
 * @returns {Promise<boolean>} 用户是否选择安装依赖
 */
async function confirmDependencies() {
  const showDevDeps = [...devDependencies];
  const showDeps = [...dependencies];

  console.log("\nWill install the following basic common dependencies:");
  console.log(`  devDependencies: ${showDevDeps.join(", ")}`);
  console.log(`  dependencies: ${showDeps.join(", ") || "none"}`);
  console.log();
  return await confirm({
    message: "Install dependencies automatically?",
    default: false
  });
}

/**
 * @brief 初始化Git仓库并配置
 * @param {string} projectDir - 项目目录路径
 * @param {boolean} addWorkflow - 是否添加GitHub工作流
 * @throws 如果git初始化失败会抛出错误
 */
function initGitRepo(projectDir: string, addWorkflow: boolean) {
  try {
    // 初始化Git仓库，使用pipe模式隐藏git命令输出
    execSync("git init", { stdio: "pipe" });
    console.log("✅ Git repository initialized");

    // 创建.gitignore文件，忽略常见不需要版本控制的文件
    fs.writeFileSync(path.join(projectDir, ".gitignore"), "node_modules/\n.DS_Store\n.env\n");

    // 如果需要添加GitHub工作流
    if (addWorkflow) {
      const workflowsDir = path.join(__dirname, "../../.github/workflows");
      if (fs.existsSync(workflowsDir)) {
        // 创建工作流目录并复制模板文件
        const destDir = path.join(projectDir, ".github/workflows");
        fs.ensureDirSync(destDir);
        fs.copySync(workflowsDir, destDir);
        console.log("✅ GitHub Actions workflow files copied");
      } else {
        console.log("ℹ️ No workflow files found in .github/workflows");
      }
    }
  } catch (err) {
    console.error("Failed to initialize git repository:", err);
  }
}

/**
 * @brief 复制各种项目模板文件
 * @param {string} projectDir - 项目目录路径
 * @param {Object} answers - 用户配置对象
 */
function copyTemplateFiles(projectDir: string, answers: UserConfig) {
  // 处理README文件：
  // 1. 尝试从模板目录读取README模板
  const readmeTemplatePath = path.join(__dirname, "../../npm-template/README.md");
  if (fs.existsSync(readmeTemplatePath)) {
    // 读取模板内容并替换占位符
    let readmeContent = fs.readFileSync(readmeTemplatePath, "utf8");
    readmeContent = readmeContent.replace(/\{\{\s*title\s*\}\}/g, answers.name);
    fs.writeFileSync(path.join(projectDir, "README.md"), readmeContent);
  } else {
    // 模板不存在时创建基础README
    fs.writeFileSync(
      path.join(projectDir, "README.md"),
      `# ${answers.name}\n\n${answers.description || "Project description"}`
    );
  }

  // 复制.editorconfig
  if (answers.addEditorConfig) {
    const editorConfigPath = path.join(__dirname, "../../.editorconfig");
    if (fs.existsSync(editorConfigPath)) {
      fs.copyFileSync(editorConfigPath, path.join(projectDir, ".editorconfig"));
      console.log("✅ .editorconfig copied");
    }
  }

  // 复制.vscode配置
  if (answers.addVscodeConfig) {
    const vscodePath = path.join(__dirname, "../../.vscode");
    if (fs.existsSync(vscodePath)) {
      fs.copySync(vscodePath, path.join(projectDir, ".vscode"));
      console.log("✅ .vscode configuration copied");
    }
  }

  // 复制Prettier配置
  if (answers.addPrettierConfig) {
    const prettierRcPath = path.join(__dirname, "../../.prettierrc");
    const prettierIgnorePath = path.join(__dirname, "../../.prettierignore");

    if (fs.existsSync(prettierRcPath)) {
      fs.copyFileSync(prettierRcPath, path.join(projectDir, ".prettierrc"));
      console.log("✅ .prettierrc copied");
    }
    if (fs.existsSync(prettierIgnorePath)) {
      fs.copyFileSync(prettierIgnorePath, path.join(projectDir, ".prettierignore"));
      console.log("✅ .prettierignore copied");
    }
    devDependencies.push("prettier");
  }
}

/**
 * @brief 创建package.json文件
 * @param {string} projectDir - 项目目录路径
 * @param {Object} answers - 用户配置对象
 * @param {string} [scope] - 可选的npm包作用域
 */
function createPackageJson(projectDir: string, answers: UserConfig, scope?: string) {
  // 构建package.json内容
  const packageJson = {
    // 处理包名：如果有作用域则添加作用域前缀
    name: scope
      ? `@${scope}/${answers.name.toLowerCase().replace(/\s+/g, "-")}`
      : answers.name.toLowerCase().replace(/\s+/g, "-"),
    version: "1.0.0", // 默认版本号
    description: answers.description,
    main: "index.js", // 默认入口文件
    scripts: {
      test: 'echo "Error: no test specified" && exit 1', // 默认测试脚本
      // 如果配置了Prettier，添加格式化脚本
      ...(answers.addPrettierConfig
        ? {
            "format:check": "prettier . --check",
            "format:fix": "prettier . --write"
          }
        : {})
    },
    author: answers.author,
    license: answers.license
  };

  // 将package.json写入文件，使用2个空格缩进
  fs.writeFileSync(path.join(projectDir, "package.json"), JSON.stringify(packageJson, null, 2));
}

/**
 * @brief 安装项目依赖
 * @param {string} projectDir - 项目目录路径
 * @throws 如果npm安装失败会抛出错误
 */
function installDependencies() {
  try {
    console.log("Installing dependencies...");

    // 准备要安装的依赖列表
    const installDevDeps = [...devDependencies]; // 开发依赖
    const installDeps = [...dependencies]; // 生产依赖

    // 安装开发依赖
    if (installDevDeps.length) {
      console.log(`  devDependencies: ${installDevDeps.join(", ")}`);
      // 使用npm install -D安装开发依赖
      execSync(`npm install ${installDevDeps.join(" ")} -D`, {
        stdio: "inherit"
      });
    }

    // 安装生产依赖
    if (installDeps.length) {
      console.log(`  dependencies: ${installDeps.join(", ")}`);
      // 使用npm install安装生产依赖
      execSync(`npm install ${installDeps.join(" ")}`, { stdio: "inherit" });
    }
  } catch (err) {
    console.error("Failed to install dependencies:", err);
  }
}

/**
 * @brief 项目初始化主命令
 * @param {string} [dirName] - 可选的项目目录名
 * @param {boolean} [skipPrompts=false] - 是否跳过交互式提示
 * @param {boolean} [yes=false] - 是否自动选择默认值
 * @param {string} [scope] - 可选的npm包作用域
 * @returns {Promise<void>}
 */
export async function cmdInit(dirName?: string, skipPrompts = false, yes = false, scope?: string) {
  console.log("Welcome to tdoc project initialization\n");

  // 创建项目目录
  const projectDir = createProjectDir(dirName);

  // 收集用户输入
  const answers = await collectUserInput(dirName, yes || skipPrompts, scope);

  // 切换到项目目录
  process.chdir(projectDir);

  // 初始化Git仓库
  if (answers.initGit) {
    initGitRepo(projectDir, answers.addWorkflow);
  }

  // 复制模板文件
  copyTemplateFiles(projectDir, answers);

  // 创建package.json
  createPackageJson(projectDir, answers, scope);

  // 安装依赖
  if (answers.installDeps) {
    installDependencies();
  }

  console.log(`\n✅ Project ${answers.name} initialized successfully!`);
  console.log(`++++++++++ cd ${answers.name} to get started. ++++++++++`);
}

/**
 * @brief 创建初始化项目命令
 * @return {Command} 配置好的Command实例
 */
function createInitCommand(): Command {
  const program = new Command("init")
    .description("Initialize a new tdoc project")
    .argument("[dirName]", "项目目录名")
    .option("-y, --yes", "Skip prompts and use default values")
    .option("--scope <scope>", "Set npm package scope (e.g. myorg)")
    .action(async (dirName: string | undefined, options: { yes?: boolean; scope?: string }) => {
      try {
        await cmdInit(dirName, false, options.yes, options.scope);
      } catch (err) {
        console.error("❌ 初始化项目失败:", (err as Error).message);
        process.exit(1);
      }
    });

  return program;
}

export default createInitCommand;
