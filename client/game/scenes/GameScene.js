import Phaser from 'phaser';

/**
 * 主游戏场景 - 角色探索
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 获取当前场景配置
    this.currentSceneId = window.gameState.getCurrentScene();
    this.loadSceneBackground();

    // 创建地面
    this.createGround();

    // 创建玩家角色
    this.createPlayer();

    // 创建交互物体
    this.createInteractables();

    // 控制提示
    this.createControls();

    // 监听场景切换
    window.gameState.on('scene:changed', (sceneId) => {
      this.switchScene(sceneId);
    });

    // 键盘输入
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // 添加 WASD 键支持
    this.keys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
    };
    
    // 攻击相关
    this.canAttack = true;
    this.attackCooldown = 300; // 攻击冷却时间（毫秒）
    this.facingRight = true; // 玩家朝向
  }

  loadSceneBackground() {
    const sceneColors = {
      town: 0x87CEEB,      // 天蓝色
      forest: 0x228B22,    // 森林绿
      cave: 0x4B0082,      // 靛蓝色
      mountain: 0xE0FFFF,  // 浅青色
      dungeon: 0x1C1C1C    // 深灰色
    };

    const color = sceneColors[this.currentSceneId] || 0x87CEEB;
    this.cameras.main.setBackgroundColor(color);

    // 场景名称
    const sceneName = this.getSceneName(this.currentSceneId);
    const sceneText = this.add.text(20, 20, sceneName, {
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    sceneText.setScrollFactor(0);
  }

  getSceneName(sceneId) {
    const names = {
      town: '新手村',
      forest: '迷雾森林',
      cave: '水晶洞穴',
      mountain: '雪山',
      dungeon: '暗影地下城'
    };
    return names[sceneId] || '未知区域';
  }

  createGround() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 地面（静态物理对象）
    this.ground = this.add.rectangle(
      width / 2,
      height - 50,
      width * 2,
      100,
      0x8B4513
    );
    this.physics.add.existing(this.ground, true);
  }

  createPlayer() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 玩家角色（简单的方块代替）
    this.player = this.add.rectangle(
      200,
      height - 150,
      40,
      60,
      0x00ff00
    );
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // 玩家名字
    const user = window.gameState.getUser();
    this.playerName = this.add.text(200, height - 190, user?.username || 'Player', {
      fontSize: '14px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.playerName.setOrigin(0.5);

    // 碰撞检测
    this.physics.add.collider(this.player, this.ground);
  }

  createInteractables() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 小游戏入口（紫色方块）
    this.minigamePortal = this.add.rectangle(
      width / 2,
      height - 150,
      60,
      60,
      0x9933ff
    );
    this.physics.add.existing(this.minigamePortal, true);

    // 标签
    this.portalLabel = this.add.text(width / 2, height - 200, '小游戏', {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.portalLabel.setOrigin(0.5);

    // 闪烁动画
    this.tweens.add({
      targets: this.minigamePortal,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // NPC（蓝色方块）
    this.npc = this.add.rectangle(
      width - 200,
      height - 150,
      50,
      70,
      0x0066ff
    );
    this.physics.add.existing(this.npc, true);

    this.npcLabel = this.add.text(width - 200, height - 200, 'NPC', {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.npcLabel.setOrigin(0.5);
  }

  createControls() {
    const height = this.cameras.main.height;

    const controlText = this.add.text(
      20,
      height - 80,
      '控制: ← → 移动 | ↑ 跳跃 | Space 交互 | J/1 攻击',
      {
        fontSize: '16px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    controlText.setScrollFactor(0);
  }

  update() {
    if (!this.player || !this.cursors) return;

    // 左右移动（支持方向键和 AD）
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      this.player.body.setVelocityX(-200);
      this.facingRight = false; // 朝左
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      this.player.body.setVelocityX(200);
      this.facingRight = true; // 朝右
    } else {
      this.player.body.setVelocityX(0);
    }

    // 跳跃（支持方向键上和 W）
    if ((this.cursors.up.isDown || this.keys.W.isDown) && this.player.body.touching.down) {
      this.player.body.setVelocityY(-400);
    }

    // 攻击（J 键或 1 键）
    if ((Phaser.Input.Keyboard.JustDown(this.keys.J) || 
         Phaser.Input.Keyboard.JustDown(this.keys.ONE)) && this.canAttack) {
      this.performAttack();
    }

    // 更新玩家名字位置，使其跟随玩家
    if (this.playerName && this.player) {
      this.playerName.setPosition(this.player.x, this.player.y - 40);
    }

    // 交互
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.checkInteraction();
    }
  }

  checkInteraction() {
    // 检查是否接近可交互物体
    const playerX = this.player.x;
    const playerY = this.player.y;

    // 小游戏入口
    const distToPortal = Phaser.Math.Distance.Between(
      playerX, playerY,
      this.minigamePortal.x, this.minigamePortal.y
    );
    
    if (distToPortal < 100) {
      this.startMinigame();
      return;
    }

    // NPC
    const distToNpc = Phaser.Math.Distance.Between(
      playerX, playerY,
      this.npc.x, this.npc.y
    );

    if (distToNpc < 100) {
      this.talkToNpc();
      return;
    }
  }

  startMinigame() {
    console.log('启动小游戏');
    this.scene.launch('MinigameScene', {
      sceneId: this.currentSceneId,
      minigameId: 'click'
    });
    this.scene.pause();
  }

  talkToNpc() {
    console.log('与NPC对话');
    window.uiManager.showDialog('欢迎来到' + this.getSceneName(this.currentSceneId) + '！');
  }

  performAttack() {
    console.log('🗡️ 执行攻击！');
    
    // 设置攻击冷却
    this.canAttack = false;
    
    // 攻击方向
    const direction = this.facingRight ? 1 : -1;
    const attackDistance = 80; // 攻击距离
    
    // 创建攻击特效（一个短暂的闪光）
    const attackX = this.player.x + (direction * attackDistance / 2);
    const attackY = this.player.y;
    
    // 攻击范围指示器（红色矩形）
    const attackBox = this.add.rectangle(
      attackX,
      attackY,
      attackDistance,
      60,
      0xff0000,
      0.5
    );
    
    // 创建斩击效果线条
    const slashLine = this.add.line(
      0, 0,
      this.player.x + (direction * 20),
      this.player.y - 30,
      this.player.x + (direction * attackDistance),
      this.player.y + 30,
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
    
    // 玩家攻击动画（闪烁效果）
    this.tweens.add({
      targets: this.player,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.player.setScale(1);
      }
    });
    
    // 检测攻击是否击中目标
    this.checkAttackHit(attackX, attackY, attackDistance);
    
    // 攻击冷却
    this.time.delayedCall(this.attackCooldown, () => {
      this.canAttack = true;
    });
  }
  
  checkAttackHit(attackX, attackY, attackDistance) {
    // 检测是否击中 NPC
    const distToNpc = Phaser.Math.Distance.Between(
      attackX, attackY,
      this.npc.x, this.npc.y
    );
    
    if (distToNpc < attackDistance) {
      console.log('💥 击中 NPC！');
      
      // NPC 受击效果
      this.tweens.add({
        targets: this.npc,
        x: this.npc.x + (this.facingRight ? 20 : -20),
        duration: 100,
        yoyo: true,
        ease: 'Bounce.easeOut'
      });
      
      // 改变 NPC 颜色表示受击
      this.npc.setFillStyle(0xff0000);
      this.time.delayedCall(200, () => {
        this.npc.setFillStyle(0x0066ff);
      });
      
      // 显示伤害数字
      this.showDamageNumber(this.npc.x, this.npc.y - 50);
      
      // 显示击中提示
      window.uiManager.showNotification('💥 攻击命中！');
    }
    
    // 检测是否击中传送门（只是测试）
    const distToPortal = Phaser.Math.Distance.Between(
      attackX, attackY,
      this.minigamePortal.x, this.minigamePortal.y
    );
    
    if (distToPortal < attackDistance) {
      console.log('⚡ 击中传送门！');
      // 传送门受击效果
      this.tweens.add({
        targets: this.minigamePortal,
        scale: 1.2,
        duration: 100,
        yoyo: true
      });
    }
  }
  
  showDamageNumber(x, y) {
    // 随机伤害值（10-30）
    const damage = Phaser.Math.Between(10, 30);
    
    // 创建伤害数字
    const damageText = this.add.text(x, y, `-${damage}`, {
      fontSize: '24px',
      fill: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
    damageText.setOrigin(0.5);
    
    // 伤害数字飘浮动画
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

  switchScene(sceneId) {
    this.currentSceneId = sceneId;
    this.scene.restart();
  }
}

