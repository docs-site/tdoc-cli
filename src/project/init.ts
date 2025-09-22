import { input, confirm, select } from "@inquirer/prompts";
import { Command } from "commander";
import path from "path";
import { UserConfig, ProjectType } from "./types";
import { createProjectDir, confirmDependencies, installDependencies } from "./helper";
import { initGitRepo, installHusky } from "./git";
import { createPackageJson, updatePackageJsonWithDependencies } from "./package";
import { copyTemplateFiles } from "./templates";

/**
 * 收集用户项目配置输入
 * @param dirName 可选的项目目录名
 * @param yes 是否自动使用默认值
 * @param scope 可选的npm包作用域
 * @param projectType 项目类型
 * @returns 包含用户配置的对象
 */
async function collectUserInput(dirName?: string, yes = false, scope?: string, projectType?: ProjectType) {
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

  const installCommitlint =
    yes || !initGit || !installHusky
      ? false
      : await confirm({
          message: "Install commitlint for commit message validation?",
          default: true
        });

  const addWorkflow =
    yes || projectType === "c"
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

  const addVscodeConfig =
    yes || projectType === "c"
      ? true
      : await confirm({
          message: "Add .vscode project configuration?",
          default: true
        });

  const addPrettierConfig =
    yes || projectType === "c"
      ? true
      : await confirm({
          message: "Add Prettier configuration (will install prettier package)?",
          default: true
        });

  const installDeps = yes ? false : true; // 默认为true，后续会根据confirmDependencies的结果更新

  const answers: UserConfig = {
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
    installCommitizen,
    installCommitlint
  };

  // 确认依赖安装选择
  if (!yes) {
    answers.installDeps = await confirmDependencies(answers);
  }

  return answers;
}

/**
 * 项目初始化主命令
 * @param dirName 可选的项目目录名
 * @param skipPrompts 是否跳过交互式提示
 * @param yes 是否自动选择默认值
 * @param scope 可选的npm包作用域
 * @param projectType 项目类型
 * @returns Promise<void>
 */
export async function cmdInit(
  dirName?: string,
  skipPrompts = false,
  yes = false,
  scope?: string,
  projectType?: ProjectType
) {
  console.log("Welcome to tdoc project initialization\n");

  // 创建项目目录
  const projectDir = createProjectDir(dirName);

  // 收集用户输入
  const answers = await collectUserInput(dirName, yes || skipPrompts, scope, projectType);

  // 切换到项目目录
  process.chdir(projectDir);

  // 初始化Git仓库
  if (answers.initGit) {
    initGitRepo(projectDir, answers.addWorkflow, projectType);
  }

  // 复制模板文件
  copyTemplateFiles(projectDir, answers, projectType);

  // 创建package.json
  createPackageJson(projectDir, answers, scope);

  // 安装husky
  if (answers.installHusky && answers.initGit) {
    installHusky(projectDir, answers);
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
 * 创建初始化项目命令
 * @return 配置好的Command实例
 */
export function createInitCommand(): Command {
  const program = new Command("init")
    .description("Initialize a new tdoc project")
    .argument("[dirName]", "项目目录名")
    .option("-y, --yes", "Skip prompts and use default values")
    .option("-t, --type <type>", "Project type (e.g. c for C language project)")
    .option("--scope <scope>", "Set npm package scope (e.g. myorg)")
    .action(async (dirName: string | undefined, options: { yes?: boolean; type?: string; scope?: string }) => {
      try {
        await cmdInit(dirName, false, options.yes, options.scope, options.type as ProjectType);
      } catch (err) {
        console.error("❌ 初始化项目失败:", (err as Error).message);
        process.exit(1);
      }
    });

  return program;
}

export default createInitCommand;
