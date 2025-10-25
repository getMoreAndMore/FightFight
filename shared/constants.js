// 游戏常量定义

// 属性类型
const ATTRIBUTES = {
  STRENGTH: 'strength',      // 力量
  AGILITY: 'agility',        // 敏捷
  INTELLIGENCE: 'intelligence', // 智力
  ENDURANCE: 'endurance'     // 耐力
};

// 属性中文名
const ATTRIBUTE_NAMES = {
  [ATTRIBUTES.STRENGTH]: '力量',
  [ATTRIBUTES.AGILITY]: '敏捷',
  [ATTRIBUTES.INTELLIGENCE]: '智力',
  [ATTRIBUTES.ENDURANCE]: '耐力'
};

// 等级配置
const LEVEL_CONFIG = {
  MAX_LEVEL: 100,
  BASE_EXP: 100,
  EXP_MULTIPLIER: 1.5,
  ATTRIBUTE_POINTS_PER_LEVEL: 5,
  BACKPACK_SLOTS_PER_LEVEL: 2,
  INITIAL_BACKPACK_SLOTS: 10
};

// 计算升级所需经验
function getExpForLevel(level) {
  return Math.floor(LEVEL_CONFIG.BASE_EXP * Math.pow(LEVEL_CONFIG.EXP_MULTIPLIER, level - 1));
}

// 道具类型
const ITEM_TYPES = {
  CONSUMABLE: 'consumable',  // 消耗品
  EQUIPMENT: 'equipment',    // 装备
  MATERIAL: 'material',      // 材料
  QUEST: 'quest'            // 任务物品
};

// 道具品质
const ITEM_QUALITY = {
  COMMON: 'common',       // 普通（白色）
  UNCOMMON: 'uncommon',   // 优秀（绿色）
  RARE: 'rare',          // 稀有（蓝色）
  EPIC: 'epic',          // 史诗（紫色）
  LEGENDARY: 'legendary' // 传说（橙色）
};

// 品质颜色
const QUALITY_COLORS = {
  [ITEM_QUALITY.COMMON]: '#ffffff',
  [ITEM_QUALITY.UNCOMMON]: '#1eff00',
  [ITEM_QUALITY.RARE]: '#0070dd',
  [ITEM_QUALITY.EPIC]: '#a335ee',
  [ITEM_QUALITY.LEGENDARY]: '#ff8000'
};

// 技能类型
const SKILL_TYPES = {
  ATTACK: 'attack',      // 攻击技能
  CONTROL: 'control',    // 控制技能
  BUFF: 'buff',         // 增益技能
  HEAL: 'heal'          // 治疗技能
};

// 控制效果
const CONTROL_EFFECTS = {
  STUN: 'stun',         // 眩晕
  SLEEP: 'sleep',       // 睡眠
  SLOW: 'slow',         // 减速
  SILENCE: 'silence'    // 沉默
};

// 技能配置
const SKILL_CONFIG = {
  MAX_EQUIPPED_SKILLS: 6,  // 最多装备6个技能
  COOLDOWN_REDUCTION_PER_AGI: 0.01 // 每点敏捷减少1%冷却
};

// 场景类型
const SCENE_TYPES = {
  TOWN: 'town',          // 城镇
  FOREST: 'forest',      // 森林
  CAVE: 'cave',          // 洞穴
  MOUNTAIN: 'mountain',  // 山脉
  DUNGEON: 'dungeon'    // 地下城
};

// 小游戏类型
const MINIGAME_TYPES = {
  CLICK: 'click',        // 点击类
  TIMING: 'timing',      // 时机类
  PUZZLE: 'puzzle',      // 解谜类
  COLLECT: 'collect'     // 收集类
};

// PVP 配置
const PVP_CONFIG = {
  MATCH_TIMEOUT: 30000,      // 匹配超时30秒
  BATTLE_TIMEOUT: 180000,    // 战斗超时3分钟
  TURN_TIME: 30000,          // 每回合30秒
  MAX_POWER_DIFFERENCE: 2000 // 最大战力差
};

// 好友配置
const FRIEND_CONFIG = {
  MAX_FRIENDS: 50,
  REQUEST_EXPIRE_TIME: 604800000 // 7天过期
};

// 排行榜配置
const RANKING_CONFIG = {
  TOP_COUNT: 100,           // 显示前100名
  REFRESH_INTERVAL: 300000  // 5分钟刷新一次
};

// 成就类型
const ACHIEVEMENT_TYPES = {
  LEVEL: 'level',           // 等级成就
  ATTRIBUTE: 'attribute',   // 属性成就
  PVP: 'pvp',              // PVP成就
  EXPLORATION: 'exploration', // 探索成就
  COLLECTION: 'collection'  // 收集成就
};

// 任务类型
const QUEST_TYPES = {
  DAILY: 'daily',          // 每日任务
  WEEKLY: 'weekly',        // 周常任务
  MAIN: 'main',            // 主线任务
  SIDE: 'side'            // 支线任务
};

// Socket 事件
const SOCKET_EVENTS = {
  // 连接
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // 用户
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_UPDATE: 'user:update',
  
  // 好友
  FRIEND_REQUEST: 'friend:request',
  FRIEND_ACCEPT: 'friend:accept',
  FRIEND_REMOVE: 'friend:remove',
  FRIEND_LIST: 'friend:list',
  FRIEND_ONLINE: 'friend:online',
  
  // PVP
  PVP_MATCH: 'pvp:match',
  PVP_MATCH_FOUND: 'pvp:match_found',
  PVP_INVITE: 'pvp:invite',
  PVP_ACCEPT: 'pvp:accept',
  PVP_START: 'pvp:start',
  PVP_ACTION: 'pvp:action',
  PVP_END: 'pvp:end',
  
  // 聊天
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history'
};

// API 路径
const API_PATHS = {
  // 用户
  REGISTER: '/api/user/register',
  LOGIN: '/api/user/login',
  PROFILE: '/api/user/profile',
  
  // 属性
  ADD_ATTRIBUTE: '/api/attribute/add',
  
  // 背包
  GET_INVENTORY: '/api/inventory/get',
  USE_ITEM: '/api/inventory/use',
  DROP_ITEM: '/api/inventory/drop',
  
  // 技能
  UNLOCK_SKILL: '/api/skill/unlock',
  EQUIP_SKILL: '/api/skill/equip',
  
  // 场景
  ENTER_SCENE: '/api/scene/enter',
  COMPLETE_MINIGAME: '/api/scene/complete',
  
  // 排行榜
  GET_RANKING: '/api/ranking/get',
  
  // 成就
  GET_ACHIEVEMENTS: '/api/achievement/get',
  CLAIM_ACHIEVEMENT: '/api/achievement/claim',
  
  // 任务
  GET_QUESTS: '/api/quest/get',
  COMPLETE_QUEST: '/api/quest/complete'
};

// 游戏配置
const GAME_CONFIG = {
  WIDTH: 1200,
  HEIGHT: 800,
  PHYSICS: {
    GRAVITY: 1000,
    PLAYER_SPEED: 200,
    JUMP_VELOCITY: -400
  }
};

// 战力计算权重
const POWER_WEIGHTS = {
  STRENGTH: 10,
  AGILITY: 10,
  INTELLIGENCE: 10,
  ENDURANCE: 15,
  LEVEL: 50,
  EQUIPMENT: 1,
  SKILL: 20
};

// CommonJS 导出（用于 Node.js 服务器）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ATTRIBUTES,
    ATTRIBUTE_NAMES,
    LEVEL_CONFIG,
    getExpForLevel,
    ITEM_TYPES,
    ITEM_QUALITY,
    QUALITY_COLORS,
    SKILL_TYPES,
    CONTROL_EFFECTS,
    SKILL_CONFIG,
    SCENE_TYPES,
    MINIGAME_TYPES,
    PVP_CONFIG,
    FRIEND_CONFIG,
    RANKING_CONFIG,
    ACHIEVEMENT_TYPES,
    QUEST_TYPES,
    SOCKET_EVENTS,
    API_PATHS,
    GAME_CONFIG,
    POWER_WEIGHTS
  };
}

// ES6 导出（用于前端）
export {
  ATTRIBUTES,
  ATTRIBUTE_NAMES,
  LEVEL_CONFIG,
  getExpForLevel,
  ITEM_TYPES,
  ITEM_QUALITY,
  QUALITY_COLORS,
  SKILL_TYPES,
  CONTROL_EFFECTS,
  SKILL_CONFIG,
  SCENE_TYPES,
  MINIGAME_TYPES,
  PVP_CONFIG,
  FRIEND_CONFIG,
  RANKING_CONFIG,
  ACHIEVEMENT_TYPES,
  QUEST_TYPES,
  SOCKET_EVENTS,
  API_PATHS,
  GAME_CONFIG,
  POWER_WEIGHTS
};
