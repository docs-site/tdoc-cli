/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : index.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: markdown模块的命令注册
 * ======================================================
 */


import { Command } from 'commander';
import { createMarkdownFile } from './cmd_create_md';
import { parseMarkdownMetadata } from './cmd_parse_md';
import { addFrontmatter } from './cmd_add_frontmatter';
import createGenerateMapCommand from './cmd_generate_map';
import type { CommandOptions } from "./types"
/**
 * @brief 注册markdown相关的命令
 * @param {Command} program - commander的Command实例
 */
function registerMarkdownCommands(program: Command): void {
  // 添加 m:n 命令
  program
    .command('m:n <filename>')
    .description('创建新的markdown文档')
    .option('-t, --template <name>', '指定模板名称', 'post')
    .option('-f, --force', '强制覆盖已存在的文件')
    .option('-d, --dir <directory>', '指定输出目录')
    .option('-m, --map [file]', '指定路径映射表文件，如果不指定则使用默认文件')
    .action(async (filename, options: CommandOptions) => {
      try {
        await createMarkdownFile(filename, options);
      } catch (err) {
        console.error('❌ 创建文档失败:', (err as Error).message);
        process.exit(1);
      }
    });
  
  // 添加 m:p 命令
  program
    .command('m:p <file>')
    .description('解析markdown文件中的元数据')
    .action(async (file: string) => {
      try {
        await parseMarkdownMetadata(file);
      } catch (err) {
        console.error('❌ 解析markdown元数据失败:', (err as Error).message);
        process.exit(1);
      }
    });
  
  // 添加 m:a 命令
  program
    .command('m:a <target>')
    .description('为markdown文件添加frontmatter')
    .option('-d, --dir', '处理目录中的所有markdown文件')
    .option('-m, --map [file]', '指定路径映射表文件，如果不指定则使用默认文件')
    .action(async (target: string, options: { dir?: boolean, map?: string }) => {
      try {
        await addFrontmatter(target, options);
      } catch (err) {
        console.error('❌ 为markdown文件添加frontmatter失败:', (err as Error).message);
        process.exit(1);
      }
    });
  
  // 添加 m:m 命令
  program.addCommand(createGenerateMapCommand());
}

export { registerMarkdownCommands };
