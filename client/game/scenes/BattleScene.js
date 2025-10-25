import Phaser from 'phaser';

/**
 * 战斗场景 - PVP对战
 */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.battleData = data;
    this.battleId = data.battleId;
    this.opponent = data.opponent;
    this.isMyTurn = data.yourTurn;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // 标题
    const title = this.add.text(width / 2, 50, 'PVP 对战', {
      fontSize: '36px',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // 玩家信息
    this.createPlayerDisplay();

    // 对手信息
    this.createOpponentDisplay();

    // 技能按钮
    this.createSkillButtons();

    // 战斗日志
    this.createBattleLog();

    // 回合提示
    this.turnText = this.add.text(width / 2, height / 2, '', {
      fontSize: '32px',
      fill: '#ffffff'
    });
    this.turnText.setOrigin(0.5);

    this.updateTurnDisplay();

    // 监听战斗事件
    window.networkManager.on('pvp:action:result', (data) => {
      this.handleActionResult(data);
    });

    window.networkManager.on('pvp:end', (data) => {
      this.handleBattleEnd(data);
    });
  }

  createPlayerDisplay() {
    const user = window.gameState.getUser();
    
    // 玩家位置（左下）
    const x = 150;
    const y = this.cameras.main.height - 200;

    // 玩家角色
    const playerSprite = this.add.rectangle(x, y, 60, 80, 0x00ff00);

    // 玩家名字
    const playerName = this.add.text(x, y - 60, user.username, {
      fontSize: '18px',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    });
    playerName.setOrigin(0.5);

    // 血条背景
    const hpBarBg = this.add.rectangle(x, y + 60, 120, 20, 0x333333);
    
    // 血条
    this.playerHpBar = this.add.rectangle(x - 60, y + 60, 120, 16, 0xff0000);
    this.playerHpBar.setOrigin(0, 0.5);

    // HP文字
    this.playerHpText = this.add.text(x, y + 60, '100/100', {
      fontSize: '14px',
      fill: '#ffffff'
    });
    this.playerHpText.setOrigin(0.5);
  }

  createOpponentDisplay() {
    // 对手位置（右上）
    const x = this.cameras.main.width - 150;
    const y = 200;

    // 对手角色
    const opponentSprite = this.add.rectangle(x, y, 60, 80, 0xff0000);

    // 对手名字
    const opponentName = this.add.text(x, y - 60, this.opponent.username, {
      fontSize: '18px',
      fill: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 3
    });
    opponentName.setOrigin(0.5);

    // 血条背景
    const hpBarBg = this.add.rectangle(x, y + 60, 120, 20, 0x333333);
    
    // 血条
    this.opponentHpBar = this.add.rectangle(x - 60, y + 60, 120, 16, 0xff0000);
    this.opponentHpBar.setOrigin(0, 0.5);

    // HP文字
    this.opponentHpText = this.add.text(x, y + 60, '100/100', {
      fontSize: '14px',
      fill: '#ffffff'
    });
    this.opponentHpText.setOrigin(0.5);
  }

  createSkillButtons() {
    const user = window.gameState.getUser();
    const skills = user?.skills?.equipped || [];

    const startX = 50;
    const startY = this.cameras.main.height - 100;
    const spacing = 100;

    this.skillButtons = [];

    skills.forEach((skillId, index) => {
      if (!skillId) return;

      const x = startX + index * spacing;
      
      const button = this.add.rectangle(x, startY, 80, 80, 0x667eea);
      button.setInteractive({ useHandCursor: true });

      const label = this.add.text(x, startY, `技能${index + 1}`, {
        fontSize: '14px',
        fill: '#ffffff'
      });
      label.setOrigin(0.5);

      button.on('pointerdown', () => {
        if (this.isMyTurn) {
          this.useSkill(skillId, index);
        }
      });

      button.on('pointerover', () => {
        button.setFillStyle(0x764ba2);
      });

      button.on('pointerout', () => {
        button.setFillStyle(0x667eea);
      });

      this.skillButtons.push({ button, label, skillId });
    });

    // 投降按钮
    const surrenderBtn = this.add.rectangle(
      startX + skills.length * spacing,
      startY,
      80,
      80,
      0xff4444
    );
    surrenderBtn.setInteractive({ useHandCursor: true });

    const surrenderLabel = this.add.text(
      startX + skills.length * spacing,
      startY,
      '投降',
      { fontSize: '16px', fill: '#ffffff' }
    );
    surrenderLabel.setOrigin(0.5);

    surrenderBtn.on('pointerdown', () => {
      this.surrender();
    });
  }

  createBattleLog() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.logText = this.add.text(width / 2, height - 50, '战斗开始！', {
      fontSize: '16px',
      fill: '#ffffff',
      align: 'center'
    });
    this.logText.setOrigin(0.5);
  }

  updateTurnDisplay() {
    if (this.isMyTurn) {
      this.turnText.setText('你的回合');
      this.turnText.setColor('#00ff00');
    } else {
      this.turnText.setText('对手回合');
      this.turnText.setColor('#ff6b6b');
    }

    // 2秒后隐藏
    this.time.delayedCall(2000, () => {
      this.turnText.setText('');
    });
  }

  useSkill(skillId, skillIndex) {
    console.log('使用技能:', skillId);

    const action = {
      type: 'skill',
      skillId: skillId
    };

    window.networkManager.sendPvpAction(this.battleId, action);

    this.logText.setText(`你使用了技能 ${skillIndex + 1}`);
    this.isMyTurn = false;
  }

  handleActionResult(data) {
    console.log('战斗动作结果:', data);

    const { result, battle } = data;

    // 更新血条
    this.updateHealthBars(battle);

    // 更新日志
    if (result.damage) {
      this.logText.setText(`造成了 ${result.damage} 点伤害！`);
    }

    // 切换回合
    const user = window.gameState.getUser();
    this.isMyTurn = battle.currentTurn === user.id;
    this.updateTurnDisplay();
  }

  updateHealthBars(battle) {
    const user = window.gameState.getUser();
    
    const playerData = battle.players[user.id];
    const opponentData = Object.values(battle.players).find(
      p => p.user.id !== user.id
    );

    if (playerData) {
      const hpPercent = playerData.hp / playerData.maxHp;
      this.playerHpBar.width = 120 * hpPercent;
      this.playerHpText.setText(`${playerData.hp}/${playerData.maxHp}`);
    }

    if (opponentData) {
      const hpPercent = opponentData.hp / opponentData.maxHp;
      this.opponentHpBar.width = 120 * hpPercent;
      this.opponentHpText.setText(`${opponentData.hp}/${opponentData.maxHp}`);
    }
  }

  handleBattleEnd(data) {
    console.log('战斗结束:', data);

    const { result, rewards } = data;

    let message = '';
    if (result === 'victory') {
      message = '🎉 胜利！\n';
    } else {
      message = '💀 失败！\n';
    }

    if (rewards) {
      message += `获得 ${rewards.exp} 经验值\n`;
      message += `等级分 ${rewards.rating > 0 ? '+' : ''}${rewards.rating}`;
    }

    // 显示结果
    const resultText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      message,
      {
        fontSize: '32px',
        fill: result === 'victory' ? '#00ff00' : '#ff0000',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center'
      }
    );
    resultText.setOrigin(0.5);

    // 3秒后返回主场景
    this.time.delayedCall(3000, () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }

  surrender() {
    if (confirm('确定要投降吗？')) {
      window.networkManager.surrenderPvp();
    }
  }
}

