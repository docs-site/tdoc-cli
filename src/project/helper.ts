import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { UserConfig } from "./types";

/**
 * 默认依赖项
 */
export const devDependencies: string[] = ["@types/node"];
export const dependencies: string[] = [];

/**
 * 获取依赖的最新版本
 * @param dependency 依赖项名称
 * @returns 版本字符串
 */
export function getLatestVersion(dependency: string): string {
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

/**
 * 创建并验证项目目录结构
 * @param dirName 可选的项目目录名
 * @returns 项目绝对路径
 * @throws 如果目录已存在且不为空则退出进程
 */
export function createProjectDir(dirName?: string): string {
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
 * 确认依赖安装选择
 * @param answers 用户配置对象
 * @returns 用户是否选择安装依赖
 */
export async function confirmDependencies(answers: UserConfig) {
  // 准备要安装的依赖列表
  const installDevDeps = [...devDependencies]; // 开发依赖
  const installDeps = [...dependencies]; // 生产依赖

  // 添加commitizen相关依赖
  if (answers.installCommitizen) {
    installDevDeps.push("commitizen", "cz-git", "@commitlint/config-conventional");
  }

  // 添加commitlint相关依赖
  if (answers.installCommitlint) {
    installDevDeps.push("@commitlint/cli");
  }

  console.log("\nWill install the following dependencies:");
  console.log(`  devDependencies: ${installDevDeps.join(", ")}`);
  console.log(`  dependencies: ${installDeps.join(", ") || "none"}`);
  console.log();

  const { confirm } = await import("@inquirer/prompts");
  return await confirm({
    message: "Install dependencies automatically?",
    default: false
  });
}

/**
 * 安装项目依赖
 * @param projectDir 项目目录路径
 * @throws 如果npm安装失败会抛出错误
 */
export function installDependencies(projectDir: string) {
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
