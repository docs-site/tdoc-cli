/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : cmd_parse_md.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: 解析markdown文件中的元数据命令实现
 * ======================================================
 */

import fs from 'fs';
import path from 'path';
import { PERMALINK_PREFIX } from './helper';

/**
 * @interface Metadata
 * @property {string} title - 标题
 * @property {string} date - 日期
 * @property {string} permalink - 永久链接
 * @property {string} [detailDate] - 详细日期
 * @property {string} [fulluuid] - 完整UUID
 * @property {string} [useduuid] - 使用的UUID部分
 */
interface Metadata {
  title: string;
  date: string;
  permalink: string;
  detailDate?: string;
  fulluuid?: string;
  useduuid?: string;
}

/**
 * @interface ParsedPermalink
 * @property {string} originalPermalink - 原始永久链接
 * @property {string} timestamp - 时间戳
 * @property {Date} date - 日期对象
 * @property {number} year - 年
 * @property {number} month - 月
 * @property {number} day - 日
 * @property {number} hours - 时
 * @property {number} minutes - 分
 * @property {number} seconds - 秒
 * @property {number} milliseconds - 毫秒
 * @property {string} isoString - ISO格式日期字符串
 * @property {string} localString - 本地格式日期字符串
 */
interface ParsedPermalink {
  originalPermalink: string;
  timestamp: string;
  date: Date;
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  isoString: string;
  localString: string;
}

/**
 * @brief 从永久链接中解析时间戳
 * @param {string} permalink - 永久链接，格式为 /xxxxxxxxxxxxxxxxxxxxxxxx
 * @returns {ParsedPermalink} 包含时间戳信息的对象
 */
function parsePermalink(permalink: string): ParsedPermalink {
  // 移除前导斜杠和前缀
  let hexStr = permalink.startsWith('/') ? permalink.substring(1) : permalink;
  if (hexStr.startsWith(PERMALINK_PREFIX + '/')) {
    hexStr = hexStr.substring(PERMALINK_PREFIX.length + 1);
  }
  
  if (hexStr.length !== 24) {
    throw new Error('永久链接格式不正确，应为24位十六进制数');
  }
  
  // 尝试解析时间戳部分
  // 时间戳部分通常是YYYYMMDDHHMMSS的十六进制表示
  // 由于时间戳部分的长度可能变化，我们需要尝试不同的长度
  
  let timestamp = null;
  let dateObj = null;
  let milliseconds = 0;
  
  // 尝试从12位十六进制数开始解析（对应14位十进制时间戳）
  for (let timestampLength = 12; timestampLength >= 8; timestampLength--) {
    try {
      const timestampHex = hexStr.substring(0, timestampLength);
      const timestampDec = BigInt('0x' + timestampHex).toString();
      
      if (timestampDec.length === 14) { // YYYYMMDDHHMMSS格式
        const year = parseInt(timestampDec.substring(0, 4));
        const month = parseInt(timestampDec.substring(4, 6));
        const day = parseInt(timestampDec.substring(6, 8));
        const hours = parseInt(timestampDec.substring(8, 10));
        const minutes = parseInt(timestampDec.substring(10, 12));
        const seconds = parseInt(timestampDec.substring(12, 14));
        
        // 检查日期是否有效
        const tempDate = new Date(year, month - 1, day, hours, minutes, seconds);
        if (tempDate.getFullYear() === year && 
            tempDate.getMonth() === month - 1 &&
            tempDate.getDate() === day) {
          
          // 解析毫秒部分（接下来的3位十六进制）
          const millisHex = hexStr.substring(timestampLength, timestampLength + 3);
          milliseconds = parseInt(millisHex, 16);
          
          dateObj = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
          timestamp = timestampDec;
          break;
        }
      }
    } catch (e) {
      // 继续尝试其他长度
      continue;
    }
  }
  
  if (!dateObj) {
    throw new Error('无法从永久链接中解析有效的时间戳');
  }
  
  // 确保timestamp不为null
  if (!timestamp) {
    throw new Error('无法从永久链接中解析有效的时间戳');
  }
  
  return {
    originalPermalink: permalink,
    timestamp: timestamp,
    date: dateObj,
    year: dateObj.getFullYear(),
    month: dateObj.getMonth() + 1,
    day: dateObj.getDate(),
    hours: dateObj.getHours(),
    minutes: dateObj.getMinutes(),
    seconds: dateObj.getSeconds(),
    milliseconds: dateObj.getMilliseconds(),
    isoString: dateObj.toISOString(),
    localString: dateObj.toLocaleString('zh-CN')
  };
}

/**
 * @brief 从markdown文件中提取元数据
 * @param {string} filePath - markdown文件路径
 * @returns {Metadata} 提取的元数据
 */
function extractMetadata(filePath: string): Metadata {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 查找YAML front matter
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
      throw new Error('未找到YAML front matter');
    }
    
    const frontMatter = match[1];
    const lines = frontMatter.split('\n');
    
    const metadata: Metadata = {
      title: '',
      date: '',
      permalink: ''
    };
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      switch (key.trim()) {
        case 'title':
          metadata.title = value.replace(/^['"]|['"]$/g, ''); // 移除引号
          break;
        case 'date':
          metadata.date = value.replace(/^['"]|['"]$/g, ''); // 移除引号
          break;
        case 'permalink':
          metadata.permalink = value.replace(/^['"]|['"]$/g, ''); // 移除引号
          break;
        case 'tdoc':
          // 处理tdoc下的子字段
          // 这里我们不需要处理，因为我们只关心第一层的字段
          break;
        default:
          // 处理tdoc下的子字段
          if (line.trim().startsWith('detailDate:')) {
            metadata.detailDate = value.replace(/^['"]|['"]$/g, ''); // 移除引号
          } else if (line.trim().startsWith('fulluuid:')) {
            metadata.fulluuid = value.replace(/^['"]|['"]$/g, ''); // 移除引号
          } else if (line.trim().startsWith('useduuid:')) {
            metadata.useduuid = value.replace(/^['"]|['"]$/g, ''); // 移除引号
          }
          break;
      }
    }
    
    return metadata;
  } catch (err) {
    console.error(`❌ 读取文件失败: ${filePath}`);
    console.error((err as Error).message);
    process.exit(1);
  }
}

/**
 * @brief 解析markdown文件中的元数据并输出时间信息
 * @param {string} filePath - markdown文件路径
 * @returns {Promise<void>} 无返回值
 */
async function parseMarkdownMetadata(filePath: string): Promise<void> {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果filePath不是完整路径，尝试在当前目录下查找
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ 文件不存在: ${filePath}`);
        process.exit(1);
      }
      filePath = fullPath;
    }
    
    // 提取元数据
    const metadata = extractMetadata(filePath);
    
    // 解析permalink
    const parsedPermalink = parsePermalink(metadata.permalink);
    
    // 输出结果
    console.log(`📄 文件: ${filePath}`);
    console.log('='.repeat(50));
    console.log('📋 Frontmatter 信息:');
    console.log(`  标题          : ${metadata.title}`);
    console.log(`  日期          : ${metadata.date}`);
    console.log(`  永久链接      : ${metadata.permalink}`);
    
    if (metadata.detailDate) {
      console.log(`  详细日期      : ${metadata.detailDate}`);
    }
    
    if (metadata.fulluuid) {
      console.log(`  完整UUID      : ${metadata.fulluuid}`);
    }
    
    if (metadata.useduuid) {
      console.log(`  使用的UUID部分: ${metadata.useduuid}`);
    }
    
    console.log('-'.repeat(50));
    console.log('📅 解析的时间信息:');
    console.log(`  时间戳        : ${parsedPermalink.timestamp}`);
    console.log(`  日期          : ${parsedPermalink.localString}`);
    console.log(`  ISO格式       : ${parsedPermalink.isoString}`);
    console.log(`  年-月-日      : ${parsedPermalink.year}-${parsedPermalink.month.toString().padStart(2, '0')}-${parsedPermalink.day.toString().padStart(2, '0')}`);
    console.log(`  时:分:秒.毫秒 : ${parsedPermalink.hours.toString().padStart(2, '0')}:${parsedPermalink.minutes.toString().padStart(2, '0')}:${parsedPermalink.seconds.toString().padStart(2, '0')}.${parsedPermalink.milliseconds.toString().padStart(3, '0')}`);
  } catch (err) {
    console.error('❌ 解析markdown元数据失败:', (err as Error).message);
    process.exit(1);
  }
}

export { parseMarkdownMetadata };
