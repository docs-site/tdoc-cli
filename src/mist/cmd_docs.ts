/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_docs.ts
 * Author     : 苏木
 * Date       : 2025-09-17
 * Version    :
 * Description: Mist docs 命令 - Office 文档备份功能
 * ======================================================
 */

import fs from "fs-extra";
import path from "path";
import { Command } from "commander";

// 需要备份的文件扩展名（来自 .gitignore 第142-149行）
const TARGET_EXTENSIONS = [
  ".xmind",
  ".pptx",
  ".ppt",
  ".vsdx",
  ".docx",
  ".doc",
  ".xls",
  ".xlsx",
  ".excalidraw",
  ".drawio"
];

/**
 * 创建目录（如果不存在）
 * @param dirPath - 目录路径
 * @param baseDir - 基础目录（用于相对路径显示）
 * @returns 创建的目录数量
 */
function createDirectoryIfNotExists(dirPath: string, baseDir: string = ""): number {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    if (baseDir) {
      const relativePath = path.relative(baseDir, dirPath);
      console.log(`📁 创建目录: ${relativePath}`);
    }
    return 1;
  }
  return 0;
}

/**
 * 复制文件到目标位置
 * @param sourceFile - 源文件路径
 * @param targetFile - 目标文件路径
 * @param relativePath - 相对路径（用于日志显示）
 * @returns 是否成功复制
 */
function copyFileWithBackup(
  sourceFile: string,
  targetFile: string,
  relativePath: string,
  debugMode: boolean = false
): boolean {
  try {
    // 检查目标文件是否已存在
    if (fs.existsSync(targetFile)) {
      if (debugMode) {
        console.log(`  ⚠️  文件已存在，将覆盖: ${relativePath}`);
      }
    }

    fs.copyFileSync(sourceFile, targetFile);
    if (debugMode) {
      console.log(`  ✅ 已备份: ${relativePath}`);
    }
    return true;
  } catch (copyError) {
    console.error(`❌ 备份失败: ${relativePath} - ${(copyError as Error).message}`);
    return false;
  }
}

/**
 * 格式化运行时间
 * @param durationMs - 运行时间（毫秒）
 * @returns 格式化后的时间字符串
 */
function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const milliseconds = durationMs % 1000;

  let timeString = "⏱️  运行时间: ";
  if (minutes > 0) {
    timeString += `${minutes}m `;
  }
  if (seconds > 0 || minutes > 0) {
    timeString += `${seconds}s `;
  }
  timeString += `${milliseconds}ms`;

  return timeString;
}

/**
 * 递归查找并备份目标文件
 * @param dir - 当前目录路径
 * @param sourceDirPath - 源目录根路径
 * @param targetBackupDir - 目标备份目录
 * @param stats - 统计对象
 */
function findAndBackupFiles(
  dir: string,
  sourceDirPath: string,
  targetBackupDir: string,
  stats: { totalFilesFound: number; totalFilesCopied: number; totalDirsCreated: number },
  debugMode: boolean = false
): void {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  items.forEach((item) => {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // 递归处理子目录
      findAndBackupFiles(fullPath, sourceDirPath, targetBackupDir, stats, debugMode);
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();

      // 检查是否是目标文件类型
      if (TARGET_EXTENSIONS.includes(ext)) {
        stats.totalFilesFound++;

        // 计算相对路径（相对于源目录）
        const relativePath = path.relative(sourceDirPath, fullPath);
        const targetFilePath = path.join(targetBackupDir, relativePath);
        const targetDir = path.dirname(targetFilePath);

        // 创建目标目录（如果不存在）
        stats.totalDirsCreated += createDirectoryIfNotExists(targetDir, targetBackupDir);

        // 拷贝文件
        if (copyFileWithBackup(fullPath, targetFilePath, relativePath, debugMode)) {
          stats.totalFilesCopied++;
        }
      }
    }
  });
}

/**
 * 检测数字开头的目录
 * @param dirPath - 要检测的目录路径
 * @returns 数字开头目录的路径数组
 */
function detectNumberedDirectories(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const numberedDirs: string[] = [];

  items.forEach((item) => {
    if (item.isDirectory()) {
      const dirName = item.name;
      // 匹配以数字加点或-开头的目录名，例如 "01.xxx" 或 "01-xxx"
      if (/^\d+[.-]/.test(dirName)) {
        numberedDirs.push(path.join(dirPath, dirName));
      }
    }
  });

  return numberedDirs;
}

/**
 * 备份 Office 文档主函数
 * @param debugMode - 是否启用调试模式
 * @param backupDir - 自定义备份目录（可选）
 */
function backupOfficeDocuments(debugMode: boolean = false, backupDir?: string): void {
  try {
    // 记录开始时间
    const startTime = Date.now();

    console.log("🚀 开始执行 Office 文档备份任务");
    if (debugMode) {
      console.log("🔧 调试模式已启用");
    }
    console.log("─".repeat(50));

    // 获取当前工作目录的绝对路径
    const currentDir = process.cwd();
    console.log("📁 当前工作目录:", currentDir);

    // 获取工程目录名（当前目录的文件夹名）
    const projectName = path.basename(currentDir);
    console.log("🏗️  工程目录名:", projectName);

    // 源目录路径
    const sdocDirPath = path.join(currentDir, "src", "sdoc");
    const srcDirPath = path.join(currentDir, "src");

    // 检测源目录
    let sourceDirs: string[] = [];

    if (fs.existsSync(sdocDirPath)) {
      console.log("📦 检测到 sdoc 目录:", sdocDirPath);
      sourceDirs.push(sdocDirPath);
    } else {
      console.log("ℹ️  未检测到 sdoc 目录，正在检测 src 目录下的数字开头目录...");

      // 检测 src 目录下的数字开头目录
      const numberedDirs = detectNumberedDirectories(srcDirPath);
      if (numberedDirs.length > 0) {
        console.log(`📦 检测到 ${numberedDirs.length} 个数字开头目录:`);
        numberedDirs.forEach((dir) => {
          const relativePath = path.relative(currentDir, dir);
          console.log(`   - ${relativePath}`);
        });
        sourceDirs = numberedDirs;
      } else {
        console.error("❌ 错误: 未找到 sdoc 目录，也未在 src 目录下找到数字开头的目录");
        console.error("   请确保存在 sdoc 目录或在 src 目录下创建以数字开头（如 01.xxx 或 01-xxx）的目录");
        process.exit(1);
      }
    }

    console.log("─".repeat(50));

    // 确定备份目录
    let targetBackupDir: string;
    if (backupDir) {
      targetBackupDir = path.resolve(backupDir);
    } else {
      // 使用 OneDrive 备份目录（使用环境变量）
      const oneDriveDir = process.env.USERPROFILE || "C:\\Users\\20380";
      targetBackupDir = path.join(oneDriveDir, "OneDrive", "sumu-docs", projectName);
    }

    const dirsCreated = createDirectoryIfNotExists(targetBackupDir);
    if (dirsCreated > 0) {
      console.log("📁 创建目标备份目录:", targetBackupDir);
    }

    // 统计对象
    const stats = {
      totalFilesFound: 0,
      totalFilesCopied: 0,
      totalDirsCreated: 0
    };

    // 递归查找并备份目标文件
    console.log("🔍 正在查找目标文件...");

    sourceDirs.forEach((sourceDir, index) => {
      const relativeSourcePath = path.relative(currentDir, sourceDir);
      console.log(`   📁 扫描目录 ${index + 1}/${sourceDirs.length}: ${relativeSourcePath}`);

      // 对于数字开头的目录，使用 src 目录作为基础路径来保留目录结构
      const baseDir = fs.existsSync(sdocDirPath) ? sourceDir : srcDirPath;
      findAndBackupFiles(sourceDir, baseDir, targetBackupDir, stats, debugMode);
    });

    console.log(`   - 找到目标文件: ${stats.totalFilesFound} 个`);

    console.log("─".repeat(50));
    console.log("📊 备份统计:");
    console.log(`   - 成功备份文件: ${stats.totalFilesCopied} 个`);
    console.log(`   - 创建目录: ${stats.totalDirsCreated} 个`);

    // 计算并显示运行时间
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    console.log(formatDuration(durationMs));

    if (stats.totalFilesCopied > 0) {
      console.log("🎉 Office 文档备份完成!");
      console.log(`📂 备份位置: ${targetBackupDir}`);
    } else {
      console.log("ℹ️  未找到需要备份的 Office 文档");
    }
    console.log("─".repeat(50));
  } catch (error) {
    console.error("❌ 备份过程中发生错误:", (error as Error).message);
    process.exit(1);
  }
}

/**
 * 创建 mist docs 命令
 * @returns commander 的 Command 实例
 */
export function createDocsCommand(): Command {
  const program = new Command("docs").description("备份 Office 文档到指定目录");

  program
    .option("-d, --debug", "启用调试模式")
    .option("-b, --backup-dir <dir>", "指定自定义备份目录")
    .action((options) => {
      backupOfficeDocuments(options.debug, options.backupDir);
    });

  return program;
}

export default createDocsCommand;
