#!/usr/bin/env node
/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_git_submodule.ts
 * Author     : 苏木
 * Date       : 2025-06-18
 * Version    :
 * Description: 检查并转换git子模块URL格式
 * ======================================================
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * @brief Checks if a directory is a valid git repository
 * @param {string} dirPath - Path to directory to check
 * @return {boolean} True if valid git repo, false otherwise
 */
function isGitRepository(dirPath: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: dirPath,
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * @brief Converts git SSH URLs to HTTPS format in .gitmodules
 * @param {string} gitmodulesPath - Path to .gitmodules file
 * @return {object} {modified: boolean, content: string}
 */
function convertSubmoduleUrls(gitmodulesPath: string): {
  modified: boolean;
  content: string;
} {
  const gitmodules = fs.readFileSync(gitmodulesPath, 'utf8');
  const urlRegex = /url\s*=\s*(git@github\.com:([^/]+)\/([^.]+)\.git)/g;
  let modified = false;

  const newContent = gitmodules.replace(
    urlRegex,
    (match, fullUrl, user, repo) => {
      const newUrl = `https://github.com/${user}/${repo}.git`;
      console.log(`${fullUrl} ---> ${newUrl}`);
      modified = true;
      return `url = ${newUrl}`;
    }
  );

  return { modified, content: newContent };
}

/**
 * @brief Main handler for git-submodule command
 * @param {string} dir - Directory path to process
 */
function handleGitSubmodule(dir: string): void {
  if (!dir) {
    console.error('错误：请指定要检查的目录');
    process.exit(1);
  }

  const targetDir = path.resolve(dir);
  if (!fs.existsSync(targetDir)) {
    console.error(`错误：目录 ${targetDir} 不存在`);
    process.exit(1);
  }

  if (!isGitRepository(targetDir)) {
    console.error(`× ${targetDir} 不是git仓库`);
    process.exit(1);
  }

  console.log(`✓ ${targetDir} 是git仓库`);

  const gitmodulesPath = path.join(targetDir, '.gitmodules');
  if (!fs.existsSync(gitmodulesPath)) {
    console.log('没有找到子模块');
    process.exit(0);
  }

  console.log('发现子模块，开始检查URL...');
  const { modified, content } = convertSubmoduleUrls(gitmodulesPath);

  if (modified) {
    fs.writeFileSync(gitmodulesPath, content);
    console.log('✓ 子模块URL已更新');
    console.log('\n请执行以下命令完成同步:');
    console.log('1. git submodule sync');
    console.log('2. git submodule update --init --recursive');
    console.log('3. git add .gitmodules');
    console.log('4. git commit -m "Update submodule URLs"');
  } else {
    console.log('没有需要修改的子模块URL');
  }
  process.exit(0);
}

export default {
  command: 'git-submodule [dir]',
  description: '检查并转换git子模块URL格式',
  handler: handleGitSubmodule
};
