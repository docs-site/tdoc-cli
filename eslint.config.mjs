import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  // 配置对象 1: 基础规则集
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended']
  },
  // 配置对象 2: 环境配置
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.node }
  },
  // 配置对象 3: TypeScript支持
  tseslint.configs.recommended,
  // 配置对象 4: 自定义规则覆盖 (移除了与 Prettier 冲突的格式化规则)
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
		rules: {
      semi: ['error', 'always'], // 强制使用分号
      indent: ['error', 4] // 强制使用2个空格缩进
    }
  },
  // 配置对象 5: 禁用与 Prettier 冲突的规则
  eslintConfigPrettier,
  // 配置对象 6: Prettier 集成 - 使用 Prettier 规则并覆盖其他格式化规则
  eslintPluginPrettierRecommended,
]);
