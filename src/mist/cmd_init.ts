/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_init.ts
 * Author     : 苏木
 * Date       : 2025-09-17
 * Version    :
 * Description: Mist init 命令 - 初始化Vitepress站点
 * ======================================================
 */

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { input, confirm } from "@inquirer/prompts";
import { ConfigReplacementRule, UpdateConfigParams } from "./types";

/**
 * @brief 从GitHub模板初始化Vitepress站点
 * @param {string} [dirName] - 可选的项目目录名
 * @param {boolean} [yes=false] - 是否自动使用默认值
 * @returns {Promise<void>}
 */
export async function initMistProject(dirName?: string, yes = false, useGitee = false): Promise<void> {
  console.log("Welcome to tdoc mist project initialization\n");

  // 收集用户输入
  const answers = await collectUserInput(dirName, yes);

  // 解析项目绝对路径
  const projectDir = path.resolve(answers.dirName || "");

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

    // 使用git从模板仓库创建新项目（支持GitHub和Gitee回退）
    await cloneProjectTemplate(useGitee);

    // 更新配置文件中的base URL和GitHub链接
    const updateParams = {
      dirName: answers.dirName,
      title: answers.title,
      description: answers.description
    };
    await updateConfigFile(updateParams);
    await updateWorkflowFile(updateParams);
    await updateCNBFile(updateParams);

    // 删除.git目录以解除与模板仓库的关联
    if (fs.existsSync(".git")) {
      fs.removeSync(".git");
    }

    // 初始化新的git仓库
    if (!yes && answers.initGit) {
      console.log("\n🔄 初始化新的git仓库...");
      execSync("git init -b main", { stdio: "pipe" });
    }

    // 安装依赖
    if (answers.installDeps) {
      console.log("\n🔄 正在安装依赖...");
      execSync("npm install", { stdio: "inherit" });
    }

    console.log("\n✅ Vitepress站点初始化成功!");
    console.log(`++++++++++ cd ${answers.dirName || "."} to get started. ++++++++++`);
  } catch (err) {
    console.error("❌ 初始化Vitepress站点失败:", (err as Error).message);
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
      ? dirName || "mist-docs"
      : await input({
          message: "请输入站点目录名:",
          default: dirName || "mist-docs",
          validate: (input: string) => input.trim() !== "" || "站点目录名不能为空"
        }),
    title: yes
      ? "Mist"
      : await input({
          message: "请输入站点标题:",
          default: "Mist",
          validate: (input: string) => input.trim() !== "" || "站点标题不能为空"
        }),
    description: yes
      ? "mist docs"
      : await input({
          message: "请输入站点描述:",
          default: "mist docs",
          validate: (input: string) => input.trim() !== "" || "站点描述不能为空"
        }),
    initGit: yes
      ? true
      : await confirm({
          message: "是否初始化git仓库?",
          default: true
        }),
    installDeps: yes
      ? false
      : await confirm({
          message: "是否自动安装依赖?",
          default: true
        })
  };
}

/**
 * @brief 从GitHub或Gitee克隆项目模板
 * @param {boolean} [useGitee=false] - 是否直接使用Gitee
 * @returns {Promise<void>}
 */
async function cloneProjectTemplate(useGitee = false): Promise<void> {
  const githubUrl = "https://github.com/docs-site/vitepress-theme-mist-docs.git";
  const giteeUrl = "https://gitee.com/docs-site/vitepress-theme-mist-docs.git";

  // 如果指定了直接使用Gitee，则直接尝试Gitee
  if (useGitee) {
    try {
      console.log("🔄 正在从Gitee模板克隆Vitepress站点...");
      execSync(`git clone --depth=1 ${giteeUrl} .`, {
        stdio: "inherit",
        timeout: 30000 // 30秒超时
      });
      console.log("✅ Gitee克隆成功");
      return;
    } catch (giteeError) {
      console.error("❌ Gitee克隆失败:", (giteeError as Error).message);
      throw new Error("项目模板下载失败，请检查网络连接或稍后重试");
    }
  }

  // 默认逻辑：先尝试GitHub，失败后回退到Gitee
  try {
    console.log("🔄 正在从GitHub模板克隆Vitepress站点...");
    execSync(`git clone --depth=1 ${githubUrl} .`, {
      stdio: "inherit",
      timeout: 30000 // 30秒超时
    });
    console.log("✅ GitHub克隆成功");
  } catch (githubError) {
    console.warn("⚠️  GitHub克隆失败，尝试从Gitee镜像下载...");
    try {
      console.log("🔄 正在从Gitee镜像克隆Vitepress站点...");
      execSync(`git clone --depth=1 ${giteeUrl} .`, {
        stdio: "inherit",
        timeout: 30000 // 30秒超时
      });
      console.log("✅ Gitee克隆成功");
    } catch (giteeError) {
      console.error("❌ GitHub和Gitee克隆均失败:");
      console.error(`GitHub错误: ${(githubError as Error).message}`);
      console.error(`Gitee错误: ${(giteeError as Error).message}`);
      throw new Error("项目模板下载失败，请检查网络连接或稍后重试");
    }
  }
}

/**
 * @brief 配置替换规则数组
 * @param {UpdateConfigParams} params - 配置更新参数
 * @returns {ConfigReplacementRule[]} 替换规则数组
 */
function getConfigReplacementRules(params: UpdateConfigParams): ConfigReplacementRule[] {
  return [
    {
      search: /title:\s*(["'])([^"']*)\1/,
      replace: `title: "${params.title}"`,
      description: "更新站点标题"
    },
    {
      search: /description:\s*(["'])([^"']*)\1/,
      replace: `description: "${params.description}"`,
      description: "更新站点描述"
    },
    {
      search: /base:\s*(["'])\/vitepress-theme-mist-docs\/\1/,
      replace: `base: '/${params.dirName}/'`,
      description: "更新base URL"
    },
    {
      search: /https:\/\/github\.com\/docs-site\/vitepress-theme-mist\.git/,
      replace: `https://github.com/docs-site/${params.dirName}.git`,
      description: "更新GitHub链接"
    },
    {
      search: /math:\s*false/,
      replace: `math: true`,
      description: "开启数学公式支持"
    },
    {
      search: /\/\/\s*rewrites:/,
      replace: `rewrites:`,
      description: "启用rewrites配置"
    }
  ];
}

/**
 * @brief 更新GitHub Actions工作流文件
 * @param {UpdateConfigParams} params - 配置更新参数
 * @returns {Promise<void>}
 */
async function updateWorkflowFile(params: UpdateConfigParams): Promise<void> {
  const workflowPath = path.join(process.cwd(), ".github/workflows/deploy-docs.yml");

  if (fs.existsSync(workflowPath)) {
    try {
      let workflowContent = fs.readFileSync(workflowPath, "utf8");
      const repName = params.dirName.replace(/-/g, "_"); // 将-替换为_
      let updated = false;

      // 替换 repository_dispatch 类型
      const originalTypes = workflowContent;
      workflowContent = workflowContent.replace(
        /types:\s*\[trigger_deployment_vitepress_theme_mist_docs\]/,
        `types: [trigger_deployment_${repName}]`
      );
      if (workflowContent !== originalTypes) {
        console.log("✅ 更新GitHub Actions事件类型");
        updated = true;
      }

      // 替换 repository_dispatch 条件
      const originalCondition = workflowContent;
      workflowContent = workflowContent.replace(
        /github\.event_name == 'repository_dispatch' && github\.event\.action == 'trigger_deployment_vitepress_theme_mist_docs'/,
        `github.event_name == 'repository_dispatch' && github.event.action == 'trigger_deployment_${repName}'`
      );
      if (workflowContent !== originalCondition) {
        console.log("✅ 更新GitHub Actions触发条件");
        updated = true;
      }

      if (updated) {
        // 写回文件
        fs.writeFileSync(workflowPath, workflowContent);
        console.log("✅ GitHub Actions工作流文件更新完成");
      } else {
        console.log("ℹ️  GitHub Actions工作流文件无需更新");
      }
    } catch (err) {
      console.error("❌ 更新GitHub Actions工作流文件失败:", (err as Error).message);
    }
  } else {
    console.warn("⚠️  GitHub Actions工作流文件不存在，跳过更新");
  }
}

/**
 * @brief 更新Vitepress配置文件
 * @param {UpdateConfigParams} params - 配置更新参数
 * @returns {Promise<void>}
 */
async function updateConfigFile(params: UpdateConfigParams): Promise<void> {
  const configPath = path.join(process.cwd(), "src/.vitepress/config.mts");

  if (fs.existsSync(configPath)) {
    try {
      let configContent = fs.readFileSync(configPath, "utf8");
      const rules = getConfigReplacementRules(params);
      let updated = false;

      // 应用所有替换规则
      for (const rule of rules) {
        const originalContent = configContent;
        const replaceValue = typeof rule.replace === "function" ? rule.replace(params.dirName) : rule.replace;

        configContent = configContent.replace(rule.search, replaceValue);

        if (configContent !== originalContent) {
          console.log(`✅ ${rule.description}`);
          updated = true;
        }
      }

      if (updated) {
        // 写回文件
        fs.writeFileSync(configPath, configContent);
        console.log("✅ 配置文件更新完成");
      } else {
        console.log("ℹ️  配置文件无需更新");
      }
    } catch (err) {
      console.error("❌ 更新配置文件失败:", (err as Error).message);
    }
  } else {
    console.warn("⚠️  配置文件不存在，跳过更新");
  }
}

/**
 * @brief 更新.cnb.yml文件中的项目名称
 * @param {UpdateConfigParams} params - 配置更新参数
 * @returns {Promise<void>}
 */
async function updateCNBFile(params: UpdateConfigParams): Promise<void> {
  const cnbPath = path.join(process.cwd(), ".cnb.yml");

  if (fs.existsSync(cnbPath)) {
    try {
      let cnbContent = fs.readFileSync(cnbPath, "utf8");
      let updated = false;

      // 替换 vitepress-theme-mist-docs 为项目目录名
      const originalContent = cnbContent;
      cnbContent = cnbContent.replace(/vitepress-theme-mist-docs/g, params.dirName);

      if (cnbContent !== originalContent) {
        // 写回文件
        fs.writeFileSync(cnbPath, cnbContent);
        console.log("✅ .cnb.yml文件更新完成");
        updated = true;
      }

      if (!updated) {
        console.log("ℹ️  .cnb.yml文件无需更新");
      }
    } catch (err) {
      console.error("❌ 更新.cnb.yml文件失败:", (err as Error).message);
    }
  } else {
    console.warn("⚠️  .cnb.yml文件不存在，跳过更新");
  }
}

/**
 * @brief 创建 mist init 命令
 * @returns commander 的 Command 实例
 */
export function createInitCommand(): Command {
  const program = new Command("init")
    .description("Initialize a new Vitepress site with mist theme")
    .argument("[dirName]", "项目目录名")
    .option("-y, --yes", "Skip prompts and use default values")
    .option("--gitee", "直接从Gitee下载模板")
    .action(async (dirName, options) => {
      try {
        await initMistProject(dirName, options.yes, options.gitee);
      } catch (err) {
        console.error("❌ 初始化项目失败:", (err as Error).message);
        process.exit(1);
      }
    });

  return program;
}

export default createInitCommand;
