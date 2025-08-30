/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : add_frontmatter.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: 为markdown文件添加frontmatter
 * ======================================================
 */
import fs from 'fs';
import path from 'path';
import {
  generatePermalink,
  readTemplate,
  formatDateTime,
  generateContent,
  generateIndexContent
} from './helper';

/**
 * @brief 检测markdown文件是否包含frontmatter
 * @param {string} content - 文件内容
 * @return {boolean} 是否包含frontmatter
 */
function hasFrontmatter(content: string): boolean {
  // 检查文件是否以frontmatter开始 (---开头和结尾)
  return content.trimStart().startsWith('---');
}

/**
 * @brief 读取模板文件内容
 * @param {string} templatePath - 模板文件路径
 * @return {string} 模板文件内容
 * @throws {Error} 当文件读取失败时抛出异常
 */

/**
 * @brief 生成frontmatter内容
 * @param {string} filePath - 目标文件路径
 * @return {string} 生成的frontmatter内容
 */
function generateFrontmatter(filePath: string): string {
  // 获取文件名（不带扩展名）
  const fileName = path.basename(filePath, '.md');
  
  // 确定模板名称
  const templateName = fileName.toLowerCase() === 'index' ? 'index' : 'post';
  
  // 1. 确定模板路径
  const templatePath = path.join(
    path.join(__dirname, '../../'),
    'scaffolds',
    `${templateName}.md`
  );
  
  const template = readTemplate(templatePath); // 2. 读取模板内容
  
  // 3. 生成文件内容
  // 获取当前时间（包括毫秒）用于统一时间源
  const currentTime = new Date();
  // 生成permalink和UUID信息用于后续打印
  const permalinkData = generatePermalink(currentTime);
  
  // 生成详细时间戳（中国时区格式，包含毫秒）
  const detailDate = `${formatDateTime(currentTime)}.${String(currentTime.getMilliseconds()).padStart(3, '0')}`;
  
  // 获取文件所在目录
  const outputDir = path.dirname(filePath);
  
  const content = fileName.toLowerCase() === 'index'
    ? generateIndexContent(template, outputDir, currentTime, permalinkData.permalink, detailDate, permalinkData.fulluuid, permalinkData.useduuid)
    : generateContent(template, fileName, currentTime, permalinkData.permalink, detailDate, permalinkData.fulluuid, permalinkData.useduuid);
  
  // 提取frontmatter部分（从---到下一个---之间的内容）
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch && frontmatterMatch[1]) {
    return '---\n' + frontmatterMatch[1] + '\n---';
  }
  
  // 如果没有找到frontmatter，返回空字符串
  return '';
}

/**
 * @brief 将frontmatter添加到文件开头
 * @param {string} filePath - 文件路径
 * @param {string} frontmatter - frontmatter内容
 * @return {void}
 */
function addFrontmatterToFile(filePath: string, frontmatter: string): void {
  try {
    // 读取原文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已包含frontmatter
    if (hasFrontmatter(content)) {
      console.log(`⚠️  文件已包含frontmatter: ${filePath}`);
      return;
    }
    
    // 将frontmatter和原内容合并，并在最后添加一个空行
    const newContent = frontmatter + '\n\n' + content + '\n';
    
    // 确保使用LF作为换行符
    const normalizedContent = newContent.replace(/\r\n/g, '\n');
    
    // 写入文件
    fs.writeFileSync(filePath, normalizedContent, 'utf8');
    console.log(`✅ frontmatter已添加到文件: ${filePath}`);
  } catch (err) {
    throw new Error(`文件处理失败: ${filePath}\n${(err as Error).message}`);
  }
}

/**
 * @brief 为markdown文件添加frontmatter
 * @param {string} target - 目标文件或目录路径
 * @param {object} options - 命令行选项
 * @param {boolean} options.dir - 是否处理目录中的所有markdown文件
 * @param {boolean} options.verbose - 是否显示详细信息
 * @return {Promise<void>} 无返回值
 * @async
 */
async function addFrontmatter(target: string, options: { dir?: boolean; verbose?: boolean }): Promise<void> {
  try {
    // 检查目标是文件还是目录
    const stat = fs.statSync(target);
    
    if (stat.isFile()) {
      // 处理单个文件
      if (path.extname(target) === '.md') {
        // 生成frontmatter内容（默认使用post模板）
        const frontmatter = generateFrontmatter(target);
        addFrontmatterToFile(target, frontmatter);
      } else {
        console.log(`⚠️  文件不是markdown格式: ${target}`);
      }
    } else if (stat.isDirectory() && options.dir) {
      // 处理目录中的所有markdown文件
      const files = fs.readdirSync(target);
      for (const file of files) {
        const filePath = path.join(target, file);
        const fileStat = fs.statSync(filePath);
        
        if (fileStat.isFile() && path.extname(filePath) === '.md') {
          // 生成frontmatter内容（默认使用post模板）
          const frontmatter = generateFrontmatter(filePath);
          addFrontmatterToFile(filePath, frontmatter);
        }
      }
    } else {
      console.log(`⚠️  目标不是文件或未指定-dir选项: ${target}`);
    }
  } catch (err) {
    throw new Error(`处理目标失败: ${target}\n${(err as Error).message}`);
  }
}

export { addFrontmatter };
