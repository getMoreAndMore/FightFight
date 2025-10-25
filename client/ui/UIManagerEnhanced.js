import { FriendsUI } from './components/FriendsUI.js';
import { RankingUI } from './components/RankingUI.js';
import { QuestsUI } from './components/QuestsUI.js';

/**
 * 增强版 UI 管理器
 * 使用组件化的UI设计
 */
export function enhanceUIManager(UIManager) {
  // 替换showFriends方法
  const originalShowFriends = UIManager.prototype.showFriends;
  UIManager.prototype.showFriends = function() {
    const content = document.getElementById('content-area');
    if (content) {
      FriendsUI.render(content);
    } else {
      originalShowFriends.call(this);
    }
  };

  // 替换showRanking方法
  const originalShowRanking = UIManager.prototype.showRanking;
  UIManager.prototype.showRanking = function() {
    const content = document.getElementById('content-area');
    if (content) {
      RankingUI.render(content);
    } else {
      originalShowRanking.call(this);
    }
  };

  // 替换showQuests方法
  const originalShowQuests = UIManager.prototype.showQuests;
  UIManager.prototype.showQuests = function() {
    const content = document.getElementById('content-area');
    if (content) {
      QuestsUI.render(content);
    } else {
      originalShowQuests.call(this);
    }
  };
}

