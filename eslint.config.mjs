import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

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
  // 配置对象 4: 自定义规则覆盖
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      semi: ['error', 'always'], // 强制使用分号
      indent: ['error', 2] // 强制使用2个空格缩进
    }
  }
]);
