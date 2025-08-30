/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : helper.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: 辅助函数集合
 * ======================================================
 */

import { randomUUID } from 'crypto';

const PERMALINK_PREFIX = 'docs'
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
function generatePermalink(date: Date): PermalinkData {
  // 获取年月日时分秒
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // 组合成 YYYYMMDDHHMMSS 格式
  const timestampStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  // 将时间戳字符串转换为BigInt然后转换为十六进制
  const timestampBigInt = BigInt(timestampStr);
  let timestampHex = timestampBigInt.toString(16);
  
  // 获取毫秒并转换为十六进制
  const milliseconds = date.getMilliseconds();
  const millisHex = milliseconds.toString(16).padStart(3, '0');
  
  // 生成UUID并移除连字符
  const fulluuid = randomUUID().replace(/-/g, '');
  
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
    permalink = permalink.padEnd(24, '0').substring(0, 24);
  }
  
  // 添加前导斜杠
  return {
    permalink: `/${PERMALINK_PREFIX}/${permalink}`,
    fulluuid,
    useduuid
  };
}

export { generatePermalink, PermalinkData };
