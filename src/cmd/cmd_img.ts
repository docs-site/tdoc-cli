/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_img.ts
 * Author     : 苏木
 * Date       : 2025-06-18
 * Version    :
 * Description: 处理markdown文件中的图片路径
 * 支持两种模式:
 * 1. 单文件模式: tdoc img xxx.md
 * 2. 目录模式: tdoc img -d xxx (处理git修改/新增的.md文件)
 * ======================================================
 */
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import simpleGit from 'simple-git';

/**
 * @brief 处理markdown文件中的图片路径
 * @param {string} filePath markdown文件路径
 * @return {Promise<void>} 无返回值
 */
async function processImagePaths(filePath: string): Promise<void> {
  // 创建并返回Promise来处理异步文件操作
  return new Promise((resolve, reject) => {
    // 创建readline接口来逐行读取文件
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath), // 文件输入流
      output: process.stdout, // 控制台输出
      terminal: false // 禁用终端控制字符
    });

    // 从文件路径中提取目录名(不含.md扩展名)
    // const dirName = path.basename(filePath, '.md');
    // 存储处理后的行内容
    const outputLines: string[] = [];

    // 处理每行内容的回调函数
    rl.on('line', (line: string) => {
      /**
       * 处理Markdown图片语法: ![alt text](image-path)
       * 正则表达式说明:
       * - !\[.*?\] : 匹配![alt text](非贪婪匹配)
       * - \((?!http)([^)]+)\) : 匹配(path)但排除http(s)路径
       * - 回调函数检查路径是否需要添加'./'前缀
       */
      line = line.replace(
        /!\[.*?\]\((?!http)([^)]+)\)/g,
        (match: string, p1: string) => {
          if (!p1.startsWith('./') && !p1.startsWith('http')) {
            return match.replace(p1, `./${p1}`); // 添加'./'前缀
          }
          return match; // 如果已有前缀或是http路径则保持不变
        }
      );

      /**
       * 处理HTML图片标签: <img src="image-path">
       * 正则表达式说明:
       * - <img\s+ : 匹配<img后跟空白字符
       * - [^>]* : 匹配除'>'外的任意字符
       * - src="(?!http)([^"]+)" : 匹配src="path"但排除http(s)路径
       * - [^>]*> : 匹配剩余属性和结束标签'>'
       * - 回调函数检查路径是否需要添加'./'前缀
       */
      line = line.replace(
        /<img\s+[^>]*src="(?!http)([^"]+)"[^>]*>/g,
        (match: string, p1: string) => {
          if (!p1.startsWith('./') && !p1.startsWith('http')) {
            return match.replace(p1, `./${p1}`); // 添加'./'前缀
          }
          return match; // 如果已有前缀或是http路径则保持不变
        }
      );

      // 将处理后的行添加到输出数组
      outputLines.push(line);
    });

    // 文件读取完成时的回调
    rl.on('close', () => {
      // 将所有处理后的行写回原文件
      fs.writeFile(
        filePath,
        outputLines.join('\n'),
        (err: NodeJS.ErrnoException | null) => {
          if (err) {
            reject(err); // 写入失败时拒绝Promise
          } else {
            // 打印成功信息
            console.log(`✅ 图片路径处理完成: ${filePath}`);
            resolve(); // 成功时解决Promise
          }
        }
      );
    });

    // 读取错误时的回调
    rl.on('error', (err: Error) => {
      reject(err);
    });
  });
}

/**
 * @brief 处理目录中git修改/新增的markdown文件
 * @param {string} dirPath 目录路径
 * @return {Promise<void>} 无返回值
 */
async function processDirectory(dirPath: string): Promise<void> {
  const git = simpleGit(dirPath);

  try {
    // 获取当前目录相对于git根目录的路径
    const rootPath = await git.revparse(['--show-toplevel']);
    const relativePath = path.relative(rootPath.trim(), dirPath);

    // 获取git状态信息（仅包含当前目录下的文件）
    const status = await git.status();

    // 合并修改和未跟踪的文件，并过滤出当前目录下的.md文件
    const mdFiles = [...status.modified, ...status.not_added, ...status.created]
      .filter((file) => {
        // 只处理当前目录下的.md文件
        const filePath = path.normalize(file);
        const inTargetDir =
          relativePath === '.'
            ? !filePath.includes(path.sep)
            : filePath.startsWith(relativePath + path.sep) &&
              filePath.split(path.sep).length ===
                relativePath.split(path.sep).length + 1;

        return (
          file.endsWith('.md') &&
          inTargetDir &&
          fs.existsSync(path.join(dirPath, path.basename(file)))
        );
      })
      .map((file) => path.basename(file));

    // 打印将要处理的文件列表
    console.log('📋 将要处理的文件:');
    mdFiles.forEach((file) => console.log(`  - ${file}`));

    // 处理每个.md文件
    for (const file of mdFiles) {
      const fullPath = path.join(dirPath, file);
      console.log(`🔄 正在处理: ${file}`);
      await processImagePaths(fullPath);
    }

    console.log(`✅ 目录处理完成，共处理 ${mdFiles.length} 个文件: ${dirPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ 目录处理失败: ${err}`);
    process.exit(1);
  }
}

/**
 * @brief 根据参数选择处理模式
 * @param {string[]} args 命令行参数
 */
async function main(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error('❌ 请提供文件路径或目录路径');
    process.exit(1);
  }

  if (args[0] === '-d' && args[1]) {
    await processDirectory(args[1]);
  } else if (args[0].endsWith('.md')) {
    await processImagePaths(args[0]);
  } else {
    console.error('❌ 无效参数');
    process.exit(1);
  }
}

export { processImagePaths, processDirectory, main };
