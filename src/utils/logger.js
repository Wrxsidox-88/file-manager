const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.ensureLogDir();
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('创建日志目录失败:', error);
    }
  }

  getLogFileName(type = 'app') {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return `${type}-${dateStr}.log`;
  }

  getLogFilePath(type = 'app') {
    return path.join(this.logDir, this.getLogFileName(type));
  }

  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge && file.endsWith('.log')) {
          await fs.unlink(filePath);
          console.log(`已删除过期日志: ${file}`);
        }
      }
    } catch (error) {
      console.error('清理旧日志失败:', error);
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  async writeLog(type, level, message, meta = {}) {
    try {
      const logFilePath = this.getLogFilePath(type);
      const formattedMessage = this.formatMessage(level, message, meta);
      await fs.appendFile(logFilePath, formattedMessage, 'utf8');
    } catch (error) {
      console.error('写入日志失败:', error);
    }
  }

  async info(message, meta = {}) {
    await this.writeLog('app', 'info', message, meta);
  }

  async error(message, meta = {}) {
    await this.writeLog('app', 'error', message, meta);
  }

  async warn(message, meta = {}) {
    await this.writeLog('app', 'warn', message, meta);
  }

  async access(message, meta = {}) {
    await this.writeLog('access', 'info', message, meta);
  }

  async fileOperation(message, meta = {}) {
    await this.writeLog('file', 'info', message, meta);
  }

  async security(message, meta = {}) {
    await this.writeLog('security', 'warn', message, meta);
  }
}

const logger = new Logger();

module.exports = logger;