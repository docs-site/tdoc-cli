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
import {
  generatePermalink as generatePermalinkHelper,
  readTemplate,
  formatDateTime,
  generateContent,
  generateIndexContent
} from './helper';
import type { CommandOptions } from "./types"


/**
 * @brief 读取模板文件内容
 * @param {string} templatePath - 模板文件路径
 * @return {string} 模板文件内容
 * @throws {Error} 当文件读取失败时抛出异常
 */

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
  // 检查是否为index文件名，如果是则使用index.md模板
  const templateName = fileName.toLowerCase() === 'index' ? 'index' : (options.template || 'post');
  const templatePath = path.join(
    path.join(__dirname, '../../'),
    'scaffolds',
    `${templateName}.md`
  );
  try {
    const template = readTemplate(templatePath); // 2. 读取模板内容
    // 4. 确定输出目录和路径
    const outputDir = options.dir
      ? path.join(process.cwd(), options.dir)
      : path.join(process.cwd(), 'test');
    // 3. 生成文件内容
    // 获取当前时间（包括毫秒）用于统一时间源
    const currentTime = new Date();
    // 生成permalink和UUID信息用于后续打印
    const permalinkData = generatePermalinkHelper(currentTime);

    // 生成详细时间戳（中国时区格式，包含毫秒）
    const detailDate = `${formatDateTime(currentTime)}.${String(currentTime.getMilliseconds()).padStart(3, '0')}`;

    const content = fileName.toLowerCase() === 'index'
      ? generateIndexContent(template, outputDir, currentTime, permalinkData.permalink, detailDate, permalinkData.fulluuid, permalinkData.useduuid)
      : generateContent(template, fileName, currentTime, permalinkData.permalink, detailDate, permalinkData.fulluuid, permalinkData.useduuid);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 创建目录: ${outputDir}`);
    }
    const outputPath = path.join(outputDir, `${fileName}.md`);
    try {
      // 5. 检查文件是否存在
      const fileExists = fs.existsSync(outputPath);
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
      // 打印详细的时间信息（包括毫秒）和permalink
      console.log(`⏰ 生成时间: ${formatDateTime(currentTime)}.${String(currentTime.getMilliseconds()).padStart(3, '0')}`);
      console.log(`🔗 永久链接: ${permalinkData.permalink}`);
    } catch (err) {
      throw new Error(`文件创建失败: ${outputPath}\n${(err as Error).message}`);
    }
  } catch (err) {
    console.error(`❌ ${(err as Error).message}`);
    process.exit(1);
  }
}

export { createMarkdownFile };
