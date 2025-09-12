/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : tree.ts
 * Author     : 苏木
 * Date       : 2025-06-18
 * Version    :
 * Description: 实现sdoc tree命令，打印目录树结构
 * ======================================================
 */
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import color from 'picocolors';

interface TreeCounts {
  dirCount: number;
  fileCount: number;
}

interface TreeOptions {
  level?: number;
  ignore?: string[] | string; // 可以是数组或逗号分隔的字符串
}

/**
 * @brief 生成目录树结构并统计文件/文件夹数量
 * @param {string} dirPath 要遍历的目录路径
 * @param {string} [prefix=''] 当前层级的前缀字符串，用于缩进和连接线
 * @param {number} [maxDepth=Infinity] 最大递归深度限制
 * @param {number} [currentDepth=0] 当前递归深度
 * @param {string[]} [ignoreDirs=[]] 要忽略的目录列表
 * @return {Object} 包含文件夹和文件数量的统计对象 {dirCount: number, fileCount: number}
 */
function generateTree(
  dirPath: string,
  prefix: string = '',
  maxDepth: number = Infinity,
  currentDepth: number = 0,
  ignoreDirs: string[] = []
): TreeCounts {
  // 同步读取目录内容
  const files = fs.readdirSync(dirPath);
  let dirCount = 0;
  let fileCount = 0;

  // 遍历目录中的每个文件/子目录
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath); // 获取文件状态信息
    // 跳过忽略的目录
    if (stats.isDirectory() && ignoreDirs.includes(file)) {
      continue;
    }
    const isCurrentLast = index === files.length - 1; // 检查是否是当前目录中的最后一项

    // 构建当前项的连接线
    let line = prefix; // 继承父级前缀
    line += isCurrentLast ? '└── ' : '├── '; // 添加当前项连接符号
    // 根据是目录还是文件使用不同颜色
    line += stats.isDirectory() ? color.blue(file) : color.green(file); // 添加文件名

    console.log(line); // 输出当前项

    // 统计文件/文件夹数量
    if (stats.isDirectory()) {
      dirCount++;
      // 如果是目录且未达到最大深度限制，则递归处理
      if (currentDepth < maxDepth - 1) {
        // 为子目录项计算前缀：添加适当的缩进和连接线
        const childPrefix = prefix + (isCurrentLast ? '    ' : '│   ');
        const subCounts = generateTree(
          fullPath,
          childPrefix,
          maxDepth,
          currentDepth + 1
        );
        dirCount += subCounts.dirCount;
        fileCount += subCounts.fileCount;
      }
    } else {
      fileCount++;
    }
  }

  return { dirCount, fileCount };
}

/**
 * @brief 执行tree命令的主函数
 * @param {Object} [options={}] 命令行选项对象
 * @param {number} [options.level] 最大目录深度限制
 * @return {void} 无返回值
 * @note 执行成功时退出码为0，失败时为1
 */
function main(options: TreeOptions = {}): void {
  try {
    const currentDir = process.cwd();
    console.log(path.basename(currentDir));
    // 处理 ignore 参数，支持字符串和数组格式
    const ignoreDirs =
      typeof options.ignore === 'string'
        ? options.ignore.split(',').map((s) => s.trim()) // 将逗号分隔的字符串转换为数组
        : options.ignore || []; // 如果已经是数组则直接使用，否则使用空数组
    const counts = generateTree(
      currentDir,
      '',
      options.level || Infinity,
      0,
      ignoreDirs
    );
    console.log(`\n${counts.dirCount} directories, ${counts.fileCount} files`);
    process.exit(0); // 确保程序正常退出
  } catch (err) {
    console.error('执行tree命令出错:', err);
    process.exit(1);
  }
}

/**
 * @brief 模块导出对象
 * @property {function} generateTree 生成目录树结构的函数
 * @property {function} main 执行tree命令的主函数
 */
export default {
  generateTree,
  main
};

/**
 * @brief 注册tree命令到program实例
 * @param {Command} program commander的Command实例
 * @return {void} 无返回值
 */
export function registerTreeCommand(program: Command): void {
  // 添加显示目录树结构的命令
  program
    .command('tree')
    .description('显示当前目录的树状结构')
    .option('-L, --level <number>', '设置最大递归深度', parseInt)
    .option('-i, --ignore <dirs>', '要忽略的目录列表(逗号分隔)', String)
    .action((options: TreeOptions) => {
      try {
        main(options);
      } catch (err) {
        console.error('❌ 显示目录树失败:', (err as Error).message);
        process.exit(1);
      }
    });
}

/**
 * @brief 直接执行检查
 * @description 当文件被直接执行而非require导入时，自动运行main函数
 */
if (require.main === module) {
  main();
}
