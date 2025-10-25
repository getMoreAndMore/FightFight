/**
 * 好友系统UI组件
 */
export class FriendsUI {
  static render(container) {
    const user = window.gameState.getUser();
    if (!user) return;

    container.innerHTML = `
      <div class="friends-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">好友系统</h2>
        
        <!-- 添加好友 -->
        <div class="add-friend" style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">添加好友</h3>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="friend-username" placeholder="输入用户名" style="flex: 1; padding: 10px; background: #1a1a2e; border: 1px solid #667eea; color: white; border-radius: 5px;">
            <button id="add-friend-btn" style="padding: 10px 20px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px; font-weight: bold;">添加</button>
          </div>
        </div>

        <!-- 好友列表 -->
        <div class="friends-list" style="background: #2a2a3e; padding: 15px; border-radius: 8px;">
          <h3 style="margin-bottom: 10px;">好友列表 <span id="friend-count" style="color: #667eea;">(0)</span></h3>
          <div id="friends-container" style="max-height: 400px; overflow-y: auto;">
            <div style="text-align: center; padding: 20px; color: #999;">加载中...</div>
          </div>
        </div>

        <!-- 好友请求 -->
        <div class="friend-requests" style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin-bottom: 10px;">好友请求</h3>
          <div id="requests-container">
            <div style="text-align: center; padding: 20px; color: #999;">暂无请求</div>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    document.getElementById('add-friend-btn').addEventListener('click', () => {
      FriendsUI.addFriend();
    });

    // 加载好友列表
    FriendsUI.loadFriends();

    // 设置网络事件监听
    FriendsUI.setupNetworkListeners();
  }

  static async loadFriends() {
    window.networkManager.getFriendList();
  }

  static setupNetworkListeners() {
    // 好友列表
    window.networkManager.on('friend:list', (data) => {
      FriendsUI.renderFriends(data.friends);
    });

    // 收到好友请求
    window.networkManager.on('friend:request:received', (data) => {
      window.uiManager.showNotification(`${data.from.username} 请求添加你为好友`);
      FriendsUI.addFriendRequest(data);
    });

    // 好友请求已发送
    window.networkManager.on('friend:request:sent', () => {
      window.uiManager.showNotification('好友请求已发送');
      document.getElementById('friend-username').value = '';
    });

    // 好友接受成功
    window.networkManager.on('friend:accept:success', () => {
      window.uiManager.showNotification('已成为好友');
      FriendsUI.loadFriends();
    });

    // 好友上线/下线
    window.networkManager.on('friend:online', (data) => {
      FriendsUI.updateFriendOnlineStatus(data.userId, data.isOnline);
    });
  }

  static addFriend() {
    const username = document.getElementById('friend-username').value.trim();
    
    if (!username) {
      alert('请输入用户名');
      return;
    }

    window.networkManager.sendFriendRequest(username);
  }

  static renderFriends(friends) {
    const container = document.getElementById('friends-container');
    const countEl = document.getElementById('friend-count');

    // 如果不在好友页面，元素不存在，直接返回
    if (!container || !countEl) {
      return;
    }

    if (!friends || friends.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无好友</div>';
      countEl.textContent = '(0)';
      return;
    }

    countEl.textContent = `(${friends.length})`;

    container.innerHTML = friends.map(friend => `
      <div class="friend-item" data-friend-id="${friend.id}" style="padding: 12px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 16px; margin-bottom: 5px;">
            ${friend.username}
            <span class="online-status" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${friend.isOnline ? '#00ff00' : '#666'}; margin-left: 8px;"></span>
          </div>
          <div style="font-size: 12px; color: #999;">
            等级: ${friend.level} | 战力: ${friend.power || 0}
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="invite-pvp-btn" data-friend-id="${friend.id}" style="padding: 8px 12px; background: #ff6b6b; border: none; color: white; cursor: pointer; border-radius: 5px; font-size: 12px;">
            ⚔️ 对战
          </button>
          <button class="chat-btn" data-friend-id="${friend.id}" style="padding: 8px 12px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px; font-size: 12px;">
            💬 聊天
          </button>
          <button class="remove-friend-btn" data-friend-id="${friend.id}" style="padding: 8px 12px; background: #ff4444; border: none; color: white; cursor: pointer; border-radius: 5px; font-size: 12px;">
            ❌
          </button>
        </div>
      </div>
    `).join('');

    // 绑定按钮事件
    container.querySelectorAll('.invite-pvp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const friendId = btn.getAttribute('data-friend-id');
        FriendsUI.invitePvp(friendId);
      });
    });

    container.querySelectorAll('.remove-friend-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const friendId = btn.getAttribute('data-friend-id');
        if (confirm('确定要删除这个好友吗？')) {
          FriendsUI.removeFriend(friendId);
        }
      });
    });
  }

  static addFriendRequest(request) {
    const container = document.getElementById('requests-container');
    
    // 如果不在好友页面，元素不存在，直接返回
    if (!container) {
      return;
    }
    
    const requestEl = document.createElement('div');
    requestEl.className = 'friend-request';
    requestEl.style.cssText = 'padding: 12px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;';
    
    requestEl.innerHTML = `
      <div>
        <div style="font-size: 16px;">${request.from.username}</div>
        <div style="font-size: 12px; color: #999;">等级: ${request.from.level}</div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="accept-request-btn" data-request-id="${request.requestId}" style="padding: 8px 15px; background: #00ff00; border: none; color: #000; cursor: pointer; border-radius: 5px; font-weight: bold;">接受</button>
        <button class="reject-request-btn" data-request-id="${request.requestId}" style="padding: 8px 15px; background: #ff4444; border: none; color: white; cursor: pointer; border-radius: 5px;">拒绝</button>
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(requestEl);

    // 绑定按钮
    requestEl.querySelector('.accept-request-btn').addEventListener('click', () => {
      window.networkManager.acceptFriendRequest(request.requestId);
      requestEl.remove();
      
      if (container.children.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无请求</div>';
      }
    });

    requestEl.querySelector('.reject-request-btn').addEventListener('click', () => {
      requestEl.remove();
      if (container.children.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无请求</div>';
      }
    });
  }

  static invitePvp(friendId) {
    window.networkManager.invitePvp(friendId);
    window.uiManager.showNotification('已发送对战邀请');
  }

  static removeFriend(friendId) {
    window.networkManager.removeFriend(friendId);
    FriendsUI.loadFriends();
  }

  static updateFriendOnlineStatus(userId, isOnline) {
    const friendItem = document.querySelector(`[data-friend-id="${userId}"]`);
    if (friendItem) {
      const statusDot = friendItem.querySelector('.online-status');
      if (statusDot) {
        statusDot.style.background = isOnline ? '#00ff00' : '#666';
      }
    }
  }
}

