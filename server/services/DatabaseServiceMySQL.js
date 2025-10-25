const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const db = require('../config/database');

/**
 * 数据库服务（MySQL版本）
 */
class DatabaseService {
  constructor() {
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      const connected = await db.testConnection();
      if (connected) {
        console.log('✅ DatabaseService (MySQL) 初始化完成');
      }
    } catch (error) {
      console.error('❌ DatabaseService 初始化失败:', error.message);
    }
  }

  // ============ 用户管理 ============

  async createUser(username, password, email) {
    try {
      // 检查用户名是否已存在
      const existingUser = await this.findUserByUsername(username);
      if (existingUser) {
        throw new Error('用户名已存在');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      const sessionId = uuidv4();

      await db.transaction(async (connection) => {
        // 1. 创建用户基本信息
        await connection.execute(
          'INSERT INTO users (id, username, password, email, session_id) VALUES (?, ?, ?, ?, ?)',
          [userId, username, hashedPassword, email, sessionId]
        );

        // 2. 创建用户档案
        await connection.execute(
          `INSERT INTO user_profiles (user_id, level, experience, attribute_points, power, stats) 
           VALUES (?, 1, 0, 5, 0, ?)`,
          [userId, JSON.stringify({ loginCount: 0, questsCompleted: 0, minigamesCompleted: 0, pvpWins: 0, pvpLosses: 0 })]
        );

        // 3. 创建用户属性
        await connection.execute(
          'INSERT INTO user_attributes (user_id, strength, agility, intelligence, endurance) VALUES (?, 10, 10, 10, 10)',
          [userId]
        );

        // 4. 创建用户背包
        await connection.execute(
          'INSERT INTO user_inventory (user_id, slots, items) VALUES (?, 10, ?)',
          [userId, JSON.stringify([])]
        );

        // 5. 创建用户技能
        await connection.execute(
          'INSERT INTO user_skills (user_id, unlocked, active) VALUES (?, ?, ?)',
          [userId, JSON.stringify(['fireball']), JSON.stringify([])]
        );

        // 6. 创建用户任务
        const quests = {
          daily: [],
          weekly: [],
          main: [],
          side: []
        };
        await connection.execute(
          'INSERT INTO user_quests (user_id, daily, weekly, main, side) VALUES (?, ?, ?, ?, ?)',
          [userId, JSON.stringify(quests.daily), JSON.stringify(quests.weekly), JSON.stringify(quests.main), JSON.stringify(quests.side)]
        );

        // 7. 创建用户成就
        await connection.execute(
          'INSERT INTO user_achievements (user_id, achievements) VALUES (?, ?)',
          [userId, JSON.stringify([])]
        );

        // 8. 创建签到记录
        await connection.execute(
          'INSERT INTO user_checkin (user_id, consecutive_days, total_days) VALUES (?, 0, 0)',
          [userId]
        );
      });

      console.log(`✅ 用户创建成功: ${username} (${userId})`);
      return { userId, sessionId };
    } catch (error) {
      console.error('创建用户失败:', error.message);
      throw error;
    }
  }

  async findUserByUsername(username) {
    try {
      const results = await db.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('查询用户失败:', error.message);
      return null;
    }
  }

  findUserById(userId) {
    // 同步方法改为异步包装
    return this.findUserByIdAsync(userId);
  }

  async findUserByIdAsync(userId) {
    try {
      const [user] = await db.query(
        `SELECT u.*, 
                p.level, p.experience, p.attribute_points, p.power, p.current_scene, p.stats,
                a.strength, a.agility, a.intelligence, a.endurance,
                i.slots, i.items,
                s.unlocked as skills_unlocked, s.active as skills_active,
                q.daily, q.weekly, q.main, q.side,
                ach.achievements,
                c.last_date as checkin_last_date, c.consecutive_days as checkin_consecutive_days, c.total_days as checkin_total_days
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         LEFT JOIN user_attributes a ON u.id = a.user_id
         LEFT JOIN user_inventory i ON u.id = i.user_id
         LEFT JOIN user_skills s ON u.id = s.user_id
         LEFT JOIN user_quests q ON u.id = q.user_id
         LEFT JOIN user_achievements ach ON u.id = ach.user_id
         LEFT JOIN user_checkin c ON u.id = c.user_id
         WHERE u.id = ?`,
        [userId]
      );

      if (!user) return null;

      // 转换JSON字段
      return this.parseUserData(user);
    } catch (error) {
      console.error('查询用户失败:', error.message);
      return null;
    }
  }

  parseUserData(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      sessionId: user.session_id,
      level: user.level || 1,
      experience: user.experience || 0,
      attributePoints: user.attribute_points || 5,
      power: user.power || 0,
      currentScene: user.current_scene || 'forest',
      attributes: {
        strength: user.strength || 10,
        agility: user.agility || 10,
        intelligence: user.intelligence || 10,
        endurance: user.endurance || 10
      },
      inventory: {
        slots: user.slots || 10,
        items: this.parseJSON(user.items, [])
      },
      skills: {
        unlocked: this.parseJSON(user.skills_unlocked, ['fireball']),
        active: this.parseJSON(user.skills_active, [])
      },
      quests: {
        daily: this.parseJSON(user.daily, []),
        weekly: this.parseJSON(user.weekly, []),
        main: this.parseJSON(user.main, []),
        side: this.parseJSON(user.side, [])
      },
      achievements: this.parseJSON(user.achievements, []),
      stats: this.parseJSON(user.stats, { loginCount: 0, questsCompleted: 0, minigamesCompleted: 0, pvpWins: 0, pvpLosses: 0 }),
      dailyCheckin: user.checkin_last_date ? {
        lastDate: user.checkin_last_date,
        consecutiveDays: user.checkin_consecutive_days || 0,
        totalDays: user.checkin_total_days || 0
      } : null,
      friends: [],
      createdAt: user.created_at
    };
  }

  parseJSON(value, defaultValue = null) {
    if (!value) return defaultValue;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return defaultValue;
    }
  }

  async validateSession(sessionId) {
    try {
      const results = await db.query(
        'SELECT id FROM users WHERE session_id = ?',
        [sessionId]
      );
      return results.length > 0 ? results[0].id : null;
    } catch (error) {
      console.error('验证会话失败:', error.message);
      return null;
    }
  }

  async validateCredentials(username, password) {
    try {
      const user = await this.findUserByUsername(username);
      if (!user) return null;

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return null;

      // 更新会话ID和登录时间
      const sessionId = uuidv4();
      await db.query(
        'UPDATE users SET session_id = ?, last_login = NOW() WHERE id = ?',
        [sessionId, user.id]
      );

      // 更新登录统计
      const fullUser = await this.findUserByIdAsync(user.id);
      if (fullUser) {
        fullUser.stats.loginCount = (fullUser.stats.loginCount || 0) + 1;
        await db.query(
          'UPDATE user_profiles SET stats = ? WHERE user_id = ?',
          [JSON.stringify(fullUser.stats), user.id]
        );
      }

      return { userId: user.id, sessionId };
    } catch (error) {
      console.error('验证凭证失败:', error.message);
      return null;
    }
  }

  getSafeUser(user) {
    if (!user) return null;
    const safe = { ...user };
    delete safe.password;
    return safe;
  }

  // ============ 属性系统 ============

  async addAttribute(userId, attributeName, points) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) throw new Error('用户不存在');
      if (user.attributePoints < points) throw new Error('属性点不足');

      await db.query(
        `UPDATE user_attributes SET ${attributeName} = ${attributeName} + ? WHERE user_id = ?`,
        [points, userId]
      );

      await db.query(
        'UPDATE user_profiles SET attribute_points = attribute_points - ? WHERE user_id = ?',
        [points, userId]
      );

      // 重新计算战力
      const updatedUser = await this.findUserByIdAsync(userId);
      const power = this.calculatePower(updatedUser);
      await db.query(
        'UPDATE user_profiles SET power = ? WHERE user_id = ?',
        [power, userId]
      );

      // 更新排行榜
      await this.updateRankings();

      return this.getSafeUser(await this.findUserByIdAsync(userId));
    } catch (error) {
      console.error('加点失败:', error.message);
      throw error;
    }
  }

  calculatePower(user) {
    const { POWER_WEIGHTS } = require('../../shared/constants.cjs');
    if (!user || !user.attributes) return 0;

    return Math.floor(
      user.attributes.strength * POWER_WEIGHTS.strength +
      user.attributes.agility * POWER_WEIGHTS.agility +
      user.attributes.intelligence * POWER_WEIGHTS.intelligence +
      user.attributes.endurance * POWER_WEIGHTS.endurance +
      user.level * POWER_WEIGHTS.level
    );
  }

  // ============ 等级系统 ============

  addExperience(userId, exp) {
    // 包装为异步
    return this.addExperienceAsync(userId, exp);
  }

  async addExperienceAsync(userId, exp) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) throw new Error('用户不存在');

      user.experience += exp;
      const levelUpInfo = await this.checkLevelUp(user);

      return { user: this.getSafeUser(user), ...levelUpInfo };
    } catch (error) {
      console.error('添加经验失败:', error.message);
      throw error;
    }
  }

  async checkLevelUp(user) {
    const { LEVEL_CONFIG } = require('../../shared/constants.cjs');
    let leveled = false;
    let levelsGained = 0;
    let attributeGains = { strength: 0, agility: 0, intelligence: 0, endurance: 0 };
    let totalAttributePoints = 0;
    let totalSlots = 0;

    if (!user.attributes) {
      user.attributes = { strength: 10, agility: 10, intelligence: 10, endurance: 10 };
    }

    while (user.level < LEVEL_CONFIG.MAX_LEVEL) {
      const requiredExp = this.getExpForLevel(user.level + 1);
      if (user.experience >= requiredExp) {
        user.level++;
        user.experience -= requiredExp;
        levelsGained++;

        const pointsGained = LEVEL_CONFIG.ATTRIBUTE_POINTS_PER_LEVEL;
        user.attributePoints += pointsGained;
        totalAttributePoints += pointsGained;

        const slotsGained = LEVEL_CONFIG.BACKPACK_SLOTS_PER_LEVEL;
        user.inventory.slots += slotsGained;
        totalSlots += slotsGained;

        const attributeBonus = 0.02;
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
      } else {
        break;
      }
    }

    if (leveled) {
      user.power = this.calculatePower(user);

      // 更新数据库
      await db.query(
        `UPDATE user_profiles SET level = ?, experience = ?, attribute_points = ?, power = ? WHERE user_id = ?`,
        [user.level, user.experience, user.attributePoints, user.power, user.id]
      );

      await db.query(
        `UPDATE user_attributes SET strength = ?, agility = ?, intelligence = ?, endurance = ? WHERE user_id = ?`,
        [user.attributes.strength, user.attributes.agility, user.attributes.intelligence, user.attributes.endurance, user.id]
      );

      await db.query(
        `UPDATE user_inventory SET slots = ? WHERE user_id = ?`,
        [user.inventory.slots, user.id]
      );

      console.log(`🎉 用户 ${user.username} 升到 ${user.level} 级！属性增加:`, attributeGains);
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

  async addItem(userId, item) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) throw new Error('用户不存在');
      if (user.inventory.items.length >= user.inventory.slots) {
        throw new Error('背包已满');
      }

      user.inventory.items.push(item);
      await db.query(
        'UPDATE user_inventory SET items = ? WHERE user_id = ?',
        [JSON.stringify(user.inventory.items), userId]
      );

      return this.getSafeUser(await this.findUserByIdAsync(userId));
    } catch (error) {
      console.error('添加物品失败:', error.message);
      throw error;
    }
  }

  async removeItem(userId, itemId) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) throw new Error('用户不存在');

      const index = user.inventory.items.findIndex(i => i.id === itemId);
      if (index === -1) throw new Error('物品不存在');

      user.inventory.items.splice(index, 1);
      await db.query(
        'UPDATE user_inventory SET items = ? WHERE user_id = ?',
        [JSON.stringify(user.inventory.items), userId]
      );

      return this.getSafeUser(await this.findUserByIdAsync(userId));
    } catch (error) {
      console.error('移除物品失败:', error.message);
      throw error;
    }
  }

  // ============ 排行榜系统 ============

  async updateRankings() {
    try {
      await db.query('DELETE FROM rankings');
      
      const users = await db.query(
        `SELECT u.id, u.username, p.level, p.power 
         FROM users u
         JOIN user_profiles p ON u.id = p.user_id
         ORDER BY p.power DESC`
      );

      for (let i = 0; i < users.length; i++) {
        await db.query(
          'INSERT INTO rankings (user_id, username, level, power, rank) VALUES (?, ?, ?, ?, ?)',
          [users[i].id, users[i].username, users[i].level, users[i].power, i + 1]
        );
      }
    } catch (error) {
      console.error('更新排行榜失败:', error.message);
    }
  }

  async getGlobalRankings(limit = 100) {
    try {
      return await db.query(
        'SELECT * FROM rankings ORDER BY rank ASC LIMIT ?',
        [limit]
      );
    } catch (error) {
      console.error('获取全局排行榜失败:', error.message);
      return [];
    }
  }

  // ============ 签到系统 ============

  async dailyCheckin(userId) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) throw new Error('用户不存在');

      const today = new Date().toISOString().split('T')[0];
      const lastDate = user.dailyCheckin?.lastDate ? new Date(user.dailyCheckin.lastDate).toISOString().split('T')[0] : null;

      if (lastDate === today) {
        throw new Error('今天已经签到过了');
      }

      let consecutiveDays = 1;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (lastDate === yesterday) {
        consecutiveDays = (user.dailyCheckin?.consecutiveDays || 0) + 1;
      }

      const totalDays = (user.dailyCheckin?.totalDays || 0) + 1;
      const reward = Math.min(consecutiveDays, 7);

      await db.query(
        `UPDATE user_checkin SET last_date = ?, consecutive_days = ?, total_days = ? WHERE user_id = ?`,
        [today, consecutiveDays, totalDays, userId]
      );

      await db.query(
        `UPDATE user_profiles SET attribute_points = attribute_points + ? WHERE user_id = ?`,
        [reward, userId]
      );

      return {
        success: true,
        consecutiveDays,
        reward,
        message: `签到成功！连续签到${consecutiveDays}天，获得${reward}属性点`
      };
    } catch (error) {
      throw error;
    }
  }

  // ============ 好友系统 ============

  async addFriend(userId, friendId) {
    try {
      if (userId === friendId) throw new Error('不能添加自己为好友');

      const existing = await db.query(
        'SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?',
        [userId, friendId]
      );

      if (existing.length > 0) throw new Error('已经是好友或已发送请求');

      await db.query(
        `INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted')`,
        [userId, friendId]
      );

      await db.query(
        `INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted')`,
        [friendId, userId]
      );

      return { success: true, message: '添加好友成功' };
    } catch (error) {
      throw error;
    }
  }

  async getFriends(userId) {
    try {
      const friends = await db.query(
        `SELECT u.id, u.username, p.level, p.power 
         FROM friendships f
         JOIN users u ON f.friend_id = u.id
         JOIN user_profiles p ON u.id = p.user_id
         WHERE f.user_id = ? AND f.status = 'accepted'`,
        [userId]
      );
      return friends;
    } catch (error) {
      console.error('获取好友列表失败:', error.message);
      return [];
    }
  }

  async removeFriend(userId, friendId) {
    try {
      await db.query(
        'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
        [userId, friendId, friendId, userId]
      );
      return { success: true, message: '删除好友成功' };
    } catch (error) {
      throw error;
    }
  }

  // ============ 技能系统 ============

  async unlockSkill(userId, skillId) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) throw new Error('用户不存在');

      if (user.skills.unlocked.includes(skillId)) {
        throw new Error('技能已解锁');
      }

      user.skills.unlocked.push(skillId);
      await db.query(
        'UPDATE user_skills SET unlocked = ? WHERE user_id = ?',
        [JSON.stringify(user.skills.unlocked), userId]
      );

      return this.getSafeUser(await this.findUserByIdAsync(userId));
    } catch (error) {
      throw error;
    }
  }

  async setActiveSkills(userId, skillIds) {
    try {
      await db.query(
        'UPDATE user_skills SET active = ? WHERE user_id = ?',
        [JSON.stringify(skillIds), userId]
      );

      return this.getSafeUser(await this.findUserByIdAsync(userId));
    } catch (error) {
      throw error;
    }
  }

  // ============ 任务系统 ============

  async updateQuest(userId, questType, questId, progress) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) throw new Error('用户不存在');

      const quest = user.quests[questType].find(q => q.id === questId);
      if (quest) {
        quest.progress = progress;
        
        await db.query(
          `UPDATE user_quests SET ${questType} = ? WHERE user_id = ?`,
          [JSON.stringify(user.quests[questType]), userId]
        );
      }

      return this.getSafeUser(await this.findUserByIdAsync(userId));
    } catch (error) {
      throw error;
    }
  }

  // ============ PVP系统 ============

  async createPVPRoom(hostId) {
    try {
      const roomId = uuidv4();
      await db.query(
        `INSERT INTO pvp_rooms (id, host_id, status, room_data) VALUES (?, ?, 'waiting', ?)`,
        [roomId, hostId, JSON.stringify({})]
      );

      return { roomId, hostId, status: 'waiting' };
    } catch (error) {
      throw error;
    }
  }

  async joinPVPRoom(roomId, guestId) {
    try {
      await db.query(
        `UPDATE pvp_rooms SET guest_id = ?, status = 'ready' WHERE id = ?`,
        [guestId, roomId]
      );

      const [room] = await db.query('SELECT * FROM pvp_rooms WHERE id = ?', [roomId]);
      return room || null;
    } catch (error) {
      throw error;
    }
  }

  // ============ 统计更新 ============

  async updateStats(userId, statName, increment = 1) {
    try {
      const user = await this.findUserByIdAsync(userId);
      if (!user) return;

      user.stats[statName] = (user.stats[statName] || 0) + increment;
      await db.query(
        'UPDATE user_profiles SET stats = ? WHERE user_id = ?',
        [JSON.stringify(user.stats), userId]
      );
    } catch (error) {
      console.error('更新统计失败:', error.message);
    }
  }

  // ============ 辅助方法 ============

  async getUserCount() {
    try {
      const [result] = await db.query('SELECT COUNT(*) as count FROM users');
      return result.count;
    } catch (error) {
      return 0;
    }
  }

  async cleanup() {
    try {
      // 清理过期的PVP房间（超过1小时）
      await db.query(
        `DELETE FROM pvp_rooms WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR) AND status != 'playing'`
      );
    } catch (error) {
      console.error('清理数据失败:', error.message);
    }
  }
}

module.exports = DatabaseService;

