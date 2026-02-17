# 文件资源管理系统

一个基于 Node.js + Express 的现代化文件资源管理系统，支持文件上传、管理、公开访问、访问统计等功能。

## 功能特性

### 核心功能
- 📁 **文件管理** - 支持文件上传、下载、删除、编辑
- 🔐 **权限控制** - 基于令牌的管理员认证系统
- 🌐 **公开访问** - 可为文件设置公开访问路径
- 📊 **访问统计** - 记录文件访问次数和历史，支持趋势分析
- 🖥️ **服务器文件管理** - 浏览和管理服务器上的文件
- 🔄 **批量操作** - 批量设置文件夹访问性，支持递归处理

### 高级功能
- 🔗 **智能链接** - 一键复制公共访问链接
- 📂 **后缀配置** - 为不同文件后缀设置默认处理方式
- 📝 **完整日志** - 按天分割日志，自动清理30天前的日志
- 🎨 **iOS风格界面** - 现代化、美观的管理后台
- 📈 **趋势分析** - 访问量趋势统计（上升/下降/稳定）

## 技术栈

### 后端
- **Node.js** - JavaScript 运行环境
- **Express.js** - Web 应用框架
- **Multer** - 文件上传中间件
- **Dotenv** - 环境变量管理
- **CORS** - 跨域资源共享

### 前端
- **Bootstrap 5** - UI 框架
- **Vanilla JavaScript** - 原生 JavaScript
- **Bootstrap Icons** - 图标库

## 项目结构

```
file-manager/
├── data/                          # 数据目录
│   ├── files.json                 # 文件元数据
│   └── extensionConfig.json       # 后缀配置
├── logs/                          # 日志目录
│   ├── app-YYYY-MM-DD.log         # 应用日志
│   ├── access-YYYY-MM-DD.log      # 访问日志
│   ├── file-YYYY-MM-DD.log        # 文件操作日志
│   └── security-YYYY-MM-DD.log    # 安全日志
├── public/                        # 静态文件
│   └── admin.html                 # 管理后台
├── src/                           # 源代码
│   ├── controllers/               # 控制器
│   │   └── fileController.js      # 文件操作控制器
│   ├── middleware/                # 中间件
│   │   └── auth.js                # 认证中间件
│   ├── routes/                    # 路由
│   │   ├── adminRoutes.js         # 管理员路由
│   │   ├── fileRoutes.js          # 文件路由
│   │   └── publicRoutes.js        # 公共访问路由
│   └── utils/                     # 工具类
│       ├── extensionConfig.js     # 后缀配置管理
│       ├── fileStorage.js         # 文件存储管理
│       ├── logger.js              # 日志工具
│       └── pathHelper.js          # 路径处理工具
├── upload/                        # 上传目录（旧）
├── uploads/                       # 上传目录
├── .env                           # 环境变量
├── .env.example                   # 环境变量示例
├── .gitignore                     # Git 忽略文件
├── package.json                   # 项目配置
├── server.js                      # 入口文件
└── README.md                      # 项目文档
```

## 安装部署

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/wrxsidox-88/file-manager.git
cd file-manager
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，修改相关配置
```

4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3008 |
| HOST | 监听地址 | 0.0.0.0 |
| UPLOAD_DIR | 上传目录 | ./uploads |
| DATA_FILE | 数据文件路径 | ./data/files.json |
| MAX_FILE_SIZE | 最大文件大小（字节） | 10485760 |
| ADMIN_PASSWORD | 管理员密码 | admin123 |
| ADMIN_PATH | 管理后台路径 | /admin |
| SESSION_SECRET | 会话密钥 | your-secret-key-change-this |
| STATISTICS_DAYS | 统计天数 | 7 |
| SERVER_BASE_DIR | 服务器基础目录 | /www/wwwroot/file-manager |
| LOG_RETENTION_DAYS | 日志保留天数 | 30 |
| EXTENSION_CONFIG_FILE | 后缀配置文件路径 | ./data/extensionConfig.json |

### 后缀配置

后缀配置允许为不同文件后缀设置默认处理方式：

**配置类型：**
- `file` - 返回指定的默认文件
- `redirect` - 重定向到指定 URL

**配置示例：**
```json
{
  "default": {
    "type": "file",
    "value": "404.html"
  },
  "extensions": {
    "html": {
      "type": "file",
      "value": "public/404.html"
    },
    "jpg": {
      "type": "redirect",
      "value": "https://example.com/default-image.jpg"
    }
  }
}
```

## API 文档

### 公开接口

#### 上传文件
```
POST /api/files/upload
Content-Type: multipart/form-data

Response: {
  "message": "文件上传成功",
  "file": {...}
}
```

#### 获取文件列表
```
GET /api/files

Response: {
  "files": [...]
}
```

#### 下载文件
```
GET /api/files/:id/download
```

#### 公开访问
```
GET /public/:publicPath/:fileName
```

### 管理员接口

#### 登录
```
POST /api/admin/login
Content-Type: application/json

Body: {
  "password": "your-password"
}

Response: {
  "success": true,
  "token": "session-token"
}
```

#### 上传文件到指定路径
```
POST /api/admin/upload-to-path
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: FormData {
  "file": File,
  "uploadPath": "/custom/path"
}
```

#### 浏览服务器文件
```
GET /api/admin/server/browse?path=/path/to/directory
Headers: Authorization: Bearer {token}

Response: {
  "directories": [...],
  "files": [...],
  "currentPath": "/path/to/directory"
}
```

#### 批量设置文件夹访问性
```
POST /api/admin/server/batch-set-access
Headers: Authorization: Bearer {token}
Content-Type: application/json

Body: {
  "folderPath": "/path/to/folder",
  "isPublic": true,
  "publicPathPrefix": "/public/folder",
  "recursive": true,
  "overwrite": false
}

Response: {
  "message": "批量设置完成",
  "total": 10,
  "success": 8,
  "failed": 2,
  "errors": [...]
}
```

#### 后缀配置管理
```
# 获取配置
GET /api/admin/extensions
Headers: Authorization: Bearer {token}

# 添加配置
POST /api/admin/extensions
Headers: Authorization: Bearer {token}
Body: {
  "extension": "html",
  "type": "file",
  "value": "404.html"
}

# 删除配置
DELETE /api/admin/extensions/:extension
Headers: Authorization: Bearer {token}

# 更新默认配置
PUT /api/admin/extensions/default
Headers: Authorization: Bearer {token}
Body: {
  "type": "file",
  "value": "404.html"
}
```

## 日志系统

系统自动记录以下日志：

### 日志类型
- **app-*.log** - 应用日志（服务器启动、错误等）
- **access-*.log** - 访问日志（HTTP 请求记录）
- **file-*.log** - 文件操作日志（上传、删除、批量操作）
- **security-*.log** - 安全日志（登录失败、未授权访问）

### 日志格式
```
[2026-02-17T12:00:00.000Z] [INFO] 服务器启动成功 {"url":"http://0.0.0.0:3008"}
```

### 日志清理
- 每天自动创建新的日志文件
- 自动删除超过 30 天的旧日志
- 可通过 `LOG_RETENTION_DAYS` 配置保留天数

## 安全建议

1. **修改默认密码** - 生产环境务必修改 `ADMIN_PASSWORD`
2. **使用 HTTPS** - 生产环境建议使用 SSL/TLS
3. **限制访问** - 使用防火墙限制管理后台访问
4. **定期备份** - 定期备份 `data/` 目录
5. **日志监控** - 定期检查 `security-*.log` 日志
6. **会话密钥** - 修改 `SESSION_SECRET` 为强随机字符串

## 常见问题

### 1. 文件上传失败
- 检查 `MAX_FILE_SIZE` 配置
- 确保 `UPLOAD_DIR` 目录有写权限
- 查看日志文件获取详细错误信息

### 2. 公开访问 404
- 确认文件已设置为公开访问
- 检查公共路径格式（需要包含文件名）
- 查看后缀配置是否正确

### 3. 批量操作失败
- 检查文件夹路径是否存在
- 确保文件权限正确
- 查看日志获取失败原因

### 4. 日志文件过大
- 调整 `LOG_RETENTION_DAYS` 配置
- 手动删除旧的日志文件

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 ISC 许可证。

## 作者

Your Name - [@wrxsidox-88](https://github.com/wrxsidox-88)

## 致谢

- Express.js 团队
- Bootstrap 团队
- 所有贡献者
- iflow助手

---

**注意：** 本项目仅供学习和个人使用，生产环境请务必进行安全加固。