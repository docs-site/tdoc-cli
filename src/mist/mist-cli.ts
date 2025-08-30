/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : mist-cli.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: 实现mist相关的命令
 * ======================================================
 */

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { input, confirm } from '@inquirer/prompts';

/**
 * @brief 从GitHub模板初始化Vitepress站点
 * @param {string} [dirName] - 可选的项目目录名
 * @param {boolean} [yes=false] - 是否自动使用默认值
 * @returns {Promise<void>}
 */
async function initMistProject(dirName?: string, yes = false): Promise<void> {
  console.log('Welcome to tdoc mist project initialization\n');
  
  // 收集用户输入
  const answers = await collectUserInput(dirName, yes);
  
  // 解析项目绝对路径
  const projectDir = path.resolve(answers.dirName || '');
  
  // 检查目录是否已存在
  if (fs.existsSync(projectDir)) {
    // 如果目录存在，检查是否为空
    const files = fs.readdirSync(projectDir);
    if (files.length > 0) {
      // 目录不为空，报错并退出
      console.error(`❌ 目录 ${projectDir} 已存在且不为空`);
      process.exit(1);
    }
  } else {
    // 目录不存在，递归创建目录
    fs.mkdirSync(projectDir, { recursive: true });
  }
  
  try {
    // 切换到项目目录
    process.chdir(projectDir);
    
    console.log('🔄 正在从GitHub模板克隆Vitepress站点...');
    
    // 使用git从模板仓库创建新项目
    execSync('git clone https://github.com/docs-site/vitepress-theme-mist-docs .', {
      stdio: 'inherit'
    });
    
    // 更新配置文件中的title和description
    await updateConfigFile(answers.title, answers.description);
    
    // 删除.git目录以解除与模板仓库的关联
    if (fs.existsSync('.git')) {
      fs.removeSync('.git');
    }
    
    // 初始化新的git仓库
    if (!yes && answers.initGit) {
      console.log('\n🔄 初始化新的git仓库...');
      execSync('git init', { stdio: 'pipe' });
    }
    
    // 安装依赖
    if (answers.installDeps) {
      console.log('\n🔄 正在安装依赖...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    console.log('\n✅ Vitepress站点初始化成功!');
    console.log(`++++++++++ cd ${answers.dirName || '.'} to get started. ++++++++++`);
  } catch (err) {
    console.error('❌ 初始化Vitepress站点失败:', (err as Error).message);
    process.exit(1);
  }
}

/**
 * @brief 收集用户项目配置输入
 * @param {string} [dirName] - 可选的项目目录名
 * @param {boolean} [yes=false] - 是否自动使用默认值
 * @returns {Promise<Object>} 包含用户配置的对象
 */
async function collectUserInput(dirName?: string, yes = false) {
  // 自动模式使用默认值，否则通过交互式提示获取用户输入
  return {
    dirName: yes
      ? dirName || 'mist-docs'
      : await input({
          message: '请输入站点目录名:',
          default: dirName || 'mist-docs',
          validate: (input: string) =>
            input.trim() !== '' || '站点目录名不能为空'
        }),
    title: yes
      ? 'Mist'
      : await input({
          message: '请输入站点标题:',
          default: 'Mist',
          validate: (input: string) =>
            input.trim() !== '' || '站点标题不能为空'
        }),
    description: yes
      ? 'mist docs'
      : await input({
          message: '请输入站点描述:',
          default: 'mist docs',
          validate: (input: string) =>
            input.trim() !== '' || '站点描述不能为空'
        }),
    initGit: yes
      ? true
      : await confirm({
          message: '是否初始化git仓库?',
          default: true
        }),
    installDeps: yes
      ? false
      : await confirm({
          message: '是否自动安装依赖?',
          default: false
        })
  };
}

/**
 * @brief 更新Vitepress配置文件中的title和description
 * @param {string} title - 站点标题
 * @param {string} description - 站点描述
 * @returns {Promise<void>}
 */
async function updateConfigFile(title: string, description: string): Promise<void> {
  const configPath = path.join(process.cwd(), 'src/.vitepress/config.mts');
  
  if (fs.existsSync(configPath)) {
    try {
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // 更新title
      configContent = configContent.replace(
        /title:\s*"[^"]*"/,
        `title: "${title}"`
      );
      
      // 更新description
      configContent = configContent.replace(
        /description:\s*"[^"]*"/,
        `description: "${description}"`
      );
      
      // 写回文件
      fs.writeFileSync(configPath, configContent);
      console.log('✅ 配置文件更新成功');
    } catch (err) {
      console.error('❌ 更新配置文件失败:', (err as Error).message);
    }
  } else {
    console.warn('⚠️  配置文件不存在，跳过更新');
  }
}

/**
 * @brief 创建mist命令
 * @returns {Command} commander的Command实例
 */
function createMistCommand(): Command {
  const program = new Command('mist')
    .description('Mist相关的命令');
  
  // 添加init子命令
  program
    .command('init [dirName]')
    .description('Initialize a new Vitepress site with mist theme')
    .option('-y, --yes', 'Skip prompts and use default values')
    .action(async (dirName, options) => {
      try {
        await initMistProject(dirName, options.yes);
      } catch (err) {
        console.error('❌ 初始化项目失败:', (err as Error).message);
        process.exit(1);
      }
    });
  
  return program;
}

export default createMistCommand;
