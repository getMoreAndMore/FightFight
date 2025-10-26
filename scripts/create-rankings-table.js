const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRankingsTable() {
  let connection;
  
  try {
    console.log('🔄 连接到数据库...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'fightfight_game'
    });
    
    console.log('✅ 数据库连接成功！');
    
    // 检查表是否存在
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'rankings'"
    );
    
    if (tables.length > 0) {
      console.log('⚠️  rankings 表已存在');
      console.log('🗑️  删除旧表...');
      await connection.query('DROP TABLE rankings');
      console.log('✅ 旧表已删除');
    }
    
    console.log('📋 创建 rankings 表...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rankings (
        user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
        username VARCHAR(50) NOT NULL COMMENT '用户名',
        level INT DEFAULT 1 COMMENT '等级',
        power INT DEFAULT 0 COMMENT '战力',
        \`rank\` INT COMMENT '排名',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_power (power DESC),
        INDEX idx_rank (\`rank\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排行榜表'
    `);
    
    console.log('✅ rankings 表创建成功！');
    
    // 初始化排行榜数据
    console.log('📊 初始化排行榜数据...');
    
    const [users] = await connection.query(`
      SELECT u.id, u.username, p.level, p.power 
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY p.power DESC, p.level DESC
      LIMIT 100
    `);
    
    if (users.length > 0) {
      console.log(`📝 找到 ${users.length} 个用户，开始插入排行榜...`);
      
      for (let i = 0; i < users.length; i++) {
        await connection.query(
          'INSERT INTO rankings (user_id, username, level, power, `rank`) VALUES (?, ?, ?, ?, ?)',
          [users[i].id, users[i].username, users[i].level, users[i].power, i + 1]
        );
      }
      
      console.log(`✅ 成功插入 ${users.length} 条排行榜记录`);
    } else {
      console.log('⚠️  没有找到用户数据');
    }
    
    // 验证数据
    const [rankings] = await connection.query('SELECT COUNT(*) as count FROM rankings');
    console.log(`\n📊 排行榜总记录数: ${rankings[0].count}`);
    
    // 显示前10名
    const [topUsers] = await connection.query(
      'SELECT `rank`, username, level, power FROM rankings ORDER BY `rank` ASC LIMIT 10'
    );
    
    if (topUsers.length > 0) {
      console.log('\n🏆 排行榜前10名:');
      console.log('═'.repeat(60));
      console.log('排名  用户名          等级  战力');
      console.log('─'.repeat(60));
      topUsers.forEach(user => {
        console.log(
          `${String(user.rank).padStart(4)}  ${user.username.padEnd(15)} ${String(user.level).padStart(4)}  ${String(user.power).padStart(6)}`
        );
      });
      console.log('═'.repeat(60));
    }
    
    console.log('\n🎉 完成！rankings 表已创建并初始化');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ 数据库连接已关闭');
    }
  }
}

createRankingsTable();

