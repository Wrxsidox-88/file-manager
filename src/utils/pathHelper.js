const path = require('path');

function ensureUploadDir(uploadDir) {
  const fs = require('fs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function getSafeFileName(originalName) {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
  return `${safeBaseName}_${timestamp}${ext}`;
}

module.exports = {
  ensureUploadDir,
  getSafeFileName
};