/**
 * @interface CommandOptions
 * @property {string} [template] - 使用的模板名称 (默认为'post')
 * @property {boolean} [force] - 是否强制覆盖已存在的文件
 * @property {string} [dir] - 指定输出目录 (默认为'test')
 * @property {string | boolean} [map] - 路径映射表文件路径，当使用-m但不提供值时为true
 */
export interface CommandOptions {
  template?: string;
  force?: boolean;
  dir?: string;
  map?: string | boolean;
}
