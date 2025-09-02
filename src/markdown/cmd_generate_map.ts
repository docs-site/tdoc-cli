/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_generate_map.ts
 * Author     : Roo
 * Date       : 2025-09-02
 * Version    :
 * Description: 实现tdoc m:m -d path命令，用于扫描指定目录的目录结构
 * ======================================================
 */
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

// 定义sdoc目录名，方便后期修改
const SDOC_DIR_NAME = 'sdoc';

interface MMOptions {
  dir?: string;
}

/**
 * @brief 查找sdoc根目录路径
 * @param {string} dirPath 起始目录路径
 * @return {string | null} sdoc根目录路径或null
 */
function findSdocRoot(dirPath: string): string | null {
  const normalizedPath = path.normalize(dirPath);
  const pathParts = normalizedPath.split(path.sep);
  const sdocIndex = pathParts.indexOf(SDOC_DIR_NAME);

  if (sdocIndex !== -1) {
    // 找到了sdoc目录，构建sdoc根目录路径
    const sdocPathParts = pathParts.slice(0, sdocIndex + 1);
    return sdocPathParts.join(path.sep);
  }

  return null;
}

/**
 * @brief 递归扫描指定目录及其子目录，构建目录名到相对路径的映射
 * @param {string} dirPath 要扫描的起始目录路径
 * @param {string} basePath 基准路径，用于计算相对路径
 * @return {Map<string, string>} 目录名到相对路径的映射 (name -> relativePath)
 */
function scanDirectories(dirPath: string, basePath: string): Map<string, string> {
  const dirMap = new Map<string, string>();
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dirPath, entry.name);
      // 检查当前目录下是否有同名的.md文档，若有则跳过
      const mdFilePath = path.join(dirPath, entry.name + '.md');
      if (fs.existsSync(mdFilePath)) {
        // console.log(`🔍 跳过目录 "${entry.name}"，因为存在同名的.md文档`);
        continue;
      }
      
      // 计算相对于basePath的路径
      let relativePath = path.relative(basePath, fullPath);
      // 确保使用Unix风格的路径分隔符
      relativePath = relativePath.replace(/\\/g, '/');
      dirMap.set(entry.name, relativePath);
      
      // 递归扫描子目录并合并结果
      const subMap = scanDirectories(fullPath, basePath);
      for (const [name, relPath] of subMap) {
        dirMap.set(name, relPath);
      }
    }
  }
  
  return dirMap;
}

/**
 * @brief 读取现有的path-map.js文件
 * @param {string} filePath 文件路径
 * @return {Map<string, string>} 现有的键值映射
 */
function readExistingMap(filePath: string): Map<string, string> {
  const existingMap = new Map<string, string>();

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return existingMap;
  }

  try {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');

    // 使用正则表达式匹配键值对
    const regex = /"([^"]+)":\s*"([^"]+)"/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      existingMap.set(match[1], match[2]);
    }
  } catch (err) {
    console.warn(`⚠️ 读取现有文件时出错: ${err}`);
  }

  return existingMap;
}

/**
 * @brief 生成path-map.js文件
 * @param {string} dirPath sdoc目录路径
 * @return {void}
 */
function generatePathMap(dirPath: string): void {
  // 获取目录映射
  const dirMap = scanDirectories(dirPath, dirPath);

  // 读取现有文件中的键值对
  const outputPath = path.join(dirPath, 'path-map.js');
  const existingMap = readExistingMap(outputPath);

  // 生成文件内容
  let content = '/**\n';
  content += ' * 由tdoc m:m命令自动生成的目录映射文件\n';
  content += ' * 用于将中文目录名映射为英文别名\n';
  content += ' */\n\n';
  content += 'export default {\n';

  for (const [name, relativePath] of dirMap) {
    // 如果已存在该键值，则使用原有的值，否则使用"default"
    const value = existingMap.has(name) ? existingMap.get(name) : "default";
    content += `  "${name}": "${value}", // ${relativePath}\n`;
  }

  content += '};\n';

  // 写入文件
  fs.writeFileSync(outputPath, content);
  console.log(`✅ 成功生成文件: ${outputPath}`);
}

/**
 * @brief 执行m:m命令的主函数
 * @param {string} inputPath 输入路径
 * @param {MMOptions} options 命令选项
 * @return {void}
 */
function main(inputPath: string, options: MMOptions): void {
  try {
    // 确定要扫描的目录路径
    const scanPath = options.dir ? path.resolve(options.dir) : path.resolve(inputPath || '.');

    // 检查目录是否存在
    if (!fs.existsSync(scanPath)) {
      console.error(`❌ 指定的路径不存在: ${scanPath}`);
      process.exit(1);
    }

    // 检查是否为目录
    const stat = fs.statSync(scanPath);
    if (!stat.isDirectory()) {
      console.error(`❌ 指定的路径不是目录: ${scanPath}`);
      process.exit(1);
    }

    console.log(`🔍 正在分析路径: ${scanPath}`);

    // 查找sdoc根目录
    let sdocRoot = findSdocRoot(scanPath);

    // 如果在指定目录中没有找到sdoc目录，则检查扫描目录是否就是sdoc目录
    if (!sdocRoot && path.basename(scanPath) === SDOC_DIR_NAME) {
      sdocRoot = scanPath;
    }

    if (!sdocRoot) {
      console.error('❌ 未找到sdoc目录');
      process.exit(1);
    }

    console.log(`📁 找到sdoc根目录: ${sdocRoot}`);

    // 生成path-map.js文件
    generatePathMap(sdocRoot);

    // console.log('✅ 命令执行完成');
    process.exit(0);
  } catch (err) {
    console.error('❌ 执行m:m命令出错:', err);
    process.exit(1);
  }
}

/**
 * @brief 创建m:m命令
 * @return {Command} commander命令对象
 */
function createGenerateMapCommand(): Command {
  const program = new Command('m:m')
    .description('扫描目录结构并生成path-map.js文件')
    .option('-d, --dir <path>', '指定要扫描的目录路径')
    .arguments('[path]')
    .action((path, options: MMOptions) => {
      main(path, options);
    });

  return program;
}

export default createGenerateMapCommand;
