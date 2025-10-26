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
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
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
      '控制: ← → 移动 | ↑ 跳跃 | Space 交互',
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
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      this.player.body.setVelocityX(200);
    } else {
      this.player.body.setVelocityX(0);
    }

    // 跳跃（支持方向键上和 W）
    if ((this.cursors.up.isDown || this.keys.W.isDown) && this.player.body.touching.down) {
      this.player.body.setVelocityY(-400);
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

  switchScene(sceneId) {
    this.currentSceneId = sceneId;
    this.scene.restart();
  }
}

