import Phaser from 'phaser';
import { GameConfig } from './game/config.js';
import { UIManager } from './ui/UIManager.js';
import { enhanceUIManager } from './ui/UIManagerEnhanced.js';
import { NetworkManager } from './network/NetworkManager.js';
import { GameStateManager } from './game/GameStateManager.js';

// 初始化网络管理器
window.networkManager = new NetworkManager();

// 初始化游戏状态管理器
window.gameState = new GameStateManager();

// 增强 UI 管理器
enhanceUIManager(UIManager);

// 初始化 UI 管理器
window.uiManager = new UIManager();

// 创建 Phaser 游戏实例
const game = new Phaser.Game(GameConfig);

// 全局游戏实例
window.game = game;

// 等待 DOM 加载完成
window.addEventListener('load', async () => {
  // 移除加载文字
  const loadingEl = document.querySelector('.loading');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }

  // 尝试从本地存储恢复登录状态
  const restored = await tryRestoreLogin();
  
  if (!restored) {
    // 如果没有保存的登录状态，显示登录界面
    window.uiManager.showLoginScreen();
  }
});

// 尝试恢复登录状态
async function tryRestoreLogin() {
  try {
    // 从本地存储恢复状态
    const restored = await window.gameState.restoreState();
    
    if (!restored) {
      return false;
    }
    
    const user = window.gameState.getUser();
    const sessionId = window.gameState.getSessionId();
    
    if (!user || !sessionId) {
      return false;
    }
    
    console.log('🔄 正在恢复登录状态...', user.username);
    
    // 验证 sessionId 是否仍然有效，通过获取用户资料
    try {
      const result = await window.networkManager.getProfile(user.id);
      
      if (result.success && result.user) {
        // 更新用户数据（服务器可能有更新的数据）
        window.gameState.setUser(result.user);
        
        // 连接 Socket
        window.networkManager.connectSocket();
        
        // Socket 连接成功后发送登录事件
        window.networkManager.on('socket:connected', () => {
          window.networkManager.socketLogin(user.id, sessionId);
        });
        
        // 设置网络事件监听（接收 PVP 邀请等）
        window.uiManager.setupNetworkListeners();
        
        // 显示主界面
        window.uiManager.showMainUI();
        
        // 显示欢迎消息
        setTimeout(() => {
          window.uiManager.showNotification(`欢迎回来，${result.user.username}！`);
        }, 500);
        
        console.log('✅ 登录状态恢复成功');
        return true;
      } else {
        // Session 无效，清除本地存储
        console.log('⚠️ Session 已过期');
        window.gameState.clearLocalStorage();
        return false;
      }
    } catch (error) {
      // 网络错误或服务器错误，清除本地存储
      console.error('❌ 恢复登录失败:', error);
      window.gameState.clearLocalStorage();
      return false;
    }
  } catch (error) {
    console.error('恢复状态时出错:', error);
    return false;
  }
}

console.log('🎮 FightFight RPG 启动！');

