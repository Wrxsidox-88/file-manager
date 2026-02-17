const FileStorage = require('../utils/fileStorage');
const { ensureUploadDir, getSafeFileName } = require('../utils/pathHelper');
const logger = require('../utils/logger');

class FileController {
  constructor(config) {
    this.storage = new FileStorage(config.dataFile);
    this.uploadDir = config.uploadDir;
    this.maxFileSize = config.maxFileSize;
    this.serverBaseDir = config.serverBaseDir || process.cwd();
    ensureUploadDir(this.uploadDir);
  }

  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '没有上传文件' });
      }

      const safeFileName = getSafeFileName(req.file.originalname);
      const fileInfo = {
        originalName: req.file.originalname,
        fileName: safeFileName,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype
      };

      const savedFile = await this.storage.addFile(fileInfo);
      logger.fileOperation('文件上传成功', {
        fileId: savedFile.id,
        fileName: savedFile.originalName,
        fileSize: savedFile.size,
        path: savedFile.path
      });
      res.status(201).json({
        message: '文件上传成功',
        file: savedFile
      });
    } catch (error) {
      logger.error('文件上传失败', {
        error: error.message,
        fileName: req.file?.originalname
      });
      res.status(500).json({ error: '文件上传失败: ' + error.message });
    }
  }

  async getFiles(req, res) {
    try {
      const files = await this.storage.getAllFiles();
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: '获取文件列表失败: ' + error.message });
    }
  }

  async getFile(req, res) {
    try {
      const { id } = req.params;
      const file = await this.storage.getFileById(id);
      if (!file) {
        return res.status(404).json({ error: '文件不存在' });
      }
      res.json({ file });
    } catch (error) {
      res.status(500).json({ error: '获取文件信息失败: ' + error.message });
    }
  }

  async downloadFile(req, res) {
    try {
      const { id } = req.params;
      const file = await this.storage.getFileById(id);
      if (!file) {
        return res.status(404).json({ error: '文件不存在' });
      }
      res.download(file.path, file.originalName);
    } catch (error) {
      res.status(500).json({ error: '文件下载失败: ' + error.message });
    }
  }

  async deleteFile(req, res) {
    try {
      const { id } = req.params;
      const file = await this.storage.getFileById(id);
      const deleted = await this.storage.deleteFile(id);
      if (!deleted) {
        return res.status(404).json({ error: '文件不存在' });
      }
      logger.fileOperation('文件删除成功', {
        fileId: id,
        fileName: file?.originalName,
        path: file?.path
      });
      res.json({ message: '文件删除成功' });
    } catch (error) {
      logger.error('文件删除失败', {
        fileId: req.params.id,
        error: error.message
      });
      res.status(500).json({ error: '文件删除失败: ' + error.message });
    }
  }

  async updateFile(req, res) {
    try {
      const { id } = req.params;
      const { originalName, isPublic, publicPath } = req.body;
      const updates = {};
      if (originalName) {
        updates.originalName = originalName;
      }
      if (typeof isPublic === 'boolean') {
        updates.isPublic = isPublic;
      }
      if (publicPath !== undefined) {
        updates.publicPath = publicPath;
      }
      const updatedFile = await this.storage.updateFile(id, updates);
      if (!updatedFile) {
        return res.status(404).json({ error: '文件不存在' });
      }
      res.json({
        message: '文件信息更新成功',
        file: updatedFile
      });
    } catch (error) {
      res.status(500).json({ error: '文件信息更新失败: ' + error.message });
    }
  }

  async getPublicFiles(req, res) {
    try {
      const files = await this.storage.getAllPublicFiles();
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: '获取公共文件列表失败: ' + error.message });
    }
  }

  async getAccessStatistics(req, res) {
    try {
      const { id } = req.params;
      const days = parseInt(req.query.days) || 7;
      const stats = await this.storage.getAccessStatistics(id, days);
      if (!stats) {
        return res.status(404).json({ error: '文件不存在或无访问统计' });
      }
      res.json({ statistics: stats });
    } catch (error) {
      res.status(500).json({ error: '获取访问统计失败: ' + error.message });
    }
  }

  async uploadToPath(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '没有上传文件' });
      }

      const { uploadPath } = req.body;
      if (!uploadPath) {
        return res.status(400).json({ error: '未指定上传路径' });
      }

      const fs = require('fs');
      const path = require('path');
      
      const targetDir = path.isAbsolute(uploadPath) 
        ? uploadPath 
        : path.join(process.cwd(), uploadPath);
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const safeFileName = getSafeFileName(req.file.originalname);
      const targetPath = path.join(targetDir, safeFileName);
      
      fs.renameSync(req.file.path, targetPath);

      const fileInfo = {
        originalName: req.file.originalname,
        fileName: safeFileName,
        path: targetPath,
        size: req.file.size,
        mimeType: req.file.mimetype,
        customPath: uploadPath
      };

      const savedFile = await this.storage.addFile(fileInfo);
      res.status(201).json({
        message: '文件上传成功',
        file: savedFile
      });
    } catch (error) {
      res.status(500).json({ error: '文件上传失败: ' + error.message });
    }
  }

  async browseServerFiles(req, res) {
    try {
      const { path: browsePath } = req.query;
      if (!browsePath) {
        return res.status(400).json({ error: '未指定路径' });
      }

      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(browsePath)) {
        return res.status(404).json({ error: '路径不存在' });
      }

      const stats = fs.statSync(browsePath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: '指定路径不是目录' });
      }

      const files = [];
      const directories = [];
      const entries = fs.readdirSync(browsePath);
      const allFiles = await this.storage.getAllFiles();

      for (const entry of entries) {
        const fullPath = path.join(browsePath, entry);
        const entryStats = fs.statSync(fullPath);
        
        if (entryStats.isDirectory()) {
          directories.push({
            name: entry,
            path: fullPath
          });
        } else if (entryStats.isFile()) {
          const registeredFile = allFiles.find(f => f.path === fullPath);
          files.push({
            name: entry,
            path: fullPath,
            size: entryStats.size,
            registered: !!registeredFile,
            fileId: registeredFile ? registeredFile.id : null
          });
        }
      }

      directories.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => a.name.localeCompare(b.name));

      res.json({ directories, files, currentPath: browsePath });
    } catch (error) {
      res.status(500).json({ error: '浏览服务器文件失败: ' + error.message });
    }
  }

  async registerServerFile(req, res) {
    try {
      const { filePath, fileName, isPublic, publicPath } = req.body;
      if (!filePath) {
        return res.status(400).json({ error: '未指定文件路径' });
      }

      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '文件不存在' });
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return res.status(400).json({ error: '指定路径不是文件' });
      }

      const existingFile = await this.storage.getFileByPath(filePath);
      if (existingFile) {
        return res.status(400).json({ error: '该文件已注册' });
      }

      const fileInfo = {
        originalName: fileName || path.basename(filePath),
        fileName: path.basename(filePath),
        path: filePath,
        size: stats.size,
        mimeType: this.getMimeType(path.extname(filePath)),
        isPublic: isPublic || false,
        publicPath: publicPath || null
      };

      const savedFile = await this.storage.addFile(fileInfo);
      res.status(201).json({
        message: '文件注册成功',
        file: savedFile
      });
    } catch (error) {
      res.status(500).json({ error: '文件注册失败: ' + error.message });
    }
  }

  getMimeType(ext) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  async batchSetFolderAccess(req, res) {
    try {
      const { folderPath, isPublic, publicPathPrefix, recursive, overwrite } = req.body;

      if (!folderPath || !publicPathPrefix) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: '文件夹不存在' });
      }

      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: '指定路径不是文件夹' });
      }

      const files = this.collectFiles(folderPath, recursive);
      const results = {
        total: files.length,
        success: 0,
        failed: 0,
        errors: []
      };

      const allRegisteredFiles = await this.storage.getAllFiles();
      const registeredPaths = new Map(allRegisteredFiles.map(f => [f.path, f]));

      for (const filePath of files) {
        try {
          const relativePath = path.relative(folderPath, filePath);
          const fileName = path.basename(filePath);
          
          // 公共路径不包含文件名，只包含相对路径的目录部分
          const relativeDir = path.dirname(relativePath);
          let publicPath = publicPathPrefix;
          
          if (relativeDir !== '.') {
            publicPath = publicPathPrefix + '/' + relativeDir.replace(/\\/g, '/');
          }
          
          const existingFile = registeredPaths.get(filePath);
          
          if (existingFile && !overwrite) {
            continue;
          }

          const fileInfo = {
            originalName: fileName,
            fileName: fileName,
            path: filePath,
            size: fs.statSync(filePath).size,
            mimeType: this.getMimeType(path.extname(filePath)),
            isPublic: isPublic,
            publicPath: publicPath
          };

          if (existingFile && overwrite) {
            await this.storage.updateFile(existingFile.id, {
              isPublic: isPublic,
              publicPath: publicPath
            });
          } else {
            await this.storage.addFile(fileInfo);
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            file: filePath,
            error: error.message
          });
        }
      }

      logger.fileOperation('批量设置文件夹访问性完成', {
        folderPath,
        isPublic,
        publicPathPrefix,
        recursive,
        overwrite,
        total: results.total,
        success: results.success,
        failed: results.failed
      });

      res.json({
        message: '批量设置完成',
        ...results
      });
    } catch (error) {
      logger.error('批量设置文件夹访问性失败', {
        folderPath: req.body.folderPath,
        error: error.message
      });
      res.status(500).json({ error: '批量设置失败: ' + error.message });
    }
  }

  collectFiles(dirPath, recursive = true) {
    const fs = require('fs');
    const path = require('path');
    const files = [];

    const scan = (currentPath) => {
      const entries = fs.readdirSync(currentPath);
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stats = fs.statSync(fullPath);
        
        if (stats.isFile()) {
          files.push(fullPath);
        } else if (stats.isDirectory() && recursive) {
          scan(fullPath);
        }
      }
    };

    scan(dirPath);
    return files;
  }
}

module.exports = FileController;