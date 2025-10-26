import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { MinigameScene } from './scenes/MinigameScene.js';
import { RealtimePvpScene } from './scenes/RealtimePvpScene.js';

export const GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: window.innerWidth - 400, // 减去右侧UI面板宽度
  height: window.innerHeight,
  backgroundColor: '#0f0f1e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MainMenuScene,
    GameScene,
    BattleScene,
    MinigameScene,
    RealtimePvpScene
  ],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

