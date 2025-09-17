/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_img.ts
 * Author     : 苏木
 * Date       : 2025-06-18
 * Version    :
 * Description: 处理markdown文件中的图片路径
 * 支持三种模式:
 * 1. 单文件模式: tdoc img xxx.md
 * 2. 目录模式: tdoc img -d xxx (处理git修改/新增的.md文件)
 * 3. 转换模式: tdoc img -t xxx.md 或 tdoc img -t -d xxx (转换图片路径为OSS绝对路径)
 * 4. 递归模式: tdoc img -d xxx -a (处理指定目录及其子目录中所有git修改/新增的.md文件)
 * ======================================================
 */

import fs from "fs";
import readline from "readline";
import path from "path";
import simpleGit from "simple-git";
import { Command } from "commander";

const OSS_BASE_URL = "https://fanhua-picture.oss-cn-hangzhou.aliyuncs.com/";

interface CommandOptions {
  dir?: boolean;
  all?: boolean;
  transform?: boolean;
  debug?: boolean;
}

/**
 * @brief 检查是否为有效的git仓库
 * @param {string} dirPath 目录路径
 * @return {Promise<string>} git根目录路径
 */
async function validateGitRepository(dirPath: string): Promise<string> {
  const git = simpleGit(dirPath);

  try {
    await git.status();
    const rootPath = await git.revparse(["--show-toplevel"]);
    return rootPath.trim();
  } catch {
    throw new Error(`当前目录不是有效的git仓库: ${dirPath}`);
  }
}

/**
 * @brief 获取git状态中的markdown文件
 * @param {string} dirPath 目录路径
 * @param {boolean} recursive 是否递归处理子目录
 * @return {Promise<string[]>} markdown文件路径数组
 */
async function getGitMarkdownFiles(dirPath: string, recursive: boolean = false): Promise<string[]> {
  const git = simpleGit(dirPath);

  const rootDir = await validateGitRepository(dirPath);
  const status = await git.status();

  // 合并修改和未跟踪的文件
  const allFiles = [...status.modified, ...status.not_added, ...status.created];

  return allFiles
    .filter((file) => {
      // 只处理.md文件
      if (!file.endsWith(".md")) {
        return false;
      }

      // 检查文件是否存在
      const fullPath = path.resolve(rootDir, file);
      if (!fs.existsSync(fullPath)) {
        return false;
      }
      if (recursive) {
        // 递归模式：检查文件是否在指定目录或其子目录下
        const targetDir = path.resolve(dirPath);
        return fullPath.startsWith(targetDir);
      } else {
        // 非递归模式：检查文件是否在指定目录下（不包括子目录）
        const fileRelativePath = path.relative(rootDir, file);
        const targetRelativePath = path.relative(rootDir, dirPath);

        // 如果文件在目标目录下，且不在子目录中
        if (targetRelativePath === ".") {
          // 目标目录是git根目录，文件应该直接在根目录下（不含路径分隔符）
          return !fileRelativePath.includes(path.sep);
        } else {
          // 目标目录不是git根目录，文件应该在目标目录下且直接在该目录中
          return (
            fileRelativePath.startsWith(targetRelativePath) && path.dirname(fileRelativePath) === targetRelativePath
          );
        }
      }
    })
    .map((file) => path.resolve(rootDir, file));
}

/**
 * @brief 处理markdown文件中的图片路径
 * @param {string} filePath markdown文件路径
 * @param {boolean} debugMode 是否启用调试模式
 * @param {boolean} transformMode 是否启用转换模式
 * @return {Promise<void>} 无返回值
 */
async function processImagePaths(filePath: string, debugMode = false, transformMode = false): Promise<void> {
  // 如果是转换模式，提前获取相对路径和根目录名
  let relativePath = "";
  let rootDirName = "";
  if (transformMode) {
    try {
      const git = simpleGit(path.dirname(filePath));
      const rootPath = await git.revparse(["--show-toplevel"]);
      relativePath = path.relative(rootPath.trim(), filePath);
      rootDirName = path.basename(rootPath.trim());
    } catch (err) {
      console.error(`❌ 获取git信息失败: ${err}`);
      process.exit(1);
    }
  }

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    });

    const outputLines: string[] = [];
    let totalImages = 0;
    let processedImages = 0;

    /**
     * 处理图片路径（通用函数）
     * @param {string} line 文件行内容
     * @param {RegExp} regex 正则表达式
     * @param {(match: string, p1: string) => string} replacer 替换函数
     * @return {string} 处理后的行内容
     */
    const processLine = (line: string, regex: RegExp, replacer: (match: string, p1: string) => string): string => {
      return line.replace(regex, replacer);
    };

    // Markdown图片语法处理函数
    const processMarkdownImage = (match: string, p1: string): string => {
      if (!p1.startsWith("http") && !p1.startsWith("/") && !p1.match(/^[a-zA-Z]:[\\/]/)) {
        totalImages++;
      }

      if (transformMode && !p1.startsWith("http")) {
        // 转换模式：替换为OSS绝对路径
        const dirPath = path.dirname(relativePath).split(path.sep).join("/");
        const imgPath = (p1.startsWith("./") ? p1.substring(2) : p1).split(path.sep).join("/");
        const ossPath = `${OSS_BASE_URL}${rootDirName}/${dirPath}/${imgPath}`;

        processedImages++;
        if (debugMode) {
          console.log("🖼️  图片路径转换: %s → %s", p1, ossPath);
        }
        return match.replace(p1, ossPath);
      } else if (!transformMode && !p1.startsWith("./") && !p1.startsWith("http")) {
        // 原有模式：添加'./'前缀
        processedImages++;
        if (debugMode) {
          console.log(`🖼️  图片路径优化: ${p1} → ./${p1}`);
        }
        return match.replace(p1, `./${p1}`);
      }

      return match;
    };

    // HTML图片标签处理函数
    const processHtmlImage = (match: string, p1: string): string => {
      if (!p1.startsWith("http") && !p1.startsWith("/") && !p1.match(/^[a-zA-Z]:[\\/]/)) {
        totalImages++;
      }

      if (transformMode && !p1.startsWith("http")) {
        // 转换模式：替换为OSS绝对路径
        const dirPath = path.dirname(relativePath).split(path.sep).join("/");
        const imgPath = (p1.startsWith("./") ? p1.substring(2) : p1).split(path.sep).join("/");
        const ossPath = `${OSS_BASE_URL}${rootDirName}/${dirPath}/${imgPath}`;

        processedImages++;
        if (debugMode) {
          console.log(`🖼️  HTML图片路径转换: ${p1} → ${ossPath}`);
        }
        return match.replace(p1, ossPath);
      } else if (!transformMode && !p1.startsWith("./") && !p1.startsWith("http")) {
        // 原有模式：添加'./'前缀
        processedImages++;
        if (debugMode) {
          console.log(`🖼️  HTML图片路径优化: ${p1} → ./${p1}`);
        }
        return match.replace(p1, `./${p1}`);
      }

      return match;
    };

    rl.on("line", (line: string) => {
      // 处理Markdown图片语法: ![alt text](image-path)
      line = processLine(line, /!\[.*?\]\((?!http)([^)]+)\)/g, processMarkdownImage);

      // 处理HTML图片标签: <img src="image-path">
      line = processLine(line, /<img\s+[^>]*src="(?!http)([^"]+)"[^>]*>/g, processHtmlImage);

      outputLines.push(line);
    });

    rl.on("close", () => {
      fs.writeFile(filePath, outputLines.join("\n"), (err: NodeJS.ErrnoException | null) => {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ 图片路径处理完成: ${filePath}`);
          if (debugMode) {
            console.log(`📊 共检测到 ${totalImages} 个图片链接，优化了 ${processedImages} 个相对路径`);
          }
          resolve();
        }
      });
    });

    rl.on("error", (err: Error) => {
      reject(err);
    });
  });
}

/**
 * @brief 统一的目录处理函数
 * @param {string} dirPath 目录路径
 * @param {boolean} recursive 是否递归处理子目录
 * @param {boolean} debugMode 是否启用调试模式
 * @param {boolean} transformMode 是否启用转换模式
 * @return {Promise<void>} 无返回值
 */
async function processDirectoryFiles(
  dirPath: string,
  recursive: boolean,
  debugMode: boolean,
  transformMode: boolean
): Promise<void> {
  try {
    const mdFiles = await getGitMarkdownFiles(dirPath, recursive);

    if (mdFiles.length === 0) {
      console.log("📋 没有找到需要处理的markdown文件");
      process.exit(0);
      return;
    }

    // 打印将要处理的文件列表
    console.log("📋 将要处理的文件:");
    mdFiles.forEach((file) => {
      const relativePath = path.relative(dirPath, file);
      console.log(`  - ${relativePath}`);
    });

    // 处理每个.md文件
    for (const file of mdFiles) {
      const relativePath = path.relative(dirPath, file);
      console.log(`🔄 正在处理: ${relativePath}`);
      await processImagePaths(file, debugMode, transformMode);
      console.log(" ");
    }

    console.log(`📊 目录处理完成，共处理 ${mdFiles.length} 个文件: ${dirPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ 目录处理失败: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

/**
 * @brief 根据参数选择处理模式
 * @param {string[]} args 命令行参数
 */
async function main(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error("❌ 请提供文件路径或目录路径");
    process.exit(1);
  }

  // 解析参数
  const options = {
    debug: false,
    transform: false,
    all: false,
    dir: false
  };

  // 解析参数（避免修改原数组）
  const parsedArgs = [...args];

  const debugIndex = parsedArgs.indexOf("--debug");
  if (debugIndex !== -1) {
    options.debug = true;
    parsedArgs.splice(debugIndex, 1);
  }

  const transformIndex = parsedArgs.indexOf("-t");
  if (transformIndex !== -1) {
    options.transform = true;
    parsedArgs.splice(transformIndex, 1);
  }

  const allIndex = parsedArgs.indexOf("-a");
  if (allIndex !== -1) {
    options.all = true;
    parsedArgs.splice(allIndex, 1);
  }

  const dirIndex = parsedArgs.indexOf("-d");
  if (dirIndex !== -1 && parsedArgs[dirIndex + 1]) {
    options.dir = true;
    const dirPath = parsedArgs[dirIndex + 1];

    if (options.all) {
      // 递归处理模式
      await processDirectoryFiles(dirPath, true, options.debug, options.transform);
    } else {
      // 单目录处理模式
      await processDirectoryFiles(dirPath, false, options.debug, options.transform);
    }
  } else if (parsedArgs[0].endsWith(".md")) {
    // 单文件处理模式
    await processImagePaths(parsedArgs[0], options.debug, options.transform);
  } else {
    console.error("❌ 无效参数");
    process.exit(1);
  }
}

/**
 * @brief 创建img命令
 * @return {Command} 配置好的Command实例
 */
function createImgCommand(): Command {
  const program = new Command("img")
    .description("处理markdown文件中的图片路径")
    .argument("[path]", "文件或目录路径")
    .option("-d, --dir <path>", "处理目录中git修改/新增的markdown文件")
    .option("-a, --all", "处理指定目录及其子目录中所有git修改/新增的markdown文件")
    .option("-t, --transform", "转换图片路径为OSS绝对路径")
    .option("--debug", "显示详细处理信息")
    .action(async (pathArg, options: CommandOptions) => {
      try {
        const args = [];

        if (options.dir) {
          args.push("-d");
          args.push(options.dir);
        }

        if (options.all) {
          args.push("-a");
        }

        if (options.transform) {
          args.push("-t");
        }

        if (pathArg) {
          args.push(pathArg);
        }

        if (options.debug) {
          args.push("--debug");
        }

        await main(args);
      } catch (err) {
        console.error("❌ 处理图片路径失败:", (err as Error).message);
        process.exit(1);
      }
    });

  return program;
}

export { createImgCommand };
