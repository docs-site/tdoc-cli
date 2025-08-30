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
}

export { registerMarkdownCommands };
