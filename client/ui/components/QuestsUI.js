/**
 * 任务系统UI组件
 */
export class QuestsUI {
  static render(container) {
    const user = window.gameState.getUser();
    if (!user) return;

    container.innerHTML = `
      <div class="quests-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">任务系统</h2>
        
        <!-- 任务类型切换 -->
        <div class="quest-tabs" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
          <button class="quest-tab-btn active" data-type="daily" style="padding: 12px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px; font-weight: bold;">每日任务</button>
          <button class="quest-tab-btn" data-type="weekly" style="padding: 12px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px; font-weight: bold;">周常任务</button>
        </div>

        <!-- 刷新按钮 -->
        <div style="margin-bottom: 20px;">
          <button id="refresh-quests-btn" style="width: 100%; padding: 12px; background: #00ff00; border: none; color: #000; cursor: pointer; border-radius: 5px; font-weight: bold;">
            🔄 刷新每日任务
          </button>
        </div>

        <!-- 任务列表 -->
        <div id="quests-container">
          <div style="text-align: center; padding: 20px;">加载中...</div>
        </div>

        <!-- 成就系统 -->
        <div class="achievements-section" style="margin-top: 30px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">成就</h3>
          <div id="achievements-container">
            <div style="text-align: center; padding: 20px; color: #999;">加载中...</div>
          </div>
        </div>
      </div>
    `;

    // 标签切换
    document.querySelectorAll('.quest-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        
        document.querySelectorAll('.quest-tab-btn').forEach(b => {
          b.style.background = '#333';
          b.classList.remove('active');
        });
        btn.style.background = '#667eea';
        btn.classList.add('active');

        QuestsUI.loadQuests(type);
      });
    });

    // 刷新任务
    document.getElementById('refresh-quests-btn').addEventListener('click', () => {
      QuestsUI.refreshDailyQuests();
    });

    // 默认加载每日任务
    QuestsUI.loadQuests('daily');
    
    // 加载成就
    QuestsUI.loadAchievements();
  }

  static async loadQuests(type = 'daily') {
    const user = window.gameState.getUser();
    if (!user) return;

    try {
      const result = await window.networkManager.getQuests(user.id, type);
      
      if (result.success) {
        QuestsUI.renderQuests(result.quests);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  }

  static async refreshDailyQuests() {
    const user = window.gameState.getUser();
    if (!user) return;

    try {
      const result = await window.networkManager.refreshDailyQuests(user.id);
      
      if (result.success) {
        window.uiManager.showNotification('每日任务已刷新');
        QuestsUI.renderQuests(result.quests);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  static renderQuests(quests) {
    const container = document.getElementById('quests-container');
    
    // 如果不在任务页面，元素不存在，直接返回
    if (!container) {
      return;
    }
    
    if (!quests || quests.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无任务</div>';
      return;
    }

    container.innerHTML = quests.map(quest => {
      const progress = quest.progress || 0;
      const requirement = quest.requirement || 1;
      const progressPercent = Math.min(100, (progress / requirement) * 100);
      const isCompleted = quest.completed;
      const canComplete = progress >= requirement && !isCompleted;

      return `
        <div class="quest-item" style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin-bottom: 15px; ${isCompleted ? 'opacity: 0.6;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <div style="flex: 1;">
              <h4 style="color: #667eea; margin-bottom: 5px;">${quest.name}</h4>
              <div style="font-size: 14px; color: #999; margin-bottom: 10px;">${quest.description || '完成任务获得奖励'}</div>
              
              <!-- 进度条 -->
              <div style="margin-bottom: 10px;">
                <div style="font-size: 12px; margin-bottom: 5px;">进度: ${progress} / ${requirement}</div>
                <div style="background: #1a1a2e; height: 20px; border-radius: 10px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
                </div>
              </div>

              <!-- 奖励 -->
              <div style="font-size: 12px; color: #00ff00;">
                ${quest.rewards ? Object.entries(quest.rewards).map(([key, value]) => {
                  if (key === 'exp') return `经验值: +${value}`;
                  if (key === 'attributePoints') return `属性点: +${value}`;
                  return '';
                }).join(' | ') : ''}
              </div>
            </div>

            <div style="margin-left: 15px;">
              ${isCompleted ? 
                '<div style="padding: 10px 20px; background: #666; border-radius: 5px; color: white; font-weight: bold;">已完成</div>' :
                canComplete ?
                `<button class="complete-quest-btn" data-quest-id="${quest.id}" style="padding: 10px 20px; background: #00ff00; border: none; color: #000; cursor: pointer; border-radius: 5px; font-weight: bold;">领取</button>` :
                '<div style="padding: 10px 20px; background: #333; border-radius: 5px; color: #999;">进行中</div>'
              }
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 绑定完成按钮
    container.querySelectorAll('.complete-quest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const questId = btn.getAttribute('data-quest-id');
        QuestsUI.completeQuest(questId);
      });
    });
  }

  static async completeQuest(questId) {
    const user = window.gameState.getUser();
    if (!user) return;

    try {
      const result = await window.networkManager.completeQuest(user.id, questId);
      
      if (result.success) {
        window.uiManager.showNotification('任务完成！');
        
        // 更新用户数据并保存到localStorage
        if (result.user) {
          window.gameState.setUser(result.user);
        } else {
          // 如果没有返回用户数据，则重新获取
          const profile = await window.networkManager.getProfile(user.id);
          window.gameState.setUser(profile.user);
        }
        
        // 如果升级了，显示升级信息
        if (result.leveled) {
          window.uiManager.showLevelUpNotification(result);
        }
        
        // 显示奖励
        window.uiManager.showRewards(result.rewards);
        
        // 刷新所有UI（包括顶部用户栏）
        window.uiManager.refreshCurrentView();
        
        // 重新加载任务列表
        const activeTab = document.querySelector('.quest-tab-btn.active');
        if (activeTab) {
          QuestsUI.loadQuests(activeTab.getAttribute('data-type'));
        }
      }
    } catch (error) {
      alert(error.message);
    }
  }

  static async loadAchievements() {
    const user = window.gameState.getUser();
    if (!user) return;

    try {
      const result = await window.networkManager.getAchievements(user.id);
      
      if (result.success) {
        QuestsUI.renderAchievements(result.allAchievements, result.completedAchievements);
      }
    } catch (error) {
      console.error('加载成就失败:', error);
    }
  }

  static renderAchievements(allAchievements, completedAchievements) {
    const container = document.getElementById('achievements-container');
    
    // 如果不在任务页面，元素不存在，直接返回
    if (!container) {
      return;
    }
    
    if (!allAchievements || allAchievements.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无成就</div>';
      return;
    }

    // 只显示前5个成就
    const achievements = allAchievements.slice(0, 5);

    container.innerHTML = achievements.map(achievement => {
      const completed = completedAchievements?.find(a => a.id === achievement.id);
      const isCompleted = !!completed;
      const canClaim = completed && !completed.claimed;

      return `
        <div class="achievement-item" style="background: #2a2a3e; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; ${isCompleted ? 'border-left: 4px solid #00ff00;' : ''}">
          <div style="flex: 1;">
            <div style="font-size: 14px; color: #667eea; margin-bottom: 3px;">${achievement.name}</div>
            <div style="font-size: 12px; color: #999;">${achievement.description}</div>
          </div>
          <div>
            ${isCompleted ?
              canClaim ?
                `<button class="claim-achievement-btn" data-achievement-id="${achievement.id}" style="padding: 8px 15px; background: #00ff00; border: none; color: #000; cursor: pointer; border-radius: 5px; font-weight: bold; font-size: 12px;">领取</button>` :
                '<div style="color: #00ff00; font-size: 12px;">✓ 已完成</div>' :
              '<div style="color: #666; font-size: 12px;">未完成</div>'
            }
          </div>
        </div>
      `;
    }).join('');

    // 绑定领取按钮
    container.querySelectorAll('.claim-achievement-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const achievementId = btn.getAttribute('data-achievement-id');
        QuestsUI.claimAchievement(achievementId);
      });
    });
  }

  static async claimAchievement(achievementId) {
    const user = window.gameState.getUser();
    if (!user) return;

    try {
      const result = await window.networkManager.claimAchievement(user.id, achievementId);
      
      if (result.success) {
        window.uiManager.showNotification('成就奖励已领取');
        
        // 更新用户数据并保存到localStorage
        if (result.user) {
          window.gameState.setUser(result.user);
        }
        
        // 如果升级了，显示升级信息
        if (result.leveled) {
          window.uiManager.showLevelUpNotification(result);
        }
        
        // 显示奖励
        window.uiManager.showRewards(result.rewards);
        
        // 刷新所有UI（包括顶部用户栏）
        window.uiManager.refreshCurrentView();
        
        // 刷新成就列表
        QuestsUI.loadAchievements();
      }
    } catch (error) {
      alert(error.message);
    }
  }
}

