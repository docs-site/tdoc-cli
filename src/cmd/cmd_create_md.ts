/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_create_md.ts
 * Author     : 苏木
 * Date       : 2025-06-18
 * Version    :
 * Description: 创建markdown文件的命令实现
 * ======================================================
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { getCurrentDateTime } from '../utils/sys_time';

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
 * @brief 读取模板文件内容
 * @param {string} templatePath - 模板文件路径
 * @return {string} 模板文件内容
 * @throws {Error} 当文件读取失败时抛出异常
 */
function readTemplate(templatePath: string): string {
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    console.error(`❌ 模板文件读取失败: ${templatePath}`);
    console.error((err as Error).message);
    process.exit(1);
  }
}

/**
 * @brief 替换模板中的占位符生成最终内容
 * @param {string} template - 模板内容
 * @param {string} name - 要替换的标题名称
 * @return {string} 替换后的内容
 * @note 替换模板中的{{ title }}和{{ date }}占位符
 */
function generateContent(template: string, name: string): string {
  return template
    .replace(/{{ title }}/g, name)
    .replace(/{{ date }}/g, getCurrentDateTime());
}

/**
 * @brief 确认是否覆盖已存在的文件
 * @param {string} filePath - 要检查的文件路径
 * @return {Promise<boolean>} 用户确认结果 (true表示确认覆盖)
 * @async
 */
async function confirmOverwrite(filePath: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    return await new Promise((resolve) => {
      rl.question(`⚠️  文件已存在: ${filePath} 是否覆盖? (y/N) `, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
  } finally {
    rl.close();
  }
}

/**
 * @brief 创建markdown文件
 * @param {string} fileName - 要创建的文件名（不带扩展名）
 * @param {CommandOptions} [options] - 命令行选项
 * @return {Promise<void>} 无返回值
 * @throws {Error} 当文件创建失败时抛出异常
 * @async
 * @description 主要执行流程:
 * 1. 确定模板路径
 * 2. 读取模板内容
 * 3. 生成文件内容
 * 4. 确定输出目录和路径
 * 5. 检查文件是否存在
 * 6. 处理文件存在的情况
 * 7. 创建/覆盖文件
 */
async function createMarkdownFile(
  fileName: string,
  options: CommandOptions = {}
): Promise<void> {
  // 1. 确定模板路径
  const templatePath = path.join(
    path.join(__dirname, '../../'),
    'scaffolds',
    `${options.template || 'post'}.md`
  );
  try {
    const template = readTemplate(templatePath); // 2. 读取模板内容
    const content = generateContent(template, fileName); // 3. 生成文件内容
    // 4. 确定输出目录和路径
    const outputDir = options.dir
      ? path.join(process.cwd(), options.dir)
      : path.join(process.cwd(), 'test');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 创建目录: ${outputDir}`);
    }
    const outputPath = path.join(outputDir, `${fileName}.md`);
    try {
      const fileExists = fs.existsSync(outputPath); // 5. 检查文件是否存在
      // 6. 处理文件存在的情况
      if (fileExists) {
        if (options.force) {
          console.log(`🔧 强制覆盖已存在的文件: ${outputPath}`);
        } else {
          const overwrite = await confirmOverwrite(outputPath);
          if (!overwrite) {
            console.log('🚫 操作已取消');
            return;
          }
        }
      }
      // 7. 创建/覆盖文件
      fs.writeFileSync(outputPath, content, 'utf8');
      console.log(`✅ 文档已生成: ${outputPath}`);
      console.log(`📋 使用模板: ${path.relative(process.cwd(), templatePath)}`);
      console.log(`⏰ 当前时间: ${getCurrentDateTime()}`);
    } catch (err) {
      throw new Error(`文件创建失败: ${outputPath}\n${(err as Error).message}`);
    }
  } catch (err) {
    console.error(`❌ ${(err as Error).message}`);
    process.exit(1);
  }
}

export { createMarkdownFile };
