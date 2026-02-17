require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const createFileRoutes = require('./src/routes/fileRoutes');
const createAdminRoutes = require('./src/routes/adminRoutes');
const createPublicRoutes = require('./src/routes/publicRoutes');
const createAuthMiddleware = require('./src/middleware/auth');
const logger = require('./src/utils/logger');
const ExtensionConfig = require('./src/utils/extensionConfig');

const app = express();

const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  dataFile: process.env.DATA_FILE || './data/files.json',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminPath: process.env.ADMIN_PATH || '/admin',
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  statisticsDays: parseInt(process.env.STATISTICS_DAYS) || 7,
  serverBaseDir: process.env.SERVER_BASE_DIR || '/www/wwwroot/file-manager',
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
  extensionConfigFile: process.env.EXTENSION_CONFIG_FILE || './data/extensionConfig.json'
};

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

if (!fs.existsSync(path.dirname(config.dataFile))) {
  fs.mkdirSync(path.dirname(config.dataFile), { recursive: true });
}

const authMiddleware = createAuthMiddleware(config.adminPassword, config.sessionSecret);

const extensionConfig = new ExtensionConfig(config.extensionConfigFile);
extensionConfig.load().catch(err => {
  logger.error('初始化后缀配置失败', { error: err.message });
});

logger.info('服务器启动中', { 
  port: config.port, 
  host: config.host,
  environment: process.env.NODE_ENV || 'development'
});

logger.cleanupOldLogs(config.logRetentionDays);

setInterval(() => {
  logger.cleanupOldLogs(config.logRetentionDays);
}, 24 * 60 * 60 * 1000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(async (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.access(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});

app.use('/api/files', createFileRoutes(config));
app.use('/api/admin', createAdminRoutes(config, authMiddleware, extensionConfig));
app.use('/public', createPublicRoutes(config, extensionConfig));

// 捕获所有未匹配的路径，处理后缀配置
app.use(async (req, res, next) => {
  try {
    const requestPath = req.path;
    const parts = requestPath.split('/').filter(p => p);
    
    if (parts.length === 0) {
      return res.status(404).json({ error: '接口不存在' });
    }

    // 提取后缀
    const lastPart = parts[parts.length - 1];
    const extension = lastPart.includes('.') ? lastPart.split('.').pop() : '';
    
    const extConfig = extensionConfig.getExtension(extension);
    
    logger.info('未匹配路径，使用后缀配置处理', {
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
    
    logger.warn('未匹配路径且无后缀配置', {
      requestPath,
      ip: req.ip
    });
    res.status(404).json({ error: '接口不存在' });
  } catch (error) {
    logger.error('处理后缀配置失败', {
      path: req.path,
      error: error.message
    });
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get(config.adminPath, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (req, res) => {
  res.json({
    message: '文件资源管理 API',
    version: '2.0.0',
    endpoints: {
      upload: 'POST /api/files/upload',
      list: 'GET /api/files',
      get: 'GET /api/files/:id',
      download: 'GET /api/files/:id/download',
      delete: 'DELETE /api/files/:id',
      update: 'PUT /api/files/:id',
      admin: config.adminPath,
      publicAccess: 'GET /public/:publicPath'
    }
  });
});

app.use((err, req, res, next) => {
  logger.error('服务器错误', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误: ' + err.message });
});

app.use((req, res) => {
  logger.warn('接口不存在', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  res.status(404).json({ error: '接口不存在' });
});

if (require.main === module) {
  app.listen(config.port, config.host, () => {
    console.log(`文件管理服务器运行在 http://${config.host}:${config.port}`);
    console.log(`管理员界面: http://${config.host}:${config.port}${config.adminPath}`);
    logger.info('服务器启动成功', {
      url: `http://${config.host}:${config.port}`,
      adminUrl: `http://${config.host}:${config.port}${config.adminPath}`
    });
  });
}

module.exports = app;