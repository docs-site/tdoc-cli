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
import { generatePermalink as generatePermalinkHelper } from './helper';
import type { CommandOptions } from "./types"


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
 * @brief 获取处理后的标题
 * @param {string} name - 原始标题名称
 * @param {string} [outputDir] - 输出目录的绝对路径（仅用于index模板）
 * @return {string} 处理后的标题
 */
function getTitle(name: string, outputDir?: string): string {
  // 如果outputDir存在，则处理index模板的标题
  if (outputDir) {
    // 获取当前目录名
    let dirName = path.basename(outputDir);

    // 处理目录名，去除前缀序号(例如: 04-测试 -> 测试)
    dirName = dirName.replace(/^\d+-/, '');

    return dirName;
  }

  // 否则处理普通模板的标题
  return name;
}

/**
 * @brief 格式化日期时间字符串，用于 替换 {{ title }}
 * @param {Date} date - 要格式化的日期对象
 * @return 格式化的日期时间字符串 (YYYY-MM-DD HH:MM:SS)
 */
function formatDateTime(date: Date): string {
  // 使用 padStart(2, '0') 确保单数位数字补零（如 9 → 09）
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始需+1
  const day = String(date.getDate()).padStart(2, '0');

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // 组合成目标格式
}

/**
 * @brief 获取处理后的目录名（用于index模板）
 * @param {string} outputDir - 输出目录的绝对路径
 * @return {string} 处理后的目录名
 */
function getIndexDir(outputDir: string): string {
  // 获取当前目录名
  let dirName = path.basename(outputDir);

  // 处理目录名，去除前缀序号(例如: 04-测试 -> 测试)
  dirName = dirName.replace(/^\d+-/, '');

  return dirName;
}

/**
 * @brief 获取处理后的路径（用于index模板）
 * @param {string} outputDir - 输出目录的绝对路径
 * @return {string} 处理后的路径
 */
function getIndexPath(outputDir: string): string {
  // 获取当前目录名
  let dirName = path.basename(outputDir);

  // 处理目录名，去除前缀序号(例如: 04-测试 -> 测试)
  dirName = dirName.replace(/^\d+-/, '');

  // 解析绝对路径
  const absolutePath = path.resolve(outputDir);

  // 检查路径中是否含有'sdoc'目录
  const sdocIndex = absolutePath.indexOf('sdoc');
  if (sdocIndex !== -1) {
    // 如果含有'sdoc'目录，则从这一级开始截断
    const sdocPath = absolutePath.substring(sdocIndex);
    // 将反斜杠替换为正斜杠
    return sdocPath.replace(/\\/g, '/');
  } else {
    // 若不含sdoc，则使用最后的目录名作为path
    return dirName;
  }
}

/**
 * @brief 为index.md模板替换占位符生成最终内容
 * @param {string} template - 模板内容
 * @param {string} outputDir - 输出目录的绝对路径
 * @param {Date} date - 时间对象，用于生成date和permalink
 * @param {string} permalink - 已生成的permalink
 * @param {string} detailDate - 详细时间戳
 * @param {string} fulluuid - 完整的UUID
 * @param {string} useduuid - 生成permalink使用的UUID部分
 * @return {string} 替换后的内容
 * @note 替换模板中的{{ title }}、{{ date }}、{{ permalink }}、{{ path }}、{{ dir }}、{{ detailDate }}、{{ fulluuid }}和{{ useduuid }}占位符
 */
function generateIndexContent(
  template: string,
  outputDir: string,
  date: Date,
  permalink: string,
  detailDate: string,
  fulluuid: string,
  useduuid: string
): string {
  return template
    .replace(/{{ title }}/g, getTitle('', outputDir)) // 传递空字符串作为name参数，因为getTitle会根据outputDir处理index模板的标题
    .replace(/{{ date }}/g, formatDateTime(date))
    .replace(/{{ permalink }}/g, permalink)
    .replace(/{{ path }}/g, getIndexPath(outputDir))
    .replace(/{{ dir }}/g, getIndexDir(outputDir))
    .replace(/{{ detailDate }}/g, detailDate)
    .replace(/{{ fulluuid }}/g, fulluuid)
    .replace(/{{ useduuid }}/g, useduuid);
}

/**
 * @brief 替换一般文档模板中的占位符生成最终内容
 * @param {string} template - 模板内容
 * @param {string} name - 要替换的标题名称
 * @param {Date} date - 时间对象，用于生成date和permalink
 * @param {string} permalink - 已生成的permalink
 * @param {string} detailDate - 详细时间戳
 * @param {string} fulluuid - 完整的UUID
 * @param {string} useduuid - 生成permalink使用的UUID部分
 * @return {string} 替换后的内容
 * @note 替换模板中的{{ title }}、{{ date }}、{{ permalink }}、{{ detailDate }}、{{ fulluuid }}和{{ useduuid }}占位符
 */
function generateContent(
  template: string,
  name: string,
  date: Date,
  permalink: string,
  detailDate: string,
  fulluuid: string,
  useduuid: string
): string {
  return template
    .replace(/{{ title }}/g, getTitle(name))
    .replace(/{{ date }}/g, formatDateTime(date))
    .replace(/{{ permalink }}/g, permalink)
    .replace(/{{ detailDate }}/g, detailDate)
    .replace(/{{ fulluuid }}/g, fulluuid)
    .replace(/{{ useduuid }}/g, useduuid);
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
