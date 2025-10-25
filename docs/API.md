# API 文档

## 目录
- [用户相关](#用户相关)
- [属性相关](#属性相关)
- [背包相关](#背包相关)
- [技能相关](#技能相关)
- [场景相关](#场景相关)
- [排行榜相关](#排行榜相关)
- [成就相关](#成就相关)
- [任务相关](#任务相关)
- [Socket.io 事件](#socketio-事件)

---

## 用户相关

### 注册
```
POST /api/user/register
```

**请求体**:
```json
{
  "username": "string (min: 3)",
  "password": "string (min: 6)",
  "email": "string (optional)"
}
```

**响应**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "string",
    "level": 1,
    "experience": 0,
    "attributes": {...},
    "inventory": {...},
    "skills": {...}
  },
  "message": "注册成功"
}
```

### 登录
```
POST /api/user/login
```

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "user": {...},
  "sessionId": "uuid",
  "message": "登录成功"
}
```

### 获取个人信息
```
GET /api/user/profile?userId={userId}
```

**响应**:
```json
{
  "success": true,
  "user": {...}
}
```

### 每日签到
```
POST /api/user/checkin
```

**请求体**:
```json
{
  "userId": "uuid"
}
```

**响应**:
```json
{
  "success": true,
  "consecutiveDays": 5,
  "rewards": {
    "exp": 100,
    "attributePoints": 1
  },
  "message": "连续签到 5 天！"
}
```

---

## 属性相关

### 添加属性点
```
POST /api/attribute/add
```

**请求体**:
```json
{
  "userId": "uuid",
  "attribute": "strength|agility|intelligence|endurance",
  "points": 1
}
```

**响应**:
```json
{
  "success": true,
  "user": {...},
  "message": "属性添加成功"
}
```

### 重置属性点
```
POST /api/attribute/reset
```

**请求体**:
```json
{
  "userId": "uuid"
}
```

---

## 背包相关

### 获取背包
```
GET /api/inventory/get?userId={userId}
```

### 使用物品
```
POST /api/inventory/use
```

**请求体**:
```json
{
  "userId": "uuid",
  "instanceId": "uuid"
}
```

### 丢弃物品
```
POST /api/inventory/drop
```

**请求体**:
```json
{
  "userId": "uuid",
  "instanceId": "uuid",
  "quantity": 1
}
```

### 整理背包
```
POST /api/inventory/sort
```

**请求体**:
```json
{
  "userId": "uuid",
  "sortBy": "type|quality|name"
}
```

---

## 技能相关

### 获取技能列表
```
GET /api/skill/list?userId={userId}
```

### 解锁技能
```
POST /api/skill/unlock
```

**请求体**:
```json
{
  "userId": "uuid",
  "skillId": "string"
}
```

### 装备技能
```
POST /api/skill/equip
```

**请求体**:
```json
{
  "userId": "uuid",
  "skillId": "string",
  "slotIndex": 0
}
```

### 卸下技能
```
POST /api/skill/unequip
```

**请求体**:
```json
{
  "userId": "uuid",
  "slotIndex": 0
}
```

---

## 场景相关

### 获取场景列表
```
GET /api/scene/list?userId={userId}
```

### 进入场景
```
POST /api/scene/enter
```

**请求体**:
```json
{
  "userId": "uuid",
  "sceneId": "string"
}
```

### 完成小游戏
```
POST /api/scene/complete
```

**请求体**:
```json
{
  "userId": "uuid",
  "sceneId": "string",
  "minigameId": "string",
  "score": 1000
}
```

**响应**:
```json
{
  "success": true,
  "rewards": {
    "exp": 150,
    "items": [...]
  },
  "leveled": false,
  "message": "小游戏完成！"
}
```

---

## 排行榜相关

### 获取排行榜
```
GET /api/ranking/get?userId={userId}&type=global|friends
```

**响应**:
```json
{
  "success": true,
  "ranking": [
    {
      "userId": "uuid",
      "username": "string",
      "level": 10,
      "power": 1500,
      "pvpWins": 20
    },
    ...
  ],
  "userRank": {
    "rank": 15,
    "userId": "uuid",
    "username": "string",
    "power": 1200
  },
  "type": "global"
}
```

---

## 成就相关

### 获取成就列表
```
GET /api/achievement/get?userId={userId}
```

### 领取成就奖励
```
POST /api/achievement/claim
```

**请求体**:
```json
{
  "userId": "uuid",
  "achievementId": "string"
}
```

---

## 任务相关

### 获取任务列表
```
GET /api/quest/get?userId={userId}&type=daily|weekly|main|side
```

### 完成任务
```
POST /api/quest/complete
```

**请求体**:
```json
{
  "userId": "uuid",
  "questId": "string"
}
```

### 刷新每日任务
```
POST /api/quest/refresh-daily
```

**请求体**:
```json
{
  "userId": "uuid"
}
```

---

## Socket.io 事件

### 客户端发送事件

#### 用户登录
```javascript
socket.emit('user:login', {
  userId: 'uuid',
  sessionId: 'uuid'
});
```

#### 发送好友请求
```javascript
socket.emit('friend:request', {
  toUsername: 'string'
});
```

#### 接受好友请求
```javascript
socket.emit('friend:accept', {
  requestId: 'string'
});
```

#### 删除好友
```javascript
socket.emit('friend:remove', {
  friendId: 'uuid'
});
```

#### 获取好友列表
```javascript
socket.emit('friend:list');
```

#### PVP 匹配
```javascript
socket.emit('pvp:match');
```

#### PVP 邀请
```javascript
socket.emit('pvp:invite', {
  friendId: 'uuid'
});
```

#### PVP 接受邀请
```javascript
socket.emit('pvp:accept', {
  inviteId: 'string'
});
```

#### PVP 动作
```javascript
socket.emit('pvp:action', {
  battleId: 'string',
  action: {
    type: 'attack|skill|defend',
    skillId: 'string' // if type is 'skill'
  }
});
```

#### PVP 投降
```javascript
socket.emit('pvp:surrender');
```

#### 发送聊天消息
```javascript
socket.emit('chat:message', {
  to: 'uuid',
  message: 'string'
});
```

### 服务器发送事件

#### 用户登录成功
```javascript
socket.on('user:login:success', (data) => {
  // data: { user: {...} }
});
```

#### 收到好友请求
```javascript
socket.on('friend:request:received', (data) => {
  // data: { requestId: 'string', from: {...} }
});
```

#### 好友请求发送成功
```javascript
socket.on('friend:request:sent', (data) => {
  // data: { requestId: 'string', toUser: {...} }
});
```

#### 好友接受成功
```javascript
socket.on('friend:accept:success', (data) => {
  // data: { fromUser: {...}, toUser: {...} }
});
```

#### 好友已添加
```javascript
socket.on('friend:added', (data) => {
  // data: { friend: {...} }
});
```

#### 好友已删除
```javascript
socket.on('friend:removed', (data) => {
  // data: { friendId: 'uuid' }
});
```

#### 好友上线/下线
```javascript
socket.on('friend:online', (data) => {
  // data: { userId: 'uuid', username: 'string', isOnline: boolean }
});
```

#### 好友列表
```javascript
socket.on('friend:list', (data) => {
  // data: { friends: [...] }
});
```

#### PVP 匹配中
```javascript
socket.on('pvp:matching', (data) => {
  // data: { message: 'string' }
});
```

#### PVP 开始
```javascript
socket.on('pvp:start', (data) => {
  // data: { battleId: 'string', opponent: {...}, yourTurn: boolean, battle: {...} }
});
```

#### PVP 动作结果
```javascript
socket.on('pvp:action:result', (data) => {
  // data: { result: {...}, battle: {...} }
});
```

#### PVP 结束
```javascript
socket.on('pvp:end', (data) => {
  // data: { result: 'victory|defeat', battle: {...}, rewards: {...} }
});
```

#### 收到 PVP 邀请
```javascript
socket.on('pvp:invite:received', (data) => {
  // data: { from: {...}, inviteId: 'string' }
});
```

#### PVP 匹配超时
```javascript
socket.on('pvp:match:timeout', (data) => {
  // data: { message: 'string' }
});
```

#### 收到聊天消息
```javascript
socket.on('chat:message', (data) => {
  // data: { from: 'uuid', fromUsername: 'string', message: 'string', timestamp: number }
});
```

#### 聊天消息已发送
```javascript
socket.on('chat:sent', (data) => {
  // data: { success: boolean }
});
```

---

## 错误响应

所有 API 失败时返回统一格式：

```json
{
  "success": false,
  "message": "错误信息"
}
```

HTTP 状态码：
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器内部错误

