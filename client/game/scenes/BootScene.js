import Phaser from 'phaser';

/**
 * 启动场景 - 预加载资源
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 显示加载进度
    this.createLoadingBar();

    // 这里可以预加载游戏资源
    // 由于没有实际的图片资源，我们使用颜色代替
    // this.load.image('player', 'assets/player.png');
    // this.load.image('background', 'assets/bg.png');
  }

  createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 加载文字
    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '32px',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5);

    // 进度条背景
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 200, height / 2, 400, 30);

    // 进度条
    const progressBar = this.add.graphics();

    // 加载进度事件
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x667eea, 1);
      progressBar.fillRect(width / 2 - 195, height / 2 + 5, 390 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create() {
    // 启动完成，进入主菜单
    this.scene.start('MainMenuScene');
  }
}

