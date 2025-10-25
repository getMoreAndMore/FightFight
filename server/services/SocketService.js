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
      socket.on('pvp:surrender', () => this.handlePvpSurrender(socket));

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
    
    const battle = {
      id: battleId,
      players: {
        [userId1]: {
          user: this.db.getSafeUser(user1),
          hp: this.calculateMaxHp(user1),
          maxHp: this.calculateMaxHp(user1),
          effects: []
        },
        [userId2]: {
          user: this.db.getSafeUser(user2),
          hp: this.calculateMaxHp(user2),
          maxHp: this.calculateMaxHp(user2),
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
    
    if (socket1) {
      this.io.to(socket1).emit('pvp:start', {
        battleId,
        opponent: this.db.getSafeUser(user2),
        yourTurn: true,
        battle
      });
    }
    
    if (socket2) {
      this.io.to(socket2).emit('pvp:start', {
        battleId,
        opponent: this.db.getSafeUser(user1),
        yourTurn: false,
        battle
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
    return 100 + user.attributes.endurance * 10;
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

  async endPvpBattle(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;
    
    const winner = Object.entries(battle.players).find(
      ([_, player]) => player.hp > 0
    );
    const loser = Object.entries(battle.players).find(
      ([_, player]) => player.hp <= 0
    );
    
    if (winner && loser) {
      // 更新战绩
      const winnerUser = await this.db.findUserByIdAsync(winner[0]);
      const loserUser = await this.db.findUserByIdAsync(loser[0]);
      
      winnerUser.pvp.wins++;
      winnerUser.pvp.rating += 25;
      loserUser.pvp.losses++;
      loserUser.pvp.rating = Math.max(0, loserUser.pvp.rating - 20);
      
      // 通知结果
      const winnerSocketId = this.userSockets.get(winner[0]);
      const loserSocketId = this.userSockets.get(loser[0]);
      
      if (winnerSocketId) {
        this.io.to(winnerSocketId).emit('pvp:end', {
          result: 'victory',
          battle,
          rewards: { exp: 100, rating: 25 }
        });
      }
      
      if (loserSocketId) {
        this.io.to(loserSocketId).emit('pvp:end', {
          result: 'defeat',
          battle,
          rewards: { exp: 50, rating: -20 }
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

  handlePvpSurrender(socket) {
    const userId = this.onlineUsers.get(socket.id);
    if (!userId) return;

    for (const [battleId, battle] of this.activeBattles.entries()) {
      if (battle.players[userId]) {
        battle.players[userId].hp = 0;
        this.endPvpBattle(battleId);
        break;
      }
    }
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

