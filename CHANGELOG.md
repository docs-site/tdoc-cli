# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/docs-site/tdoc-cli/compare/v1.1.12...v1.2.0) (2025-09-15)

### Features

- **markdown:** 🚀 添加md文档移动命令 ([05f49db](https://github.com/docs-site/tdoc-cli/commit/05f49db932d65ede5954d6f9c6268713407fbb4c))

### Bug Fixes

- **mist:** 🐞 修复未处理双引号的问题 ([11bfbee](https://github.com/docs-site/tdoc-cli/commit/11bfbee4bd549ebe285ef678fa2684915af57ba1))

### Code Refactoring

- **markdown:** ♻️ 移动文档转图片链接时进行URL编码 ([3c3eb9b](https://github.com/docs-site/tdoc-cli/commit/3c3eb9bb9cf5389235f9aedcd325fbd81c29e054))
- **markdown:** ♻️ 优化m:d命令的统计逻辑 ([33deb56](https://github.com/docs-site/tdoc-cli/commit/33deb5693aa5ed8e4e37fb4a225b5ef73b70ea46))

### Others

- **release:** 1.1.13 [publish] ([0885445](https://github.com/docs-site/tdoc-cli/commit/08854453a999c88a1dec3bbf2ff4917cc42985c9))

### [1.1.13](https://github.com/docs-site/tdoc-cli/compare/v1.1.12...v1.1.13) (2025-09-15)

### Features

- **markdown:** 🚀 添加md文档移动命令 ([05f49db](https://github.com/docs-site/tdoc-cli/commit/05f49db932d65ede5954d6f9c6268713407fbb4c))

### Code Refactoring

- **markdown:** ♻️ 移动文档转图片链接时进行URL编码 ([3c3eb9b](https://github.com/docs-site/tdoc-cli/commit/3c3eb9bb9cf5389235f9aedcd325fbd81c29e054))
- **markdown:** ♻️ 优化m:d命令的统计逻辑 ([33deb56](https://github.com/docs-site/tdoc-cli/commit/33deb5693aa5ed8e4e37fb4a225b5ef73b70ea46))

### [1.1.12](https://github.com/docs-site/tdoc-cli/compare/v1.1.11...v1.1.12) (2025-09-12)

### Features

- **commit:** 🚀 提交前自动运行eslint ([b9390ce](https://github.com/docs-site/tdoc-cli/commit/b9390ce8e581fbb0bd33be5c15bacba90b96ce71))
- **system:** 🚀 tree命令增加高亮显示 ([cff35bf](https://github.com/docs-site/tdoc-cli/commit/cff35bfe542b0a8338f4e00ad0cd1fe701bdb907))
- **system:** 🚀 tree命令支持指定目录的扫描 ([14890b6](https://github.com/docs-site/tdoc-cli/commit/14890b68582cf37867ec6acbfb9f03b4ee945dfa))

### Bug Fixes

- **cmd:** 🐞 修复img命令的eslint错误 ([496f56f](https://github.com/docs-site/tdoc-cli/commit/496f56fa017e97be765cde47856ecb040c1e4d3c))
- **inquirer-cmd:** 🐞 修复init的eslint错误 ([94d141a](https://github.com/docs-site/tdoc-cli/commit/94d141a5f911037b6fb74ce0509aa816ead0169e))
- **markdown:** 🐞 修复markdown相关命令的eslint报错 ([68b4b87](https://github.com/docs-site/tdoc-cli/commit/68b4b87389b92617f10e7a2d6f20268631c4fa52))

### Styling

- **style:** 🎨 格式化代码 ([5e05a87](https://github.com/docs-site/tdoc-cli/commit/5e05a87e99da4b5d7d25562a80a05f9c493567c5))
- **style:** 🎨 设置保存自动格式化 ([666de6b](https://github.com/docs-site/tdoc-cli/commit/666de6b7cdb537e6284db233fce5249a573a3fe0))

### Code Refactoring

- **cmd:** ♻️ 统一git-submodule、init、login命令的注册方式 ([9eabc4f](https://github.com/docs-site/tdoc-cli/commit/9eabc4f2b16f1d38b2ae72690f75770d74d1d6f5))
- **cmd:** ♻️ git-submodule命令采用addCommand方式注册 ([bebce55](https://github.com/docs-site/tdoc-cli/commit/bebce558945854ce254700432ade1a1ffd62eda3))
- **cmd:** ♻️ init命令修改为addCommand方式注册 ([73fed3d](https://github.com/docs-site/tdoc-cli/commit/73fed3dd51f334338e93137955c91cf9433035b3))
- **cmd:** ♻️ login命令修改为addCommand方式注册 ([2dddb22](https://github.com/docs-site/tdoc-cli/commit/2dddb22b897396229b6cb0e9b7a56f159a577fa1))
- **cmd:** ♻️ tree命令移入system目录 ([2460c0e](https://github.com/docs-site/tdoc-cli/commit/2460c0e00214b38964721d0357332f7fd2bfedfa))
- **markdown:** ♻️ markdown相关命令修改为addCommand方式注册 ([418347e](https://github.com/docs-site/tdoc-cli/commit/418347e17dc019eae116ca7810232f2a7169e538))
- **system:** ♻️ img命令修改为addCommand方式注册 ([37e5b80](https://github.com/docs-site/tdoc-cli/commit/37e5b807feac8f345f131f1040f138212052fc19))
- **system:** ♻️ img命令移动到system目录 ([396c28e](https://github.com/docs-site/tdoc-cli/commit/396c28e59c0d3d3ca5162c334b7f8b3d5282eeae))
- **system:** ♻️ tree命令改为addCommand方式注册 ([11023b7](https://github.com/docs-site/tdoc-cli/commit/11023b747599fa22ca9d30c36cc89a330835707e))
- **system:** ♻️ tree命令优化 ([f7ce081](https://github.com/docs-site/tdoc-cli/commit/f7ce081a98f2e1400cde9adc1385c3a559f23526))

### Docs

- **docs:** 📚 更新README.md ([698e8f5](https://github.com/docs-site/tdoc-cli/commit/698e8f57cba7528ad7aed4de3bf0c55f5c4b891c))

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
