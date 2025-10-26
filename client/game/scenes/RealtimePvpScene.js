import Phaser from 'phaser';

/**
 * 实时 PVP 对战场景
 * 双方可以同时移动、跳跃和攻击
 */
export class RealtimePvpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RealtimePvpScene' });
  }

  init(data) {
    // 接收对战数据
    this.battleData = data.battleData;
    
    // 🔍 关键调试：检查服务器发送的数据
    const playerIds = Object.keys(data.battleData.players);
    console.log('🔍 [调试] 服务器发送的玩家ID列表:', playerIds);
    console.log('🔍 [调试] 玩家1数据:', data.battleData.players[playerIds[0]].user.username, playerIds[0]);
    console.log('🔍 [调试] 玩家2数据:', data.battleData.players[playerIds[1]].user.username, playerIds[1]);
    
    this.player1Data = data.battleData.players[playerIds[0]];
    this.player2Data = data.battleData.players[playerIds[1]];
    
    // 获取当前登录用户
    const currentUser = window.gameState.getUser();
    this.myUserId = currentUser.userId;
    
    console.log('🔍 [调试] 我的登录信息:', currentUser.username, this.myUserId);
    console.log('🔍 [调试] 我是玩家1吗?', this.myUserId === playerIds[0]);
    console.log('🔍 [调试] 我是玩家2吗?', this.myUserId === playerIds[1]);
    
    this.opponentUserId = playerIds.find(id => id !== this.myUserId);
    this.battleId = data.battleData.id;
    
    console.log('🎮 实时对战开始！', {
      '我的用户名': currentUser.username,
      '我的ID': this.myUserId,
      '对手ID': this.opponentUserId,
      battleId: this.battleId
    });
    
    // 🚨 检查是否识别错误
    if (!this.opponentUserId) {
      console.error('❌❌❌ 错误：无法识别对手ID！');
      console.error('玩家列表:', playerIds);
      console.error('我的ID:', this.myUserId);
      alert('对战数据错误：无法识别对手！');
    }
  }

  create() {
    // 🔴 关键修复：清除所有可能残留的背景
    this.cameras.main.setBackgroundColor('#000000');
    
    // 🔴 关键修复：使用固定的物理世界大小，确保所有客户端一致
    const WORLD_WIDTH = 1200;
    const WORLD_HEIGHT = 800;
    
    // 设置物理世界边界
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // 设置相机边界
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    console.log('🌍 [世界设置]', {
      物理世界: `${WORLD_WIDTH}x${WORLD_HEIGHT}`,
      相机大小: `${this.cameras.main.width}x${this.cameras.main.height}`,
      重力: this.physics.world.gravity.y
    });

    // 🔴 创建天空和地面背景（必须完全覆盖）
    this.createBackground(WORLD_WIDTH, WORLD_HEIGHT);

    // 创建战场地面（物理碰撞）
    this.createGround(WORLD_WIDTH, WORLD_HEIGHT);

    // 创建标题
    this.createTitle();

    // 创建双方角色
    this.createPlayers(WORLD_WIDTH, WORLD_HEIGHT);

    // 创建血量条
    this.createHealthBars();

    // 创建控制提示
    this.createControls();

    // 设置键盘控制
    this.setupControls();

    // 监听网络事件
    this.setupNetworkListeners();

    // 初始化战斗状态
    this.battleEnded = false;
    this.lastSyncTime = 0;
    this.syncInterval = 50; // 每50ms同步一次位置

    // 启动心跳同步
    this.startPositionSync();
  }

  createBackground(worldWidth, worldHeight) {
    // 🔴 完全覆盖的背景矩形（防止下层场景显示）
    const fullBackground = this.add.rectangle(0, 0, worldWidth, worldHeight, 0x000000);
    fullBackground.setOrigin(0, 0);
    fullBackground.setDepth(-100);  // 确保在最底层
    
    // 🌤️ 天空背景（渐变：从浅蓝到深蓝）
    const skyTop = this.add.rectangle(0, 0, worldWidth, worldHeight * 0.6, 0x87ceeb);
    skyTop.setOrigin(0, 0);
    skyTop.setDepth(-90);
    
    const skyBottom = this.add.rectangle(0, worldHeight * 0.6, worldWidth, worldHeight * 0.4, 0x4a90e2);
    skyBottom.setOrigin(0, 0);
    skyBottom.setDepth(-90);
    
    // ☁️ 装饰云朵
    this.createClouds(worldWidth, worldHeight);
    
    // 🌍 地面草地背景（从 60% 高度开始到底部）
    const grassStartY = worldHeight * 0.6;  // 与天空底部对齐
    const grassHeight = worldHeight - grassStartY;
    
    const grass = this.add.rectangle(
      0,
      grassStartY,
      worldWidth,
      grassHeight,
      0x2d5016
    );
    grass.setOrigin(0, 0);
    grass.setDepth(-80);
    
    // 地表线（浅绿色草地顶部）
    const grassTop = this.add.rectangle(
      0,
      grassStartY,
      worldWidth,
      20,
      0x4a7c2c
    );
    grassTop.setOrigin(0, 0);
    grassTop.setDepth(-75);
    
    console.log('🎨 [背景创建]', {
      天空高度: worldHeight * 0.6,
      草地起始: grassStartY,
      草地高度: grassHeight,
      完全覆盖: true
    });
  }

  createClouds(worldWidth, worldHeight) {
    // 创建几朵简单的云
    const cloudY = [100, 150, 200, 120, 180];
    const cloudX = [200, 500, 800, 1000, 350];
    
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.ellipse(cloudX[i], cloudY[i], 80, 40, 0xffffff, 0.7);
      cloud.setDepth(-70);  // 云朵在背景之上
      
      // 云朵缓慢飘动
      this.tweens.add({
        targets: cloud,
        x: cloudX[i] + 50,
        duration: 8000 + i * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createGround(worldWidth, worldHeight) {
    // 🔴 物理地面（位置与视觉草地顶部对齐）
    const grassTopY = worldHeight * 0.6;  // 草地顶部位置（与背景一致）
    const groundHeight = 40;  // 地面厚度
    const groundY = grassTopY + groundHeight / 2;  // 地面中心
    
    this.ground = this.add.rectangle(
      worldWidth / 2,
      groundY,
      worldWidth,
      groundHeight,
      0xff0000,  // 🔴 临时用红色可见，方便调试
      0  // 透明度0（不可见）
    );
    this.physics.add.existing(this.ground, true);  // true = static body
    this.ground.setDepth(-60);
    
    console.log('🏞️ [地面创建]', {
      地面中心Y: groundY,
      地面顶部Y: groundY - groundHeight / 2,
      地面底部Y: groundY + groundHeight / 2,
      草地顶部Y: grassTopY,
      地面高度: groundHeight,
      是否静态: true
    });
  }

  createTitle() {
    const width = this.cameras.main.width;

    const title = this.add.text(
      width / 2,
      20,
      '⚔️ 实时对战 ⚔️',
      {
        fontSize: '32px',
        fill: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    title.setOrigin(0.5);
    title.setScrollFactor(0);

    const vsText = this.add.text(
      width / 2,
      60,
      `${this.player1Data.user.username} VS ${this.player2Data.user.username}`,
      {
        fontSize: '20px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    vsText.setOrigin(0.5);
    vsText.setScrollFactor(0);
  }

  createPlayers(worldWidth, worldHeight) {
    // 计算最大血量（耐力 × 10）
    const player1MaxHp = this.player1Data.user.attributes.endurance * 10;
    const player2MaxHp = this.player2Data.user.attributes.endurance * 10;

    // 我的角色
    const myData = this.player1Data.user.userId === this.myUserId ? this.player1Data : this.player2Data;
    
    console.log('👤 [创建我的角色]', {
      '我的用户名': myData.user.username,
      '我的ID': myData.user.userId,
      '期望的ID': this.myUserId,
      '匹配': myData.user.userId === this.myUserId
    });
    
    // 🔴 关键修复：角色位置与地面顶部对齐
    const grassTopY = worldHeight * 0.6;  // 草地顶部（与 createGround 一致）
    const playerHeight = 60;
    const playerY = grassTopY - playerHeight / 2;  // 角色中心应该让角色底部刚好在草地顶部
    
    const leftX = worldWidth * 0.25;    // 左侧位置（世界坐标的25%）
    const rightX = worldWidth * 0.75;   // 右侧位置（世界坐标的75%）
    
    console.log('📍 [位置计算]', {
      世界大小: `${worldWidth}x${worldHeight}`,
      草地顶部Y: grassTopY,
      角色中心Y: playerY,
      角色底部Y: playerY + playerHeight / 2,
      左侧X: leftX,
      右侧X: rightX
    });
    
    this.myPlayer = this.add.rectangle(
      leftX,  // 使用世界坐标
      playerY,  // 🔴 修正后的Y坐标
      40,
      playerHeight,
      0x00ff00
    );
    this.physics.add.existing(this.myPlayer);
    this.myPlayer.body.setCollideWorldBounds(true);
    // 🔴 移除额外重力设置，使用全局重力配置即可
    
    console.log('🎮 [我的角色物理]', {
      位置: { x: this.myPlayer.x, y: this.myPlayer.y },
      物理体: !!this.myPlayer.body,
      世界重力: this.physics.world.gravity.y
    });
    
    // 🔴 从服务器传来的数据中获取血量
    this.myPlayer.maxHp = myData.maxHp || (this.player1Data.user.userId === this.myUserId ? player1MaxHp : player2MaxHp);
    this.myPlayer.currentHp = myData.currentHp || this.myPlayer.maxHp;
    this.myPlayer.userId = this.myUserId;
    this.myPlayer.userData = myData.user;
    
    console.log('💉 [我的血量]', {
      '当前血量': this.myPlayer.currentHp,
      '最大血量': this.myPlayer.maxHp,
      '来源数据': { maxHp: myData.maxHp, currentHp: myData.currentHp }
    });

    // 我的名字
    this.myPlayerName = this.add.text(
      this.myPlayer.x,
      this.myPlayer.y - 50,
      myData.user.username + ' (我)',
      {
        fontSize: '16px',
        fill: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    this.myPlayerName.setOrigin(0.5);

    // 对手角色
    const opponentData = this.player1Data.user.userId === this.opponentUserId ? this.player1Data : this.player2Data;
    
    console.log('👤 [创建对手角色]', {
      '对手用户名': opponentData.user.username,
      '对手ID': opponentData.user.userId,
      '期望的对手ID': this.opponentUserId,
      '匹配': opponentData.user.userId === this.opponentUserId
    });
    
    // 🔴 对手在右边，使用世界坐标
    this.opponentPlayer = this.add.rectangle(
      rightX,  // 使用世界坐标
      playerY,  // 🔴 使用相同的Y坐标
      40,
      playerHeight,
      0xff0000
    );
    this.physics.add.existing(this.opponentPlayer);
    this.opponentPlayer.body.setCollideWorldBounds(true);
    // 🔴 移除额外重力设置，使用全局重力配置即可
    
    // 🔴 从服务器传来的数据中获取血量
    this.opponentPlayer.maxHp = opponentData.maxHp || (this.player1Data.user.userId === this.opponentUserId ? player1MaxHp : player2MaxHp);
    this.opponentPlayer.currentHp = opponentData.currentHp || this.opponentPlayer.maxHp;
    this.opponentPlayer.userId = this.opponentUserId;
    this.opponentPlayer.userData = opponentData.user;
    
    console.log('💉 [对手血量]', {
      '当前血量': this.opponentPlayer.currentHp,
      '最大血量': this.opponentPlayer.maxHp,
      '来源数据': { maxHp: opponentData.maxHp, currentHp: opponentData.currentHp }
    });
    
    console.log('✅ [角色创建完成]', {
      我的位置: `(${Math.floor(this.myPlayer.x)}, ${Math.floor(this.myPlayer.y)})`,
      对手位置: `(${Math.floor(this.opponentPlayer.x)}, ${Math.floor(this.opponentPlayer.y)})`
    });

    // 对手名字
    this.opponentPlayerName = this.add.text(
      this.opponentPlayer.x,
      this.opponentPlayer.y - 50,
      opponentData.user.username,
      {
        fontSize: '16px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    this.opponentPlayerName.setOrigin(0.5);

    // 添加碰撞
    this.physics.add.collider(this.myPlayer, this.ground);
    this.physics.add.collider(this.opponentPlayer, this.ground);
    
    // 🔴 修复地图错乱：相机跟随我的角色
    this.cameras.main.startFollow(this.myPlayer, true, 0.1, 0.1);
    console.log('📹 [相机设置] 相机跟随玩家', {
      玩家位置: { x: this.myPlayer.x, y: this.myPlayer.y },
      相机中心: { x: this.cameras.main.scrollX + this.cameras.main.width / 2, y: this.cameras.main.scrollY + this.cameras.main.height / 2 }
    });

    // 攻击状态
    this.canAttack = true;
    this.attackCooldown = 500; // 攻击冷却时间
    this.myFacingRight = true;
  }

  createHealthBars() {
    const width = this.cameras.main.width;

    // 我的血量条（左上角）
    this.myHpBarBg = this.add.rectangle(20, 100, 200, 20, 0x333333);
    this.myHpBarBg.setOrigin(0, 0.5);
    this.myHpBarBg.setScrollFactor(0);

    this.myHpBar = this.add.rectangle(20, 100, 200, 20, 0x00ff00);
    this.myHpBar.setOrigin(0, 0.5);
    this.myHpBar.setScrollFactor(0);

    this.myHpText = this.add.text(120, 100, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    this.myHpText.setOrigin(0.5);
    this.myHpText.setScrollFactor(0);

    // 对手血量条（右上角）
    this.opponentHpBarBg = this.add.rectangle(width - 220, 100, 200, 20, 0x333333);
    this.opponentHpBarBg.setOrigin(0, 0.5);
    this.opponentHpBarBg.setScrollFactor(0);

    this.opponentHpBar = this.add.rectangle(width - 220, 100, 200, 20, 0xff0000);
    this.opponentHpBar.setOrigin(0, 0.5);
    this.opponentHpBar.setScrollFactor(0);

    this.opponentHpText = this.add.text(width - 120, 100, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    this.opponentHpText.setOrigin(0.5);
    this.opponentHpText.setScrollFactor(0);

    this.updateHealthBars();
  }

  createControls() {
    const height = this.cameras.main.height;

    const controlText = this.add.text(
      20,
      height - 60,
      '控制: WASD移动 | ↑/W跳跃 | J/1攻击 | ESC退出',
      {
        fontSize: '16px',
        fill: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    );
    controlText.setScrollFactor(0);
  }

  setupControls() {
    // 方向键
    this.cursors = this.input.keyboard.createCursorKeys();

    // WASD + 攻击键
    this.keys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      ESC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    };
  }

  setupNetworkListeners() {
    // 🔴 关键修复：先清理旧的监听器，防止重复注册
    console.log('🧹 [清理] 清理旧的PVP事件监听器');
    window.networkManager.off('pvp:position');
    window.networkManager.off('pvp:attack');
    window.networkManager.off('pvp:damage');
    window.networkManager.off('pvp:hp:update');
    window.networkManager.off('pvp:end');
    
    console.log('📡 [注册] 注册新的PVP事件监听器');
    
    // 监听对手位置更新
    window.networkManager.on('pvp:position', (data) => {
      if (data.userId === this.opponentUserId) {
        this.updateOpponentPosition(data);
      }
    });

    // 监听对手攻击
    window.networkManager.on('pvp:attack', (data) => {
      if (data.userId === this.opponentUserId) {
        this.handleOpponentAttack(data);
      }
    });

    // 监听伤害（唯一的伤害处理入口）
    window.networkManager.on('pvp:damage', (data) => {
      if (data.targetId === this.myUserId) {
        console.log('💥 [收到伤害事件]', {
          伤害: data.damage,
          击退方向: data.knockbackDirection,
          目标: data.targetId,
          我的ID: this.myUserId
        });
        // 🔴 传递击退方向
        this.takeDamage(data.damage, data.knockbackDirection);
      }
    });

    // 🔴 监听血量更新（攻击者看到对手的血量变化）
    window.networkManager.on('pvp:hp:update', (data) => {
      if (data.targetId === this.opponentUserId) {
        console.log('🩸 [对手血量更新]', {
          旧血量: this.opponentPlayer.currentHp,
          新血量: data.currentHp,
          伤害: this.opponentPlayer.currentHp - data.currentHp,
          击退方向: data.knockbackDirection
        });

        // 计算伤害
        const damage = this.opponentPlayer.currentHp - data.currentHp;

        // 更新血量
        this.opponentPlayer.currentHp = data.currentHp;
        this.updateHealthBars();

        // 🔴 问题二修复：在攻击者窗口显示造成的伤害
        if (damage > 0) {
          this.showDamageNumber(
            this.opponentPlayer.x,
            this.opponentPlayer.y - 50,
            damage
          );
        }

        // 对手受击特效
        this.cameras.main.shake(100, 0.003);

        // 🔴 问题一修复：使用服务器传来的击退方向（远离攻击者）
        const knockbackDistance = 30;
        const knockbackX = this.opponentPlayer.x + (data.knockbackDirection || 1) * knockbackDistance;
        
        console.log('💥 [对手被击退]', {
          对手当前位置: Math.floor(this.opponentPlayer.x),
          对手目标位置: Math.floor(knockbackX),
          击退方向: data.knockbackDirection > 0 ? '右(远离攻击者)' : '左(远离攻击者)',
          移动距离: knockbackDistance * (data.knockbackDirection > 0 ? 1 : -1)
        });
        
        this.tweens.add({
          targets: this.opponentPlayer,
          x: knockbackX,
          duration: 150,
          ease: 'Power2.easeOut',
          yoyo: true
        });

        // 闪白效果
        this.opponentPlayer.setFillStyle(0xffffff);  // 先变白
        this.time.delayedCall(100, () => {
          this.opponentPlayer.setFillStyle(0xff0000); // 对手始终是红色
        });

        // 播放受击音效
        this.playHitSound();
      }
    });

    // 监听战斗结束
    window.networkManager.on('pvp:end', (data) => {
      this.endBattle(data);
    });
  }

  startPositionSync() {
    // 定期同步位置
    this.positionSyncTimer = this.time.addEvent({
      delay: this.syncInterval,
      callback: () => {
        if (!this.battleEnded && this.myPlayer) {
          this.sendPositionUpdate();
        }
      },
      loop: true
    });
  }

  sendPositionUpdate() {
    const data = {
      battleId: this.battleId,
      userId: this.myUserId,
      x: this.myPlayer.x,
      y: this.myPlayer.y,
      velocityX: this.myPlayer.body.velocity.x,
      velocityY: this.myPlayer.body.velocity.y,
      facingRight: this.myFacingRight
    };
    window.networkManager.socketEmit('pvp:position', data);
  }

  updateOpponentPosition(data) {
    if (!this.opponentPlayer) return;

    // 平滑插值更新位置
    this.tweens.add({
      targets: this.opponentPlayer,
      x: data.x,
      y: data.y,
      duration: this.syncInterval,
      ease: 'Linear'
    });

    // 更新速度（用于预测）
    if (this.opponentPlayer.body) {
      this.opponentPlayer.body.setVelocity(data.velocityX, data.velocityY);
    }
  }

  update() {
    if (this.battleEnded || !this.myPlayer) return;

    // 移动控制
    const speed = 250;
    let moving = false;

    if (this.cursors.left.isDown || this.keys.A.isDown) {
      this.myPlayer.body.setVelocityX(-speed);
      this.myFacingRight = false;
      moving = true;
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      this.myPlayer.body.setVelocityX(speed);
      this.myFacingRight = true;
      moving = true;
    } else {
      this.myPlayer.body.setVelocityX(0);
    }

    // 跳跃（增加调试日志）
    const isJumpKeyPressed = this.cursors.up.isDown || this.keys.W.isDown;
    const isTouchingGround = this.myPlayer.body.touching.down || this.myPlayer.body.blocked.down;
    
    if (isJumpKeyPressed && isTouchingGround) {
      this.myPlayer.body.setVelocityY(-500);
      console.log('🦘 [跳跃] 跳跃触发！', {
        velocityY: this.myPlayer.body.velocity.y,
        位置: { x: Math.floor(this.myPlayer.x), y: Math.floor(this.myPlayer.y) }
      });
    }

    // 攻击
    if ((Phaser.Input.Keyboard.JustDown(this.keys.J) || 
         Phaser.Input.Keyboard.JustDown(this.keys.ONE)) && this.canAttack) {
      this.performAttack();
    }

    // 退出
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.confirmExit();
    }

    // 更新名字位置
    this.myPlayerName.setPosition(this.myPlayer.x, this.myPlayer.y - 50);
    this.opponentPlayerName.setPosition(this.opponentPlayer.x, this.opponentPlayer.y - 50);
  }

  performAttack() {
    if (!this.canAttack || this.battleEnded) return;

    this.canAttack = false;

    // 计算伤害（攻击力 = 力量属性值）
    const damage = this.myPlayer.userData.attributes.strength;

    // 检测是否击中对手
    const distance = Phaser.Math.Distance.Between(
      this.myPlayer.x,
      this.myPlayer.y,
      this.opponentPlayer.x,
      this.opponentPlayer.y
    );

    const attackRange = 80; // 攻击范围（与 GameScene 一致）

    if (distance < attackRange) {
      // 播放攻击动画（与 GameScene 一致的效果）
      this.playMyAttackAnimation(distance < attackRange);

      // 🔴 计算击退方向（被攻击者远离攻击者）
      // 如果对手在我右边，对手应该向右击退（1）
      // 如果对手在我左边，对手应该向左击退（-1）
      const knockbackDirection = this.opponentPlayer.x > this.myPlayer.x ? 1 : -1;

      console.log('⚔️ [发起攻击]', {
        攻击者: this.myUserId,
        目标: this.opponentUserId,
        伤害: damage,
        距离: Math.floor(distance),
        我的位置: Math.floor(this.myPlayer.x),
        对手位置: Math.floor(this.opponentPlayer.x),
        击退方向: knockbackDirection > 0 ? '右(远离我)' : '左(远离我)'
      });

      // 击中！发送伤害到服务器（包含击退方向）
      window.networkManager.socketEmit('pvp:attack', {
        battleId: this.battleId,
        attackerId: this.myUserId,
        targetId: this.opponentUserId,
        damage: damage,
        knockbackDirection: knockbackDirection  // 添加击退方向
      });
    } else {
      // 未击中也播放攻击动画
      this.playMyAttackAnimation(false);
      console.log('❌ 攻击未击中');
    }

    // 攻击冷却
    this.time.delayedCall(this.attackCooldown, () => {
      this.canAttack = true;
    });
  }

  playMyAttackAnimation(hit) {
    const direction = this.myFacingRight ? 1 : -1;
    const attackDistance = 80;
    const attackX = this.myPlayer.x + (direction * attackDistance / 2);
    const attackY = this.myPlayer.y;

    // 攻击范围指示器（红色矩形）- 与 GameScene 一致
    const attackBox = this.add.rectangle(
      attackX,
      attackY,
      attackDistance,
      60,
      0xff0000,
      0.5
    );

    // 创建斩击效果线条 - 与 GameScene 一致
    const slashLine = this.add.line(
      0, 0,
      this.myPlayer.x + (direction * 20),
      this.myPlayer.y - 30,
      this.myPlayer.x + (direction * attackDistance),
      this.myPlayer.y + 30,
      0xffff00,
      1
    );
    slashLine.setLineWidth(4);

    // 攻击特效动画
    this.tweens.add({
      targets: [attackBox, slashLine],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        attackBox.destroy();
        slashLine.destroy();
      }
    });

    // 角色攻击动画（闪烁效果）- 与 GameScene 一致
    this.tweens.add({
      targets: this.myPlayer,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.myPlayer.setScale(1);
      }
    });
  }

  handleOpponentAttack(data) {
    console.log('👊 [对手攻击动画] 仅播放视觉效果，不造成伤害', data);

    // 判断对手朝向（根据相对位置）
    const direction = this.opponentPlayer.x < this.myPlayer.x ? 1 : -1;
    const attackDistance = 80;
    const attackX = this.opponentPlayer.x + (direction * attackDistance / 2);
    const attackY = this.opponentPlayer.y;

    // 攻击范围指示器 - 与 GameScene 一致
    const attackBox = this.add.rectangle(
      attackX,
      attackY,
      attackDistance,
      60,
      0xff0000,
      0.5
    );

    // 斩击效果线条
    const slashLine = this.add.line(
      0, 0,
      this.opponentPlayer.x + (direction * 20),
      this.opponentPlayer.y - 30,
      this.opponentPlayer.x + (direction * attackDistance),
      this.opponentPlayer.y + 30,
      0xffff00,
      1
    );
    slashLine.setLineWidth(4);

    // 攻击特效动画
    this.tweens.add({
      targets: [attackBox, slashLine],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        attackBox.destroy();
        slashLine.destroy();
      }
    });

    // 对手攻击动画
    this.tweens.add({
      targets: this.opponentPlayer,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.opponentPlayer.setScale(1);
      }
    });

    // 🔴 关键修复：不在这里调用 takeDamage！
    // 伤害由 pvp:damage 事件统一处理，避免重复计算
    console.log('✅ [对手攻击动画] 视觉效果已播放，等待 pvp:damage 事件处理伤害');
  }

  takeDamage(damage, knockbackDirection) {
    if (this.battleEnded) {
      console.log('⚠️ [受伤] 战斗已结束，忽略伤害');
      return;
    }

    // 🔴 防止在同一帧内多次调用
    const now = Date.now();
    if (this.lastDamageTime && now - this.lastDamageTime < 100) {
      console.log('⚠️ [受伤] 伤害事件触发过快，忽略（防抖）', {
        上次伤害时间: this.lastDamageTime,
        当前时间: now,
        间隔: now - this.lastDamageTime
      });
      return;
    }
    this.lastDamageTime = now;

    // 扣血
    const oldHp = this.myPlayer.currentHp;
    this.myPlayer.currentHp = Math.max(0, this.myPlayer.currentHp - damage);
    
    console.log('💔 [受伤] 扣除血量', {
      '伤害': damage,
      '旧血量': oldHp,
      '新血量': this.myPlayer.currentHp,
      '最大血量': this.myPlayer.maxHp,
      '击退方向': knockbackDirection,
      '调用栈': new Error().stack.split('\n').slice(1, 4).join('\n')
    });
    
    // 🔴 问题三修复：更新血条
    this.updateHealthBars();

    // 受击效果 - 与 GameScene 一致
    this.cameras.main.shake(200, 0.005);

    // 🔴 问题一修复：使用服务器传来的击退方向（远离攻击者）
    const knockbackDistance = 30;
    const knockbackX = this.myPlayer.x + (knockbackDirection || 1) * knockbackDistance;
    
    console.log('💥 [我被击退]', {
      当前位置: Math.floor(this.myPlayer.x),
      目标位置: Math.floor(knockbackX),
      击退方向: knockbackDirection > 0 ? '右(远离攻击者)' : '左(远离攻击者)',
      移动距离: knockbackDistance * (knockbackDirection > 0 ? 1 : -1)
    });
    
    this.tweens.add({
      targets: this.myPlayer,
      x: knockbackX,
      duration: 150,
      ease: 'Power2.easeOut',
      yoyo: true
    });

    // 闪红
    this.myPlayer.setFillStyle(0xffffff);  // 先变白
    this.time.delayedCall(100, () => {
      this.myPlayer.setFillStyle(0x00ff00);  // 恢复为绿色（我的角色）
    });

    // 显示伤害数字 - 与 GameScene 一致
    this.showDamageNumber(this.myPlayer.x, this.myPlayer.y - 50, damage);

    // 检查是否死亡
    if (this.myPlayer.currentHp <= 0) {
      console.log('💀 [死亡] 我被击败了！发送战败消息');
      
      // 标记战斗结束（防止重复发送）
      this.battleEnded = true;
      
      // 通知服务器我被击败了
      window.networkManager.socketEmit('pvp:defeated', {
        battleId: this.battleId,
        loserId: this.myUserId,
        winnerId: this.opponentUserId
      });
    }
  }

  showDamageNumber(x, y, damage) {
    // 与 GameScene 一致的伤害数字样式
    const damageText = this.add.text(x, y, `-${damage}`, {
      fontSize: '24px',
      fill: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    damageText.setOrigin(0.5);

    // 与 GameScene 一致的飘浮动画
    this.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        damageText.destroy();
      }
    });
  }

  updateHealthBars() {
    // 我的血量
    const myHpPercent = this.myPlayer.currentHp / this.myPlayer.maxHp;
    this.myHpBar.setScale(myHpPercent, 1);
    this.myHpText.setText(`${Math.ceil(this.myPlayer.currentHp)}/${this.myPlayer.maxHp}`);

    // 血量条颜色
    if (myHpPercent > 0.5) {
      this.myHpBar.setFillStyle(0x00ff00);
    } else if (myHpPercent > 0.25) {
      this.myHpBar.setFillStyle(0xffaa00);
    } else {
      this.myHpBar.setFillStyle(0xff0000);
    }

    // 对手血量
    const opponentHpPercent = this.opponentPlayer.currentHp / this.opponentPlayer.maxHp;
    this.opponentHpBar.setScale(opponentHpPercent, 1);
    this.opponentHpText.setText(`${Math.ceil(this.opponentPlayer.currentHp)}/${this.opponentPlayer.maxHp}`);

    if (opponentHpPercent > 0.5) {
      this.opponentHpBar.setFillStyle(0xff0000);
    } else if (opponentHpPercent > 0.25) {
      this.opponentHpBar.setFillStyle(0xffaa00);
    } else {
      this.opponentHpBar.setFillStyle(0xff3333);
    }
  }

  confirmExit() {
    if (confirm('确定要退出对战吗？退出将视为投降。')) {
      window.networkManager.socketEmit('pvp:surrender', {
        battleId: this.battleId,
        userId: this.myUserId
      });
      this.exitBattle();
    }
  }

  endBattle(data) {
    console.log('🏁 [战斗结束]', data);
    
    if (this.battleEnded && !data) {
      console.log('⚠️ [战斗结束] 已经处理过了，忽略');
      return;
    }
    
    this.battleEnded = true;

    // 停止位置同步
    if (this.positionSyncTimer) {
      this.positionSyncTimer.remove();
      console.log('⏱️ [战斗结束] 停止位置同步');
    }

    const isWinner = data.winnerId === this.myUserId;
    const resultText = isWinner ? '🎉 胜利！' : '💀 失败！';

    console.log('🏁 [战斗结果]', {
      '我的ID': this.myUserId,
      '胜利者ID': data.winnerId,
      '我是胜利者': isWinner,
      '结果文本': resultText
    });

    // 显示结果
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.8
    );
    overlay.setScrollFactor(0);

    const result = this.add.text(
      width / 2,
      height / 2 - 50,
      resultText,
      {
        fontSize: '64px',
        fill: isWinner ? '#00ff00' : '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    result.setOrigin(0.5);
    result.setScrollFactor(0);
    
    // 显示返回提示
    const hint = this.add.text(
      width / 2,
      height / 2 + 60,
      '3秒后返回游戏...',
      {
        fontSize: '24px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    hint.setOrigin(0.5);
    hint.setScrollFactor(0);

    const returnBtn = this.add.text(
      width / 2,
      height / 2 + 120,
      '立即返回',
      {
        fontSize: '28px',
        fill: '#ffffff',
        backgroundColor: '#4444ff',
        padding: { x: 40, y: 15 }
      }
    );
    returnBtn.setOrigin(0.5);
    returnBtn.setScrollFactor(0);
    returnBtn.setInteractive({ useHandCursor: true });

    returnBtn.on('pointerover', () => {
      returnBtn.setScale(1.1);
    });
    returnBtn.on('pointerout', () => {
      returnBtn.setScale(1);
    });
    returnBtn.on('pointerdown', () => {
      console.log('👆 [点击] 立即返回游戏');
      this.exitBattle();
    });

    // 特效
    if (isWinner) {
      this.cameras.main.flash(1000, 0, 255, 0);
    } else {
      this.cameras.main.fade(500, 0, 0, 0);
    }
    
    // 3秒后自动返回
    console.log('⏱️ [战斗结束] 3秒后自动返回游戏');
    this.time.delayedCall(3000, () => {
      console.log('🔄 [自动返回] 执行场景切换');
      this.exitBattle();
    });
  }

  exitBattle() {
    console.log('🚪 [退出对战] 清理网络监听器');
    
    // 🔴 清理所有网络监听（包括 pvp:hp:update）
    window.networkManager.off('pvp:position');
    window.networkManager.off('pvp:attack');
    window.networkManager.off('pvp:damage');
    window.networkManager.off('pvp:hp:update');  // 🔴 关键：清理血量更新监听器
    window.networkManager.off('pvp:end');

    console.log('✅ [退出对战] 网络监听器已清理');

    // 返回游戏场景
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}

