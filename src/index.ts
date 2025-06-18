/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : index.ts
 * Author     : 苏木
 * Date       : 2025-06-17
 * Version    :
 * Description:
 * ======================================================
 */

import { Command } from 'commander';
import pkg from '../package.json';
import { createMarkdownFile } from './cmd/cmd_create_md';
import { processImagePaths } from './cmd/cmd_img';
import gitSubmoduleCommand from './cmd/cmd_git_submodule';
import treeCommand from './cmd/cmd_tree';

/**
 * @brief 创建commander的Command实例
 */
const program = new Command(pkg.name);

/**
 * @brief 从package.json中提取项目版本和开发依赖信息
 * @returns {string} 格式化的版本信息字符串，包含:
 *                  - 项目名称和版本
 *                  - 所有开发依赖项及其版本(每行一个依赖)
 * @details 函数处理流程:
 *          1. 使用Object.entries()获取devDependencies的键值对数组
 *          2. 使用map()将每个依赖项格式化为"name: version"字符串
 *          3. 使用join('\n')将所有依赖项合并为多行字符串
 *          4. 返回包含项目名称、版本和格式化依赖信息的完整字符串
 * @example 返回格式示例:
 *          my-project: 1.0.0
 *
 *          devDependencies:
 *            typescript: ^4.0.0
 *            eslint: ^7.0.0
 */
function getVersionInfo(): string {
  const depsInfo = Object.entries(pkg.devDependencies)
    .map(([name, version]) => `  ${name}: ${version}`)
    .join('\n');
  return `${pkg.name}: ${pkg.version}\n\ndevDependencies:\n${depsInfo}`;
}

program.version(getVersionInfo(), '-v, --version', '显示版本信息和依赖包');

// 添加处理图片路径的命令
program
  .command('img <filepath>')
  .description('处理markdown文件中的图片路径')
  .action(async (filepath) => {
    try {
      await processImagePaths(filepath);
    } catch (err) {
      console.error('❌ 处理图片路径失败:', (err as Error).message);
      process.exit(1);
    }
  });

// 添加创建markdown文件的命令
program
  .command('new <filename>')
  .alias('n')
  .description('创建新的markdown文档')
  .option('-t, --template <name>', '指定模板名称', 'post')
  .option('-f, --force', '强制覆盖已存在的文件')
  .option('-d, --dir <directory>', '指定输出目录')
  .action(async (filename, options) => {
    try {
      await createMarkdownFile(filename, options);
    } catch (err) {
      console.error('❌ 创建文档失败:', (err as Error).message);
      process.exit(1);
    }
  });

// 添加处理git子模块的命令
program
  .command(gitSubmoduleCommand.command)
  .description(gitSubmoduleCommand.description)
  .action((dir) => {
    try {
      gitSubmoduleCommand.handler(dir);
    } catch (err) {
      console.error('❌ 处理子模块失败:', (err as Error).message);
      process.exit(1);
    }
  });

// 添加显示目录树结构的命令
program
  .command('tree')
  .description('显示当前目录的树状结构')
  .option('-L, --depth <number>', '设置最大递归深度', parseInt)
  .action((options) => {
    try {
      treeCommand.main(options);
    } catch (err) {
      console.error('❌ 显示目录树失败:', (err as Error).message);
      process.exit(1);
    }
  });

console.log('Raw arguments:', process.argv); // 用于代码压缩测试，压缩后将不会打印这些参数
program.parse(); // 参数处理
