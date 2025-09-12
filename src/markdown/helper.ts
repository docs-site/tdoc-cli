/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : helper.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: 辅助函数集合
 * ======================================================
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// 定义sdoc目录名，方便后期修改
const SDOC_DIR_NAME = "sdoc";

const PERMALINK_PREFIX = "docs";
/**
 * @interface PermalinkData
 * @property {string} permalink - 生成的永久链接
 * @property {string} fulluuid - 完整的UUID
 * @property {string} useduuid - 生成permalink使用的UUID部分
 */
interface PermalinkData {
  permalink: string;
  fulluuid: string;
  useduuid: string;
}

/**
 * @brief 生成带前导斜杠的24位十六进制永久链接ID
 * @param {Date} date - 用于生成permalink的时间对象
 * @return {PermalinkData} 包含permalink, fulluuid, useduuid的对象
 * @description 生成规则:
 * 1. 前面部分: YYYYMMDDHHMMSS (年月日时分秒) 编码成十六进制
 * 2. 中间部分: 毫秒的十六进制表示
 * 3. 后面部分: 从UUID中取对应的位数数字
 * 4. 总长度: 24位十六进制数 + 前导斜杠 = 25位
 * @note 优化逻辑确保在毫秒级别也能生成唯一ID
 */
function generatePermalink(date: Date, usePrefix: boolean = true): PermalinkData {
  // 获取年月日时分秒
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // 组合成 YYYYMMDDHHMMSS 格式
  const timestampStr = `${year}${month}${day}${hours}${minutes}${seconds}`;

  // 将时间戳字符串转换为BigInt然后转换为十六进制
  const timestampBigInt = BigInt(timestampStr);
  let timestampHex = timestampBigInt.toString(16);

  // 获取毫秒并转换为十六进制
  const milliseconds = date.getMilliseconds();
  const millisHex = milliseconds.toString(16).padStart(3, "0");

  // 生成UUID并移除连字符
  const fulluuid = randomUUID().replace(/-/g, "");

  // 计算需要从UUID中取的位数
  const usedLength = timestampHex.length + millisHex.length;
  const remainingLength = 24 - usedLength;

  let permalink: string;
  let useduuid: string;

  if (remainingLength < 0) {
    // 如果时间戳部分过长，截断时间戳部分
    timestampHex = timestampHex.substring(0, timestampHex.length + remainingLength);
    const finalLength = timestampHex.length + millisHex.length;
    useduuid = fulluuid.substring(0, 24 - finalLength);
    permalink = timestampHex + millisHex + useduuid;
  } else {
    // 从UUID中取对应位数的字符
    useduuid = fulluuid.substring(0, remainingLength);

    // 组合成最终的24位十六进制ID
    permalink = timestampHex + millisHex + useduuid;
    permalink = permalink.padEnd(24, "0").substring(0, 24);
  }

  // 根据usePrefix参数决定是否添加前缀
  const finalPermalink = usePrefix ? `/${PERMALINK_PREFIX}/${permalink}` : `/${permalink}`;

  // 添加前导斜杠
  return {
    permalink: finalPermalink,
    fulluuid,
    useduuid
  };
}

/**
 * @brief 读取模板文件内容
 * @param {string} templatePath - 模板文件路径
 * @return {string} 模板文件内容
 * @throws {Error} 当文件读取失败时抛出异常
 */
function readTemplate(templatePath: string): string {
  try {
    return fs.readFileSync(templatePath, "utf8");
  } catch (err) {
    console.error(`❌ 模板文件读取失败: ${templatePath}`);
    console.error((err as Error).message);
    process.exit(1);
  }
}

/**
 * @brief 获取处理后的标题
 * @param {string} name - 原始标题名称
 * @param {string} [outputDir] - 输出目录的绝对路径（仅用于index模板）
 * @return {string} 处理后的标题
 */
function getTitle(name: string, outputDir?: string): string {
  // 如果outputDir存在，则处理index模板的标题
  if (outputDir) {
    // 获取当前目录名
    let dirName = path.basename(outputDir);

    // 处理目录名，去除前缀序号(例如: 04-测试 -> 测试)
    dirName = dirName.replace(/^\d+-/, "");

    return dirName;
  }

  // 否则处理普通模板的标题
  return name;
}

/**
 * @brief 格式化日期时间字符串，用于 替换 {{ title }}
 * @param {Date} date - 要格式化的日期对象
 * @return 格式化的日期时间字符串 (YYYY-MM-DD HH:MM:SS)
 */
function formatDateTime(date: Date): string {
  // 使用 padStart(2, '0') 确保单数位数字补零（如 9 → 09）
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份从0开始需+1
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // 组合成目标格式
}

/**
 * @brief 获取处理后的目录名（用于index模板）
 * @param {string} outputDir - 输出目录的绝对路径
 * @return {string} 处理后的目录名
 */
function getIndexDir(outputDir: string): string {
  // 获取当前目录名
  let dirName = path.basename(outputDir);

  // 处理目录名，去除前缀序号(例如: 04-测试 -> 测试)
  dirName = dirName.replace(/^\d+-/, "");

  return dirName;
}

/**
 * @brief 获取处理后的路径（用于index模板）
 * @param {string} outputDir - 输出目录的绝对路径
 * @return {string} 处理后的路径
 */
function getIndexPath(outputDir: string): string {
  // 获取当前目录名
  let dirName = path.basename(outputDir);

  // 处理目录名，去除前缀序号(例如: 04-测试 -> 测试)
  dirName = dirName.replace(/^\d+-/, "");

  // 解析绝对路径
  const absolutePath = path.resolve(outputDir);

  // 检查路径中是否含有'sdoc'目录
  const sdocIndex = absolutePath.indexOf("sdoc");
  if (sdocIndex !== -1) {
    // 如果含有'sdoc'目录，则从这一级开始截断
    const sdocPath = absolutePath.substring(sdocIndex);
    // 将反斜杠替换为正斜杠
    return sdocPath.replace(/\\/g, "/");
  } else {
    // 若不含sdoc，则使用最后的目录名作为path
    return dirName;
  }
}

/**
 * @brief 替换一般文档模板中的占位符生成最终内容
 * @param {string} template - 模板内容
 * @param {string} name - 要替换的标题名称
 * @param {Date} date - 时间对象，用于生成date和permalink
 * @param {string} permalink - 已生成的permalink
 * @param {string} detailDate - 详细时间戳
 * @param {string} fulluuid - 完整的UUID
 * @param {string} useduuid - 生成permalink使用的UUID部分
 * @return {string} 替换后的内容
 * @note 替换模板中的{{ title }}、{{ date }}、{{ permalink }}、{{ detailDate }}、{{ fulluuid }}和{{ useduuid }}占位符
 */
function generateContent(
  template: string,
  name: string,
  date: Date,
  permalink: string,
  detailDate: string,
  fulluuid: string,
  useduuid: string
): string {
  return template
    .replace(/{{ title }}/g, getTitle(name))
    .replace(/{{ date }}/g, formatDateTime(date))
    .replace(/{{ permalink }}/g, permalink)
    .replace(/{{ detailDate }}/g, detailDate)
    .replace(/{{ fulluuid }}/g, fulluuid)
    .replace(/{{ useduuid }}/g, useduuid);
}

/**
 * @brief 为index.md模板替换占位符生成最终内容
 * @param {string} template - 模板内容
 * @param {string} outputDir - 输出目录的绝对路径
 * @param {Date} date - 时间对象，用于生成date和permalink
 * @param {string} permalink - 已生成的permalink
 * @param {string} detailDate - 详细时间戳
 * @param {string} fulluuid - 完整的UUID
 * @param {string} useduuid - 生成permalink使用的UUID部分
 * @return {string} 替换后的内容
 * @note 替换模板中的{{ title }}、{{ date }}、{{ permalink }}、{{ path }}、{{ dir }}、{{ detailDate }}、{{ fulluuid }}和{{ useduuid }}占位符
 */
function generateIndexContent(
  template: string,
  outputDir: string,
  date: Date,
  permalink: string,
  detailDate: string,
  fulluuid: string,
  useduuid: string
): string {
  return template
    .replace(/{{ title }}/g, getTitle("", outputDir)) // 传递空字符串作为name参数，因为getTitle会根据outputDir处理index模板的标题
    .replace(/{{ date }}/g, formatDateTime(date))
    .replace(/{{ permalink }}/g, permalink)
    .replace(/{{ path }}/g, getIndexPath(outputDir))
    .replace(/{{ dir }}/g, getIndexDir(outputDir))
    .replace(/{{ detailDate }}/g, detailDate)
    .replace(/{{ fulluuid }}/g, fulluuid)
    .replace(/{{ useduuid }}/g, useduuid);
}

export {
  generatePermalink,
  PermalinkData,
  PERMALINK_PREFIX,
  readTemplate,
  getTitle,
  formatDateTime,
  getIndexDir,
  getIndexPath,
  generateContent,
  generateIndexContent,
  processPathWithMap
};

/**
 * @brief 根据路径映射表处理permalink
 * @param {string} outputDir - 输出目录的绝对路径
 * @param {string} [mapFile] - 路径映射表文件路径，如果不提供则使用默认路径
 * @return {string | null} 处理后的路径，如果没有有效映射则返回null
 */
async function processPathWithMap(outputDir: string, mapFile?: string): Promise<string | null> {
  try {
    // 获取输出目录的绝对路径
    const absoluteOutputDir = path.resolve(outputDir);

    // 检查路径中是否含有sdoc目录
    const sdocIndex = absoluteOutputDir.indexOf(SDOC_DIR_NAME);
    if (sdocIndex === -1) {
      console.error(`❌ 输出目录中不包含'${SDOC_DIR_NAME}': ${absoluteOutputDir}`);
      return null;
    }

    // 确定映射文件路径
    let pathMapPath: string;
    if (mapFile) {
      // 如果提供了映射文件路径
      pathMapPath = path.isAbsolute(mapFile) ? mapFile : path.join(process.cwd(), mapFile);
    } else {
      // 如果没有提供映射文件路径，使用默认路径
      // 从sdoc开始截断路径
      const sdocPath = absoluteOutputDir.substring(0, sdocIndex + SDOC_DIR_NAME.length);
      // 默认映射文件路径 (只支持.js类型)
      pathMapPath = path.join(sdocPath, "path-map.js");
    }

    // 检查映射文件是否存在
    if (!fs.existsSync(pathMapPath)) {
      console.error(`❌ 路径映射文件不存在: ${pathMapPath}`);
      console.error(
        `💡 提示: 使用 'tdoc m:m -d path' 命令生成路径映射文件, path 需要包含 ${SDOC_DIR_NAME}, 都是以${SDOC_DIR_NAME}为基础路劲`
      );
      return null;
    }

    // 读取并解析映射文件 (只支持.js类型)
    let pathMap: Record<string, string>;
    if (!pathMapPath.endsWith(".js")) {
      console.error(`❌ 映射文件必须是.js类型: ${pathMapPath}`);
      return null;
    }

    // 使用require导入JS文件
    let loadedMap = require(pathMapPath);
    // 处理ES6模块的default导出
    pathMap = loadedMap.default || loadedMap;

    // 从sdoc开始截断路径
    const sdocPath = absoluteOutputDir.substring(sdocIndex);

    // 分割路径为各个部分并进行映射
    const pathParts = sdocPath.split(path.sep);
    const mappedParts: string[] = [];

    for (const part of pathParts) {
      if (part === SDOC_DIR_NAME) {
        // 直接添加sdoc
        mappedParts.push(part);
      } else if (pathMap[part]) {
        // 如果在映射表中找到，则使用映射值
        mappedParts.push(pathMap[part]);
      } else {
        // 如果没有找到映射，则返回null
        console.error(`❌ 路径部分'${part}'没有有效的映射`);
        return null;
      }
    }

    // 返回映射后的路径
    return mappedParts.join("/");
  } catch (err) {
    console.error(`❌ 处理路径映射时出错: ${(err as Error).message}`);
    return null;
  }
}
