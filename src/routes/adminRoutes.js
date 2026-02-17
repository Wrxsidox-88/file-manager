const express = require('express');
const multer = require('multer');
const path = require('path');
const FileController = require('../controllers/fileController');

function createAdminRoutes(config, authMiddleware, extensionConfig) {
  const router = express.Router();
  const controller = new FileController(config);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fs = require('fs');
      const uploadDir = config.uploadDir;
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const { getSafeFileName } = require('../utils/pathHelper');
      const safeName = getSafeFileName(file.originalname);
      cb(null, safeName);
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: config.maxFileSize
    }
  });

  router.post('/login', (req, res) => authMiddleware.login(req, res));
  router.post('/logout', (req, res) => authMiddleware.logout(req, res));
  router.get('/check', (req, res) => authMiddleware.checkAuth(req, res));

  router.use(authMiddleware.authenticate);

  router.post('/upload', upload.single('file'), (req, res) => controller.uploadFile(req, res));
  router.post('/upload-to-path', upload.single('file'), (req, res) => controller.uploadToPath(req, res));
  router.get('/files', (req, res) => controller.getFiles(req, res));
  router.get('/files/:id', (req, res) => controller.getFile(req, res));
  router.get('/files/:id/download', (req, res) => controller.downloadFile(req, res));
  router.get('/files/:id/statistics', (req, res) => controller.getAccessStatistics(req, res));
  router.put('/files/:id', (req, res) => controller.updateFile(req, res));
  router.delete('/files/:id', (req, res) => controller.deleteFile(req, res));
  router.get('/public-files', (req, res) => controller.getPublicFiles(req, res));

  router.get('/server/browse', (req, res) => controller.browseServerFiles(req, res));
  router.post('/server/register', (req, res) => controller.registerServerFile(req, res));
  router.post('/server/batch-set-access', (req, res) => controller.batchSetFolderAccess(req, res));

  // 后缀配置管理路由
  router.get('/extensions', async (req, res) => {
    try {
      const config = extensionConfig.getConfig();
      res.json({ config });
    } catch (error) {
      res.status(500).json({ error: '获取后缀配置失败: ' + error.message });
    }
  });

  router.post('/extensions', async (req, res) => {
    try {
      const { extension, type, value } = req.body;
      if (!extension || !type || !value) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      await extensionConfig.setExtension(extension, type, value);
      res.json({ message: '后缀配置添加成功' });
    } catch (error) {
      res.status(500).json({ error: '添加后缀配置失败: ' + error.message });
    }
  });

  router.delete('/extensions/:extension', async (req, res) => {
    try {
      const { extension } = req.params;
      await extensionConfig.deleteExtension(extension);
      res.json({ message: '后缀配置删除成功' });
    } catch (error) {
      res.status(500).json({ error: '删除后缀配置失败: ' + error.message });
    }
  });

  router.put('/extensions/default', async (req, res) => {
    try {
      const { type, value } = req.body;
      if (!type || !value) {
        return res.status(400).json({ error: '缺少必要参数' });
      }
      await extensionConfig.setDefault(type, value);
      res.json({ message: '默认配置更新成功' });
    } catch (error) {
      res.status(500).json({ error: '更新默认配置失败: ' + error.message });
    }
  });

  return router;
}

module.exports = createAdminRoutes;