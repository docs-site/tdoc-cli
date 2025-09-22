import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { UserConfig } from "./types";

/**
 * 初始化Git仓库并配置
 * @param projectDir 项目目录路径
 * @param addWorkflow 是否添加GitHub工作流
 * @param projectType 项目类型
 * @throws 如果git初始化失败会抛出错误
 */
export function initGitRepo(projectDir: string, addWorkflow: boolean, projectType?: string) {
  try {
    // 初始化Git仓库，使用pipe模式隐藏git命令输出
    execSync("git init", { stdio: "pipe" });
    console.log("✅ Git repository initialized");

    // 创建.gitignore文件，忽略常见不需要版本控制的文件
    fs.writeFileSync(path.join(projectDir, ".gitignore"), "node_modules/\n.DS_Store\n.env\n");

    // 如果需要添加GitHub工作流
    if (addWorkflow && projectType !== "c") {
      const workflowsDir = path.join(__dirname, "../../.github/workflows");
      if (fs.existsSync(workflowsDir)) {
        // 创建工作流目录并复制模板文件
        const destDir = path.join(projectDir, ".github/workflows");
        fs.ensureDirSync(destDir);
        fs.copySync(workflowsDir, destDir);
        console.log("✅ GitHub Actions workflow files copied");
      } else {
        console.log("ℹ️ No workflow files found in .github/workflows");
      }
    }
  } catch (err) {
    console.error("Failed to initialize git repository:", err);
  }
}

/**
 * 安装并配置Husky
 * @param projectDir 项目目录路径
 * @param answers 用户配置对象
 * @throws 如果husky安装失败会抛出错误
 */
export function installHusky(projectDir: string, answers: UserConfig) {
  try {
    console.log("Installing husky...");
    execSync("npx husky-init", { stdio: "inherit" });
    console.log("✅ Husky installed successfully!");

    // 添加commitlint钩子
    if (answers.installCommitlint) {
      try {
        console.log("Adding commitlint hook...");
        const commitMsgPath = path.join(projectDir, ".husky", "commit-msg");
        const commitMsgContent = "npx --no-install commitlint --edit $1\n";

        // 确保.husky目录存在
        fs.ensureDirSync(path.join(projectDir, ".husky"));

        // 如果文件已存在，则追加内容，否则创建新文件
        if (fs.existsSync(commitMsgPath)) {
          // 读取现有内容
          const existingContent = fs.readFileSync(commitMsgPath, "utf8");
          // 检查是否已包含该命令
          if (!existingContent.includes("npx --no-install commitlint --edit $1")) {
            fs.appendFileSync(commitMsgPath, commitMsgContent);
          }
        } else {
          // 创建新文件，添加shebang和命令
          fs.writeFileSync(commitMsgPath, `#!/usr/bin/env sh\n${commitMsgContent}`);
        }

        // 确保文件具有可执行权限
        fs.chmodSync(commitMsgPath, 0o755);

        console.log("✅ Commitlint hook added successfully!");
      } catch (err) {
        console.error("Failed to add commitlint hook:", err);
      }
    }
  } catch (err) {
    console.error("Failed to install husky:", err);
  }
}
