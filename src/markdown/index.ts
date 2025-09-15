/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : index.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: markdown模块的命令注册
 * ======================================================
 */

import { Command } from "commander";
import { createMnCommand } from "./cmd_create_md";
import { createMpCommand } from "./cmd_parse_md";
import { createMaCommand } from "./cmd_add_frontmatter";
import { createGenerateMapCommand } from "./cmd_generate_map";
import { createMdCommand } from "./cmd_move_docs";

/**
 * @brief 创建markdown相关的命令数组
 * @return {Command[]} 配置好的Command实例数组
 */
function createMarkdownCommands(): Command[] {
  return [
    createMnCommand(), // m:n 命令
    createMpCommand(), // m:p 命令
    createMaCommand(), // m:a 命令
    createGenerateMapCommand(), // m:m 命令
    createMdCommand() // m:d 命令
  ];
}

export default createMarkdownCommands;
