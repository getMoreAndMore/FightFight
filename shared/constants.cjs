// 游戏常量定义 (CommonJS 版本，用于 Node.js 后端)

// 属性类型
const ATTRIBUTES = {
  STRENGTH: 'strength',
  AGILITY: 'agility',
  INTELLIGENCE: 'intelligence',
  ENDURANCE: 'endurance'
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
  CONSUMABLE: 'consumable',
  EQUIPMENT: 'equipment',
  MATERIAL: 'material',
  QUEST: 'quest'
};

// 道具品质
const ITEM_QUALITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
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
  ATTACK: 'attack',
  CONTROL: 'control',
  BUFF: 'buff',
  HEAL: 'heal'
};

// 控制效果
const CONTROL_EFFECTS = {
  STUN: 'stun',
  SLEEP: 'sleep',
  SLOW: 'slow',
  SILENCE: 'silence'
};

// 技能配置
const SKILL_CONFIG = {
  MAX_EQUIPPED_SKILLS: 6,
  COOLDOWN_REDUCTION_PER_AGI: 0.01
};

// 场景类型
const SCENE_TYPES = {
  TOWN: 'town',
  FOREST: 'forest',
  CAVE: 'cave',
  MOUNTAIN: 'mountain',
  DUNGEON: 'dungeon'
};

// 小游戏类型
const MINIGAME_TYPES = {
  CLICK: 'click',
  TIMING: 'timing',
  PUZZLE: 'puzzle',
  COLLECT: 'collect'
};

// PVP 配置
const PVP_CONFIG = {
  MATCH_TIMEOUT: 30000,
  BATTLE_TIMEOUT: 180000,
  TURN_TIME: 30000,
  MAX_POWER_DIFFERENCE: 2000
};

// 好友配置
const FRIEND_CONFIG = {
  MAX_FRIENDS: 50,
  REQUEST_EXPIRE_TIME: 604800000
};

// 排行榜配置
const RANKING_CONFIG = {
  TOP_COUNT: 100,
  REFRESH_INTERVAL: 300000
};

// 成就类型
const ACHIEVEMENT_TYPES = {
  LEVEL: 'level',
  ATTRIBUTE: 'attribute',
  PVP: 'pvp',
  EXPLORATION: 'exploration',
  COLLECTION: 'collection'
};

// 任务类型
const QUEST_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MAIN: 'main',
  SIDE: 'side'
};

// Socket 事件
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_UPDATE: 'user:update',
  FRIEND_REQUEST: 'friend:request',
  FRIEND_ACCEPT: 'friend:accept',
  FRIEND_REMOVE: 'friend:remove',
  FRIEND_LIST: 'friend:list',
  FRIEND_ONLINE: 'friend:online',
  PVP_MATCH: 'pvp:match',
  PVP_MATCH_FOUND: 'pvp:match_found',
  PVP_INVITE: 'pvp:invite',
  PVP_ACCEPT: 'pvp:accept',
  PVP_START: 'pvp:start',
  PVP_ACTION: 'pvp:action',
  PVP_END: 'pvp:end',
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history'
};

// API 路径
const API_PATHS = {
  REGISTER: '/api/user/register',
  LOGIN: '/api/user/login',
  PROFILE: '/api/user/profile',
  ADD_ATTRIBUTE: '/api/attribute/add',
  GET_INVENTORY: '/api/inventory/get',
  USE_ITEM: '/api/inventory/use',
  DROP_ITEM: '/api/inventory/drop',
  UNLOCK_SKILL: '/api/skill/unlock',
  EQUIP_SKILL: '/api/skill/equip',
  ENTER_SCENE: '/api/scene/enter',
  COMPLETE_MINIGAME: '/api/scene/complete',
  GET_RANKING: '/api/ranking/get',
  GET_ACHIEVEMENTS: '/api/achievement/get',
  CLAIM_ACHIEVEMENT: '/api/achievement/claim',
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

