const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * 数据库服务（内存存储）
 * 生产环境建议替换为真实数据库（MongoDB/PostgreSQL）
 */
class DatabaseService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.friendRequests = new Map();
    this.rankings = { global: [], friends: {} };
    this.pvpMatches = new Map();
    
    // 初始化示例数据
    this.initializeSampleData();
  }

  initializeSampleData() {
    // 可以在这里添加测试数据
    console.log('数据库服务初始化完成');
  }

  // ============ 用户管理 ============

  async createUser(username, password, email) {
    if (this.findUserByUsername(username)) {
      throw new Error('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const user = {
      id: userId,
      username,
      password: hashedPassword,
      email,
      createdAt: Date.now(),
      
      // 游戏数据
      level: 1,
      experience: 0,
      attributePoints: 5,
      
      attributes: {
        strength: 10,
        agility: 10,
        intelligence: 10,
        endurance: 10
      },
      
      inventory: {
        slots: 10,
        items: []
      },
      
      skills: {
        unlocked: [],
        equipped: []
      },
      
      scenes: {
        unlocked: ['town'],
        current: 'town'
      },
      
      friends: [],
      
      pvp: {
        wins: 0,
        losses: 0,
        rating: 1000
      },
      
      achievements: [],
      quests: {
        daily: [],
        weekly: [],
        main: [],
        side: []
      },
      
      dailyCheckin: {
        lastCheckin: 0,
        consecutiveDays: 0
      },
      
      // 统计数据
      stats: {
        totalPlayTime: 0,
        monstersKilled: 0,
        itemsCollected: 0,
        minigamesCompleted: 0
      }
    };

    this.users.set(userId, user);
    return this.getSafeUser(user);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  findUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  findUserById(userId) {
    return this.users.get(userId);
  }

  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    Object.assign(user, updates);
    return this.getSafeUser(user);
  }

  getSafeUser(user) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // ============ 会话管理 ============

  createSession(userId, socketId) {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      id: sessionId,
      userId,
      socketId,
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  findSessionBySocketId(socketId) {
    for (const session of this.sessions.values()) {
      if (session.socketId === socketId) {
        return session;
      }
    }
    return null;
  }

  // ============ 属性系统 ============

  addAttribute(userId, attributeName, points) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    if (user.attributePoints < points) {
      throw new Error('属性点不足');
    }
    
    if (points <= 0) {
      throw new Error('点数必须大于0');
    }
    
    user.attributes[attributeName] = (user.attributes[attributeName] || 0) + points;
    user.attributePoints -= points;
    
    // 重新计算战力
    user.power = this.calculatePower(user);
    
    return this.getSafeUser(user);
  }

  // ============ 等级系统 ============

  addExperience(userId, exp) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    user.experience += exp;
    const levelUpInfo = this.checkLevelUp(user);
    
    return { user: this.getSafeUser(user), ...levelUpInfo };
  }

  checkLevelUp(user) {
    const { LEVEL_CONFIG } = require('../../shared/constants.cjs');
    let leveled = false;
    let levelsGained = 0;
    let attributeGains = {
      strength: 0,
      agility: 0,
      intelligence: 0,
      endurance: 0
    };
    let totalAttributePoints = 0;
    let totalSlots = 0;
    
    // 确保用户有 attributes 对象
    if (!user.attributes) {
      console.error('用户缺少 attributes 对象:', user);
      user.attributes = {
        strength: 10,
        agility: 10,
        intelligence: 10,
        endurance: 10
      };
    }
    
    while (user.level < LEVEL_CONFIG.MAX_LEVEL) {
      const requiredExp = this.getExpForLevel(user.level + 1);
      if (user.experience >= requiredExp) {
        // 升级
        user.level++;
        user.experience -= requiredExp;
        levelsGained++;
        
        // 增加属性点
        const pointsGained = LEVEL_CONFIG.ATTRIBUTE_POINTS_PER_LEVEL;
        user.attributePoints += pointsGained;
        totalAttributePoints += pointsGained;
        
        // 增加背包格子
        const slotsGained = LEVEL_CONFIG.BACKPACK_SLOTS_PER_LEVEL;
        user.inventory.slots += slotsGained;
        totalSlots += slotsGained;
        
        // 所有属性按比例增加（每次升级 +2%）
        const attributeBonus = 0.02; // 2%
        const strengthGain = Math.max(1, Math.ceil(user.attributes.strength * attributeBonus));
        const agilityGain = Math.max(1, Math.ceil(user.attributes.agility * attributeBonus));
        const intelligenceGain = Math.max(1, Math.ceil(user.attributes.intelligence * attributeBonus));
        const enduranceGain = Math.max(1, Math.ceil(user.attributes.endurance * attributeBonus));
        
        user.attributes.strength += strengthGain;
        user.attributes.agility += agilityGain;
        user.attributes.intelligence += intelligenceGain;
        user.attributes.endurance += enduranceGain;
        
        attributeGains.strength += strengthGain;
        attributeGains.agility += agilityGain;
        attributeGains.intelligence += intelligenceGain;
        attributeGains.endurance += enduranceGain;
        
        leveled = true;
        
        console.log(`🎉 用户 ${user.username} 升到 ${user.level} 级！属性增加:`, attributeGains);
      } else {
        break;
      }
    }
    
    if (leveled) {
      // 重新计算战力
      user.power = this.calculatePower(user);
    }
    
    return {
      leveled,
      levelsGained,
      newLevel: user.level,
      attributeGains,
      attributePointsGained: totalAttributePoints,
      slotsGained: totalSlots
    };
  }

  getExpForLevel(level) {
    const { getExpForLevel } = require('../../shared/constants.cjs');
    return getExpForLevel(level);
  }

  // ============ 背包系统 ============

  addItem(userId, item) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    if (user.inventory.items.length >= user.inventory.slots) {
      throw new Error('背包已满');
    }
    
    // 检查是否可堆叠
    if (item.stackable) {
      const existingItem = user.inventory.items.find(
        i => i.id === item.id && i.stackable
      );
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
        return this.getSafeUser(user);
      }
    }
    
    user.inventory.items.push({
      ...item,
      instanceId: uuidv4(),
      obtainedAt: Date.now()
    });
    
    user.stats.itemsCollected++;
    
    return this.getSafeUser(user);
  }

  removeItem(userId, instanceId, quantity = 1) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    const itemIndex = user.inventory.items.findIndex(
      item => item.instanceId === instanceId
    );
    
    if (itemIndex === -1) {
      throw new Error('物品不存在');
    }
    
    const item = user.inventory.items[itemIndex];
    
    if (item.stackable && item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      user.inventory.items.splice(itemIndex, 1);
    }
    
    return this.getSafeUser(user);
  }

  useItem(userId, instanceId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    const item = user.inventory.items.find(
      item => item.instanceId === instanceId
    );
    
    if (!item) throw new Error('物品不存在');
    
    // 应用物品效果
    const result = this.applyItemEffect(user, item);
    
    // 消耗品使用后删除
    if (item.type === 'consumable') {
      this.removeItem(userId, instanceId, 1);
    }
    
    return { user: this.getSafeUser(user), result };
  }

  applyItemEffect(user, item) {
    const result = { effects: [] };
    
    if (item.effects) {
      // 恢复生命值
      if (item.effects.hp) {
        result.effects.push({ type: 'hp', value: item.effects.hp });
      }
      
      // 增加经验
      if (item.effects.exp) {
        this.addExperience(user.id, item.effects.exp);
        result.effects.push({ type: 'exp', value: item.effects.exp });
      }
      
      // 临时属性增益
      if (item.effects.attributes) {
        result.effects.push({ type: 'attributes', value: item.effects.attributes });
      }
    }
    
    return result;
  }

  // ============ 技能系统 ============

  unlockSkill(userId, skillId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    if (user.skills.unlocked.includes(skillId)) {
      throw new Error('技能已解锁');
    }
    
    // 这里可以添加解锁条件检查（等级、前置技能等）
    
    user.skills.unlocked.push(skillId);
    
    return this.getSafeUser(user);
  }

  equipSkill(userId, skillId, slotIndex) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    if (!user.skills.unlocked.includes(skillId)) {
      throw new Error('技能未解锁');
    }
    
    const { SKILL_CONFIG } = require('../../shared/constants.cjs');
    if (slotIndex < 0 || slotIndex >= SKILL_CONFIG.MAX_EQUIPPED_SKILLS) {
      throw new Error('技能槽位无效');
    }
    
    user.skills.equipped[slotIndex] = skillId;
    user.power = this.calculatePower(user);
    
    return this.getSafeUser(user);
  }

  // ============ 场景系统 ============

  unlockScene(userId, sceneId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    if (!user.scenes.unlocked.includes(sceneId)) {
      user.scenes.unlocked.push(sceneId);
    }
    
    return this.getSafeUser(user);
  }

  enterScene(userId, sceneId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    if (!user.scenes.unlocked.includes(sceneId)) {
      throw new Error('场景未解锁');
    }
    
    user.scenes.current = sceneId;
    
    return this.getSafeUser(user);
  }

  // ============ 好友系统 ============

  sendFriendRequest(fromUserId, toUsername) {
    const toUser = this.findUserByUsername(toUsername);
    if (!toUser) throw new Error('用户不存在');
    
    if (fromUserId === toUser.id) {
      throw new Error('不能添加自己为好友');
    }
    
    const fromUser = this.users.get(fromUserId);
    if (fromUser.friends.includes(toUser.id)) {
      throw new Error('已经是好友');
    }
    
    const requestId = `${fromUserId}_${toUser.id}`;
    
    if (this.friendRequests.has(requestId)) {
      throw new Error('已发送好友请求');
    }
    
    this.friendRequests.set(requestId, {
      id: requestId,
      from: fromUserId,
      to: toUser.id,
      createdAt: Date.now()
    });
    
    return { requestId, toUser: this.getSafeUser(toUser) };
  }

  acceptFriendRequest(requestId) {
    const request = this.friendRequests.get(requestId);
    if (!request) throw new Error('好友请求不存在');
    
    const fromUser = this.users.get(request.from);
    const toUser = this.users.get(request.to);
    
    if (!fromUser || !toUser) throw new Error('用户不存在');
    
    fromUser.friends.push(request.to);
    toUser.friends.push(request.from);
    
    this.friendRequests.delete(requestId);
    
    return {
      fromUser: this.getSafeUser(fromUser),
      toUser: this.getSafeUser(toUser)
    };
  }

  removeFriend(userId, friendId) {
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    
    if (!user || !friend) throw new Error('用户不存在');
    
    user.friends = user.friends.filter(id => id !== friendId);
    friend.friends = friend.friends.filter(id => id !== userId);
    
    return this.getSafeUser(user);
  }

  getFriends(userId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    return user.friends.map(friendId => {
      const friend = this.users.get(friendId);
      return friend ? this.getSafeUser(friend) : null;
    }).filter(f => f !== null);
  }

  // ============ 战力计算 ============

  calculatePower(user) {
    const { POWER_WEIGHTS } = require('../../shared/constants.cjs');
    
    let power = 0;
    
    // 属性战力
    power += user.attributes.strength * POWER_WEIGHTS.STRENGTH;
    power += user.attributes.agility * POWER_WEIGHTS.AGILITY;
    power += user.attributes.intelligence * POWER_WEIGHTS.INTELLIGENCE;
    power += user.attributes.endurance * POWER_WEIGHTS.ENDURANCE;
    
    // 等级战力
    power += user.level * POWER_WEIGHTS.LEVEL;
    
    // 技能战力
    power += user.skills.equipped.filter(s => s).length * POWER_WEIGHTS.SKILL;
    
    return Math.floor(power);
  }

  // ============ 排行榜 ============

  updateRankings() {
    const allUsers = Array.from(this.users.values());
    
    // 全局排行榜（按战力排序）
    this.rankings.global = allUsers
      .map(user => ({
        userId: user.id,
        username: user.username,
        level: user.level,
        power: this.calculatePower(user),
        pvpWins: user.pvp.wins
      }))
      .sort((a, b) => b.power - a.power)
      .slice(0, 100);
  }

  getRanking(userId, type = 'global') {
    if (type === 'global') {
      return this.rankings.global;
    } else if (type === 'friends') {
      const user = this.users.get(userId);
      if (!user) return [];
      
      const friendIds = user.friends;
      return this.rankings.global.filter(
        entry => friendIds.includes(entry.userId) || entry.userId === userId
      );
    }
    
    return [];
  }

  // ============ 成就系统 ============

  checkAchievements(userId) {
    // 简化版成就检查
    // 实际应该有完整的成就配置和检查逻辑
    return [];
  }

  // ============ 任务系统 ============

  getDailyQuests(userId) {
    const user = this.users.get(userId);
    if (!user) return [];
    
    // 简化版每日任务
    return user.quests.daily;
  }

  completeQuest(userId, questId) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');
    
    // 查找并完成任务
    // 这里需要实现完整的任务逻辑
    
    return this.getSafeUser(user);
  }
}

module.exports = DatabaseService;

