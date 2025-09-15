/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_move_docs.ts
 * Author     : 苏木
 * Date       : 2025-09-15
 * Version    :
 * Description: 根据配置文件复制文档的命令实现
 * ======================================================
 */

import fs from "fs";
import path from "path";
import { Command } from "commander";
import readline from "readline";
import simpleGit from "simple-git";
import type { CommandOptions } from "./types";

const OSS_BASE_URL = "https://fanhua-picture.oss-cn-hangzhou.aliyuncs.com/";

// 支持的图片文件扩展名
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"]);

/**
 * @brief 同时统计文件数量和拥有图片资源目录的文档数量
 * @param {string} sourceDir - 源目录
 * @param {boolean} markdownOnly - 是否只计算markdown文件
 * @return {Promise<{fileCount: number, imageResourceDocCount: number}>} 文件数量和拥有图片资源目录的文档数量
 * @async
 */
async function countFilesAndDocsWithImageResources(
  sourceDir: string,
  markdownOnly: boolean = false
): Promise<{ fileCount: number; imageResourceDocCount: number }> {
  const files = fs.readdirSync(sourceDir, { withFileTypes: true });
  let fileCount = 0;
  let imageResourceDocCount = 0;

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file.name);
    const correspondingMdFile = path.join(sourceDir, `${file.name}.md`);
    const isImageResourceDir = fs.existsSync(correspondingMdFile);

    if (file.isDirectory()) {
      // 如果存在同名的markdown文件，则认为这是一个图片资源目录
      if (isImageResourceDir) {
        imageResourceDocCount++;
      }

      // 如果只计算markdown文件，检查是否有同名的markdown文件
      if (markdownOnly && isImageResourceDir) {
        continue; // 跳过存在同名markdown文件的目录
      }

      // 递归处理子目录
      const subCounts = await countFilesAndDocsWithImageResources(sourcePath, markdownOnly);
      fileCount += subCounts.fileCount;
      // 只有当当前目录不是图片资源目录时，才累加子目录的imageResourceDocCount
      if (!isImageResourceDir) {
        imageResourceDocCount += subCounts.imageResourceDocCount;
      }
    } else {
      // 如果是文件，根据参数决定是否只计算markdown文件
      if (markdownOnly && !file.name.endsWith(".md")) {
        continue; // 跳过非markdown文件
      }
      fileCount++;
    }
  }

  return { fileCount, imageResourceDocCount };
}

/**
 * @brief 执行图片资源复制操作
 * @param {Array<{ sourcePath: string; targetPath: string; fileCount: number }>} imageCopyTasks - 图片复制任务列表
 * @return {Promise<void>} 无返回值
 * @async
 */
async function executeImageCopy(
  imageCopyTasks: Array<{ sourcePath: string; targetPath: string; fileCount: number }>
): Promise<void> {
  // 执行图片资源复制操作
  console.log("\n" + "=".repeat(50));
  console.log("📋 图片资源复制任务");
  console.log("=".repeat(50));

  for (const task of imageCopyTasks) {
    // 复制整个sdoc目录为img目录
    if (!fs.existsSync(task.targetPath)) {
      fs.mkdirSync(task.targetPath, { recursive: true });
      console.log(`📁 创建图片目标目录: ${task.targetPath}`);
    }

    // 复制整个目录
    await copyDirectory(task.sourcePath, task.targetPath);
    console.log(`✅ 复制完成目录: ${task.sourcePath} -> ${task.targetPath}`);

    // 删除非图片文件
    const deletedCount = await deleteNonImageFiles(task.targetPath);
    if (deletedCount > 0) {
      console.log(`🗑️  删除 ${deletedCount} 个非图片文件`);
    }

    // 检查图片目录是否为空，如果为空则删除
    if (fs.existsSync(task.targetPath)) {
      const currentFiles = fs.readdirSync(task.targetPath);
      if (currentFiles.length === 0) {
        fs.rmdirSync(task.targetPath);
        console.log(`🗑️  图片目录为空，已删除: ${task.targetPath}`);
      }
    }
  }
}

/**
 * @brief 执行文档复制操作
 * @param {Array<{ sourcePath: string; targetPath: string; fileCount: number }>} copyTasks - 复制任务列表
 * @param {CommandOptions} options - 命令行选项
 * @return {Promise<void>} 无返回值
 * @async
 */
async function executeDocumentCopy(
  copyTasks: Array<{ sourcePath: string; targetPath: string; fileCount: number }>,
  options: CommandOptions
): Promise<void> {
  for (const task of copyTasks) {
    // 确保目标目录存在
    if (!fs.existsSync(task.targetPath)) {
      fs.mkdirSync(task.targetPath, { recursive: true });
      console.log(`📁 创建目标目录: ${task.targetPath}`);
    }

    // 复制文件
    const skippedFiles = { count: 0 };
    const fileCount = await copyMarkdownFiles(task.sourcePath, task.targetPath, options.force, skippedFiles);
    if (fileCount > 0) {
      console.log(`✅ 复制完成 ${fileCount} 个markdown文件: ${task.sourcePath} -> ${task.targetPath}`);
    }
    if (skippedFiles.count > 0) {
      console.log(`⚠️  🖼️ 跳过 ${skippedFiles.count} 个非git仓库文件的图片处理`);
    }
  }
}

/**
 * @brief 显示任务预览并等待用户确认
 * @param {string} absoluteConfigPath - 配置文件绝对路径
 * @param {Array<{ sourcePath: string; targetPath: string; fileCount: number }>} copyTasks - 文档复制任务列表
 * @param {Array<{ sourcePath: string; targetPath: string; fileCount: number }>} imageCopyTasks - 图片复制任务列表
 * @param {number} totalFileCount - 总文件数量
 * @param {number} totalImageCount - 总图片数量
 * @return {Promise<boolean>} 用户是否确认执行任务
 * @async
 */
async function showPreviewAndConfirm(
  absoluteConfigPath: string,
  copyTasks: Array<{ sourcePath: string; targetPath: string; fileCount: number }>,
  imageCopyTasks: Array<{ sourcePath: string; targetPath: string; fileCount: number }>,
  totalFileCount: number,
  totalImageCount: number
): Promise<boolean> {
  // 打印所有需要复制的信息
  console.log("\n" + "=".repeat(50));
  console.log("📋 文档复制任务预览");
  console.log("=".repeat(50));
  console.log(`📄 配置文件路径:`);
  console.log(`   ${absoluteConfigPath}`);
  console.log(`\n📂 复制任务详情:`);
  for (const [index, task] of copyTasks.entries()) {
    console.log(`   ${index + 1}. 源路径  :    ${task.sourcePath}`);
    console.log(`      目标路径:    ${task.targetPath}`);
    console.log(`      文件数量:    ${task.fileCount}`);
  }
  console.log(`\n📊 统计信息:`);
  console.log(`   总文件数量:    ${totalFileCount}`);
  console.log(`   拥有图片资源的文档数量:    ${totalImageCount}`);
  console.log("=".repeat(50) + "\n");

  // 提示用户确认
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question("⚠️  请确认是否执行以上文档复制任务? (y/N) ", (answer: string) => {
        resolve(answer.trim().toLowerCase());
      });
    });

    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

/**
 * @brief 读取配置文件
 * @param {string} absoluteConfigPath - 配置文件绝对路径
 * @return {Promise<Record<string, string>>} 配置对象
 * @throws {Error} 当读取配置文件失败时抛出异常
 * @async
 */
async function loadConfig(absoluteConfigPath: string): Promise<Record<string, string>> {
  // 读取配置文件
  // export default {
  //   "media-docs/sdoc": "media-docs/src/sdoc", // 01-图像
  //   "aaa-docs/sdoc": "aaa-docs/src/sdoc" // 01-图像
  // };
  let config: Record<string, string>;
  try {
    if (absoluteConfigPath.endsWith(".js")) {
      // 动态导入JS文件
      const loadedConfig = await import(absoluteConfigPath);
      config = loadedConfig.default || loadedConfig;
    } else {
      throw new Error(`📄 配置文件必须是.js类型: ${absoluteConfigPath}`);
    }
  } catch (err) {
    throw new Error(`📄 读取配置文件失败: ${absoluteConfigPath}\n${(err as Error).message}`);
  }

  return config;
}

/**
 * @brief 统一错误处理函数
 * @param {string} message - 错误信息
 * @param {Error} [error] - 错误对象
 * @return {void}
 */
function handleError(message: string, error?: Error): void {
  console.error(`❌ ${message}`, error ? error.message : "");
  process.exit(1);
}

/**
 * @brief 将相对图片路径转换为OSS绝对路径
 * @param {string} imgPath - 图片相对路径
 * @param {string} relativePath - 文件相对路径
 * @param {string} rootDirName - 根目录名称
 * @return {string} OSS绝对路径
 */
function convertImagePathToOSS(imgPath: string, relativePath: string, rootDirName: string): string {
  // 移除 relativePath 中的 src/sdoc 部分
  const normalizedRelativePath = relativePath.split(path.sep).join("/");
  const dirPath = path.dirname(normalizedRelativePath);
  // 去掉前两级 src/sdoc
  const pathParts = dirPath.split("/");
  if (pathParts.length > 2) {
    pathParts.splice(0, 2); // 去掉前两级
  }
  const adjustedDirPath = pathParts.join("/");
  const normalizedImgPath = (imgPath.startsWith("./") ? imgPath.substring(2) : imgPath).split(path.sep).join("/");
  return `${OSS_BASE_URL}${rootDirName}/${adjustedDirPath}/${normalizedImgPath}`;
}

/**
 * @brief 根据配置文件复制文档
 * @param {string} configPath - 配置文件路径
 * @param {CommandOptions} [options] - 命令行选项
 * @return {Promise<void>} 无返回值
 * @throws {Error} 当复制失败时抛出异常
 * @async
 */
async function moveDocs(configPath: string, options: CommandOptions = {}): Promise<void> {
  try {
    // 1. 确定配置文件路径
    let absoluteConfigPath: string;
    if (path.isAbsolute(configPath)) {
      absoluteConfigPath = configPath;
    } else {
      absoluteConfigPath = path.join(process.cwd(), configPath);
    }

    // 2. 检查配置文件是否存在
    if (!fs.existsSync(absoluteConfigPath)) {
      throw new Error(`📄 配置文件不存在: ${absoluteConfigPath}`);
    }

    // 3. 读取配置文件
    const config = await loadConfig(absoluteConfigPath);

    // 4. 获取配置文件所在目录
    const configDir = path.dirname(absoluteConfigPath);

    // 5. 收集所有需要复制的文件信息
    const copyTasks: Array<{ sourcePath: string; targetPath: string; fileCount: number }> = [];
    const imageCopyTasks: Array<{ sourcePath: string; targetPath: string; fileCount: number }> = [];
    let totalFileCount = 0;
    let totalImageCount = 0;

    // 6. 遍历配置文件中的映射关系
    for (const [sourceDir, targetDir] of Object.entries(config)) {
      // 7. 构建源目录和目标目录的完整路径
      // 源路径：配置文件目录 + sourceDir
      const sourcePath = path.join(configDir, sourceDir);

      // 目标路径：配置文件目录的上级目录 + targetDir
      // 配置文件路径：D:\sumu_blog\sumu-docs\folder.config.js
      // 配置文件目录：D:\sumu_blog\sumu-docs
      // 配置文件目录的上级目录：D:\sumu_blog
      // 目标路径：D:\sumu_blog\media-docs\src\sdoc
      const configParentDir = path.dirname(configDir); // D:\sumu_blog

      const relativeTargetPath = path.join(targetDir);
      const targetPath = path.join(configParentDir, relativeTargetPath);

      // 图片目标路径：源路径同级目录的img目录，直接复制sdoc为img
      const imageTargetPath = path.join(configDir, sourceDir.replace(/sdoc$/, "img"));

      // 8. 检查源目录是否存在
      if (!fs.existsSync(sourcePath)) {
        console.warn(`⚠️  📂 源目录不存在，跳过: ${sourcePath}`);
        continue;
      }

      // 9. 计算文件数量（不实际复制）
      const counts = await countFilesAndDocsWithImageResources(sourcePath, true); // 同时计算markdown文件数量和拥有图片资源目录的文档数量
      const fileCount = counts.fileCount;
      const imageCount = counts.imageResourceDocCount;
      totalFileCount += fileCount;
      totalImageCount += imageCount;

      // 10. 添加到复制任务列表
      copyTasks.push({ sourcePath, targetPath, fileCount });
      imageCopyTasks.push({ sourcePath, targetPath: imageTargetPath, fileCount: imageCount });
    }

    // 11. 显示任务预览并等待用户确认
    const isConfirmed = await showPreviewAndConfirm(
      absoluteConfigPath,
      copyTasks,
      imageCopyTasks,
      totalFileCount,
      totalImageCount
    );

    if (!isConfirmed) {
      console.log("❌ 文档复制任务已取消");
      return;
    }

    // 13. 执行文档复制操作
    await executeDocumentCopy(copyTasks, options);

    // 14. 执行图片资源复制操作
    await executeImageCopy(imageCopyTasks);

    console.log("🎉 所有文档和图片资源复制任务已完成！");
  } catch (err) {
    handleError("复制文档失败:", err as Error);
  }
}

/**
 * @brief 递归复制文件并计数
 * @param {string} sourceDir - 源目录
 * @param {string} targetDir - 目标目录
 * @param {boolean} force - 是否强制覆盖
 * @return {Promise<number>} 复制的文件数量
 * @async
 */
async function copyMarkdownFiles(
  sourceDir: string,
  targetDir: string,
  force: boolean = false,
  skippedFiles: { count: number } = { count: 0 }
): Promise<number> {
  const files = fs.readdirSync(sourceDir, { withFileTypes: true });
  let fileCount = 0;

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      // 检查是否有同名的markdown文件
      const correspondingMdFile = path.join(sourceDir, `${file.name}.md`);
      if (fs.existsSync(correspondingMdFile)) {
        continue; // 跳过存在同名markdown文件的目录
      }

      // 如果是目录，递归处理
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      const dirFileCount = await copyMarkdownFiles(sourcePath, targetPath, force, skippedFiles);
      fileCount += dirFileCount;
    } else {
      // 如果是文件，检查是否为markdown文件
      if (!file.name.endsWith(".md")) {
        continue; // 跳过非markdown文件
      }

      // 检查是否需要覆盖
      if (fs.existsSync(targetPath) && !force) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        try {
          const overwrite = await new Promise<boolean>((resolve) => {
            rl.question(`⚠️  文件已存在: ${targetPath} 是否覆盖? (y/N) `, (answer: string) => {
              resolve(answer.trim().toLowerCase() === "y");
            });
          });

          if (!overwrite) {
            continue;
          }
        } finally {
          rl.close();
        }
      }

      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);

      // 处理复制后的文件中的图片路径
      await convertImagePathsToOSS(targetPath, skippedFiles);
      fileCount++;
    }
  }

  return fileCount;
}

/**
 * @brief 递归复制目录
 * @param {string} sourceDir - 源目录
 * @param {string} targetDir - 目标目录
 * @return {Promise<void>} 无返回值
 * @async
 */
async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  const files = fs.readdirSync(sourceDir, { withFileTypes: true });

  // 确保目标目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      // 递归复制子目录
      await copyDirectory(sourcePath, targetPath);
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * @brief 递归删除非图片文件
 * @param {string} targetDir - 目标目录
 * @return {Promise<number>} 删除的文件数量
 * @async
 */
async function deleteNonImageFiles(targetDir: string): Promise<number> {
  // 检查目录是否存在
  if (!fs.existsSync(targetDir)) {
    return 0;
  }

  const files = fs.readdirSync(targetDir, { withFileTypes: true });
  let deletedCount = 0;

  for (const file of files) {
    const targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      // 递归处理子目录
      const dirDeletedCount = await deleteNonImageFiles(targetPath);
      deletedCount += dirDeletedCount;

      // 检查子目录是否为空，如果为空则删除
      if (fs.existsSync(targetPath)) {
        const subFiles = fs.readdirSync(targetPath);
        if (subFiles.length === 0) {
          fs.rmdirSync(targetPath);
        }
      }
    } else {
      // 检查文件是否为图片文件
      const isImage = IMAGE_EXTENSIONS.has(path.extname(file.name).toLowerCase());

      // 如果不是图片文件，删除
      if (!isImage) {
        fs.unlinkSync(targetPath);
        deletedCount++;
      }
    }
  }

  return deletedCount;
}

/**
 * @brief 处理markdown文件中的图片路径，转换为OSS绝对路径
 * @param {string} filePath markdown文件路径
 * @return {Promise<void>} 无返回值
 * @async
 */
async function convertImagePathsToOSS(filePath: string, skippedFiles: { count: number } = { count: 0 }): Promise<void> {
  try {
    // 检查是否在git仓库中
    const git = simpleGit(path.dirname(filePath));
    let relativePath: string;
    let rootDirName: string;

    try {
      const rootPath = await git.revparse(["--show-toplevel"]);
      relativePath = path.relative(rootPath.trim(), filePath);
      rootDirName = path.basename(rootPath.trim());
    } catch {
      // 如果不是git仓库，跳过图片处理
      skippedFiles.count++;
      return;
    }

    // 创建readline接口来逐行读取文件
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    });

    const outputLines: string[] = [];

    // 处理每行内容
    rl.on("line", (line: string) => {
      // 处理Markdown图片语法: ![alt text](image-path)
      line = line.replace(/!\[.*?\]\((?!http)([^)]+)\)/g, (match: string, p1: string) => {
        if (!p1.startsWith("http")) {
          const ossPath = convertImagePathToOSS(p1, relativePath, rootDirName);
          return match.replace(p1, ossPath);
        }
        return match;
      });

      // 处理HTML图片标签: <img src="image-path">
      line = line.replace(/<img\s+[^>]*src="(?!http)([^"]+)"[^>]*>/g, (match: string, p1: string) => {
        if (!p1.startsWith("http")) {
          const ossPath = convertImagePathToOSS(p1, relativePath, rootDirName);
          return match.replace(p1, ossPath);
        }
        return match;
      });

      outputLines.push(line);
    });

    // 文件读取完成时写回
    rl.on("close", () => {
      fs.writeFileSync(filePath, outputLines.join("\n"), "utf8");
    });

    await new Promise<void>((resolve, reject) => {
      rl.on("close", resolve);
      rl.on("error", reject);
    });
  } catch (err) {
    console.warn(`⚠️  🖼️ 处理文件图片路径失败: ${filePath}\n${(err as Error).message}`);
  }
}

/**
 * @brief 创建m:d命令
 * @return {Command} 配置好的Command实例
 */
function createMdCommand(): Command {
  const program = new Command("m:d")
    .description("根据配置文件复制文档")
    .argument("<config-path>", "配置文件路径")
    .option("-f, --force", "强制覆盖已存在的文件")
    .action(async (configPath: string, options: CommandOptions) => {
      try {
        await moveDocs(configPath, options);
      } catch (err) {
        handleError("复制文档失败:", err as Error);
      }
    });

  return program;
}

export { moveDocs, createMdCommand };
