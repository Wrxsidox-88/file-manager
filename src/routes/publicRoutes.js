const express = require('express');
const FileStorage = require('../utils/fileStorage');
const logger = require('../utils/logger');

function createPublicRoutes(config, extensionConfig) {
  const router = express.Router();
  const storage = new FileStorage(config.dataFile);

  router.get('/*', async (req, res) => {
    try {
      const requestPath = req.params[0];
      
      // 提取可能的文件名
      const parts = requestPath.split('/').filter(p => p);
      
      if (parts.length === 0) {
        return res.status(400).json({ error: '无效的访问路径' });
      }

      // 尝试匹配文件：可能是完整路径或者路径+文件名
      let file = null;
      
      // 优先尝试完整路径匹配
      file = await storage.getPublicFileByPath(requestPath);
      
      // 如果没匹配到，尝试去掉最后一部分（文件名）后匹配
      if (!file && parts.length > 1) {
        const prefixPath = '/' + parts.slice(0, -1).join('/');
        const fileName = parts[parts.length - 1];
        
        // 查找公共路径为prefixPath，文件名匹配的文件
        const allPublicFiles = await storage.getAllPublicFiles();
        file = allPublicFiles.find(f => {
          const storedPath = f.publicPath || '';
          return storedPath === prefixPath && f.fileName === fileName;
        });
      }

      if (!file) {
        // 文件不存在，提取后缀进行处理
        const lastPart = parts[parts.length - 1];
        const extension = lastPart.includes('.') ? lastPart.split('.').pop() : '';
        
        const extConfig = extensionConfig.getExtension(extension);
        
        logger.info('文件未找到，使用后缀配置处理', {
          requestPath,
          extension,
          config: extConfig,
          ip: req.ip
        });

        if (extConfig.type === 'redirect') {
          return res.redirect(extConfig.value);
        } else if (extConfig.type === 'file') {
          const fs = require('fs');
          const filePath = path.join(process.cwd(), extConfig.value);
          
          if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
          } else {
            logger.warn('默认文件不存在', { filePath });
            return res.status(404).json({ error: '文件不存在' });
          }
        }
        
        logger.security('公共文件访问失败 - 文件不存在', {
          requestPath,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        return res.status(404).json({ error: '文件不存在或未公开访问' });
      }

      await storage.recordAccess(
        file.id, 
        req.ip, 
        req.get('user-agent')
      );

      logger.access('公共文件下载', {
        fileId: file.id,
        fileName: file.originalName,
        requestPath,
        ip: req.ip
      });

      res.download(file.path, file.originalName);
    } catch (error) {
      logger.error('公共文件访问失败', {
        requestPath: req.params[0],
        error: error.message,
        ip: req.ip
      });
      res.status(500).json({ error: '文件访问失败: ' + error.message });
    }
  });

  return router;
}

module.exports = createPublicRoutes;