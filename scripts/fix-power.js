require('dotenv').config();
const db = require('../server/config/database');
const { POWER_WEIGHTS } = require('../shared/constants.cjs');

async function fixAllUsersPower() {
  console.log('🔧 开始修复所有用户的战力...\n');
  
  try {
    // 获取所有用户
    const users = await db.query(`
      SELECT 
        u.id, u.username,
        p.level,
        a.strength, a.agility, a.intelligence, a.endurance
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN user_attributes a ON u.id = a.user_id
    `);

    console.log(`📊 找到 ${users.length} 个用户\n`);

    let updated = 0;
    for (const user of users) {
      // 计算正确的战力
      const power = Math.floor(
        user.strength * POWER_WEIGHTS.STRENGTH +
        user.agility * POWER_WEIGHTS.AGILITY +
        user.intelligence * POWER_WEIGHTS.INTELLIGENCE +
        user.endurance * POWER_WEIGHTS.ENDURANCE +
        user.level * POWER_WEIGHTS.LEVEL
      );

      // 更新数据库
      await db.query(
        'UPDATE user_profiles SET power = ? WHERE user_id = ?',
        [power, user.id]
      );

      console.log(`✅ ${user.username}: 战力更新为 ${power} (Lv.${user.level}, 力${user.strength} 敏${user.agility} 智${user.intelligence} 耐${user.endurance})`);
      updated++;
    }

    console.log(`\n✅ 完成！共更新 ${updated} 个用户的战力`);
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    process.exit(0);
  }
}

fixAllUsersPower();

