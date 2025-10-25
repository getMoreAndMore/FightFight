/**
 * 排行榜UI组件
 */
export class RankingUI {
  static render(container) {
    const user = window.gameState.getUser();
    if (!user) return;

    container.innerHTML = `
      <div class="ranking-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">排行榜</h2>
        
        <!-- 切换标签 -->
        <div class="ranking-tabs" style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button class="ranking-tab-btn active" data-type="global" style="flex: 1; padding: 12px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px; font-weight: bold;">全服排行</button>
          <button class="ranking-tab-btn" data-type="friends" style="flex: 1; padding: 12px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px; font-weight: bold;">好友排行</button>
        </div>

        <!-- 我的排名 -->
        <div id="my-rank" style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px; color: #667eea;">我的排名</h3>
          <div style="text-align: center; padding: 20px;">加载中...</div>
        </div>

        <!-- 排行榜列表 -->
        <div class="ranking-list" style="background: #2a2a3e; padding: 15px; border-radius: 8px;">
          <h3 style="margin-bottom: 15px;">排行榜</h3>
          <div id="ranking-container" style="max-height: 500px; overflow-y: auto;">
            <div style="text-align: center; padding: 20px;">加载中...</div>
          </div>
        </div>
      </div>
    `;

    // 标签切换
    document.querySelectorAll('.ranking-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        
        document.querySelectorAll('.ranking-tab-btn').forEach(b => {
          b.style.background = '#333';
          b.classList.remove('active');
        });
        btn.style.background = '#667eea';
        btn.classList.add('active');

        RankingUI.loadRanking(type);
      });
    });

    // 默认加载全服排行
    RankingUI.loadRanking('global');
  }

  static async loadRanking(type = 'global') {
    const user = window.gameState.getUser();
    if (!user) return;

    try {
      const result = await window.networkManager.getRanking(user.id, type);
      
      if (result.success) {
        RankingUI.renderRanking(result.ranking, type);
        RankingUI.renderMyRank(result.userRank);
      }
    } catch (error) {
      console.error('加载排行榜失败:', error);
    }
  }

  static renderMyRank(userRank) {
    const container = document.getElementById('my-rank');
    
    // 如果不在排行榜页面，元素不存在，直接返回
    if (!container) {
      return;
    }
    
    const contentDiv = container.querySelector('div');
    if (!contentDiv) {
      return;
    }
    
    if (!userRank) {
      contentDiv.innerHTML = '未上榜';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const medal = userRank.rank <= 3 ? medals[userRank.rank - 1] : '';

    contentDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 24px; font-weight: bold; color: #667eea;">
          ${medal} 第 ${userRank.rank} 名
        </div>
        <div style="text-align: right;">
          <div style="font-size: 18px; color: #ff6b6b;">战力: ${userRank.power}</div>
          <div style="font-size: 14px; color: #999;">等级: ${userRank.level}</div>
        </div>
      </div>
    `;
  }

  static renderRanking(ranking, type) {
    const container = document.getElementById('ranking-container');
    
    // 如果不在排行榜页面，元素不存在，直接返回
    if (!container) {
      return;
    }
    
    if (!ranking || ranking.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无数据</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    container.innerHTML = `
      <div class="ranking-header" style="display: grid; grid-template-columns: 60px 1fr 80px 80px; padding: 10px; border-bottom: 2px solid #667eea; font-weight: bold; color: #667eea;">
        <div>排名</div>
        <div>玩家</div>
        <div style="text-align: center;">等级</div>
        <div style="text-align: right;">战力</div>
      </div>
      ${ranking.map((entry, index) => {
        const rank = index + 1;
        const medal = rank <= 3 ? medals[rank - 1] : `#${rank}`;
        const user = window.gameState.getUser();
        const isCurrentUser = entry.userId === user?.id;
        
        return `
          <div class="ranking-row" style="display: grid; grid-template-columns: 60px 1fr 80px 80px; padding: 12px; border-bottom: 1px solid #333; ${isCurrentUser ? 'background: rgba(102, 126, 234, 0.2);' : ''}">
            <div style="font-size: 18px; font-weight: bold;">${medal}</div>
            <div>
              <div style="font-size: 16px;">${entry.username} ${isCurrentUser ? '(我)' : ''}</div>
              <div style="font-size: 12px; color: #999;">胜场: ${entry.pvpWins || 0}</div>
            </div>
            <div style="text-align: center; color: #667eea;">${entry.level}</div>
            <div style="text-align: right; color: #ff6b6b; font-weight: bold;">${entry.power}</div>
          </div>
        `;
      }).join('')}
    `;
  }
}

