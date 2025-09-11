/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : types.ts
 * Author     : 苏木
 * Date       : 2025-09-11
 * Version    :
 * Description: Mist CLI 类型定义
 * ======================================================
 */

/**
 * @interface 配置替换规则接口
 */
export interface ConfigReplacementRule {
  /** 搜索的正则表达式或字符串 */
  search: string | RegExp;
  /** 替换的字符串或函数 */
  replace: string | ((dirName: string) => string);
  /** 规则描述 */
  description: string;
}

/**
 * @interface 配置更新参数接口
 */
export interface UpdateConfigParams {
  /** 站点目录名 */
  dirName: string;
  /** 站点标题 */
  title: string;
  /** 站点描述 */
  description: string;
}
