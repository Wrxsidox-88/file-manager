const express = require('express');
const multer = require('multer');
const path = require('path');
const FileController = require('../controllers/fileController');

function createFileRoutes(config) {
  const router = express.Router();
  const controller = new FileController(config);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.uploadDir);
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
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar|mp4|mp3|xls|xlsx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (extname || mimetype) {
        return cb(null, true);
      }
      cb(new Error('不支持的文件类型'));
    }
  });

  router.post('/upload', upload.single('file'), (req, res) => controller.uploadFile(req, res));
  router.get('/', (req, res) => controller.getFiles(req, res));
  router.get('/:id', (req, res) => controller.getFile(req, res));
  router.get('/:id/download', (req, res) => controller.downloadFile(req, res));
  router.delete('/:id', (req, res) => controller.deleteFile(req, res));
  router.put('/:id', (req, res) => controller.updateFile(req, res));

  return router;
}

module.exports = createFileRoutes;