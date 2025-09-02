# Markdown 命令使用说明

注意：文档最好都生成到sdoc目录下，这样路径映射相关的命令才可用。

## 一、m:m - 生成path-map.js文件

该命令用于扫描指定目录的结构并生成path-map.js文件，用于路径映射。但是，我在内部做了限制：

```typescript
const SDOC_DIR_NAME = 'sdoc';
```

我只会扫描绝对路径中含有`sdoc`路径的目录，例如：

```bash
D:\sumu_blog\tdoc-cli\test             # 不会扫描
D:\sumu_blog\tdoc-cli\test\sdoc         # 生成文件位于 sdoc 目录
D:\sumu_blog\tdoc-cli\test\sdoc\01-测试  # 生成文件位于 sdoc 目录
```

### 1. 基本用法

```bash
tdoc m:m [path] [options]
```

**参数**

- `path` - 要扫描的目录路径 (可选，默认为当前目录)

**选项**

- `-d, --dir <path>` - 指定要扫描的目录路径

### 2. 使用示例

如下目录结构：

```bash
test
├── example.md
└── sdoc
    ├── 01-测试
    │   ├── 01-java
    │   └── 02-c
    ├── 02-开发
    └── README.md
```

- （1）**扫描当前目录并生成path-map.js文件**：

```bash
D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:m 
🔍 正在分析路径: D:\sumu_blog\tdoc-cli\test
❌ 未找到sdoc目录
```

- （2）**指定目录进行扫描**：

```bash
D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:m -d ./sdoc
🔍 正在分析路径: D:\sumu_blog\tdoc-cli\test\sdoc
📁 找到sdoc根目录: D:\sumu_blog\tdoc-cli\test\sdoc
✅ 成功生成文件: D:\sumu_blog\tdoc-cli\test\sdoc\path-map.js

D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:m -d .\sdoc\01-测试\
🔍 正在分析路径: D:\sumu_blog\tdoc-cli\test\sdoc\01-测试
📁 找到sdoc根目录: D:\sumu_blog\tdoc-cli\test\sdoc
✅ 成功生成文件: D:\sumu_blog\tdoc-cli\test\sdoc\path-map.js
```

### 3. 文件示例

执行命令后，会在sdoc根目录下生成一个`path-map.js`文件。生成的映射文件内容示例：

```javascript
/**
 * 由tdoc m:m命令自动生成的目录映射文件
 * 用于将中文目录名映射为英文别名
 */

export default {
  "01-测试": "default", // 01-测试
  "01-java": "default", // 01-测试/01-java
  "02-c": "default", // 01-测试/02-c
  "02-开发": "default", // 02-开发
};
```

然后可以手动更改要映射的英文文件名，后面创建永久链接的时候可能会用到。例如：

```javascript
/**
 * 由tdoc m:m命令自动生成的目录映射文件
 * 用于将中文目录名映射为英文别名
 */

export default {
  "01-测试": "01-test", // 01-测试
  "01-java": "01-java", // 01-测试/01-java
  "02-c": "02-c", // 01-测试/02-c
  "02-开发": "02-dev", // 02-开发
};
```



### 4. 使用说明

（1）该文件用于将中文目录名映射为英文别名

（2）每个键值对表示：`"中文目录名": "英文别名"`

（3）默认值为"default"，需要手动修改为有意义的英文别名

（4）注释中显示了目录的相对路径，便于识别

（5）只会扫描绝对路径中sdoc目录下的目录。

## 二、 m:n - 创建新的markdown文档

该命令用于创建新的markdown文档，支持指定模板、输出目录和路径映射。

### 1. 基本用法

```bash
tdoc m:n <filename> [options]
```

**参数**

- `filename` - 要创建的文件名（不带扩展名）

**选项**

- `-t, --template <name>` - 指定模板名称 (默认为'post')，当名称为index时会自动使用index模板。
- `-f, --force` - 强制覆盖已存在的文件
- `-d, --dir <directory>` - 指定输出目录 (默认为'test')
- `-m, --map [file]` - 指定路径映射表文件，如果不指定则使用默认文件，这个时候输出目录的路径中一定要有sdoc这一级目录，因为映射文件都是以这个目录为基准定位。

### 2. 使用示例

- （1）**创建一个名为"example"的markdown文档**：

```bash
D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:n example
📁 创建目录: D:\sumu_blog\tdoc-cli\test\test
✅ 文档已生成: D:\sumu_blog\tdoc-cli\test\test\example.md
📋 使用模板: ..\scaffolds\post.md
⏰ 生成时间: 2025-09-02 17:18:47.583
🔗 永久链接: /docs/126b07d490c7247ecda44d14
```
- （2）**使用index模板创建一个名为"index"的markdown文档**：

```bash
D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:n index  
✅ 文档已生成: D:\sumu_blog\tdoc-cli\test\test\index.md
📋 使用模板: ..\scaffolds\index.md
⏰ 生成时间: 2025-09-02 17:19:12.809
🔗 永久链接: /docs/126b07d491083291fe4ef844
```
- （3）**指定输出目录创建文档**：

```bash
D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:n example -d ./docs/articles
📁 创建目录: D:\sumu_blog\tdoc-cli\test\docs\articles
✅ 文档已生成: D:\sumu_blog\tdoc-cli\test\docs\articles\example.md
📋 使用模板: ..\scaffolds\post.md
⏰ 生成时间: 2025-09-02 17:19:28.911
🔗 永久链接: /docs/126b07d4911838f48f3eb40d
```
- （4）**强制覆盖已存在的文件**

```bash
D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:n example -f
🔧 强制覆盖已存在的文件: D:\sumu_blog\tdoc-cli\test\test\example.md
✅ 文档已生成: D:\sumu_blog\tdoc-cli\test\test\example.md
📋 使用模板: ..\scaffolds\post.md
⏰ 生成时间: 2025-09-02 17:19:43.575
🔗 永久链接: /docs/126b07d4912723f0ae98b3f4
```

- （5）**使用路径映射创建文档**，注意这里输出路径一定要包含sdoc且映射文件要存在，映射目录要在映射文件中存在才行：

```bash
D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:n example -m
❌ 输出目录中不包含'sdoc': D:\sumu_blog\tdoc-cli\test\test
❌ 路径映射失败，无法创建文档

D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:n example -d sdoc -m
✅ 文档已生成: D:\sumu_blog\tdoc-cli\test\sdoc\example.md
📋 使用模板: ..\scaffolds\post.md
⏰ 生成时间: 2025-09-02 17:21:18.199
🔗 永久链接: /sdoc/docs/126b07d491d60c7c3871c08a

D:\sumu_blog\tdoc-cli\test [master ↑2 +1 ~1 -0 !]> tdoc m:n example -d sdoc/03-插件 -m
❌ 路径部分'03-插件'没有有效的映射
❌ 路径映射失败，无法创建文档

D:\sumu_blog\tdoc-cli\test\sdoc\01-测试 [master ↑2 +1 ~1 -0 !]> tdoc m:n example -d . -m
✅ 文档已生成: D:\sumu_blog\tdoc-cli\test\sdoc\01-测试\example.md
📋 使用模板: ..\..\..\scaffolds\post.md
⏰ 生成时间: 2025-09-02 17:22:18.697
🔗 永久链接: /sdoc/default/docs/126b07d4923a2b9e6fb3e6b1
```
### 3. 文件示例

执行命令后，会在指定目录下创建一个新的markdown文件，文件包含根据模板生成的frontmatter信息。

#### 3.1 永久链接无路径映射

生成的markdown文件内容示例：

```markdown
---
title: example
date: 2025-09-02 17:30:45
permalink: /docs/2025090217304512345678901234
tdoc:
  detailDate: 2025-09-02 17:30:45.123
  fulluuid: 1234567890abcdef1234567890abcdef
  useduuid: 1234567890abcdef
---

# example

这里是文档内容...
```

#### 3.2 带路径映射

```markdown
---
title: example
date: 2025-09-02 17:22:18
icon: famicons:logo-markdown
permalink: /sdoc/default/docs/126b07d4923a2b9e6fb3e6b1
#...
tdoc:
  detailDate: 2025-09-02 17:22:18.697
  fulluuid: e6fb3e6b14c04177a2c5a07060c7acfa
  useduuid: e6fb3e6b1
---
```

## 三、 m:p - 解析markdown文件中的元数据

该命令用于解析markdown文件中的元数据并输出详细的时间信息。主要是解析永久链接。

### 1. 基本用法

```bash
tdoc m:p <file>
```

**参数**

- `file` - 要解析的markdown文件路径

### 2. 使用示例

**解析一个markdown文件的元数据**：

```bash
tdoc m:p ./docs/example.md
```

**输出示例**：

```
📄 文件: /path/to/docs/example.md
==================================================
📋 Frontmatter 信息:
  标题          : example
  日期          : 2025-09-02 17:30:45
  永久链接      : /docs/2025090217304512345678901234
  详细日期      : 2025-09-02 17:30:45.123
  完整UUID      : 1234567890abcdef1234567890abcdef
  使用的UUID部分: 1234567890abcdef
--------------------------------------------------
📅 解析的时间信息:
  时间戳        : 20250902173045
  日期          : 2025/9/2 17:30:45
  ISO格式       : 2025-09-02T09:30:45.123Z
  年-月-日      : 2025-09-02
  时:分:秒.毫秒 : 17:30:45.123
```

## 四、 m:a - 为markdown文件添加frontmatter

该命令用于为现有的markdown文件添加frontmatter。逻辑和`m:n`完全一样，只是一个是新建，一个是添加，当md文档存在frontmatter时不会重复添加。

### 1. 基本用法

```bash
tdoc m:a <target> [options]
```

**参数**

- `target` - 目标文件或目录路径

**选项**

- `-d, --dir` - 处理目录中的所有markdown文件
- `-m, --map [file]` - 指定路径映射表文件，如果不指定则使用默认文件

### 2. 使用示例

同`tdoc m:n`用法。只是多了目录下文档批量处理。