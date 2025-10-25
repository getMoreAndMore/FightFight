# 数据库说明

## 快速开始

### 1. 安装 MySQL

确保你已经安装了 MySQL 8.0 或更高版本。

```bash
# 检查 MySQL 版本
mysql --version
```

### 2. 创建数据库

有两种方式：

#### 方式 A：使用 MySQL 命令行

```bash
# 登录 MySQL
mysql -u root -p

# 执行建表脚本
source database/schema.sql
```

#### 方式 B：使用数据库管理工具

使用 Navicat、MySQL Workbench、phpMyAdmin 等工具：
1. 连接到 MySQL 服务器
2. 导入 `schema.sql` 文件

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并修改数据库配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=fightfight_game
```

### 4. 安装依赖

```bash
npm install
```

### 5. 启动服务器

```bash
npm run dev:server
```

## 数据库表结构

### 核心表

| 表名 | 说明 | 主键 |
|-----|------|------|
| `users` | 用户基本信息 | id (UUID) |
| `user_profiles` | 用户档案（等级、经验、战力等） | user_id |
| `user_attributes` | 用户属性（力量、敏捷等） | user_id |
| `user_inventory` | 用户背包 | user_id |
| `user_skills` | 用户技能 | user_id |
| `user_quests` | 用户任务 | user_id |
| `user_achievements` | 用户成就 | user_id |
| `user_checkin` | 用户签到记录 | user_id |

### 社交表

| 表名 | 说明 | 主键 |
|-----|------|------|
| `friendships` | 好友关系 | id (自增) |
| `rankings` | 排行榜 | user_id |

### PVP表

| 表名 | 说明 | 主键 |
|-----|------|------|
| `pvp_rooms` | PVP房间 | id (UUID) |
| `pvp_matches` | PVP对战记录 | id (自增) |

## 数据库设计说明

### 用户数据分表设计

为了提高查询性能和数据管理，用户数据被分为多个表：

1. **users**: 存储登录凭证和基本信息
2. **user_profiles**: 存储游戏进度数据
3. **user_attributes**: 存储角色属性
4. **user_inventory**: 存储背包数据
5. **user_skills**: 存储技能数据

所有子表通过 `user_id` 外键关联到 `users` 表，并设置了级联删除。

### JSON字段使用

部分复杂数据使用 JSON 字段存储：

- `stats`: 统计数据（灵活扩展）
- `items`: 背包物品列表
- `unlocked`/`active`: 技能列表
- `daily`/`weekly`/`main`/`side`: 任务数据
- `achievements`: 成就数据

### 索引优化

- 用户名、会话ID：用于快速登录验证
- 等级、战力：用于排行榜查询
- 好友关系：用于社交功能查询
- 创建时间：用于历史记录查询

## 常用SQL语句

### 查询用户完整信息

```sql
SELECT * FROM view_user_full WHERE id = 'user-id';
```

### 查询排行榜前10名

```sql
SELECT * FROM rankings ORDER BY power DESC LIMIT 10;
```

### 查询用户好友列表

```sql
SELECT u.id, u.username, p.level, p.power
FROM friendships f
JOIN users u ON f.friend_id = u.id
JOIN user_profiles p ON u.id = p.user_id
WHERE f.user_id = 'user-id' AND f.status = 'accepted';
```

### 更新用户属性

```sql
UPDATE user_attributes 
SET strength = strength + 1 
WHERE user_id = 'user-id';
```

## 备份和恢复

### 备份数据库

```bash
mysqldump -u root -p fightfight_game > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
mysql -u root -p fightfight_game < backup_20241025.sql
```

## 性能优化建议

1. 定期清理过期的PVP对战记录
2. 对于大量数据的查询，考虑使用缓存（Redis）
3. 监控慢查询日志
4. 定期优化表结构

```sql
-- 优化表
OPTIMIZE TABLE users, user_profiles, rankings;

-- 分析表
ANALYZE TABLE users, user_profiles;
```

## 故障排查

### 连接失败

- 检查 MySQL 服务是否启动
- 检查防火墙设置
- 检查 .env 配置是否正确

### 外键约束错误

确保在插入子表数据前，父表（users）中已存在对应记录。

### JSON 字段查询

```sql
-- 查询背包中特定物品
SELECT * FROM user_inventory 
WHERE JSON_CONTAINS(items, '{"id": "item_123"}');

-- 提取JSON字段
SELECT user_id, JSON_EXTRACT(stats, '$.loginCount') as login_count
FROM user_profiles;
```

