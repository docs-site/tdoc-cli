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

/**
 * @interface CommandOptions
 * @property {string} [template] - 使用的模板名称 (默认为'post')
 * @property {boolean} [force] - 是否强制覆盖已存在的文件
 * @property {string} [dir] - 指定输出目录 (默认为'test')
 */
interface CommandOptions {
  template?: string;
  force?: boolean;
  dir?: string;
}

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
}

export { registerMarkdownCommands };
