/** =====================================================
 * Copyright © hk. 2022-2025. All rights reserved.
 * File name  : mist-cli.ts
 * Author     : 苏木
 * Date       : 2025-08-30
 * Version    :
 * Description: Mist命令注册主入口
 * ======================================================
 */

import { Command } from "commander";
import { createDocsCommand } from "./cmd_docs";
import { createInitCommand } from "./cmd_init";

/**
 * @brief 创建mist命令
 * @returns {Command} commander的Command实例
 */
function createMistCommand(): Command {
  const program = new Command("mist").description("Mist相关的命令");

  // 添加init子命令
  program.addCommand(createInitCommand());

  // 添加docs子命令
  program.addCommand(createDocsCommand());

  return program;
}

export default createMistCommand;
