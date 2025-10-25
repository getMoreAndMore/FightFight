import { io } from 'socket.io-client';

/**
 * 网络管理器
 * 处理所有与服务器的通信（HTTP + Socket.io）
 */
export class NetworkManager {
  constructor() {
    this.socket = null;
    this.baseUrl = window.location.origin;
    this.apiUrl = `${this.baseUrl}/api`;
    
    this.listeners = {};
  }

  // ============ HTTP 请求 ============

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('请求错误:', error);
      throw error;
    }
  }

  // 用户相关
  async register(username, password, email) {
    return this.request('/user/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email })
    });
  }

  async login(username, password) {
    return this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async getProfile(userId) {
    return this.request(`/user/profile?userId=${userId}`);
  }

  async checkin(userId) {
    return this.request('/user/checkin', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // 属性相关
  async addAttribute(userId, attribute, points) {
    return this.request('/attribute/add', {
      method: 'POST',
      body: JSON.stringify({ userId, attribute, points })
    });
  }

  async resetAttributes(userId) {
    return this.request('/attribute/reset', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // 背包相关
  async getInventory(userId) {
    return this.request(`/inventory/get?userId=${userId}`);
  }

  async useItem(userId, instanceId) {
    return this.request('/inventory/use', {
      method: 'POST',
      body: JSON.stringify({ userId, instanceId })
    });
  }

  async dropItem(userId, instanceId, quantity) {
    return this.request('/inventory/drop', {
      method: 'POST',
      body: JSON.stringify({ userId, instanceId, quantity })
    });
  }

  async sortInventory(userId, sortBy) {
    return this.request('/inventory/sort', {
      method: 'POST',
      body: JSON.stringify({ userId, sortBy })
    });
  }

  // 技能相关
  async getSkills(userId) {
    return this.request(`/skill/list?userId=${userId}`);
  }

  async unlockSkill(userId, skillId) {
    return this.request('/skill/unlock', {
      method: 'POST',
      body: JSON.stringify({ userId, skillId })
    });
  }

  async equipSkill(userId, skillId, slotIndex) {
    return this.request('/skill/equip', {
      method: 'POST',
      body: JSON.stringify({ userId, skillId, slotIndex })
    });
  }

  async unequipSkill(userId, slotIndex) {
    return this.request('/skill/unequip', {
      method: 'POST',
      body: JSON.stringify({ userId, slotIndex })
    });
  }

  // 场景相关
  async getScenes(userId) {
    return this.request(`/scene/list?userId=${userId}`);
  }

  async enterScene(userId, sceneId) {
    return this.request('/scene/enter', {
      method: 'POST',
      body: JSON.stringify({ userId, sceneId })
    });
  }

  async completeMinigame(userId, sceneId, minigameId, score) {
    return this.request('/scene/complete', {
      method: 'POST',
      body: JSON.stringify({ userId, sceneId, minigameId, score })
    });
  }

  // 排行榜相关
  async getRanking(userId, type = 'global') {
    return this.request(`/ranking/get?userId=${userId}&type=${type}`);
  }

  // 成就相关
  async getAchievements(userId) {
    return this.request(`/achievement/get?userId=${userId}`);
  }

  async claimAchievement(userId, achievementId) {
    return this.request('/achievement/claim', {
      method: 'POST',
      body: JSON.stringify({ userId, achievementId })
    });
  }

  // 任务相关
  async getQuests(userId, type) {
    const typeParam = type ? `&type=${type}` : '';
    return this.request(`/quest/get?userId=${userId}${typeParam}`);
  }

  async completeQuest(userId, questId) {
    return this.request('/quest/complete', {
      method: 'POST',
      body: JSON.stringify({ userId, questId })
    });
  }

  async refreshDailyQuests(userId) {
    return this.request('/quest/refresh-daily', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // ============ Socket.io 连接 ============

  connectSocket() {
    if (this.socket && this.socket.connected) {
      console.log('Socket 已连接');
      return;
    }

    this.socket = io(this.baseUrl);

    this.socket.on('connect', () => {
      console.log('✅ Socket 连接成功');
      this.emit('socket:connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket 断开连接');
      this.emit('socket:disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket 错误:', error);
      // 如果error是对象，尝试提取message
      const errorMessage = error && error.message ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
      console.error('错误详情:', errorMessage);
      // 显示错误通知
      if (window.uiManager && window.uiManager.showNotification) {
        window.uiManager.showNotification(errorMessage);
      }
      this.emit('socket:error', error);
    });

    // 用户事件
    this.socket.on('user:login:success', (data) => {
      this.emit('user:login:success', data);
    });

    this.socket.on('user:update', (data) => {
      this.emit('user:update', data);
    });

    // 好友事件
    this.socket.on('friend:request:sent', (data) => {
      console.log('✅ 好友请求已发送:', data);
      this.emit('friend:request:sent', data);
    });

    this.socket.on('friend:request:received', (data) => {
      this.emit('friend:request:received', data);
    });

    this.socket.on('friend:accept:success', (data) => {
      this.emit('friend:accept:success', data);
    });

    this.socket.on('friend:added', (data) => {
      this.emit('friend:added', data);
    });

    this.socket.on('friend:removed', (data) => {
      this.emit('friend:removed', data);
    });

    this.socket.on('friend:online', (data) => {
      this.emit('friend:online', data);
    });

    this.socket.on('friend:list', (data) => {
      this.emit('friend:list', data);
    });

    // PVP 事件
    this.socket.on('pvp:matching', (data) => {
      this.emit('pvp:matching', data);
    });

    this.socket.on('pvp:start', (data) => {
      this.emit('pvp:start', data);
    });

    this.socket.on('pvp:action:result', (data) => {
      this.emit('pvp:action:result', data);
    });

    this.socket.on('pvp:end', (data) => {
      this.emit('pvp:end', data);
    });

    this.socket.on('pvp:invite:received', (data) => {
      this.emit('pvp:invite:received', data);
    });

    this.socket.on('pvp:match:timeout', (data) => {
      this.emit('pvp:match:timeout', data);
    });

    // 聊天事件
    this.socket.on('chat:message', (data) => {
      this.emit('chat:message', data);
    });

    this.socket.on('chat:sent', (data) => {
      this.emit('chat:sent', data);
    });
  }

  // Socket.io 发送事件
  socketEmit(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket 未连接');
      return;
    }

    this.socket.emit(event, data);
  }

  // 用户登录（Socket）
  socketLogin(userId, sessionId) {
    this.socketEmit('user:login', { userId, sessionId });
  }

  // 断开 Socket 连接
  disconnectSocket() {
    if (this.socket) {
      console.log('🔌 断开 Socket 连接');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 好友请求
  sendFriendRequest(toUsername) {
    this.socketEmit('friend:request', { toUsername });
  }

  acceptFriendRequest(requestId) {
    this.socketEmit('friend:accept', { requestId });
  }

  removeFriend(friendId) {
    this.socketEmit('friend:remove', { friendId });
  }

  getFriendList() {
    this.socketEmit('friend:list');
  }

  // PVP
  matchPvp() {
    this.socketEmit('pvp:match');
  }

  invitePvp(friendId) {
    this.socketEmit('pvp:invite', { friendId });
  }

  acceptPvpInvite(inviteId) {
    this.socketEmit('pvp:accept', { inviteId });
  }

  sendPvpAction(battleId, action) {
    this.socketEmit('pvp:action', { battleId, action });
  }

  surrenderPvp() {
    this.socketEmit('pvp:surrender');
  }

  // 聊天
  sendChatMessage(to, message) {
    this.socketEmit('chat:message', { to, message });
  }

  // ============ 事件系统 ============

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;

    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(callback => {
      callback(data);
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

