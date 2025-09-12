/**
 * 从永久链接中解析时间戳
 * @param {string} permalink - 永久链接，格式为 /xxxxxxxxxxxxxxxxxxxxxxxx
 * @returns {Object} 包含时间戳信息的对象
 */
function parsePermalink(permalink) {
  // 移除前导斜杠
  const hexStr = permalink.startsWith("/") ? permalink.substring(1) : permalink;

  if (hexStr.length !== 24) {
    throw new Error("永久链接格式不正确，应为24位十六进制数");
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
      const timestampDec = BigInt("0x" + timestampHex).toString();

      if (timestampDec.length === 14) {
        // YYYYMMDDHHMMSS格式
        const year = parseInt(timestampDec.substring(0, 4));
        const month = parseInt(timestampDec.substring(4, 6));
        const day = parseInt(timestampDec.substring(6, 8));
        const hours = parseInt(timestampDec.substring(8, 10));
        const minutes = parseInt(timestampDec.substring(10, 12));
        const seconds = parseInt(timestampDec.substring(12, 14));

        // 检查日期是否有效
        const tempDate = new Date(year, month - 1, day, hours, minutes, seconds);
        if (tempDate.getFullYear() === year && tempDate.getMonth() === month - 1 && tempDate.getDate() === day) {
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
    throw new Error("无法从永久链接中解析有效的时间戳");
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
    localString: dateObj.toLocaleString("zh-CN")
  };
}

// 测试函数
function testParsePermalink() {
  // 测试一些示例永久链接
  const testLinks = [
    "/126b037b77a40d68c71e3063", // 示例链接
    "/126b037b79202c6292699bee"
  ];

  console.log("永久链接解析测试:");
  console.log("=".repeat(50));

  testLinks.forEach((link, index) => {
    try {
      const result = parsePermalink(link);
      console.log(`测试 ${index + 1}:`);
      console.log(`  原始链接: ${link}`);
      console.log(`  时间戳: ${result.timestamp}`);
      console.log(`  日期: ${result.localString}`);
      console.log(`  ISO格式: ${result.isoString}`);
      console.log(
        `  年-月-日: ${result.year}-${result.month.toString().padStart(2, "0")}-${result.day.toString().padStart(2, "0")}`
      );
      console.log(
        `  时:分:秒.毫秒: ${result.hours.toString().padStart(2, "0")}:${result.minutes.toString().padStart(2, "0")}:${result.seconds.toString().padStart(2, "0")}.${result.milliseconds.toString().padStart(3, "0")}`
      );
      console.log("-".repeat(30));
    } catch (error) {
      console.log(`测试 ${index + 1}: ${link}`);
      console.log(`  错误: ${error.message}`);
      console.log("-".repeat(30));
    }
  });
}

// 导出函数供其他模块使用
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parsePermalink };
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testParsePermalink();
}
