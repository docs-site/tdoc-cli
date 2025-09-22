// 导入必要的模块
import { input, confirm, select } from "@inquirer/prompts";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { Command } from "commander";

// 定义默认依赖项
const devDependencies: string[] = ["@types/node"];
const dependencies: string[] = [];

// 获取依赖的最新版本
function getLatestVersion(dependency: string): string {
  try {
    // 使用npm view命令获取依赖的最新版本
    const version = execSync(`npm view ${dependency} version`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"]
    }).trim();
    return `^${version}`;
  } catch {
    // 如果获取失败，使用latest
    console.warn(`Failed to get latest version for ${dependency}, using 'latest'`);
    return "latest";
  }
}

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
  installHusky: boolean;
  installCommitizen: boolean;
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
  const name = yes
    ? dirName
      ? path.basename(dirName)
      : "my-project"
    : await input({
        message: "Project name:",
        default:
          dirName && scope ? `@${scope}/${path.basename(dirName)}` : dirName ? path.basename(dirName) : undefined,
        validate: (input: string) => input.trim() !== "" || "Project name is required"
      });

  const description = yes
    ? ""
    : await input({
        message: "Project description:",
        default: ""
      });

  const author = yes
    ? ""
    : await input({
        message: "Author:",
        default: ""
      });

  const license = yes
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
      });

  const initGit = yes
    ? true
    : await confirm({
        message: "Initialize git repository?",
        default: true
      });

  const installCommitizen =
    yes || !initGit
      ? false
      : await confirm({
          message: "Install commitizen with cz-git for conventional commits?",
          default: true
        });

  const installHusky =
    yes || !initGit
      ? false
      : await confirm({
          message: "Install husky for git hooks?",
          default: true
        });

  const addWorkflow = yes
    ? true
    : await confirm({
        message: "Add GitHub Actions workflow for auto-publish?",
        default: true
      });

  const addEditorConfig = yes
    ? true
    : await confirm({
        message: "Add .editorconfig configuration file?",
        default: true
      });

  const addVscodeConfig = yes
    ? true
    : await confirm({
        message: "Add .vscode project configuration?",
        default: true
      });

  const addPrettierConfig = yes
    ? true
    : await confirm({
        message: "Add Prettier configuration (will install prettier package)?",
        default: true
      });

  const installDeps = yes ? false : true; // 默认为true，后续会根据confirmDependencies的结果更新

  const answers = {
    name,
    description,
    author,
    license,
    initGit,
    installHusky,
    addWorkflow,
    addEditorConfig,
    addVscodeConfig,
    addPrettierConfig,
    installDeps,
    installCommitizen
  };

  // 确认依赖安装选择
  if (!yes) {
    answers.installDeps = await confirmDependencies(answers);
  }

  return answers;
}

/**
 * @brief 确认依赖安装选择
 * @param {UserConfig} answers - 用户配置对象
 * @returns {Promise<boolean>} 用户是否选择安装依赖
 */
async function confirmDependencies(answers: UserConfig) {
  // 准备要安装的依赖列表
  const installDevDeps = [...devDependencies]; // 开发依赖
  const installDeps = [...dependencies]; // 生产依赖

  // 添加commitizen相关依赖
  if (answers.installCommitizen) {
    installDevDeps.push("commitizen", "cz-git", "@commitlint/config-conventional");
  }

  console.log("\nWill install the following dependencies:");
  console.log(`  devDependencies: ${installDevDeps.join(", ")}`);
  console.log(`  dependencies: ${installDeps.join(", ") || "none"}`);
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

  // 拷贝commitlint.config.js文件
  if (answers.installCommitizen) {
    const commitlintConfigPath = path.join(__dirname, "../../commitlint.config.js");
    if (fs.existsSync(commitlintConfigPath)) {
      fs.copyFileSync(commitlintConfigPath, path.join(projectDir, "commitlint.config.js"));
      console.log("✅ commitlint.config.js copied");
    }
  }
}

/**
 * @brief 创建package.json文件
 * @param {string} projectDir - 项目目录路径
 * @param {Object} answers - 用户配置对象
 * @param {string} [scope] - 可选的npm包作用域
 */
function createPackageJson(projectDir: string, answers: UserConfig, scope?: string) {
  // 从npm-template/package-template.json读取模板
  const templatePath = path.join(__dirname, "../../npm-template/package-template.json");
  const packageJson = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  // 处理包名：如果有作用域则添加作用域前缀
  packageJson.name = scope
    ? `@${scope}/${answers.name.toLowerCase().replace(/\s+/g, "-")}`
    : answers.name.toLowerCase().replace(/\s+/g, "-");

  // 替换其他字段
  packageJson.description = answers.description;
  packageJson.author = answers.author;
  packageJson.license = answers.license;

  // 添加commitizen配置
  if (answers.installCommitizen) {
    packageJson.config = {
      commitizen: {
        path: "node_modules/cz-git"
      }
    };

    // 添加cz脚本命令
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts.cz = "git add . && git-cz";
  }

  // 添加commitizen配置
  if (answers.installCommitizen) {
    packageJson.config = {
      commitizen: {
        path: "node_modules/cz-git"
      }
    };

    // 添加cz脚本命令
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts.cz = "git add . && git-cz";
  }

  // 将package.json写入文件，使用2个空格缩进
  fs.writeFileSync(path.join(projectDir, "package.json"), JSON.stringify(packageJson, null, 2));
}

/**
 * @brief 更新package.json文件，添加依赖信息
 * @param {string} projectDir - 项目目录路径
 * @param {UserConfig} answers - 用户配置对象
 */
function updatePackageJsonWithDependencies(projectDir: string, answers: UserConfig) {
  // 读取现有的package.json文件
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // 准备要安装的依赖列表
  const installDevDeps: Record<string, string> = {}; // 开发依赖
  const installDeps: Record<string, string> = {}; // 生产依赖

  // 添加基本依赖
  devDependencies.forEach((dep) => {
    installDevDeps[dep] = getLatestVersion(dep);
  });
  dependencies.forEach((dep) => {
    installDeps[dep] = getLatestVersion(dep);
  });

  // 添加commitizen相关依赖
  if (answers.installCommitizen) {
    installDevDeps["commitizen"] = getLatestVersion("commitizen");
    installDevDeps["cz-git"] = getLatestVersion("cz-git");
    installDevDeps["@commitlint/config-conventional"] = getLatestVersion("@commitlint/config-conventional");
  }

  // 添加Prettier依赖
  if (answers.addPrettierConfig) {
    installDevDeps["prettier"] = getLatestVersion("prettier");
  }

  // 添加依赖到package.json
  if (Object.keys(installDevDeps).length > 0) {
    packageJson.devDependencies = installDevDeps;
  }
  if (Object.keys(installDeps).length > 0) {
    packageJson.dependencies = installDeps;
  }

  // 将更新后的package.json写入文件
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * @brief 安装项目依赖
 * @param {string} projectDir - 项目目录路径
 * @throws 如果npm安装失败会抛出错误
 */
function installDependencies(projectDir: string) {
  try {
    console.log("Installing dependencies...");
    // 直接执行npm install安装所有依赖
    execSync("npm install", {
      stdio: "inherit",
      cwd: projectDir
    });
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

  // 安装husky
  if (answers.installHusky && answers.initGit) {
    try {
      console.log("Installing husky...");
      execSync("npx husky-init", { stdio: "inherit" });
      console.log("✅ Husky installed successfully!");
    } catch (err) {
      console.error("Failed to install husky:", err);
    }
  }

  // 更新package.json文件，添加依赖信息
  console.log("Adding dependencies to package.json...");
  updatePackageJsonWithDependencies(projectDir, answers);

  // 安装依赖
  if (answers.installDeps) {
    installDependencies(projectDir);
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
