/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : index.ts
 * Author     : 苏木
 * Date       : 2025-06-17
 * Version    : 
 * Description: 
 * ======================================================
 */

import { Command } from 'commander'
import pkg from '../package.json'

/** 
 * @brief 创建commander的Command实例 
 */
const program = new Command(pkg.name);

/**
 * @brief 从package.json中提取项目版本和开发依赖信息
 * @returns {string} 格式化的版本信息字符串，包含:
 *                  - 项目名称和版本
 *                  - 所有开发依赖项及其版本(每行一个依赖)
 * @details 函数处理流程:
 *          1. 使用Object.entries()获取devDependencies的键值对数组
 *          2. 使用map()将每个依赖项格式化为"name: version"字符串
 *          3. 使用join('\n')将所有依赖项合并为多行字符串
 *          4. 返回包含项目名称、版本和格式化依赖信息的完整字符串
 * @example 返回格式示例:
 *          my-project: 1.0.0
 *          
 *          devDependencies:
 *            typescript: ^4.0.0
 *            eslint: ^7.0.0
 */
function getVersionInfo(): string {
  const depsInfo = Object.entries(pkg.devDependencies)
    .map(([name, version]) => `  ${name}: ${version}`)
    .join('\n');
  return `${pkg.name}: ${pkg.version}\n\ndevDependencies:\n${depsInfo}`;
}

program.version(
  getVersionInfo(),
  '-v, --version',
  '显示版本信息和依赖包'
);

program.parse(); // 参数处理
