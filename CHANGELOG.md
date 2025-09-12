# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.1.11](https://github.com/docs-site/tdoc-cli/compare/v1.1.9...v1.1.11) (2025-09-11)

### Others

- **release:** 1.1.10 [publish] ([5d84e3e](https://github.com/docs-site/tdoc-cli/commit/5d84e3eeddc0188a71af9912e37a6402d745937b))

### Code Refactoring

- **cmd:** ♻️ 优化mist init命令 ([c9f5f87](https://github.com/docs-site/tdoc-cli/commit/c9f5f8712cc0992db1aca9dc3e6562196ec8ec7b))
- **cmd:** ♻️ md文档使用路径映射时不添加docs前缀 ([1244d6e](https://github.com/docs-site/tdoc-cli/commit/1244d6eea8bd4fc2570fc6101a1431fa2e6f2ec7))

### [1.1.10](https://github.com/docs-site/tdoc-cli/compare/v1.1.9...v1.1.10) (2025-09-03)

### Code Refactoring

- **cmd:** ♻️ md文档使用路径映射时不添加docs前缀 ([1244d6e](https://github.com/docs-site/tdoc-cli/commit/1244d6eea8bd4fc2570fc6101a1431fa2e6f2ec7))

### [1.1.9](https://github.com/docs-site/tdoc-cli/compare/v1.1.8...v1.1.9) (2025-09-02)

### Features

- **cmd:** 添加生成映射文件命令、支持永久链接的路径映射 ([96c4ee1](https://github.com/docs-site/tdoc-cli/commit/96c4ee135e01ca555e38efcce61c4b3eab61e415))

### Bug Fixes

- **cmd:** 🐞 修复生成path-map.js文件时会扫描md文档资源目录的问题 ([0931d1c](https://github.com/docs-site/tdoc-cli/commit/0931d1c08eb8d6826b79723d03cfe2767cdc7447))
- **cmd:** 🐞 修复tdoc m:p无法解析带路径映射的permalink的问题 ([5d0a758](https://github.com/docs-site/tdoc-cli/commit/5d0a758f70dc0661edb26ecb2e01e04888b28b53))

### Docs

- **docs:** 📚 更新markdown命令的README.md文档 ([9f4e598](https://github.com/docs-site/tdoc-cli/commit/9f4e598c35040c1dc70da968f46471dd9555a3c6))

### [1.1.8](https://github.com/docs-site/tdoc-cli/compare/v1.1.7...v1.1.8) (2025-08-30)

### Features

- **cmd:** 🚀 支持为无frontmatter的md文档添加frontmatter ([a20dc86](https://github.com/docs-site/tdoc-cli/commit/a20dc86d6a4d1c7f7e1e6a35557fa64c3d027aea))
- **cmd:** 🚀 支持vitepress-theme-mist模板站点初始化命令 ([56e3659](https://github.com/docs-site/tdoc-cli/commit/56e36596e9771cb4d5bb0c9a0abbf3318e0e27a0))
- **workspace:** 🚀 添加cz-git、husky、commitlint、standard-version相关工具和文件 ([6737c89](https://github.com/docs-site/tdoc-cli/commit/6737c8955b6bac36cd9076623a79528316d70be1))

### Code Refactoring

- **cmd:** ♻️ 提取共用函数，优化代码逻辑 ([6bf38b2](https://github.com/docs-site/tdoc-cli/commit/6bf38b23ab6e3daa4c0bd5defe96d418793b84ce))
- **cmd:** ♻️ 优化接口定义 ([609543e](https://github.com/docs-site/tdoc-cli/commit/609543e15b98e5c7fe3177c8e2f288fe279d5a61))
- **cmd:** ♻️ 重新实现md文档永久链接解析功能 ([668aae0](https://github.com/docs-site/tdoc-cli/commit/668aae0fc08995474f08ce4bf041ff4887393b03))
- **cmd:** ♻️ 重新实现tdoc创建md文档命令 ([5e773a7](https://github.com/docs-site/tdoc-cli/commit/5e773a77add486137f727df46fd79752f9b0fe49))
- **scripts:** ♻️ 修改js脚本目录名为scripts ([d1b9fcb](https://github.com/docs-site/tdoc-cli/commit/d1b9fcba5227a8ecbff4bf53ebd26f912308306d))
