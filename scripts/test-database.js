/**
 * 数据库测试脚本
 * 测试数据库连接和基本操作
 */

const db = require('../server/config/database');
const DatabaseService = require('../server/services/DatabaseService');

async function testDatabase() {
  console.log('🧪 开始测试数据库...\n');

  try {
    // 1. 测试连接
    console.log('1️⃣  测试数据库连接...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }
    console.log('');

    // 2. 创建DatabaseService实例
    console.log('2️⃣  初始化DatabaseService...');
    const dbService = new DatabaseService();
    await new Promise(resolve => setTimeout(resolve, 500)); // 等待初始化
    console.log('   ✅ DatabaseService初始化成功\n');

    // 3. 测试创建用户
    console.log('3️⃣  测试创建用户...');
    const testUsername = `testuser_${Date.now()}`;
    const { userId, sessionId } = await dbService.createUser(
      testUsername,
      'password123',
      `${testUsername}@test.com`
    );
    console.log(`   ✅ 用户创建成功: ${testUsername}`);
    console.log(`   用户ID: ${userId}`);
    console.log(`   会话ID: ${sessionId}\n`);

    // 4. 测试查询用户
    console.log('4️⃣  测试查询用户...');
    const user = await dbService.findUserByIdAsync(userId);
    console.log('   ✅ 用户查询成功');
    console.log(`   用户名: ${user.username}`);
    console.log(`   等级: ${user.level}`);
    console.log(`   经验: ${user.experience}`);
    console.log(`   属性点: ${user.attributePoints}`);
    console.log(`   力量: ${user.attributes.strength}`);
    console.log(`   战力: ${user.power}\n`);

    // 5. 测试加属性点
    console.log('5️⃣  测试加属性点...');
    await dbService.addAttribute(userId, 'strength', 1);
    const userAfterAdd = await dbService.findUserByIdAsync(userId);
    console.log('   ✅ 加点成功');
    console.log(`   力量: ${user.attributes.strength} → ${userAfterAdd.attributes.strength}`);
    console.log(`   属性点: ${user.attributePoints} → ${userAfterAdd.attributePoints}`);
    console.log(`   战力: ${user.power} → ${userAfterAdd.power}\n`);

    // 6. 测试添加经验和升级
    console.log('6️⃣  测试添加经验和升级...');
    const levelUpInfo = await dbService.addExperienceAsync(userId, 150);
    const userAfterLevelUp = await dbService.findUserByIdAsync(userId);
    console.log('   ✅ 经验添加成功');
    console.log(`   等级: ${user.level} → ${userAfterLevelUp.level}`);
    console.log(`   经验: ${userAfterLevelUp.experience}`);
    if (levelUpInfo.leveled) {
      console.log(`   🎉 升级了！`);
      console.log(`   升了 ${levelUpInfo.levelsGained} 级`);
      console.log(`   属性增加:`, levelUpInfo.attributeGains);
      console.log(`   获得属性点: ${levelUpInfo.attributePointsGained}`);
      console.log(`   获得背包格子: ${levelUpInfo.slotsGained}`);
    }
    console.log('');

    // 7. 测试背包
    console.log('7️⃣  测试背包操作...');
    const testItem = {
      id: `item_${Date.now()}`,
      name: '测试道具',
      type: 'consumable',
      quality: 'common'
    };
    await dbService.addItem(userId, testItem);
    const userWithItem = await dbService.findUserByIdAsync(userId);
    console.log('   ✅ 物品添加成功');
    console.log(`   背包格子: ${userWithItem.inventory.slots}`);
    console.log(`   物品数量: ${userWithItem.inventory.items.length}`);
    console.log(`   最后添加: ${userWithItem.inventory.items[userWithItem.inventory.items.length - 1].name}\n`);

    // 8. 测试签到
    console.log('8️⃣  测试每日签到...');
    const checkinResult = await dbService.dailyCheckin(userId);
    console.log('   ✅ 签到成功');
    console.log(`   连续签到: ${checkinResult.consecutiveDays} 天`);
    console.log(`   获得奖励: ${checkinResult.reward} 属性点\n`);

    // 9. 测试排行榜
    console.log('9️⃣  测试排行榜...');
    await dbService.updateRankings();
    const rankings = await dbService.getGlobalRankings(10);
    console.log('   ✅ 排行榜更新成功');
    console.log(`   前${rankings.length}名:`);
    rankings.slice(0, 5).forEach(rank => {
      console.log(`      ${rank.rank}. ${rank.username} - 战力: ${rank.power}`);
    });
    console.log('');

    // 10. 清理测试数据
    console.log('🔟 清理测试数据...');
    await db.query('DELETE FROM users WHERE username = ?', [testUsername]);
    console.log('   ✅ 测试数据已清理\n');

    // 关闭数据库连接
    await db.close();

    console.log('🎉 所有测试通过！\n');
    console.log('✅ 数据库配置正确，可以启动服务器了！\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('堆栈:', error.stack);
    process.exit(1);
  }
}

// 运行测试
testDatabase();

