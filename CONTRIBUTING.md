# 贡献指南

感谢您对文件资源管理系统的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果您发现了 bug，请：

1. 在 [Issues](https://github.com/yourusername/file-manager/issues) 页面搜索是否已有相同问题
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（Node.js 版本、操作系统等）
   - 相关日志（如果适用）

### 提出新功能

如果您有新功能建议：

1. 先在 [Issues](https://github.com/yourusername/file-manager/issues) 讨论
2. 说明功能用途和预期效果
3. 等待维护者反馈

### 提交代码

#### 开发流程

1. Fork 本仓库
2. 创建您的特性分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. 进行开发
4. 提交您的更改：
   ```bash
   git commit -m 'Add some feature'
   ```
5. 推送到分支：
   ```bash
   git push origin feature/your-feature-name
   ```
6. 创建 Pull Request

#### 代码规范

- 使用 2 空格缩进
- 使用单引号
- 每个函数/方法添加 JSDoc 注释
- 变量和函数使用 camelCase 命名
- 常量使用 UPPER_CASE 命名
- 类使用 PascalCase 命名

#### Commit 消息规范

使用清晰的 commit 消息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具链更新
```

示例：
```
feat: 添加文件批量删除功能
fix: 修复公开访问路径匹配问题
docs: 更新 API 文档
```

#### Pull Request 规范

PR 标题格式：
- `feat: 功能描述`
- `fix: 问题描述`
- `docs: 文档更新`

PR 描述应包含：
- 改动的简要说明
- 相关的 Issue 编号
- 截图（如果涉及 UI 改动）
- 测试说明

## 开发环境设置

### 安装依赖
```bash
npm install
```

### 运行开发服务器
```bash
npm run dev
```

### 代码检查
```bash
# 暂无配置，可以添加 ESLint 等
```

### 测试
```bash
# 暂无测试，可以添加 Jest 等
```

## 项目结构说明

```
src/
├── controllers/     # 业务逻辑
├── middleware/     # 中间件
├── routes/         # 路由定义
└── utils/          # 工具函数
```

## 发布流程

1. 更新版本号 (`package.json`)
2. 更新 `CHANGELOG.md`
3. 创建 Git tag
4. 发布 Release

## 获取帮助

如果您有任何问题：

- 查看 [文档](README.md)
- 搜索 [Issues](https://github.com/yourusername/file-manager/issues)
- 创建新的 Issue

## 行为准则

- 尊重所有贡献者
- 使用友好和专业的语言
- 接受建设性批评
- 专注于对社区最有利的事情

感谢您的贡献！