/**
 * Socket.io 服务
 * 处理实时通信：好友系统、PVP对战、聊天等
 */
class SocketService {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.onlineUsers = new Map(); // socketId -> userId
    this.userSockets = new Map(); // userId -> socketId
    this.pvpQueue = [];
    this.activeBattles = new Map();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`Socket 连接: ${socket.id}`);

      // 用户登录
      socket.on('user:login', (data) => this.handleUserLogin(socket, data));

      // 用户登出
      socket.on('disconnect', () => this.handleDisconnect(socket));

      // 好友系统
      socket.on('friend:request', (data) => this.handleFriendRequest(socket, data));
      socket.on('friend:accept', (data) => this.handleFriendAccept(socket, data));
      socket.on('friend:remove', (data) => this.handleFriendRemove(socket, data));
      socket.on('friend:list', () => this.handleFriendList(socket));

      // PVP 系统
      socket.on('pvp:match', (data) => this.handlePvpMatch(socket, data));
      socket.on('pvp:invite', (data) => this.handlePvpInvite(socket, data));
      socket.on('pvp:accept', (data) => this.handlePvpAccept(socket, data));
      socket.on('pvp:action', (data) => this.handlePvpAction(socket, data));
      socket.on('pvp:surrender', (data) => this.handlePvpSurrender(socket, data));
      
      // 实时对战事件
      socket.on('pvp:position', (data) => this.handlePvpPosition(socket, data));
      socket.on('pvp:attack', (data) => this.handlePvpAttack(socket, data));
      socket.on('pvp:ranged-attack', (data) => this.handlePvpRangedAttack(socket, data));  // 🎯 远程攻击
      socket.on('pvp:ranged-hit', (data) => this.handlePvpRangedHit(socket, data));  // 🎯 远程命中
      socket.on('pvp:defeated', (data) => this.handlePvpDefeated(socket, data));

      // 聊天
      socket.on('chat:message', (data) => this.handleChatMessage(socket, data));
    });

    // 定期清理匹配队列
    setInterval(() => this.cleanupPvpQueue(), 30000);
  }

  // ============ 用户连接管理 ============

  async handleUserLogin(socket, data) {
    try {
      const { userId, sessionId } = data;
      
      // 验证会话
      const validUserId = await this.db.validateSession(sessionId);
      if (!validUserId || validUserId !== userId) {
        socket.emit('error', { message: '会话无效' });
        return;
      }

      // 获取用户信息
      const user = await this.db.findUserByIdAsync(userId);
      if (!user) {
        socket.emit('error', { message: '用户不存在' });
        return;
      }

      this.onlineUsers.set(socket.id, userId);
      this.userSockets.set(userId, socket.id);

      socket.emit('user:login:success', {
        user: this.db.getSafeUser(user)
      });

      // 通知好友上线
      await this.notifyFriendsOnline(userId, true);

      console.log(`用户登录: ${user.username} (${userId})`);
    } catch (error) {
      console.error('Socket 用户登录错误:', error);
      socket.emit('error', { message: '登录失败' });
    }
  }

  handleDisconnect(socket) {
    const userId = this.onlineUsers.get(socket.id);
    
    if (userId) {
      this.onlineUsers.delete(socket.id);
      this.userSockets.delete(userId);
      
      // 从匹配队列移除
      this.pvpQueue = this.pvpQueue.filter(entry => entry.userId !== userId);
      
      // 处理正在进行的战斗
      this.handleBattleDisconnect(userId);
      
      // 通知好友下线
      this.notifyFriendsOnline(userId, false);
      
      console.log(`用户断开连接: ${userId}`);
    }
  }

  async notifyFriendsOnline(userId, isOnline) {
    const user = await this.db.findUserByIdAsync(userId);
    if (!user) return;

    const friends = await this.db.getFriends(userId);
    friends.forEach(friend => {
      const friendSocketId = this.userSockets.get(friend.id);
      if (friendSocketId) {
        this.io.to(friendSocketId).emit('friend:online', {
          userId,
          username: user.username,
          isOnline
        });
      }
    });
  }

  // ============ 好友系统 ============

  async handleFriendRequest(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) {
      socket.emit('error', { message: '未登录' });
      return;
    }

    try {
      const { toUsername } = data;
      
      console.log(`📤 [好友请求] ${userId} 想要添加好友: ${toUsername}`);
      
      // 根据用户名查找用户
      const toUser = await this.db.findUserByUsername(toUsername);
      if (!toUser) {
        console.log(`⚠️ [好友请求] 用户不存在: ${toUsername}`);
        socket.emit('error', { message: '用户不存在' });
        return;
      }
      
      console.log(`✅ [好友请求] 找到用户: ${toUser.username} (${toUser.id})`);
      
      const result = await this.db.addFriend(userId, toUser.id);
      
      console.log(`✅ [好友请求] 添加成功: ${userId} -> ${toUser.id}`);
      
      socket.emit('friend:request:sent', { success: true, message: '好友请求已发送' });
      
      // 通知对方
      const toSocketId = this.userSockets.get(toUser.id);
      if (toSocketId) {
        const fromUser = await this.db.findUserByIdAsync(userId);
        this.io.to(toSocketId).emit('friend:request:received', {
          from: this.db.getSafeUser(fromUser)
        });
        console.log(`📨 [好友请求] 已通知目标用户: ${toUser.username}`);
      } else {
        console.log(`⚠️ [好友请求] 目标用户不在线: ${toUser.username}`);
      }
    } catch (error) {
      console.error('❌ [好友请求错误]:', error);
      socket.emit('error', { message: error.message || '添加好友失败' });
    }
  }

  handleFriendAccept(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    try {
      const { requestId } = data;
      const result = this.db.acceptFriendRequest(requestId);
      
      socket.emit('friend:accept:success', result);
      
      // 通知对方
      const fromSocketId = this.userSockets.get(result.fromUser.id);
      if (fromSocketId) {
        this.io.to(fromSocketId).emit('friend:added', {
          friend: result.toUser
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  handleFriendRemove(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    try {
      const { friendId } = data;
      this.db.removeFriend(userId, friendId);
      
      socket.emit('friend:removed', { friendId });
      
      // 通知对方
      const friendSocketId = this.userSockets.get(friendId);
      if (friendSocketId) {
        this.io.to(friendSocketId).emit('friend:removed', { friendId: userId });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  async handleFriendList(socket) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    try {
      const friends = await this.db.getFriends(userId);
      
      // 添加在线状态
      const friendsWithStatus = friends.map(friend => ({
        ...friend,
        isOnline: this.userSockets.has(friend.id)
      }));
      
      socket.emit('friend:list', { friends: friendsWithStatus });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  // ============ PVP 系统 ============

  async handlePvpMatch(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    const user = await this.db.findUserByIdAsync(userId);
    if (!user) return;

    // 检查是否已在队列中
    if (this.pvpQueue.some(entry => entry.userId === userId)) {
      socket.emit('error', { message: '已在匹配队列中' });
      return;
    }

    const power = this.db.calculatePower(user);
    
    // 尝试匹配
    const opponent = this.findPvpOpponent(power, userId);
    
    if (opponent) {
      // 找到对手，开始战斗
      this.startPvpBattle(userId, opponent.userId);
    } else {
      // 加入队列
      this.pvpQueue.push({
        userId,
        power,
        joinedAt: Date.now(),
        socketId: socket.id
      });
      
      socket.emit('pvp:matching', { message: '正在匹配中...' });
    }
  }

  findPvpOpponent(power, excludeUserId) {
    const { PVP_CONFIG } = require('../../shared/constants.cjs');
    
    for (let i = 0; i < this.pvpQueue.length; i++) {
      const entry = this.pvpQueue[i];
      
      if (entry.userId === excludeUserId) continue;
      
      const powerDiff = Math.abs(entry.power - power);
      if (powerDiff <= PVP_CONFIG.MAX_POWER_DIFFERENCE) {
        this.pvpQueue.splice(i, 1);
        return entry;
      }
    }
    
    return null;
  }

  async startPvpBattle(userId1, userId2) {
    const battleId = `${userId1}_${userId2}_${Date.now()}`;
    
    const user1 = await this.db.findUserByIdAsync(userId1);
    const user2 = await this.db.findUserByIdAsync(userId2);
    
    // 🔴 计算最大血量
    const user1MaxHp = user1.attributes.endurance * 10;
    const user2MaxHp = user2.attributes.endurance * 10;
    
    const battle = {
      id: battleId,
      players: {
        [userId1]: {
          user: this.db.getSafeUser(user1),
          currentHp: user1MaxHp,  // 🔴 当前血量
          maxHp: user1MaxHp,      // 🔴 最大血量
          hp: user1MaxHp,         // 兼容旧代码
          effects: []
        },
        [userId2]: {
          user: this.db.getSafeUser(user2),
          currentHp: user2MaxHp,  // 🔴 当前血量
          maxHp: user2MaxHp,      // 🔴 最大血量
          hp: user2MaxHp,         // 兼容旧代码
          effects: []
        }
      },
      currentTurn: userId1,
      turnStartTime: Date.now(),
      actions: []
    };
    
    this.activeBattles.set(battleId, battle);
    
    // 通知双方
    const socket1 = this.userSockets.get(userId1);
    const socket2 = this.userSockets.get(userId2);
    
    console.log('🟢 [服务器] 战斗数据创建完成', {
      战斗ID: battleId,
      玩家IDs: Object.keys(battle.players),
      玩家1: userId1,
      玩家2: userId2,
      玩家1用户名: battle.players[userId1].user.username,
      玩家2用户名: battle.players[userId2].user.username
    });
    
    if (socket1) {
      console.log('📤 [服务器→玩家1] 发送pvp:start', {
        目标ID: userId1,
        用户名: user1.username
      });
      this.io.to(socket1).emit('pvp:start', {
        battleData: battle  // 修复：改为 battleData
      });
    }
    
    if (socket2) {
      console.log('📤 [服务器→玩家2] 发送pvp:start', {
        目标ID: userId2,
        用户名: user2.username
      });
      this.io.to(socket2).emit('pvp:start', {
        battleData: battle  // 修复：改为 battleData
      });
    }
    
    // 设置回合超时
    setTimeout(() => this.checkTurnTimeout(battleId), 30000);
  }

  async handlePvpInvite(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    const { friendId } = data;
    const friendSocketId = this.userSockets.get(friendId);
    
    if (!friendSocketId) {
      socket.emit('error', { message: '好友不在线' });
      return;
    }
    
    const user = await this.db.findUserByIdAsync(userId);
    this.io.to(friendSocketId).emit('pvp:invite:received', {
      from: this.db.getSafeUser(user),
      inviteId: `${userId}_${friendId}_${Date.now()}`
    });
    
    socket.emit('pvp:invite:sent', { message: '已发送对战邀请' });
  }

  handlePvpAccept(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    const { inviteId } = data;
    const [fromUserId] = inviteId.split('_');
    
    this.startPvpBattle(fromUserId, userId);
  }

  handlePvpAction(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    const { battleId, action } = data;
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) {
      socket.emit('error', { message: '战斗不存在' });
      return;
    }
    
    if (battle.currentTurn !== userId) {
      socket.emit('error', { message: '不是你的回合' });
      return;
    }
    
    // 执行动作
    const result = this.executePvpAction(battle, userId, action);
    
    // 记录动作
    battle.actions.push({
      userId,
      action,
      result,
      timestamp: Date.now()
    });
    
    // 通知双方
    const opponentId = Object.keys(battle.players).find(id => id !== userId);
    const opponentSocketId = this.userSockets.get(opponentId);
    
    socket.emit('pvp:action:result', { result, battle });
    if (opponentSocketId) {
      this.io.to(opponentSocketId).emit('pvp:action:result', { result, battle });
    }
    
    // 检查战斗是否结束
    if (this.checkBattleEnd(battle)) {
      this.endPvpBattle(battleId);
    } else {
      // 切换回合
      battle.currentTurn = opponentId;
      battle.turnStartTime = Date.now();
      setTimeout(() => this.checkTurnTimeout(battleId), 30000);
    }
  }

  executePvpAction(battle, userId, action) {
    const attacker = battle.players[userId];
    const opponentId = Object.keys(battle.players).find(id => id !== userId);
    const defender = battle.players[opponentId];
    
    const result = { type: action.type, effects: [] };
    
    if (action.type === 'attack') {
      const damage = this.calculateDamage(attacker.user, defender.user, action.skillId);
      defender.hp = Math.max(0, defender.hp - damage);
      result.damage = damage;
    } else if (action.type === 'skill') {
      // 技能效果
      result.skillEffect = this.applySkillEffect(battle, userId, action.skillId);
    } else if (action.type === 'defend') {
      attacker.effects.push({ type: 'defend', duration: 1 });
    }
    
    return result;
  }

  calculateDamage(attacker, defender, skillId) {
    // 简化的伤害计算
    const baseAttack = attacker.attributes.strength * 2;
    const defense = defender.attributes.endurance;
    const damage = Math.max(1, baseAttack - defense);
    
    return Math.floor(damage * (0.9 + Math.random() * 0.2));
  }

  calculateMaxHp(user) {
    // 生命值 = 耐力 × 10
    return user.attributes.endurance * 10;
  }

  applySkillEffect(battle, userId, skillId) {
    // 技能效果逻辑
    return { applied: true };
  }

  checkBattleEnd(battle) {
    for (const player of Object.values(battle.players)) {
      if (player.hp <= 0) {
        return true;
      }
    }
    return false;
  }

  async endPvpBattle(battleId, winnerId = null, loserId = null) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;
    
    // 如果没有指定胜利者，自动判断
    if (!winnerId || !loserId) {
      const winner = Object.entries(battle.players).find(
        ([_, player]) => player.hp > 0
      );
      const loser = Object.entries(battle.players).find(
        ([_, player]) => player.hp <= 0
      );
      
      if (winner && loser) {
        winnerId = winner[0];
        loserId = loser[0];
      }
    }
    
    if (winnerId && loserId) {
      console.log(`🏆 PVP战斗结束: 胜利者 ${winnerId}, 失败者 ${loserId}`);
      
      // 通知结果
      const winnerSocketId = this.userSockets.get(winnerId);
      const loserSocketId = this.userSockets.get(loserId);
      
      if (winnerSocketId) {
        this.io.to(winnerSocketId).emit('pvp:end', {
          result: 'victory',
          winnerId: winnerId,
          loserId: loserId,
          battle
        });
      }
      
      if (loserSocketId) {
        this.io.to(loserSocketId).emit('pvp:end', {
          result: 'defeat',
          winnerId: winnerId,
          loserId: loserId,
          battle
        });
      }
    }
    
    this.activeBattles.delete(battleId);
  }

  handleBattleDisconnect(userId) {
    for (const [battleId, battle] of this.activeBattles.entries()) {
      if (battle.players[userId]) {
        // 断线判负
        battle.players[userId].hp = 0;
        this.endPvpBattle(battleId);
      }
    }
  }

  handlePvpSurrender(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    const { battleId } = data;
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;

    // 找到对手
    const opponentId = Object.keys(battle.players).find(id => id !== userId);
    
    // 结束战斗
    this.endPvpBattle(battleId, opponentId, userId);
  }
  
  // 处理位置同步
  handlePvpPosition(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) {
      console.log('❌ [位置同步] 无法获取用户ID');
      return;
    }

    const { battleId } = data;
    const battle = this.activeBattles.get(battleId);
    if (!battle) {
      console.log('❌ [位置同步] 找不到战斗:', battleId);
      return;
    }

    // 转发给对手
    const opponentId = Object.keys(battle.players).find(id => id !== userId);
    const opponentSocketId = this.userSockets.get(opponentId);
    
    console.log('📍 [服务器转发位置]', {
      发送者: userId,
      接收者: opponentId,
      位置: { x: data.x, y: data.y },
      原始data中的userId: data.userId,
      对手Socket: opponentSocketId ? '已连接' : '未连接'
    });
    
    if (opponentSocketId) {
      // 🔴 关键修复：确保转发的数据包含正确的 userId
      const forwardData = {
        ...data,
        userId: userId  // 强制设置为发送者的ID
      };
      
      console.log('📤 [服务器] 转发数据:', forwardData);
      this.io.to(opponentSocketId).emit('pvp:position', forwardData);
    } else {
      console.log('❌ [位置同步] 对手未连接');
    }
  }
  
  // 处理攻击
  handlePvpAttack(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) {
      console.log('❌ [攻击处理] 无法获取用户ID');
      return;
    }

    const { battleId, attackerId, targetId, damage, knockbackDirection } = data;
    const battle = this.activeBattles.get(battleId);
    if (!battle) {
      console.log('❌ [攻击处理] 找不到战斗:', battleId);
      return;
    }

    console.log(`⚔️ [PVP攻击] ${attackerId} 攻击 ${targetId}, 伤害: ${damage}, 击退方向: ${knockbackDirection}`);

    // 扣除对手血量
    const targetPlayer = battle.players[targetId];
    if (targetPlayer) {
      const oldHp = targetPlayer.hp;
      targetPlayer.hp = Math.max(0, targetPlayer.hp - damage);
      
      const attackerSocketId = this.userSockets.get(attackerId);
      const targetSocketId = this.userSockets.get(targetId);
      
      console.log(`🩸 [血量变化] ${targetId}: ${oldHp} -> ${targetPlayer.hp} (最大: ${targetPlayer.maxHp})`);
      console.log(`📡 [Socket状态] 攻击者: ${attackerSocketId ? '在线' : '离线'}, 目标: ${targetSocketId ? '在线' : '离线'}`);
      
      // 🔴 通知被攻击者受到伤害（包含击退方向）
      if (targetSocketId) {
        console.log(`➡️ [发送pvp:damage] 目标: ${targetId}, 伤害: ${damage}, 击退方向: ${knockbackDirection}`);
        this.io.to(targetSocketId).emit('pvp:damage', {
          damage: damage,
          targetId: targetId,
          knockbackDirection: knockbackDirection  // 🔴 添加击退方向
        });
        
        // 通知对手有人攻击了
        console.log(`➡️ [发送pvp:attack] 攻击者: ${attackerId} -> 目标: ${targetId}`);
        this.io.to(targetSocketId).emit('pvp:attack', {
          userId: attackerId,
          damage: damage,
          hit: true
        });
      }
      
      // 🔴 通知攻击者对手的血量更新（用于实时显示对手血条，包含击退方向）
      if (attackerSocketId) {
        console.log(`➡️ [发送pvp:hp:update] 攻击者: ${attackerId}, 对手血量: ${targetPlayer.hp}/${targetPlayer.maxHp}, 击退方向: ${knockbackDirection}`);
        this.io.to(attackerSocketId).emit('pvp:hp:update', {
          targetId: targetId,  // 🔴 修复：应该是 targetId 而不是 userId
          currentHp: targetPlayer.hp,
          maxHp: targetPlayer.maxHp,
          knockbackDirection: knockbackDirection  // 🔴 添加击退方向
        });
      }

      // 检查是否死亡
      if (targetPlayer.hp <= 0) {
        console.log(`💀 [玩家死亡] ${targetId} 被 ${attackerId} 击败`);
        this.endPvpBattle(battleId, attackerId, targetId);
      }
    } else {
      console.log('❌ [攻击处理] 找不到目标玩家:', targetId);
    }
  }
  
  // 🎯 处理远程攻击（转发子弹给对手）
  handlePvpRangedAttack(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    console.log('📨 [服务器收到远程攻击]', {
      socketId: socket.id,
      userId: userId,
      data: data
    });
    
    if (!userId) {
      console.log('❌ [远程攻击] 无法获取用户ID');
      return;
    }

    const { battleId, x, y, direction, damage } = data;
    const battle = this.activeBattles.get(battleId);
    if (!battle) {
      console.log('❌ [远程攻击] 找不到战斗:', battleId);
      console.log('当前活跃战斗:', Array.from(this.activeBattles.keys()));
      return;
    }

    // 🔴 找到对手（battle.players 是一个对象，键是 userId）
    const playerIds = Object.keys(battle.players);
    const opponentId = playerIds.find(id => id !== userId);
    
    console.log('🔍 [查找对手]', {
      所有玩家: playerIds,
      发起者: userId,
      对手: opponentId
    });
    
    if (!opponentId) {
      console.log('❌ [远程攻击] 找不到对手ID');
      return;
    }
    
    const opponentSocketId = this.userSockets.get(opponentId);
    
    console.log('🔌 [Socket映射]', {
      对手ID: opponentId,
      对手SocketId: opponentSocketId,
      所有用户Socket: Array.from(this.userSockets.entries())
    });
    
    if (opponentSocketId) {
      // 转发远程攻击事件给对手（让对手也能看到子弹）
      const forwardData = {
        userId: userId,
        x: x,
        y: y,
        direction: direction,
        damage: damage
      };
      
      this.io.to(opponentSocketId).emit('pvp:ranged-attack', forwardData);
      
      console.log(`✅ [远程攻击转发成功] ${userId} -> ${opponentId}`, {
        目标Socket: opponentSocketId,
        转发数据: forwardData
      });
    } else {
      console.log('❌ [远程攻击] 找不到对手Socket:', opponentId);
    }
  }

  // 🎯 处理远程命中（扣血和通知）
  handlePvpRangedHit(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) {
      console.log('❌ [远程命中] 无法获取用户ID');
      return;
    }

    const { battleId, targetId, damage } = data;
    const battle = this.activeBattles.get(battleId);
    if (!battle) {
      console.log('❌ [远程命中] 找不到战斗:', battleId);
      return;
    }

    // 🔴 找到目标玩家（battle.players[targetId]）
    const targetPlayer = battle.players[targetId];
    
    if (!targetPlayer) {
      console.log('❌ [远程命中] 找不到目标玩家:', targetId);
      return;
    }
    
    // 扣血
    const oldHp = targetPlayer.hp;
    targetPlayer.hp = Math.max(0, targetPlayer.hp - damage);
    targetPlayer.currentHp = targetPlayer.hp;  // 同步 currentHp
    
    console.log(`🎯 [远程命中] 攻击者: ${userId}, 目标: ${targetId}, 伤害: ${damage}, 血量: ${oldHp} -> ${targetPlayer.hp}/${targetPlayer.maxHp}`);

    // 通知目标玩家受到伤害（不击退）
    const targetSocketId = this.userSockets.get(targetId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('pvp:damage', {
        targetId: targetId,
        damage: damage,
        knockbackDirection: 0  // 🔴 远程攻击不击退
      });
      console.log(`📤 [发送伤害] -> 目标: ${targetId}`);
    }

    // 通知攻击者对手血量更新
    const attackerSocketId = this.userSockets.get(userId);
    if (attackerSocketId) {
      this.io.to(attackerSocketId).emit('pvp:hp:update', {
        targetId: targetId,
        currentHp: targetPlayer.hp,
        maxHp: targetPlayer.maxHp,
        knockbackDirection: 0  // 🔴 远程攻击不击退
      });
      console.log(`📤 [发送血量更新] -> 攻击者: ${userId}, 对手血量: ${targetPlayer.hp}/${targetPlayer.maxHp}`);
    }

    // 检查是否击败
    if (targetPlayer.hp <= 0) {
      console.log(`💀 [击败] ${targetId} 被 ${userId} 击败`);
      this.endPvpBattle(battleId, userId, targetId);
    }
  }

  // 处理玩家死亡
  handlePvpDefeated(socket, data) {
    const { battleId, winnerId, loserId } = data;
    this.endPvpBattle(battleId, winnerId, loserId);
  }

  checkTurnTimeout(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;
    
    const elapsed = Date.now() - battle.turnStartTime;
    if (elapsed >= 30000) {
      // 超时自动跳过回合
      const opponentId = Object.keys(battle.players).find(
        id => id !== battle.currentTurn
      );
      battle.currentTurn = opponentId;
      battle.turnStartTime = Date.now();
    }
  }

  cleanupPvpQueue() {
    const now = Date.now();
    this.pvpQueue = this.pvpQueue.filter(entry => {
      const elapsed = now - entry.joinedAt;
      if (elapsed > 60000) {
        // 超时，通知玩家
        this.io.to(entry.socketId).emit('pvp:match:timeout', {
          message: '匹配超时'
        });
        return false;
      }
      return true;
    });
  }

  // ============ 聊天系统 ============

  async handleChatMessage(socket, data) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    const user = await this.db.findUserByIdAsync(userId);
    const { to, message } = data;
    
    const toSocketId = this.userSockets.get(to);
    if (toSocketId) {
      this.io.to(toSocketId).emit('chat:message', {
        from: userId,
        fromUsername: user.username,
        message,
        timestamp: Date.now()
      });
    }
    
    socket.emit('chat:sent', { success: true });
  }
}

module.exports = SocketService;

