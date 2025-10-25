# FightFight - 横版网页RPG游戏

一个功能完整的横版网页RPG游戏，采用前后端分离架构，支持多人在线、实时对战。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Phaser](https://img.shields.io/badge/phaser-3.70.0-orange.svg)

## ✨ 功能特性

### 核心系统
- ⚔️ **属性系统** - 力量/敏捷/智力/耐力等属性自由加点，无上限成长
- 📈 **等级系统** - 经验值累积升级，解锁新功能（背包格、技能槽、场景）
- 🎒 **背包系统** - 道具收集、使用、堆叠，随等级扩容
- 🗺️ **探索系统** - 5大场景探索（新手村、森林、洞穴、雪山、地下城）
- 🎮 **小游戏系统** - 4种小游戏类型（点击、时机、收集、记忆）
- ✨ **技能系统** - 10+技能，支持自由装备组合（最多6个）

### 社交与竞技
- ⚔️ **PVP对战** - 回合制战斗，支持匹配和好友邀请
- 👥 **好友系统** - 添加好友、在线状态、邀请对战
- 💪 **战力系统** - 综合属性、等级、装备、技能计算
- 🏆 **排行榜** - 全服排行和好友排行，实时更新

### 趣味系统
- 🎯 **任务系统** - 每日任务、周常任务、主线任务
- 🏅 **成就系统** - 15+成就，完成获得丰厚奖励
- 📅 **签到系统** - 每日签到，连续签到额外奖励
- 📊 **统计系统** - 游戏时长、击杀数、收集数等数据统计

## 🚀 技术栈

### 前端
- **游戏引擎**: Phaser 3.70
- **语言**: JavaScript (ES6+)
- **构建工具**: Vite 5.0
- **UI**: 原生 JavaScript + CSS3
- **网络**: Socket.io Client + Fetch API

### 后端
- **运行环境**: Node.js 16+
- **框架**: Express 4.18
- **实时通信**: Socket.io 4.6
- **加密**: bcrypt 5.1
- **数据存储**: 内存存储（可扩展为数据库）

## 📦 安装与运行

### 前置要求
- Node.js >= 16.0.0
- npm 或 yarn

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd FightFight
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发环境**

需要打开两个终端：

```bash
# 终端1: 启动后端服务器
npm run dev:server

# 终端2: 启动前端开发服务器
npm run dev:client
```

4. **访问游戏**

打开浏览器访问：`http://localhost:3000`

### 生产部署

```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## 📝 环境配置

复制 `.env.example` 为 `.env` 并配置：

```bash
PORT=3001
NODE_ENV=production
```

## 项目结构

```
FightFight/
├── client/              # 前端代码
│   ├── main.js         # 入口文件
│   ├── game/           # Phaser游戏代码
│   │   ├── scenes/     # 游戏场景
│   │   ├── systems/    # 游戏系统
│   │   └── config.js   # 游戏配置
│   ├── ui/             # UI组件
│   └── network/        # 网络通信
├── server/             # 后端代码
│   ├── index.js        # 服务器入口
│   ├── models/         # 数据模型
│   ├── controllers/    # 控制器
│   └── services/       # 业务逻辑
├── shared/             # 前后端共享代码
│   └── constants.js    # 常量定义
└── assets/             # 游戏资源
    ├── images/
    ├── audio/
    └── sprites/
```

## 游戏说明

### 属性系统
- **力量 (STR)**: 提升物理攻击力
- **敏捷 (AGI)**: 提升攻击速度和闪避
- **智力 (INT)**: 提升魔法攻击力
- **耐力 (END)**: 提升生命值和防御

### 等级系统
升级奖励：
- 获得属性点
- 解锁背包格子
- 解锁新场景
- 解锁技能槽

### 技能系统
技能类型：
- **攻击技能**: 造成伤害
- **控制技能**: 眩晕、减速、睡眠
- **增益技能**: 提升属性
- **治疗技能**: 恢复生命

## 开发说明

前端使用 Phaser 3 引擎，采用场景化管理。UI 部分使用原生 JavaScript 构建。

后端使用 Express 提供 REST API，Socket.io 处理实时通信（PVP对战、好友系统）。

数据存储使用内存模式（可扩展为数据库）。

