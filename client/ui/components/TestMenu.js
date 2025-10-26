/**
 * 🧪 测试菜单 - 仅用于开发测试
 * 
 * 删除方法：
 * 1. 删除此文件 (client/ui/components/TestMenu.js)
 * 2. 在 server/routes/testRoutes.js 中删除测试路由
 * 3. 在 server/index.js 中移除 testRoutes 的引用
 * 4. 在 client/ui/UIManager.js 中移除测试菜单按钮
 */

export class TestMenu {
  static render(container) {
    const user = window.gameState.getUser();
    if (!user) return;

    container.innerHTML = `
      <div class="test-menu">
        <div style="background: #ff4444; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0;">🧪 测试菜单</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px;">⚠️ 仅用于开发测试，生产环境请删除</p>
        </div>

        <!-- 经验和等级 -->
        <div class="test-section" style="background: #2a2a3e; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">📊 经验和等级</h3>
          
          <div style="margin-bottom: 15px;">
            <label>增加经验值：</label>
            <input type="number" id="test-exp" value="100" min="0" style="width: 100px; padding: 8px; background: #1a1a2e; border: 1px solid #667eea; color: white; border-radius: 5px; margin: 0 10px;">
            <button class="test-btn" data-action="add-exp" style="padding: 8px 15px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px;">增加经验</button>
          </div>

          <div style="margin-bottom: 15px;">
            <button class="test-btn" data-action="level-up" style="padding: 8px 15px; background: #00ff00; border: none; color: #000; font-weight: bold; cursor: pointer; border-radius: 5px;">立即升级</button>
            <span style="margin-left: 15px; color: #999; font-size: 12px;">强制升一级</span>
          </div>

          <div>
            <label>设置等级：</label>
            <input type="number" id="test-level" value="5" min="1" max="100" style="width: 100px; padding: 8px; background: #1a1a2e; border: 1px solid #667eea; color: white; border-radius: 5px; margin: 0 10px;">
            <button class="test-btn" data-action="set-level" style="padding: 8px 15px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px;">设置等级</button>
          </div>
        </div>

        <!-- 属性和资源 -->
        <div class="test-section" style="background: #2a2a3e; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">💎 属性和资源</h3>
          
          <div style="margin-bottom: 15px;">
            <label>增加属性点：</label>
            <input type="number" id="test-attr-points" value="10" min="0" style="width: 100px; padding: 8px; background: #1a1a2e; border: 1px solid #667eea; color: white; border-radius: 5px; margin: 0 10px;">
            <button class="test-btn" data-action="add-attr-points" style="padding: 8px 15px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px;">增加属性点</button>
          </div>

          <div style="margin-bottom: 15px;">
            <button class="test-btn" data-action="reset-attrs" style="padding: 8px 15px; background: #ff9800; border: none; color: white; cursor: pointer; border-radius: 5px;">重置所有属性</button>
            <span style="margin-left: 15px; color: #999; font-size: 12px;">恢复初始属性</span>
          </div>

          <div>
            <button class="test-btn" data-action="max-power" style="padding: 8px 15px; background: #00ff00; border: none; color: #000; font-weight: bold; cursor: pointer; border-radius: 5px;">满属性满战力</button>
            <span style="margin-left: 15px; color: #999; font-size: 12px;">所有属性+50</span>
          </div>
        </div>

        <!-- 物品和道具 -->
        <div class="test-section" style="background: #2a2a3e; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">🎒 物品和道具</h3>
          
          <div style="margin-bottom: 15px;">
            <button class="test-btn" data-action="add-items" style="padding: 8px 15px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px;">添加测试道具</button>
            <span style="margin-left: 15px; color: #999; font-size: 12px;">各类道具各1个</span>
          </div>

          <div>
            <button class="test-btn" data-action="clear-inventory" style="padding: 8px 15px; background: #ff4444; border: none; color: white; cursor: pointer; border-radius: 5px;">清空背包</button>
          </div>
        </div>

        <!-- 任务和成就 -->
        <div class="test-section" style="background: #2a2a3e; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">📜 任务和成就</h3>
          
          <div style="margin-bottom: 15px;">
            <button class="test-btn" data-action="complete-all-quests" style="padding: 8px 15px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px;">完成所有任务</button>
          </div>

          <div>
            <button class="test-btn" data-action="unlock-achievements" style="padding: 8px 15px; background: #00ff00; border: none; color: #000; font-weight: bold; cursor: pointer; border-radius: 5px;">解锁所有成就</button>
          </div>
        </div>

        <!-- 数据重置 -->
        <div class="test-section" style="background: #3a1a1a; padding: 20px; border-radius: 8px; border: 2px solid #ff4444;">
          <h3 style="color: #ff4444; margin-bottom: 15px;">⚠️ 危险操作</h3>
          
          <div>
            <button class="test-btn" data-action="reset-user" style="padding: 8px 15px; background: #ff4444; border: none; color: white; cursor: pointer; border-radius: 5px;">重置用户数据</button>
            <span style="margin-left: 15px; color: #ff9999; font-size: 12px;">恢复到初始状态（等级1）</span>
          </div>
        </div>

        <!-- 当前状态显示 -->
        <div style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="color: #667eea; margin-bottom: 10px;">📋 当前状态</h3>
          <div id="test-status" style="font-family: monospace; font-size: 12px; line-height: 1.6;">
            <div>等级: ${user.level}</div>
            <div>经验: ${user.experience}</div>
            <div>属性点: ${user.attributePoints}</div>
            <div>战力: ${user.power}</div>
            <div>力量: ${user.attributes.strength}</div>
            <div>敏捷: ${user.attributes.agility}</div>
            <div>智力: ${user.attributes.intelligence}</div>
            <div>耐力: ${user.attributes.endurance}</div>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    TestMenu.bindEvents();
  }

  static bindEvents() {
    const buttons = document.querySelectorAll('.test-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-action');
        await TestMenu.handleAction(action);
      });
    });
  }

  static async handleAction(action) {
    const user = window.gameState.getUser();
    if (!user) {
      console.error('用户未登录');
      window.uiManager.showNotification('请先登录');
      return;
    }

    try {
      let result;
      
      switch (action) {
        case 'add-exp':
          const exp = parseInt(document.getElementById('test-exp').value) || 100;
          console.log('发送请求: 增加经验', { userId: user.id, experience: exp });
          result = await window.networkManager.request('/test/add-experience', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, experience: exp })
          });
          console.log('收到响应:', result);
          window.uiManager.showNotification(`增加了 ${exp} 经验`);
          break;

        case 'level-up':
          result = await window.networkManager.request('/test/level-up', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('升级成功！');
          break;

        case 'set-level':
          const level = parseInt(document.getElementById('test-level').value) || 5;
          result = await window.networkManager.request('/test/set-level', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, level: level })
          });
          window.uiManager.showNotification(`等级已设置为 ${level}`);
          break;

        case 'add-attr-points':
          const points = parseInt(document.getElementById('test-attr-points').value) || 10;
          result = await window.networkManager.request('/test/add-attribute-points', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, points: points })
          });
          window.uiManager.showNotification(`增加了 ${points} 属性点`);
          break;

        case 'reset-attrs':
          if (!confirm('确定要重置所有属性吗？')) return;
          result = await window.networkManager.request('/test/reset-attributes', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('属性已重置');
          break;

        case 'max-power':
          result = await window.networkManager.request('/test/max-power', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('已设置满属性！');
          break;

        case 'add-items':
          result = await window.networkManager.request('/test/add-items', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('已添加测试道具');
          break;

        case 'clear-inventory':
          if (!confirm('确定要清空背包吗？')) return;
          result = await window.networkManager.request('/test/clear-inventory', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('背包已清空');
          break;

        case 'complete-all-quests':
          result = await window.networkManager.request('/test/complete-all-quests', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('所有任务已完成');
          break;

        case 'unlock-achievements':
          result = await window.networkManager.request('/test/unlock-achievements', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('所有成就已解锁');
          break;

        case 'reset-user':
          if (!confirm('⚠️ 警告：这将重置用户到初始状态（等级1），确定吗？')) return;
          if (!confirm('再次确认：真的要重置吗？')) return;
          result = await window.networkManager.request('/test/reset-user', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
          });
          window.uiManager.showNotification('用户数据已重置');
          break;

        default:
          console.log('未知操作:', action);
          return;
      }

      // 更新用户数据
      if (result && result.success && result.user) {
        window.gameState.setUser(result.user);
        
        // 如果升级了，显示升级信息
        if (result.leveled) {
          window.uiManager.showLevelUpNotification(result);
        }
        
        // 刷新当前页面
        TestMenu.updateStatus();
        window.uiManager.updateUserBar();
      }
    } catch (error) {
      console.error('测试操作失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      
      let errorMsg = '操作失败';
      if (error.message) {
        errorMsg = error.message;
      }
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      window.uiManager.showNotification('操作失败: ' + errorMsg);
    }
  }

  static updateStatus() {
    const user = window.gameState.getUser();
    if (!user) return;

    const statusEl = document.getElementById('test-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div>等级: ${user.level}</div>
        <div>经验: ${user.experience}</div>
        <div>属性点: ${user.attributePoints}</div>
        <div>战力: ${user.power}</div>
        <div>力量: ${user.attributes.strength}</div>
        <div>敏捷: ${user.attributes.agility}</div>
        <div>智力: ${user.attributes.intelligence}</div>
        <div>耐力: ${user.attributes.endurance}</div>
      `;
    }
  }
}


