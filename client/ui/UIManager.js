/**
 * UI 管理器
 * 管理右侧面板的所有UI元素
 */
export class UIManager {
  constructor() {
    this.panel = document.getElementById('ui-panel');
    this.currentView = null;
    
    // 初始化事件监听
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 监听游戏状态更新
    window.gameState.on('user:updated', () => {
      if (this.currentView) {
        this.showView(this.currentView);
      }
    });

    window.gameState.on('inventory:updated', () => {
      if (this.currentView === 'inventory') {
        this.showInventory();
      }
    });

    window.gameState.on('skills:updated', () => {
      if (this.currentView === 'skills') {
        this.showSkills();
      }
    });

    window.gameState.on('friends:updated', () => {
      if (this.currentView === 'friends') {
        this.showFriends();
      }
    });

    window.gameState.on('rankings:updated', () => {
      if (this.currentView === 'ranking') {
        this.showRanking();
      }
    });
  }

  // 显示登录界面
  showLoginScreen() {
    this.panel.innerHTML = `
      <div class="login-screen" style="padding: 20px;">
        <h1 style="color: #667eea; text-align: center; margin-bottom: 30px;">FightFight RPG</h1>
        
        <div class="tabs" style="display: flex; margin-bottom: 20px;">
          <button id="login-tab" class="tab-btn active" style="flex: 1; padding: 10px; background: #667eea; border: none; color: white; cursor: pointer;">登录</button>
          <button id="register-tab" class="tab-btn" style="flex: 1; padding: 10px; background: #333; border: none; color: white; cursor: pointer;">注册</button>
        </div>

        <div id="login-form" class="form-container">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">用户名</label>
            <input type="text" id="login-username" style="width: 100%; padding: 10px; background: #2a2a3e; border: 1px solid #667eea; color: white;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">密码</label>
            <input type="password" id="login-password" style="width: 100%; padding: 10px; background: #2a2a3e; border: 1px solid #667eea; color: white;">
          </div>
          <button id="login-btn" style="width: 100%; padding: 12px; background: #667eea; border: none; color: white; font-size: 16px; cursor: pointer; border-radius: 5px;">登录</button>
        </div>

        <div id="register-form" class="form-container" style="display: none;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">用户名</label>
            <input type="text" id="register-username" style="width: 100%; padding: 10px; background: #2a2a3e; border: 1px solid #667eea; color: white;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">密码</label>
            <input type="password" id="register-password" style="width: 100%; padding: 10px; background: #2a2a3e; border: 1px solid #667eea; color: white;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">邮箱（可选）</label>
            <input type="email" id="register-email" style="width: 100%; padding: 10px; background: #2a2a3e; border: 1px solid #667eea; color: white;">
          </div>
          <button id="register-btn" style="width: 100%; padding: 12px; background: #667eea; border: none; color: white; font-size: 16px; cursor: pointer; border-radius: 5px;">注册</button>
        </div>

        <div id="message" style="margin-top: 20px; padding: 10px; border-radius: 5px; display: none;"></div>
      </div>
    `;

    // 标签切换
    document.getElementById('login-tab').addEventListener('click', () => {
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('register-form').style.display = 'none';
      document.getElementById('login-tab').classList.add('active');
      document.getElementById('register-tab').classList.remove('active');
      document.getElementById('login-tab').style.background = '#667eea';
      document.getElementById('register-tab').style.background = '#333';
    });

    document.getElementById('register-tab').addEventListener('click', () => {
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('register-form').style.display = 'block';
      document.getElementById('login-tab').classList.remove('active');
      document.getElementById('register-tab').classList.add('active');
      document.getElementById('login-tab').style.background = '#333';
      document.getElementById('register-tab').style.background = '#667eea';
    });

    // 登录按钮
    document.getElementById('login-btn').addEventListener('click', () => {
      this.handleLogin();
    });

    // 注册按钮
    document.getElementById('register-btn').addEventListener('click', () => {
      this.handleRegister();
    });

    // 回车登录
    document.getElementById('login-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  async handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      this.showMessage('请输入用户名和密码', 'error');
      return;
    }

    try {
      this.showMessage('登录中...', 'info');
      
      const result = await window.networkManager.login(username, password);
      
      if (result.success) {
        window.gameState.setUser(result.user);
        window.gameState.setSessionId(result.sessionId);
        
        // 连接 Socket
        window.networkManager.connectSocket();
        
        // Socket 连接成功后发送登录事件
        window.networkManager.on('socket:connected', () => {
          window.networkManager.socketLogin(result.user.id, result.sessionId);
        });
        
        this.showMessage('登录成功！', 'success');
        
        setTimeout(() => {
          this.showMainUI();
        }, 500);
      }
    } catch (error) {
      this.showMessage(error.message || '登录失败', 'error');
    }
  }

  async handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('register-email').value.trim();

    if (!username || !password) {
      this.showMessage('请输入用户名和密码', 'error');
      return;
    }

    if (username.length < 3) {
      this.showMessage('用户名至少3个字符', 'error');
      return;
    }

    if (password.length < 6) {
      this.showMessage('密码至少6个字符', 'error');
      return;
    }

    try {
      this.showMessage('注册中...', 'info');
      
      const result = await window.networkManager.register(username, password, email);
      
      if (result.success) {
        this.showMessage('注册成功！请登录', 'success');
        
        // 切换到登录表单
        setTimeout(() => {
          document.getElementById('login-tab').click();
          document.getElementById('login-username').value = username;
        }, 1000);
      }
    } catch (error) {
      this.showMessage(error.message || '注册失败', 'error');
    }
  }

  showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    const colors = {
      success: '#00ff00',
      error: '#ff0000',
      info: '#667eea'
    };
    
    messageEl.style.background = colors[type] || colors.info;
    messageEl.style.color = '#000';
  }

  // 显示主UI
  showMainUI() {
    const user = window.gameState.getUser();
    this.panel.innerHTML = `
      <div class="main-ui" style="height: 100%; display: flex; flex-direction: column;">
        <!-- 用户信息栏 -->
        <div class="user-bar" style="padding: 10px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 16px; font-weight: bold;">${user ? user.username : ''}</div>
            <div style="font-size: 12px; opacity: 0.9;">Lv.${user ? user.level : 1} | 战力: ${user ? user.power || 0 : 0}</div>
          </div>
          <button id="logout-btn" style="padding: 5px 15px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; cursor: pointer; border-radius: 5px; font-size: 13px;">登出</button>
        </div>
      
        <!-- 顶部导航 -->
        <div class="nav-bar" style="padding: 15px; background: #1a1a2e; border-bottom: 2px solid #667eea;">
          <div class="nav-buttons" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="nav-btn" data-view="attributes" style="padding: 10px; background: #667eea; border: none; color: white; cursor: pointer; border-radius: 5px;">属性</button>
            <button class="nav-btn" data-view="inventory" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">背包</button>
            <button class="nav-btn" data-view="skills" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">技能</button>
            <button class="nav-btn" data-view="scenes" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">场景</button>
            <button class="nav-btn" data-view="friends" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">好友</button>
            <button class="nav-btn" data-view="ranking" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">排行</button>
            <button class="nav-btn" data-view="quests" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">任务</button>
            <button class="nav-btn" data-view="pvp" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">PVP</button>
            <button class="nav-btn" data-view="settings" style="padding: 10px; background: #333; border: none; color: white; cursor: pointer; border-radius: 5px;">设置</button>
          </div>
        </div>
        
        <!-- 内容区域 -->
        <div id="content-area" style="flex: 1; padding: 15px; overflow-y: auto;">
          <!-- 动态内容 -->
        </div>
      </div>
    `;

    // 绑定登出按钮
    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('确定要登出吗？')) {
        this.handleLogout();
      }
    });

    // 绑定导航按钮事件
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.showView(view);
        
        // 更新按钮样式
        document.querySelectorAll('.nav-btn').forEach(b => {
          b.style.background = '#333';
        });
        btn.style.background = '#667eea';
      });
    });

    // 恢复上次的视图，或默认显示属性页面
    const lastView = window.gameState.getCurrentView() || 'attributes';
    this.showView(lastView);
    
    // 高亮对应按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.getAttribute('data-view') === lastView) {
        btn.style.background = '#667eea';
      } else {
        btn.style.background = '#333';
      }
    });
  }

  // 处理登出
  handleLogout() {
    // 断开 Socket 连接
    if (window.networkManager) {
      window.networkManager.disconnectSocket();
    }
    
    // 清除游戏状态
    window.gameState.logout();
    
    // 显示登录界面
    this.showLoginScreen();
    
    this.showNotification('已登出');
  }

  // 刷新当前视图
  refreshCurrentView() {
    // 先更新用户信息栏
    this.updateUserBar();
    
    // 然后刷新当前视图
    if (this.currentView) {
      this.showView(this.currentView);
    }
  }

  // 更新顶部用户信息栏
  updateUserBar() {
    const user = window.gameState.getUser();
    if (!user) return;
    
    const userBar = document.querySelector('.user-bar');
    if (!userBar) return;
    
    userBar.innerHTML = `
      <div>
        <div style="font-size: 16px; font-weight: bold;">${user.username}</div>
        <div style="font-size: 12px; opacity: 0.9;">Lv.${user.level} | 战力: ${user.power || 0}</div>
      </div>
      <button id="logout-btn" style="padding: 5px 15px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; cursor: pointer; border-radius: 5px; font-size: 13px;">登出</button>
    `;
    
    // 重新绑定登出按钮
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.handleLogout();
    });
  }

  showView(view) {
    this.currentView = view;
    
    // 保存当前视图到游戏状态
    window.gameState.setCurrentView(view);
    
    switch (view) {
      case 'attributes':
        this.showAttributes();
        break;
      case 'inventory':
        this.showInventory();
        break;
      case 'skills':
        this.showSkills();
        break;
      case 'scenes':
        this.showScenes();
        break;
      case 'friends':
        this.showFriends();
        break;
      case 'ranking':
        this.showRanking();
        break;
      case 'quests':
        this.showQuests();
        break;
      case 'pvp':
        this.showPVP();
        break;
      case 'settings':
        this.showSettings();
        break;
    }
  }

  async showAttributes() {
    const user = window.gameState.getUser();
    if (!user) return;

    // 使用当前用户数据，不要每次都刷新（避免无限循环）
    const latestUser = user;
    
    const expProgress = window.gameState.getExpProgress();
    const nextLevelExp = window.gameState.getExpForNextLevel();

    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="attributes-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">角色属性</h2>
        
        <!-- 基础信息 -->
        <div class="info-card" style="background: #2a2a3e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">${latestUser.username}</h3>
          <div style="margin-bottom: 10px;">
            <span>等级: <strong style="color: #667eea;">${latestUser.level}</strong></span>
            <span style="margin-left: 20px;">战力: <strong class="power-value" style="color: #ff6b6b;">${latestUser.power || 0}</strong></span>
          </div>
          <div style="margin-bottom: 5px;">
            <div style="font-size: 12px; margin-bottom: 5px;">经验值: ${latestUser.experience} / ${nextLevelExp}</div>
            <div style="background: #333; height: 20px; border-radius: 10px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${expProgress}%; transition: width 0.3s;"></div>
            </div>
          </div>
          <div style="margin-top: 10px;">
            <span>可用属性点: <strong class="available-points" style="color: #00ff00;">${latestUser.attributePoints}</strong></span>
          </div>
        </div>

        <!-- 属性列表 -->
        <div class="attributes-list">
          ${this.renderAttribute('strength', '力量', latestUser.attributes.strength, latestUser.id)}
          ${this.renderAttribute('agility', '敏捷', latestUser.attributes.agility, latestUser.id)}
          ${this.renderAttribute('intelligence', '智力', latestUser.attributes.intelligence, latestUser.id)}
          ${this.renderAttribute('endurance', '耐力', latestUser.attributes.endurance, latestUser.id)}
        </div>

        <!-- 每日签到 -->
        <div style="margin-top: 20px;">
          <button id="checkin-btn" style="width: 100%; padding: 12px; background: #667eea; border: none; color: white; font-size: 16px; cursor: pointer; border-radius: 5px;">
            📅 每日签到
          </button>
          ${latestUser.dailyCheckin ? `<div id="checkin-info" style="text-align: center; margin-top: 10px; font-size: 12px;">连续签到: ${latestUser.dailyCheckin.consecutiveDays} 天</div>` : ''}
        </div>
      </div>
    `;

    // 绑定加点按钮
    const addButtons = document.querySelectorAll('.add-attr-btn');
    
    addButtons.forEach(btn => {
      const attr = btn.getAttribute('data-attr');
      const userId = btn.getAttribute('data-user');
      
      btn.addEventListener('click', (e) => {
        // 添加点击动画效果
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = 'scale(1)';
        }, 100);
        
        this.addAttribute(userId, attr);
      });
    });

    // 签到按钮
    document.getElementById('checkin-btn').addEventListener('click', () => {
      this.dailyCheckin(latestUser.id);
    });
  }

  renderAttribute(key, name, value, userId) {
    return `
      <div class="attr-row" style="background: #2a2a3e; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 16px;">${name}</span>
          <span class="attr-value" style="margin-left: 15px; color: #667eea; font-size: 20px; font-weight: bold;">${value}</span>
        </div>
        <button class="add-attr-btn" data-attr="${key}" data-user="${userId}" style="padding: 8px 15px; background: #00ff00; border: none; color: #000; font-weight: bold; cursor: pointer; border-radius: 5px; transition: transform 0.1s;">+1</button>
      </div>
    `;
  }

  async addAttribute(userId, attribute) {
    try {
      // 先更新UI显示（乐观更新）
      const user = window.gameState.getUser();
      if (!user) {
        return;
      }
      
      // 检查属性点是否足够
      if (user.attributePoints < 1) {
        alert('属性点不足');
        return;
      }
      
      // 立即更新本地数据
      const oldValue = user.attributes[attribute] || 0;
      const oldPoints = user.attributePoints;
      
      user.attributes[attribute] = oldValue + 1;
      user.attributePoints -= 1;
      
      // 更新页面显示
      this.updateAttributeDisplay(attribute, user.attributes[attribute]);
      this.updateAttributePointsDisplay(user.attributePoints);
      
      // 发送请求到服务器
      const result = await window.networkManager.addAttribute(userId, attribute, 1);
      
      if (result.success) {
        // 服务器确认成功，更新完整的用户数据（但不触发重新渲染）
        window.gameState.user = result.user;
        this.showNotification(`${this.getAttributeName(attribute)} +1`);
        
        // 更新战力显示
        if (result.user.power) {
          this.updatePowerDisplay(result.user.power);
        }
        
        // 更新顶部用户信息栏
        this.updateUserBar();
      } else {
        // 如果失败，回滚UI
        user.attributes[attribute] = oldValue;
        user.attributePoints = oldPoints;
        this.updateAttributeDisplay(attribute, oldValue);
        this.updateAttributePointsDisplay(oldPoints);
        alert('加点失败');
      }
    } catch (error) {
      // 如果出错，回滚UI
      const user = window.gameState.getUser();
      if (user) {
        // 刷新页面数据
        try {
          const result = await window.networkManager.getProfile(userId);
          if (result.success) {
            window.gameState.user = result.user;
            // 只更新显示，不重新渲染整个页面
            this.updateAttributeDisplay(attribute, result.user.attributes[attribute]);
            this.updateAttributePointsDisplay(result.user.attributePoints);
          }
        } catch (e) {
          console.error('获取用户数据失败:', e);
        }
      }
      alert(error.message || '加点失败');
    }
  }
  
  getAttributeName(key) {
    const names = {
      strength: '力量',
      agility: '敏捷',
      intelligence: '智力',
      endurance: '耐力'
    };
    return names[key] || key;
  }

  // 更新单个属性值的显示
  updateAttributeDisplay(attributeKey, newValue) {
    // 找到对应属性的显示元素并更新
    const attrRows = document.querySelectorAll('.attr-row');
    
    attrRows.forEach(row => {
      const btn = row.querySelector(`[data-attr="${attributeKey}"]`);
      if (btn) {
        const valueSpan = row.querySelector('.attr-value');
        if (valueSpan) {
          valueSpan.textContent = newValue;
          
          // 添加动画效果
          valueSpan.style.transition = 'all 0.3s';
          valueSpan.style.transform = 'scale(1.2)';
          valueSpan.style.color = '#00ff00';
          
          setTimeout(() => {
            valueSpan.style.transform = 'scale(1)';
            valueSpan.style.color = '#667eea';
          }, 300);
        }
      }
    });
  }

  // 更新可用属性点显示
  updateAttributePointsDisplay(points) {
    const pointsDisplay = document.querySelector('.available-points');
    if (pointsDisplay) {
      pointsDisplay.textContent = points;
      
      // 添加动画效果
      pointsDisplay.style.transition = 'all 0.3s';
      pointsDisplay.style.transform = 'scale(1.2)';
      
      setTimeout(() => {
        pointsDisplay.style.transform = 'scale(1)';
      }, 300);
    }
  }

  // 更新战力显示
  updatePowerDisplay(power) {
    const powerDisplay = document.querySelector('.power-value');
    if (powerDisplay) {
      powerDisplay.textContent = power || 0;
    }
  }

  async dailyCheckin(userId) {
    try {
      const result = await window.networkManager.checkin(userId);
      
      if (result.success) {
        this.showNotification(result.message);
        
        // 刷新用户数据（不触发事件）
        const profile = await window.networkManager.getProfile(userId);
        window.gameState.user = profile.user;
        
        // 更新顶部用户信息栏
        this.updateUserBar();
        
        // 重新渲染属性页面以显示最新的签到信息
        this.showAttributes();
      }
    } catch (error) {
      alert(error.message);
    }
  }

  showInventory() {
    const user = window.gameState.getUser();
    if (!user) return;

    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="inventory-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">背包</h2>
        
        <div style="margin-bottom: 15px;">
          <span>格子数: ${user.inventory.items.length} / ${user.inventory.slots}</span>
        </div>

        <div class="inventory-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
          ${user.inventory.items.map(item => this.renderItem(item, user.id)).join('')}
          ${Array(user.inventory.slots - user.inventory.items.length).fill(0).map(() => 
            `<div class="empty-slot" style="aspect-ratio: 1; background: #2a2a3e; border: 2px dashed #667eea; border-radius: 8px;"></div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  renderItem(item, userId) {
    const qualityColors = {
      common: '#ffffff',
      uncommon: '#1eff00',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000'
    };

    return `
      <div class="item-slot" data-item="${item.instanceId}" style="aspect-ratio: 1; background: #2a2a3e; border: 2px solid ${qualityColors[item.quality] || '#667eea'}; border-radius: 8px; padding: 5px; cursor: pointer; position: relative;">
        <div style="font-size: 12px; text-align: center; color: ${qualityColors[item.quality]};">${item.name}</div>
        ${item.quantity > 1 ? `<div style="position: absolute; bottom: 5px; right: 5px; font-size: 10px; background: #000; padding: 2px 5px; border-radius: 3px;">×${item.quantity}</div>` : ''}
      </div>
    `;
  }

  showSkills() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="skills-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">技能系统</h2>
        <p style="text-align: center; padding: 40px;">技能系统开发中...</p>
      </div>
    `;
  }

  showScenes() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="scenes-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">场景探索</h2>
        <p style="text-align: center; padding: 40px;">场景系统开发中...</p>
      </div>
    `;
  }

  showFriends() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="friends-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">好友系统</h2>
        <p style="text-align: center; padding: 40px;">好友系统开发中...</p>
      </div>
    `;
  }

  showRanking() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="ranking-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">排行榜</h2>
        <p style="text-align: center; padding: 40px;">排行榜开发中...</p>
      </div>
    `;
  }

  showQuests() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="quests-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">任务系统</h2>
        <p style="text-align: center; padding: 40px;">任务系统开发中...</p>
      </div>
    `;
  }

  showPVP() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="pvp-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">PVP 对战</h2>
        
        <div style="margin-top: 40px; text-align: center;">
          <button id="match-pvp-btn" style="padding: 20px 40px; background: #ff6b6b; border: none; color: white; font-size: 20px; cursor: pointer; border-radius: 10px; font-weight: bold;">
            ⚔️ 开始匹配
          </button>
        </div>

        <div id="match-status" style="margin-top: 30px; text-align: center; font-size: 18px;"></div>
      </div>
    `;

    document.getElementById('match-pvp-btn').addEventListener('click', () => {
      this.startPvpMatch();
    });
  }

  startPvpMatch() {
    const statusEl = document.getElementById('match-status');
    statusEl.textContent = '正在匹配中...';
    statusEl.style.color = '#ffff00';

    window.networkManager.matchPvp();

    // 监听匹配结果
    window.networkManager.on('pvp:start', (data) => {
      statusEl.textContent = '找到对手！';
      statusEl.style.color = '#00ff00';

      // 启动战斗场景
      setTimeout(() => {
        window.game.scene.stop('GameScene');
        window.game.scene.start('BattleScene', data);
      }, 1000);
    });

    window.networkManager.on('pvp:match:timeout', () => {
      statusEl.textContent = '匹配超时，请重试';
      statusEl.style.color = '#ff0000';
    });
  }

  showSettings() {
    const content = document.getElementById('content-area');
    content.innerHTML = `
      <div class="settings-view">
        <h2 style="color: #667eea; margin-bottom: 20px;">设置</h2>
        
        <div style="margin-top: 40px;">
          <button id="logout-btn" style="width: 100%; padding: 12px; background: #ff4444; border: none; color: white; font-size: 16px; cursor: pointer; border-radius: 5px;">
            退出登录
          </button>
        </div>
      </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('确定要退出登录吗？')) {
        this.logout();
      }
    });
  }

  logout() {
    window.networkManager.disconnect();
    window.gameState.logout();
    this.showLoginScreen();
    window.game.scene.stop('GameScene');
    window.game.scene.start('MainMenuScene');
  }

  // 通知提示
  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(102, 126, 234, 0.95);
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      font-size: 20px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transition = 'opacity 0.5s';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 2000);
  }

  // 显示对话框
  showDialog(message) {
    alert(message);
  }

  // 显示奖励
  // 显示升级通知
  showLevelUpNotification(levelUpInfo) {
    // 安全地提取属性，提供默认值
    const { 
      newLevel = 0, 
      attributeGains = {}, 
      attributePointsGained = 0, 
      slotsGained = 0, 
      levelsGained = 1 
    } = levelUpInfo || {};
    
    // 如果没有升级信息，直接返回
    if (!newLevel || newLevel === 0) {
      console.warn('升级信息不完整:', levelUpInfo);
      return;
    }
    
    // 创建升级通知面板
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      z-index: 10000;
      min-width: 400px;
      color: white;
      animation: levelUpPop 0.5s ease-out;
    `;
    
    let attributeText = '';
    if (attributeGains.strength > 0) attributeText += `<div>💪 力量 +${attributeGains.strength}</div>`;
    if (attributeGains.agility > 0) attributeText += `<div>⚡ 敏捷 +${attributeGains.agility}</div>`;
    if (attributeGains.intelligence > 0) attributeText += `<div>🧠 智力 +${attributeGains.intelligence}</div>`;
    if (attributeGains.endurance > 0) attributeText += `<div>🛡️ 耐力 +${attributeGains.endurance}</div>`;
    
    // 如果没有属性增加，显示默认文本
    if (!attributeText) {
      attributeText = '<div style="color: #ccc;">所有属性按比例提升</div>';
    }
    
    notification.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h2 style="font-size: 32px; margin: 0 0 20px 0;">升级了！</h2>
        <div style="font-size: 24px; margin-bottom: 20px; color: #ffd700;">
          等级 ${newLevel - levelsGained} → ${newLevel}
        </div>
        
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; margin-bottom: 15px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">属性提升</div>
          <div style="font-size: 16px; line-height: 1.8;">
            ${attributeText}
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-around; margin-top: 15px;">
          <div style="text-align: center;">
            <div style="font-size: 14px; opacity: 0.8;">可用属性点</div>
            <div style="font-size: 24px; color: #00ff00;">+${attributePointsGained}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 14px; opacity: 0.8;">背包格子</div>
            <div style="font-size: 24px; color: #00ff00;">+${slotsGained}</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 添加动画样式
    if (!document.getElementById('levelup-animation-style')) {
      const style = document.createElement('style');
      style.id = 'levelup-animation-style';
      style.textContent = `
        @keyframes levelUpPop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // 3秒后自动关闭
    setTimeout(() => {
      notification.style.transition = 'opacity 0.3s';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showRewards(rewards) {
    let message = '获得奖励：\n';
    if (rewards.exp) {
      message += `经验值: +${rewards.exp}\n`;
    }
    if (rewards.items && rewards.items.length > 0) {
      message += `道具: ${rewards.items.map(i => i.name).join(', ')}`;
    }
    this.showNotification(message);
  }
}

