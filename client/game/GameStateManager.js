/**
 * 游戏状态管理器
 * 管理玩家数据、游戏状态
 */
export class GameStateManager {
  constructor() {
    this.user = null;
    this.sessionId = null;
    this.isLoggedIn = false;
    this.currentView = 'attributes'; // 默认视图
    
    this.currentScene = 'town';
    this.inventory = { slots: 10, items: [] };
    this.skills = { unlocked: [], equipped: [] };
    this.friends = [];
    this.rankings = { global: [], friends: [] };
    
    // 事件监听器
    this.listeners = {};
  }

  // 设置用户数据
  setUser(user) {
    this.user = user;
    this.isLoggedIn = true;
    
    if (user.scenes) {
      this.currentScene = user.scenes.current;
    }
    
    if (user.inventory) {
      this.inventory = user.inventory;
    }
    
    if (user.skills) {
      this.skills = user.skills;
    }
    
    // 保存到本地存储
    this.saveToLocalStorage();
    
    this.emit('user:updated', user);
  }

  // 更新用户数据
  updateUser(updates) {
    if (!this.user) return;
    
    Object.assign(this.user, updates);
    this.saveToLocalStorage(); // 保存到localStorage
    this.emit('user:updated', this.user);
  }

  // 获取用户
  getUser() {
    return this.user;
  }

  // 设置会话ID
  setSessionId(sessionId) {
    this.sessionId = sessionId;
    this.saveToLocalStorage();
  }

  // 获取会话ID
  getSessionId() {
    return this.sessionId;
  }

  // 设置当前视图
  setCurrentView(view) {
    this.currentView = view;
    this.saveToLocalStorage();
  }

  // 获取当前视图
  getCurrentView() {
    return this.currentView;
  }

  // 登出
  logout() {
    this.user = null;
    this.sessionId = null;
    this.isLoggedIn = false;
    this.currentView = 'attributes';
    
    // 清除本地存储
    this.clearLocalStorage();
    
    this.emit('user:logout');
  }

  // 保存到本地存储
  saveToLocalStorage() {
    try {
      const state = {
        user: this.user,
        sessionId: this.sessionId,
        isLoggedIn: this.isLoggedIn,
        currentView: this.currentView,
        currentScene: this.currentScene,
        savedAt: Date.now()
      };
      localStorage.setItem('fightfight_game_state', JSON.stringify(state));
    } catch (error) {
      console.error('保存游戏状态失败:', error);
    }
  }

  // 从本地存储恢复
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('fightfight_game_state');
      if (!saved) return null;
      
      const state = JSON.parse(saved);
      
      // 检查是否过期（7天）
      const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7天
      if (Date.now() - state.savedAt > expirationTime) {
        this.clearLocalStorage();
        return null;
      }
      
      return state;
    } catch (error) {
      console.error('加载游戏状态失败:', error);
      this.clearLocalStorage();
      return null;
    }
  }

  // 清除本地存储
  clearLocalStorage() {
    try {
      localStorage.removeItem('fightfight_game_state');
    } catch (error) {
      console.error('清除游戏状态失败:', error);
    }
  }

  // 恢复游戏状态
  async restoreState() {
    const state = this.loadFromLocalStorage();
    if (!state || !state.user || !state.sessionId) {
      return false;
    }
    
    // 恢复基本状态
    this.user = state.user;
    this.sessionId = state.sessionId;
    this.isLoggedIn = state.isLoggedIn;
    this.currentView = state.currentView || 'attributes';
    this.currentScene = state.currentScene || 'town';
    
    if (state.user.inventory) {
      this.inventory = state.user.inventory;
    }
    
    if (state.user.skills) {
      this.skills = state.user.skills;
    }
    
    return true;
  }

  // 更新场景
  setCurrentScene(sceneId) {
    this.currentScene = sceneId;
    this.emit('scene:changed', sceneId);
  }

  // 获取当前场景
  getCurrentScene() {
    return this.currentScene;
  }

  // 更新背包
  updateInventory(inventory) {
    this.inventory = inventory;
    this.emit('inventory:updated', inventory);
  }

  // 更新技能
  updateSkills(skills) {
    this.skills = skills;
    this.emit('skills:updated', skills);
  }

  // 更新好友列表
  updateFriends(friends) {
    this.friends = friends;
    this.emit('friends:updated', friends);
  }

  // 更新排行榜
  updateRankings(rankings) {
    this.rankings = rankings;
    this.emit('rankings:updated', rankings);
  }

  // 事件系统
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

  // 计算当前等级所需经验
  getExpForNextLevel() {
    if (!this.user) return 100;
    
    const baseExp = 100;
    const multiplier = 1.5;
    return Math.floor(baseExp * Math.pow(multiplier, this.user.level));
  }

  // 获取经验进度百分比
  getExpProgress() {
    if (!this.user) return 0;
    
    const required = this.getExpForNextLevel();
    return (this.user.experience / required) * 100;
  }

  // 获取总战力
  getPower() {
    if (!this.user || !this.user.power) return 0;
    return this.user.power;
  }
}

