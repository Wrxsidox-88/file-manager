const crypto = require('crypto');
const logger = require('../utils/logger');

function createAuthMiddleware(adminPassword, sessionSecret) {
  const sessions = new Map();

  function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  return {
    authenticate: (req, res, next) => {
      const token = req.headers['authorization']?.replace('Bearer ', '');
      if (!token || !sessions.has(token)) {
        logger.security('未授权访问尝试', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        return res.status(401).json({ error: '未授权访问' });
      }
      const session = sessions.get(token);
      if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        logger.security('会话已过期', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(401).json({ error: '会话已过期' });
      }
      req.session = session;
      next();
    },

    login: (req, res) => {
      const { password } = req.body;
      if (password !== adminPassword) {
        logger.security('登录失败 - 密码错误', {
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        return res.status(401).json({ error: '密码错误' });
      }
      const token = generateSessionToken();
      sessions.set(token, {
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      });
      logger.info('管理员登录成功', {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.json({ 
        success: true, 
        token,
        message: '登录成功' 
      });
    },

    logout: (req, res) => {
      const token = req.headers['authorization']?.replace('Bearer ', '');
      if (token) {
        sessions.delete(token);
      }
      logger.info('管理员退出登录', {
        ip: req.ip
      });
      res.json({ success: true, message: '退出成功' });
    },

    checkAuth: (req, res) => {
      const token = req.headers['authorization']?.replace('Bearer ', '');
      if (!token || !sessions.has(token)) {
        return res.json({ authenticated: false });
      }
      const session = sessions.get(token);
      if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return res.json({ authenticated: false });
      }
      res.json({ authenticated: true });
    }
  };
}

module.exports = createAuthMiddleware;