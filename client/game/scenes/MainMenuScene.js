import Phaser from 'phaser';

/**
 * 主菜单场景
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景渐变
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1);
    gradient.fillRect(0, 0, width, height);

    // 游戏标题
    const title = this.add.text(width / 2, height / 3, 'FIGHT FIGHT', {
      fontSize: '72px',
      fontFamily: 'Arial Black',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000',
        blur: 5,
        fill: true
      }
    });
    title.setOrigin(0.5);

    // 副标题
    const subtitle = this.add.text(width / 2, height / 3 + 80, '横版 RPG 冒险', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'italic'
    });
    subtitle.setOrigin(0.5);

    // 等待用户登录
    const waitingText = this.add.text(width / 2, height / 2 + 100, '请登录以开始游戏', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    waitingText.setOrigin(0.5);

    // 闪烁动画
    this.tweens.add({
      targets: waitingText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // 监听登录成功事件
    window.gameState.on('user:updated', () => {
      this.startGame();
    });
  }

  startGame() {
    // 开始游戏
    this.scene.start('GameScene');
  }
}

