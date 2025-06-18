/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : sys_time.ts
 * Author     : 苏木
 * Date       : 2025-06-18
 * Version    :
 * Description: 日期时间工具函数
 * ======================================================
 */

/**
 * @brief 获取当前日期时间字符串
 * @return 格式化的日期时间字符串 (YYYY-MM-DD HH:MM:SS)
 */
export function getCurrentDateTime(): string {
  const now = new Date();

  // 使用 padStart(2, '0') 确保单数位数字补零（如 9 → 09）
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始需+1
  const day = String(now.getDate()).padStart(2, '0');

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // 组合成目标格式
}
