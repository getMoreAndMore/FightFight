# 测试菜单 Request 调用修复

## 问题描述
测试菜单点击按钮后报错：
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 根本原因

### 1. 错误的调用方式
`TestMenu.js` 中使用了错误的 `request()` 调用方式：

```javascript
// ❌ 错误 - 传递了3个参数
window.networkManager.request('/api/test/add-experience', 'POST', {
  userId: user.id,
  experience: exp
});
```

### 2. 正确的调用方式
`NetworkManager.request()` 的签名是：
```javascript
async request(endpoint, options = {})
```

应该这样调用：
```javascript
// ✅ 正确 - 传递2个参数，options 是对象
window.networkManager.request('/test/add-experience', {
  method: 'POST',
  body: JSON.stringify({ userId: user.id, experience: exp })
});
```

## 修复内容

### 修改的文件
- `client/ui/components/TestMenu.js`

### 修复了所有测试功能的调用：
1. ✅ 增加经验 (`add-exp`)
2. ✅ 立即升级 (`level-up`)
3. ✅ 设置等级 (`set-level`)
4. ✅ 增加属性点 (`add-attr-points`)
5. ✅ 重置属性 (`reset-attrs`)
6. ✅ 满属性满战力 (`max-power`)
7. ✅ 添加道具 (`add-items`)
8. ✅ 清空背包 (`clear-inventory`)
9. ✅ 完成任务 (`complete-all-quests`)
10. ✅ 解锁成就 (`unlock-achievements`)
11. ✅ 重置用户 (`reset-user`)

### 变更详情

#### 修改前（错误）：
```javascript
result = await window.networkManager.request('/api/test/add-experience', 'POST', {
  userId: user.id,
  experience: exp
});
```

#### 修改后（正确）：
```javascript
result = await window.networkManager.request('/test/add-experience', {
  method: 'POST',
  body: JSON.stringify({ userId: user.id, experience: exp })
});
```

### 关键变化：
1. 移除 `/api` 前缀（NetworkManager 会自动添加）
2. 将第二个参数改为 options 对象
3. 包含 `method: 'POST'`
4. 使用 `body: JSON.stringify(...)` 而不是直接传对象

## 测试步骤

### 1. 刷新前端页面
```
Ctrl + Shift + R (强制刷新)
```

### 2. 登录游戏
使用已有账号登录

### 3. 打开测试菜单
点击右侧面板的红色 **"🧪 测试"** 按钮

### 4. 测试增加经验
1. 在"增加经验值"输入框输入 `100`
2. 点击 **"增加经验"** 按钮
3. 应该看到：
   - ✅ 成功通知："增加了 100 经验"
   - ✅ 如果升级，显示升级动画
   - ✅ 底部状态更新

### 5. 查看控制台日志

#### 浏览器控制台（F12）：
```
发送请求: 增加经验 {userId: "...", experience: 100}
收到响应: {success: true, user: {...}, leveled: true, ...}
```

#### 后端控制台：
```
🧪 [测试] 收到增加经验请求: { userId: '...', experience: 100 }
🔄 [测试] 调用 addExperienceAsync...
📊 [username] 经验变化: 0 + 100 = 100
✅ [测试] addExperienceAsync 返回: { user: {...}, ... }
```

## 其他测试功能

### 立即升级
1. 点击 **"立即升级"** 按钮
2. 应该立即升一级
3. 显示升级动画和属性增加

### 设置等级
1. 输入等级（如 `10`）
2. 点击 **"设置等级"** 按钮
3. 等级立即变为 10

### 增加属性点
1. 输入属性点数（如 `100`）
2. 点击 **"增加属性点"** 按钮
3. 可用属性点增加 100

### 满属性满战力
1. 点击 **"满属性满战力"** 按钮
2. 所有属性增加 50
3. 战力大幅提升

### 重置用户数据
1. 点击 **"重置用户数据"** 按钮
2. 确认两次
3. 用户回到等级 1，属性重置

## NetworkManager 使用规范

### 正确的调用模式

#### GET 请求（无参数）
```javascript
const result = await networkManager.request('/user/profile?userId=xxx');
```

#### GET 请求（带查询参数）
```javascript
const result = await networkManager.request(`/user/profile?userId=${userId}`);
```

#### POST 请求
```javascript
const result = await networkManager.request('/user/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
});
```

#### PUT 请求
```javascript
const result = await networkManager.request('/user/update', {
  method: 'PUT',
  body: JSON.stringify({ userId, data })
});
```

#### 带自定义 headers
```javascript
const result = await networkManager.request('/api/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value'
  },
  body: JSON.stringify({ data })
});
```

### 错误的调用模式（避免）

```javascript
// ❌ 错误 1: 传递3个参数
networkManager.request('/endpoint', 'POST', { data });

// ❌ 错误 2: 不使用 JSON.stringify
networkManager.request('/endpoint', {
  method: 'POST',
  body: { data }  // 应该是 JSON.stringify({ data })
});

// ❌ 错误 3: 错误的 URL 格式
networkManager.request('http://localhost:3001/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ data })
});  // 应该只使用 '/endpoint'，不要包含域名和 /api
```

## 调试技巧

### 1. 检查 Network 标签
在浏览器开发者工具的 Network 标签中：
- 查看请求 URL：应该是 `http://localhost:3000/api/test/...`
- 查看请求方法：应该是 `POST`
- 查看请求头：`Content-Type: application/json`
- 查看请求体：应该是 JSON 字符串
- 查看响应：应该是 JSON 对象，不是 HTML

### 2. 查看控制台日志
前端日志：
```javascript
console.log('发送请求:', endpoint, options);
console.log('收到响应:', result);
```

后端日志：
```javascript
console.log('🧪 [测试] 收到请求:', req.body);
console.log('✅ [测试] 返回:', result);
```

### 3. 使用 try-catch 捕获错误
```javascript
try {
  const result = await networkManager.request('/endpoint', options);
  console.log('成功:', result);
} catch (error) {
  console.error('失败:', error);
  console.error('错误详情:', {
    message: error.message,
    response: error.response,
    stack: error.stack
  });
}
```

## 常见问题

### Q1: 为什么不需要 `/api` 前缀？
**A:** `NetworkManager` 的构造函数已经设置了 `apiUrl = '${baseUrl}/api'`，所以会自动添加 `/api` 前缀。

### Q2: 为什么要使用 `JSON.stringify()`？
**A:** `fetch` API 的 `body` 必须是字符串或其他特定类型，不能直接是 JavaScript 对象。

### Q3: 如何添加新的测试功能？
**A:** 
1. 在 `TestMenu.js` 的 `render()` 方法中添加按钮
2. 在 `handleAction()` 的 switch 中添加 case
3. 在 `server/routes/testRoutes.js` 中添加对应的路由
4. 使用正确的 `request()` 调用格式

### Q4: 测试功能会影响生产数据吗？
**A:** 是的！测试功能直接修改数据库，没有权限控制。**生产环境必须删除测试菜单！**

## 总结

### ✅ 修复完成
- 修复了所有测试功能的 request 调用方式
- 使用了正确的 NetworkManager API
- 添加了详细的日志输出

### 📝 重要提醒
1. **生产环境删除测试菜单**
2. **使用正确的 request 调用格式**
3. **始终使用 JSON.stringify() 序列化 body**
4. **不要在 endpoint 中包含域名和 /api 前缀**

### 🎉 现在可以正常使用测试菜单了！
刷新页面，登录游戏，点击 **"🧪 测试"** 按钮，开始测试！

