const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class ExtensionConfig {
  constructor(configFilePath) {
    this.configFilePath = configFilePath;
    this.config = {
      default: {
        type: 'file',
        value: '404.html'
      },
      extensions: {}
    };
  }

  async load() {
    try {
      if (await fs.access(this.configFilePath).then(() => true).catch(() => false)) {
        const data = await fs.readFile(this.configFilePath, 'utf8');
        this.config = JSON.parse(data);
        logger.info('后缀配置加载成功', { path: this.configFilePath });
      } else {
        await this.save();
        logger.info('后缀配置文件创建', { path: this.configFilePath });
      }
    } catch (error) {
      logger.error('加载后缀配置失败', { error: error.message });
      await this.save();
    }
  }

  async save() {
    try {
      await fs.writeFile(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (error) {
      logger.error('保存后缀配置失败', { error: error.message });
      throw error;
    }
  }

  getConfig() {
    return this.config;
  }

  getExtension(extension) {
    // 处理空后缀或无后缀的情况，直接返回默认配置
    if (!extension || extension === '') {
      return this.config.default;
    }
    
    const ext = extension.toLowerCase();
    if (this.config.extensions[ext]) {
      return this.config.extensions[ext];
    }
    // 没有找到特定后缀配置，返回默认配置
    return this.config.default;
  }

  async setExtension(extension, type, value) {
    const ext = extension.toLowerCase();
    this.config.extensions[ext] = { type, value };
    await this.save();
    logger.info('后缀配置已更新', { extension: ext, type, value });
  }

  async deleteExtension(extension) {
    const ext = extension.toLowerCase();
    delete this.config.extensions[ext];
    await this.save();
    logger.info('后缀配置已删除', { extension: ext });
  }

  async setDefault(type, value) {
    this.config.default = { type, value };
    await this.save();
    logger.info('默认后缀配置已更新', { type, value });
  }

  async addMultipleExtensions(extensions) {
    for (const ext of extensions) {
      if (ext.extension && ext.type && ext.value) {
        this.config.extensions[ext.extension.toLowerCase()] = {
          type: ext.type,
          value: ext.value
        };
      }
    }
    await this.save();
    logger.info('批量添加后缀配置完成', { count: extensions.length });
  }

  async getAllExtensions() {
    return this.config.extensions;
  }
}

module.exports = ExtensionConfig;