import { input, password } from "@inquirer/prompts";
import { createInterface } from "readline";
import { Command } from "commander";

// 清空标准输入缓冲区
function clearStdin() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.close();
}

// 登录逻辑处理
export default async function loginCommand() {
  // 清空可能存在的预读取输入
  clearStdin();
  await new Promise((resolve) => setImmediate(resolve));
  try {
    const username = await input({
      message: "请输入用户名:",
      validate: (value) => value.trim() !== "" || "用户名不能为空"
    });

    const userPassword = await password({
      message: "请输入密码:",
      mask: "*",
      validate: (value) => value.length >= 6 || "密码长度至少6位"
    });

    console.log("\n登录信息验证中...");
    // 实际开发中这里替换为真实的登录API调用
    await new Promise((resolve) => setTimeout(resolve, 200)); // 模拟网络延迟

    console.log(`\n✅ 登录成功！欢迎回来，${username} (密码长度: ${"*".repeat(userPassword.length)})`);
    // 返回用户信息（模拟）
    return { username, token: "模拟令牌" };
  } catch (error) {
    console.error("\n❌ 登录失败:", (error as Error).message);
    process.exit(1);
  }
}

/**
 * @brief 注册登录命令
 * @param {Command} program - commander的Command实例
 */
function registerLoginCommand(program: Command): void {
  program
    .command("login")
    .description("用户登录")
    .action(async () => {
      await loginCommand();
    });
}

/**
 * @brief 直接执行检查
 * @description 当文件被直接执行而非require导入时，自动运行 loginCommand 函数
 */
if (require.main === module) {
  loginCommand();
}

export { registerLoginCommand };
