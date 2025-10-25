import Phaser from 'phaser';

/**
 * 小游戏场景
 */
export class MinigameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MinigameScene' });
  }

  init(data) {
    this.sceneId = data.sceneId;
    this.minigameId = data.minigameId;
    this.minigameType = data.type || 'click'; // click, timing, collect, puzzle
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景遮罩
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0);

    // 小游戏容器
    const containerBg = this.add.rectangle(
      width / 2,
      height / 2,
      600,
      400,
      0x1a1a2e
    );

    // 标题
    this.title = this.add.text(width / 2, height / 2 - 150, '小游戏', {
      fontSize: '32px',
      fill: '#ffffff'
    });
    this.title.setOrigin(0.5);

    // 根据类型创建不同的小游戏
    switch (this.minigameType) {
      case 'click':
        this.createClickGame();
        break;
      case 'timing':
        this.createTimingGame();
        break;
      case 'collect':
        this.createCollectGame();
        break;
      case 'puzzle':
        this.createPuzzleGame();
        break;
      default:
        this.createClickGame();
    }

    // 关闭按钮
    this.createCloseButton();
  }

  createClickGame() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.title.setText('快速点击游戏');

    this.score = 0;
    this.timeLeft = 10;

    // 得分显示
    this.scoreText = this.add.text(width / 2, height / 2 - 100, '得分: 0', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.scoreText.setOrigin(0.5);

    // 时间显示
    this.timeText = this.add.text(width / 2, height / 2 - 60, '时间: 10', {
      fontSize: '20px',
      fill: '#ffff00'
    });
    this.timeText.setOrigin(0.5);

    // 点击目标
    this.clickTarget = this.add.rectangle(
      width / 2,
      height / 2 + 20,
      100,
      100,
      0xff6b6b
    );
    this.clickTarget.setInteractive({ useHandCursor: true });

    this.clickTarget.on('pointerdown', () => {
      this.score++;
      this.scoreText.setText(`得分: ${this.score}`);

      // 随机移动位置
      this.clickTarget.x = width / 2 + Phaser.Math.Between(-200, 200);
      this.clickTarget.y = height / 2 + Phaser.Math.Between(-50, 50);

      // 闪烁效果
      this.tweens.add({
        targets: this.clickTarget,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true
      });
    });

    // 倒计时
    this.timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(`时间: ${this.timeLeft}`);

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      loop: true
    });
  }

  createTimingGame() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.title.setText('时机把握游戏');

    this.score = 0;

    // 说明
    const instruction = this.add.text(
      width / 2,
      height / 2 - 80,
      '当指针在绿色区域时按空格键',
      {
        fontSize: '18px',
        fill: '#ffffff'
      }
    );
    instruction.setOrigin(0.5);

    // 进度条背景
    this.progressBarBg = this.add.rectangle(
      width / 2 - 200,
      height / 2,
      400,
      40,
      0x333333
    );
    this.progressBarBg.setOrigin(0, 0.5);

    // 成功区域（绿色）
    this.successZone = this.add.rectangle(
      width / 2 - 200 + 150,
      height / 2,
      100,
      40,
      0x00ff00,
      0.5
    );
    this.successZone.setOrigin(0, 0.5);

    // 指针
    this.pointer = this.add.rectangle(
      width / 2 - 200,
      height / 2,
      10,
      50,
      0xff0000
    );
    this.pointer.setOrigin(0, 0.5);

    // 移动指针
    this.tweens.add({
      targets: this.pointer,
      x: width / 2 + 200,
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // 得分显示
    this.scoreText = this.add.text(width / 2, height / 2 + 80, '得分: 0', {
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.scoreText.setOrigin(0.5);

    // 空格键监听
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    
    this.spaceKey.on('down', () => {
      this.checkTiming();
    });

    // 10次后结束
    this.attempts = 0;
  }

  checkTiming() {
    if (this.attempts >= 10) return;

    const pointerX = this.pointer.x;
    const zoneX = this.successZone.x;
    const zoneWidth = this.successZone.width;

    if (pointerX >= zoneX && pointerX <= zoneX + zoneWidth) {
      // 成功
      this.score += 100;
      this.showFeedback('完美！', 0x00ff00);
    } else {
      // 失败
      this.showFeedback('失败', 0xff0000);
    }

    this.scoreText.setText(`得分: ${this.score}`);
    this.attempts++;

    if (this.attempts >= 10) {
      this.time.delayedCall(1000, () => {
        this.endGame();
      });
    }
  }

  showFeedback(text, color) {
    const feedback = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 120,
      text,
      {
        fontSize: '24px',
        fill: '#' + color.toString(16)
      }
    );
    feedback.setOrigin(0.5);

    this.tweens.add({
      targets: feedback,
      alpha: 0,
      y: feedback.y - 50,
      duration: 1000,
      onComplete: () => feedback.destroy()
    });
  }

  createCollectGame() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.title.setText('收集游戏');

    this.score = 0;
    this.timeLeft = 15;

    // 说明
    const instruction = this.add.text(
      width / 2,
      height / 2 - 80,
      '点击收集物品',
      {
        fontSize: '18px',
        fill: '#ffffff'
      }
    );
    instruction.setOrigin(0.5);

    // 得分和时间
    this.scoreText = this.add.text(width / 2 - 100, height / 2 - 120, '得分: 0', {
      fontSize: '20px',
      fill: '#ffffff'
    });

    this.timeText = this.add.text(width / 2 + 100, height / 2 - 120, '时间: 15', {
      fontSize: '20px',
      fill: '#ffff00'
    });

    // 收集物品容器
    this.collectibles = this.add.group();

    // 生成收集物品
    this.spawnTimer = this.time.addEvent({
      delay: 1000,
      callback: () => this.spawnCollectible(),
      loop: true
    });

    // 倒计时
    this.timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(`时间: ${this.timeLeft}`);

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      loop: true
    });
  }

  spawnCollectible() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const x = width / 2 + Phaser.Math.Between(-250, 250);
    const y = height / 2 + Phaser.Math.Between(-50, 50);

    const collectible = this.add.circle(x, y, 15, 0xffff00);
    collectible.setInteractive({ useHandCursor: true });

    collectible.on('pointerdown', () => {
      this.score += 10;
      this.scoreText.setText(`得分: ${this.score}`);
      collectible.destroy();

      // 粒子效果
      this.tweens.add({
        targets: collectible,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 200
      });
    });

    this.collectibles.add(collectible);

    // 3秒后自动消失
    this.time.delayedCall(3000, () => {
      if (collectible.active) {
        collectible.destroy();
      }
    });
  }

  createPuzzleGame() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.title.setText('记忆游戏');

    // 简单的记忆游戏
    this.score = 0;
    this.sequence = [];
    this.playerSequence = [];
    this.level = 1;

    // 说明
    const instruction = this.add.text(
      width / 2,
      height / 2 - 100,
      '记住闪烁的顺序',
      {
        fontSize: '18px',
        fill: '#ffffff'
      }
    );
    instruction.setOrigin(0.5);

    // 创建4个按钮
    this.puzzleButtons = [];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    const positions = [
      { x: width / 2 - 80, y: height / 2 },
      { x: width / 2 + 80, y: height / 2 },
      { x: width / 2 - 80, y: height / 2 + 80 },
      { x: width / 2 + 80, y: height / 2 + 80 }
    ];

    positions.forEach((pos, index) => {
      const button = this.add.rectangle(pos.x, pos.y, 60, 60, colors[index]);
      button.setInteractive({ useHandCursor: true });
      button.setData('index', index);

      button.on('pointerdown', () => {
        this.handlePuzzleClick(index);
      });

      this.puzzleButtons.push(button);
    });

    // 得分显示
    this.scoreText = this.add.text(width / 2, height / 2 + 150, '关卡: 1', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    this.scoreText.setOrigin(0.5);

    // 开始游戏
    this.time.delayedCall(1000, () => {
      this.playSequence();
    });
  }

  playSequence() {
    // 添加新的随机数
    this.sequence.push(Phaser.Math.Between(0, 3));
    this.playerSequence = [];

    let delay = 0;
    this.sequence.forEach((index, i) => {
      this.time.delayedCall(delay, () => {
        this.flashButton(index);
      });
      delay += 800;
    });
  }

  flashButton(index) {
    const button = this.puzzleButtons[index];
    const originalColor = button.fillColor;

    button.setFillStyle(0xffffff);
    this.time.delayedCall(400, () => {
      button.setFillStyle(originalColor);
    });
  }

  handlePuzzleClick(index) {
    this.playerSequence.push(index);

    this.flashButton(index);

    // 检查是否正确
    const currentIndex = this.playerSequence.length - 1;
    if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
      // 错误
      this.showFeedback('错误！', 0xff0000);
      this.time.delayedCall(1000, () => {
        this.endGame();
      });
      return;
    }

    // 检查是否完成这一轮
    if (this.playerSequence.length === this.sequence.length) {
      this.level++;
      this.score += this.level * 100;
      this.scoreText.setText(`关卡: ${this.level}`);

      if (this.level > 5) {
        // 完成5关就结束
        this.time.delayedCall(1000, () => {
          this.endGame();
        });
      } else {
        this.time.delayedCall(1000, () => {
          this.playSequence();
        });
      }
    }
  }

  endGame() {
    console.log('小游戏结束，得分:', this.score);

    // 清理定时器
    if (this.timer) {
      this.timer.remove();
    }
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    // 提交得分到服务器
    const user = window.gameState.getUser();
    if (user) {
      window.networkManager.completeMinigame(
        user.id,
        this.sceneId,
        this.minigameId,
        this.score
      ).then((result) => {
        console.log('小游戏奖励:', result);
        
        // 直接使用服务器返回的最新用户数据
        if (result.success && result.user) {
          // 更新游戏状态并保存到localStorage
          window.gameState.setUser(result.user);
          
          // 如果升级了，显示详细升级信息
          if (result.leveled) {
            window.uiManager.showLevelUpNotification(result);
          }
          
          // 显示奖励
          window.uiManager.showRewards(result.rewards);
          
          // 刷新UI显示（重要！）
          window.uiManager.refreshCurrentView();
          
          console.log('✅ 用户数据已更新', {
            经验: result.user.experience,
            等级: result.user.level,
            背包物品数: result.user.inventory.items.length,
            升级信息: result.leveled ? {
              新等级: result.newLevel,
              属性增加: result.attributeGains,
              可用属性点: `+${result.attributePointsGained}`,
              背包格子: `+${result.slotsGained}`
            } : null
          });
        }
      }).catch(error => {
        console.error('提交小游戏得分失败:', error);
      });
    }

    // 关闭小游戏场景
    this.time.delayedCall(2000, () => {
      this.closeMinigame();
    });
  }

  createCloseButton() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const closeBtn = this.add.text(
      width / 2 + 250,
      height / 2 - 180,
      '×',
      {
        fontSize: '48px',
        fill: '#ff0000'
      }
    );
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.closeMinigame();
    });
  }

  closeMinigame() {
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}

