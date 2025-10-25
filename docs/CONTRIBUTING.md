# 贡献指南

感谢你对 FightFight RPG 项目的关注！我们欢迎各种形式的贡献。

## 贡献方式

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 开发新功能

---

## 开发流程

### 1. Fork 项目

点击页面右上角的 "Fork" 按钮，将项目 Fork 到你的账户。

### 2. 克隆仓库

```bash
git clone https://github.com/your-username/FightFight.git
cd FightFight
```

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-fix-name
```

分支命名规范：
- `feature/*` - 新功能
- `fix/*` - Bug 修复
- `docs/*` - 文档更新
- `refactor/*` - 代码重构
- `test/*` - 测试相关

### 4. 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev:server  # 终端1
npm run dev:client  # 终端2
```

### 5. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能"
```

提交信息格式：
- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `refactor:` - 代码重构
- `test:` - 测试相关
- `chore:` - 构建/工具相关

### 6. 推送分支

```bash
git push origin feature/your-feature-name
```

### 7. 创建 Pull Request

1. 访问你的 Fork 仓库
2. 点击 "New Pull Request"
3. 填写 PR 描述
4. 等待代码审查

---

## 代码规范

### JavaScript 规范

- 使用 ES6+ 语法
- 使用 2 空格缩进
- 使用单引号
- 变量命名使用驼峰式
- 常量使用大写下划线

```javascript
// ✅ 好的示例
const userName = 'Player';
const MAX_LEVEL = 100;

function calculatePower(attributes) {
  return attributes.strength * 10;
}

// ❌ 不好的示例
const user_name = "Player";
const maxlevel = 100;

function CalculatePower(attributes) {
  return attributes.strength*10;
}
```

### 注释规范

```javascript
/**
 * 函数功能描述
 * @param {string} userId - 用户ID
 * @param {number} points - 属性点数
 * @returns {Object} 更新后的用户对象
 */
function addAttribute(userId, points) {
  // 实现代码
}
```

### 文件命名

- 组件文件：`PascalCase.js` (例: `GameScene.js`)
- 工具文件：`camelCase.js` (例: `networkManager.js`)
- 常量文件：`UPPER_SNAKE_CASE.js` (例: `GAME_CONFIG.js`)

---

## 目录结构

```
FightFight/
├── client/              # 前端代码
│   ├── game/           # Phaser 游戏
│   │   ├── scenes/     # 游戏场景
│   │   ├── systems/    # 游戏系统
│   │   └── config.js   # 游戏配置
│   ├── ui/             # UI 组件
│   │   └── components/ # UI 子组件
│   ├── network/        # 网络管理
│   └── styles/         # 样式文件
├── server/             # 后端代码
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── models/         # 数据模型
│   └── data/           # 游戏数据
├── shared/             # 前后端共享
│   └── constants.js    # 常量定义
└── docs/               # 文档
```

---

## 测试

### 运行测试

```bash
npm test
```

### 编写测试

在 `__tests__` 目录下创建测试文件：

```javascript
// __tests__/attribute.test.js
describe('Attribute System', () => {
  it('should add attribute points', () => {
    // 测试代码
  });
});
```

---

## Pull Request 指南

### PR 标题格式

```
[类型] 简短描述（不超过50字符）

feat: 添加好友系统
fix: 修复PVP匹配bug
docs: 更新API文档
```

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化

## 变更描述
简要描述你的变更内容

## 相关 Issue
Closes #123

## 测试
描述如何测试你的变更

## 截图（如果有）
添加截图展示变更效果

## Checklist
- [ ] 代码遵循项目规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 已通过所有测试
- [ ] 已测试在不同浏览器中的表现
```

---

## 报告 Bug

### Bug 报告模板

```markdown
## Bug 描述
清晰简洁地描述 bug

## 复现步骤
1. 进入 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 预期行为
描述你期望发生什么

## 实际行为
描述实际发生了什么

## 截图
如果适用，添加截图

## 环境信息
- OS: [例如 Windows 10]
- Browser: [例如 Chrome 120]
- Version: [例如 1.0.0]

## 额外信息
添加任何其他相关信息
```

---

## 功能建议

### 功能建议模板

```markdown
## 功能描述
清晰简洁地描述你希望添加的功能

## 问题背景
这个功能要解决什么问题？

## 解决方案
描述你期望的解决方案

## 替代方案
描述你考虑过的其他解决方案

## 额外信息
添加任何其他相关信息
```

---

## 社区准则

### 我们的承诺

为了营造开放友好的环境，我们承诺：

- 使用友善包容的语言
- 尊重不同的观点和经历
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 挑衅、侮辱或贬损的评论
- 公开或私下的骚扰
- 未经许可发布他人的私人信息
- 其他在专业环境中不适当的行为

---

## 获取帮助

如有任何问题，可以通过以下方式联系我们：

- GitHub Issues
- 项目讨论区
- 邮件联系

---

## 许可证

通过贡献，你同意你的贡献将使用与本项目相同的 MIT 许可证。

---

感谢你的贡献！ 🎉

