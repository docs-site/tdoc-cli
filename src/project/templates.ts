import fs from "fs-extra";
import path from "path";
import { UserConfig } from "./types";

/**
 * 复制各种项目模板文件
 * @param projectDir 项目目录路径
 * @param answers 用户配置对象
 * @param projectType 项目类型
 */
export function copyTemplateFiles(projectDir: string, answers: UserConfig, projectType?: string) {
  // 处理README文件：
  // 1. 尝试从模板目录读取README模板
  const readmeTemplatePath = path.join(__dirname, "../../npm-template/README.md");
  if (fs.existsSync(readmeTemplatePath)) {
    // 读取模板内容并替换占位符
    let readmeContent = fs.readFileSync(readmeTemplatePath, "utf8");
    readmeContent = readmeContent.replace(/\{\{\s*title\s*\}\}/g, answers.name);
    fs.writeFileSync(path.join(projectDir, "README.md"), readmeContent);
  } else {
    // 模板不存在时创建基础README
    fs.writeFileSync(
      path.join(projectDir, "README.md"),
      `# ${answers.name}\n\n${answers.description || "Project description"}`
    );
  }

  // 处理.gitignore文件
  if (projectType === "c") {
    // C语言项目使用特定的.gitignore模板
    const gitignoreTemplatePath = path.join(__dirname, "../../npm-template/c.gitignore");
    if (fs.existsSync(gitignoreTemplatePath)) {
      fs.copyFileSync(gitignoreTemplatePath, path.join(projectDir, ".gitignore"));
      console.log("✅ .gitignore copied from c.gitignore template");
    }
  } else {
    // 其他项目类型使用默认的.gitignore
    fs.writeFileSync(path.join(projectDir, ".gitignore"), "node_modules/\n.DS_Store\n.env\n");
  }

  // 复制.editorconfig
  if (answers.addEditorConfig) {
    const editorConfigPath = path.join(__dirname, "../../.editorconfig");
    if (fs.existsSync(editorConfigPath)) {
      fs.copyFileSync(editorConfigPath, path.join(projectDir, ".editorconfig"));
      console.log("✅ .editorconfig copied");
    }
  }

  // 复制.vscode配置
  if (answers.addVscodeConfig && projectType !== "c") {
    const vscodePath = path.join(__dirname, "../../.vscode");
    if (fs.existsSync(vscodePath)) {
      fs.copySync(vscodePath, path.join(projectDir, ".vscode"));
      console.log("✅ .vscode configuration copied");
    }
  }

  // 复制Prettier配置
  if (answers.addPrettierConfig && projectType !== "c") {
    const prettierRcPath = path.join(__dirname, "../../.prettierrc");
    const prettierIgnorePath = path.join(__dirname, "../../.prettierignore");

    if (fs.existsSync(prettierRcPath)) {
      fs.copyFileSync(prettierRcPath, path.join(projectDir, ".prettierrc"));
      console.log("✅ .prettierrc copied");
    }
    if (fs.existsSync(prettierIgnorePath)) {
      fs.copyFileSync(prettierIgnorePath, path.join(projectDir, ".prettierignore"));
      console.log("✅ .prettierignore copied");
    }
    // 将prettier添加到开发依赖（在helper.ts中处理）
    // 这里不需要直接操作，因为会在updatePackageJsonWithDependencies中处理
  }

  // 拷贝commitlint.config.js文件
  if (answers.installCommitizen) {
    const commitlintConfigPath = path.join(__dirname, "../../commitlint.config.js");
    if (fs.existsSync(commitlintConfigPath)) {
      fs.copyFileSync(commitlintConfigPath, path.join(projectDir, "commitlint.config.js"));
      console.log("✅ commitlint.config.js copied");
    }
  }
}
