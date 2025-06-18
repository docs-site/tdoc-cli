/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_img.ts
 * Author     : 苏木
 * Date       : 2025-06-18
 * Version    :
 * Description: 处理markdown文件中的图片路径
 * ======================================================
 */
import fs from 'fs';
import readline from 'readline';

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
            process.exit(0); // 处理完成后退出程序
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

export { processImagePaths };
