/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : index.ts
 * Author     : 苏木
 * Date       : 2025-06-17
 * Version    :
 * Description:
 * ======================================================
 */

import { Command } from "commander";
import pkg from "../package.json";
import { registerImgCommand } from "./system/img";
import gitSubmoduleCommand from "./cmd/cmd_git_submodule";
import { registerTreeCommand } from "./system/tree";
import loginCommand from "./inquirer-cmd/login";
import { cmdInit } from "./inquirer-cmd/init";
import sidebarCommand from "./cmd/cmd_sidebar";
import { registerMarkdownCommands } from "./markdown";
import mistCommand from "./mist/mist-cli";
/**
 * @brief 创建commander的Command实例
 */
const program = new Command(pkg.name);

/**
 * @brief 从package.json中提取项目版本、依赖和开发依赖信息
 * @returns {string} 格式化的版本信息字符串，包含:
 *                  - 项目名称和版本
 *                  - 所有依赖项及其版本(每行一个依赖)
 *                  - 所有开发依赖项及其版本(每行一个依赖)
 * @details 函数处理流程:
 *          1. 使用Object.entries()分别获取dependencies和devDependencies的键值对数组
 *          2. 使用map()将每个依赖项格式化为"name: version"字符串
 *          3. 使用join('\n')将所有依赖项合并为多行字符串
 *          4. 返回包含项目名称、版本和格式化依赖信息的完整字符串
 * @example 返回格式示例:
 *          my-project: 1.0.0
 *
 *          dependencies:
 *            react: ^18.0.0
 *            react-dom: ^18.0.0
 *
 *          devDependencies:
 *            typescript: ^4.0.0
 *            eslint: ^7.0.0
 */
function getVersionInfo(): string {
  const deps = Object.entries(pkg.dependencies)
    .map(([name, version]) => `  ${name}: ${version}`)
    .join("\n");
  const devDeps = Object.entries(pkg.devDependencies)
    .map(([name, version]) => `  ${name}: ${version}`)
    .join("\n");
  return `${pkg.name}: ${pkg.version}\n\ndependencies:\n${deps}\n\ndevDependencies:\n${devDeps}`;
}

program.version(getVersionInfo(), "-v, --version", "显示版本信息和依赖包");

// 添加处理git子模块的命令
program
  .command(gitSubmoduleCommand.command)
  .description(gitSubmoduleCommand.description)
  .action((dir) => {
    try {
      gitSubmoduleCommand.handler(dir);
    } catch (err) {
      console.error("❌ 处理子模块失败:", (err as Error).message);
      process.exit(1);
    }
  });

// 登录命令
program
  .command("login")
  .description("用户登录")
  .action(async () => {
    await loginCommand();
  });

// 初始化项目命令
program
  .command("init [dirName]")
  .description("Initialize a new tdoc project")
  .option("-y, --yes", "Skip prompts and use default values")
  .option("--scope <scope>", "Set npm package scope (e.g. myorg)")
  .action(async (dirName, options) => {
    try {
      await cmdInit(dirName, false, options.yes, options.scope);
    } catch (err) {
      console.error("❌ 初始化项目失败:", (err as Error).message);
      process.exit(1);
    }
  });

// 添加生成sidebar的命令
program.addCommand(sidebarCommand());

// 添加mist相关命令
program.addCommand(mistCommand());

// 注册markdown相关的命令
registerMarkdownCommands(program);

// 注册tree命令
registerTreeCommand(program);

// 注册img命令
registerImgCommand(program);

// console.log('Raw arguments:', process.argv); // 用于代码压缩测试，压缩后将不会打印这些参数
program.parse(); // 参数处理
