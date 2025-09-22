import fs from "fs-extra";
import path from "path";
import { UserConfig } from "./types";
import { devDependencies, dependencies, getLatestVersion } from "./helper";

/**
 * 创建package.json文件
 * @param projectDir 项目目录路径
 * @param answers 用户配置对象
 * @param scope 可选的npm包作用域
 */
export function createPackageJson(projectDir: string, answers: UserConfig, scope?: string) {
  // 从npm-template/package-template.json读取模板
  const templatePath = path.join(__dirname, "../../npm-template/package-template.json");
  const packageJson = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  // 处理包名：如果有作用域则添加作用域前缀
  packageJson.name = scope
    ? `@${scope}/${answers.name.toLowerCase().replace(/\s+/g, "-")}`
    : answers.name.toLowerCase().replace(/\s+/g, "-");

  // 替换其他字段
  packageJson.description = answers.description;
  packageJson.author = answers.author;
  packageJson.license = answers.license;

  // 添加commitizen配置
  if (answers.installCommitizen) {
    packageJson.config = {
      commitizen: {
        path: "node_modules/cz-git"
      }
    };

    // 添加cz脚本命令
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts.cz = "git add . && git-cz";
  }

  // 将package.json写入文件，使用2个空格缩进
  fs.writeFileSync(path.join(projectDir, "package.json"), JSON.stringify(packageJson, null, 2));
}

/**
 * 更新package.json文件，添加依赖信息
 * @param projectDir 项目目录路径
 * @param answers 用户配置对象
 */
export function updatePackageJsonWithDependencies(projectDir: string, answers: UserConfig) {
  // 读取现有的package.json文件
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // 准备要安装的依赖列表
  const installDevDeps: Record<string, string> = {}; // 开发依赖
  const installDeps: Record<string, string> = {}; // 生产依赖

  // 添加基本依赖
  devDependencies.forEach((dep) => {
    installDevDeps[dep] = getLatestVersion(dep);
  });
  dependencies.forEach((dep) => {
    installDeps[dep] = getLatestVersion(dep);
  });

  // 添加commitizen相关依赖
  if (answers.installCommitizen) {
    installDevDeps["commitizen"] = getLatestVersion("commitizen");
    installDevDeps["cz-git"] = getLatestVersion("cz-git");
    installDevDeps["@commitlint/config-conventional"] = getLatestVersion("@commitlint/config-conventional");
  }

  // 添加Prettier依赖
  if (answers.addPrettierConfig) {
    installDevDeps["prettier"] = getLatestVersion("prettier");
  }

  // 添加commitlint依赖
  if (answers.installCommitlint) {
    installDevDeps["@commitlint/cli"] = getLatestVersion("@commitlint/cli");
    installDevDeps["@commitlint/config-conventional"] = getLatestVersion("@commitlint/config-conventional");
  }

  // 添加依赖到package.json，保留原有的依赖项
  if (Object.keys(installDevDeps).length > 0) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies, // 保留原有的devDependencies
      ...installDevDeps // 添加新的devDependencies
    };
  }
  if (Object.keys(installDeps).length > 0) {
    packageJson.dependencies = {
      ...packageJson.dependencies, // 保留原有的dependencies
      ...installDeps // 添加新的dependencies
    };
  }

  // 将更新后的package.json写入文件
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
