/**
 * 项目初始化相关的类型定义
 */

/**
 * 用户配置接口
 */
export interface UserConfig {
  name: string;
  description: string;
  author: string;
  license: string;
  initGit: boolean;
  addWorkflow: boolean;
  addEditorConfig: boolean;
  addVscodeConfig: boolean;
  addPrettierConfig: boolean;
  installDeps: boolean;
  installHusky: boolean;
  installCommitizen: boolean;
  installCommitlint: boolean;
}

/**
 * 项目类型枚举
 */
export type ProjectType = "c" | "node" | "python" | "typescript" | "javascript";

/**
 * 初始化命令选项接口
 */
export interface InitOptions {
  yes?: boolean;
  type?: ProjectType;
  scope?: string;
}

/**
 * 依赖信息接口
 */
export interface DependencyInfo {
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
}
