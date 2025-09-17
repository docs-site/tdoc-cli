const fs = require('fs');
const path = require('path');

// 需要备份的文件扩展名（来自 .gitignore 第142-149行）
const TARGET_EXTENSIONS = ['.xmind', '.pptx', '.ppt', '.vsdx', '.docx', '.doc', '.xls', '.xlsx'];
// OneDrive 备份目录（使用环境变量）
const ONEDRIVE_BACKUP_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\20380', 'OneDrive', 'sumu-docs');

// 检查是否启用调试模式
const debugMode = process.argv.includes('--debug');

/**
 * 创建目录（如果不存在）
 * @param {string} dirPath - 目录路径
 * @param {string} baseDir - 基础目录（用于相对路径显示）
 * @returns {number} 创建的目录数量
 */
function createDirectoryIfNotExists(dirPath, baseDir = '') {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    if (debugMode && baseDir) {
      const relativePath = path.relative(baseDir, dirPath);
      console.log(`📁 创建目录: ${relativePath}`);
    }
    return 1;
  }
  return 0;
}

/**
 * 复制文件到目标位置
 * @param {string} sourceFile - 源文件路径
 * @param {string} targetFile - 目标文件路径
 * @param {string} relativePath - 相对路径（用于日志显示）
 * @returns {boolean} 是否成功复制
 */
function copyFileWithBackup(sourceFile, targetFile, relativePath) {
  try {
    // 检查目标文件是否已存在（仅在调试模式下显示）
    if (fs.existsSync(targetFile) && debugMode) {
      console.log(`⚠️  文件已存在，将覆盖: ${relativePath}`);
    }
    
    fs.copyFileSync(sourceFile, targetFile);
    
    if (debugMode) {
      console.log(`✅ 已备份: ${relativePath}`);
    }
    return true;
  } catch (copyError) {
    console.error(`❌ 备份失败: ${relativePath} - ${copyError.message}`);
    return false;
  }
}

/**
 * 格式化运行时间
 * @param {number} durationMs - 运行时间（毫秒）
 * @returns {string} 格式化后的时间字符串
 */
function formatDuration(durationMs) {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const milliseconds = durationMs % 1000;
  
  let timeString = '⏱️  运行时间: ';
  if (minutes > 0) {
    timeString += `${minutes}m `;
  }
  if (seconds > 0 || minutes > 0) {
    timeString += `${seconds}s `;
  }
  timeString += `${milliseconds}ms`;
  
  return timeString;
}

/**
 * 递归查找并备份目标文件
 * @param {string} dir - 当前目录路径
 * @param {string} sourceDirPath - 源目录根路径
 * @param {string} targetBackupDir - 目标备份目录
 * @param {Object} stats - 统计对象
 */
function findAndBackupFiles(dir, sourceDirPath, targetBackupDir, stats) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // 递归处理子目录
      findAndBackupFiles(fullPath, sourceDirPath, targetBackupDir, stats);
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      
      // 检查是否是目标文件类型
      if (TARGET_EXTENSIONS.includes(ext)) {
        stats.totalFilesFound++;
        
        // 计算相对路径（相对于源目录）
        const relativePath = path.relative(sourceDirPath, fullPath);
        const targetFilePath = path.join(targetBackupDir, relativePath);
        const targetDir = path.dirname(targetFilePath);
        
        // 创建目标目录（如果不存在）
        stats.totalDirsCreated += createDirectoryIfNotExists(targetDir, targetBackupDir);
        
        // 拷贝文件
        if (copyFileWithBackup(fullPath, targetFilePath, relativePath)) {
          stats.totalFilesCopied++;
        }
      }
    }
  });
}

/**
 * 备份 Office 文档主函数
 */
function backupOfficeDocuments() {
  try {
    // 记录开始时间
    const startTime = Date.now();
    
    console.log('🚀 开始执行 Office 文档备份任务');
    if (debugMode) {
      console.log('🔧 调试模式已启用');
    }
    console.log('─'.repeat(50));
    
    // 获取当前工作目录的绝对路径
    const currentDir = process.cwd();
    console.log('📁 当前工作目录:', currentDir);

    // 获取工程目录名（当前目录的文件夹名）
    const projectName = path.basename(currentDir);
    console.log('🏗️  工程目录名:', projectName);

    // 源目录路径
    const sourceDirPath = path.join(currentDir, 'src', 'sdoc');
    console.log('📦 源目录路径:', sourceDirPath);
    console.log('─'.repeat(50));

    // 检查源目录是否存在
    if (!fs.existsSync(sourceDirPath)) {
      console.error('❌ 错误: sdoc 目录不存在:', sourceDirPath);
      process.exit(1);
    }

    // 创建目标备份目录（按项目名称）
    const targetBackupDir = path.join(ONEDRIVE_BACKUP_DIR, projectName);
    const dirsCreated = createDirectoryIfNotExists(targetBackupDir);
    if (dirsCreated > 0) {
      console.log('📁 创建目标备份目录:', targetBackupDir);
    }

    // 统计对象
    const stats = {
      totalFilesFound: 0,
      totalFilesCopied: 0,
      totalDirsCreated: 0
    };

    // 递归查找并备份目标文件
    console.log('🔍 正在查找目标文件...');
    findAndBackupFiles(sourceDirPath, sourceDirPath, targetBackupDir, stats);
    console.log(`   - 找到目标文件: ${stats.totalFilesFound} 个`);

    console.log('─'.repeat(50));
    console.log('📊 备份统计:');
    console.log(`   - 成功备份文件: ${stats.totalFilesCopied} 个`);
    console.log(`   - 创建目录: ${stats.totalDirsCreated} 个`);
    
    // 计算并显示运行时间
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    console.log(formatDuration(durationMs));
    
    if (stats.totalFilesCopied > 0) {
      console.log('🎉 Office 文档备份完成!');
      console.log(`📂 备份位置: ${targetBackupDir}`);
    } else {
      console.log('ℹ️  未找到需要备份的 Office 文档');
    }
    console.log('─'.repeat(50));
  } catch (error) {
    console.error('❌ 备份过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 执行备份操作
backupOfficeDocuments();
