/**
 * 数据库安装脚本
 * 用于初始化MySQL数据库
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 开始安装数据库...\n');

  try {
    // 1. 连接到MySQL服务器（不指定数据库）
    console.log('1️⃣  连接到MySQL服务器...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    console.log('   ✅ 连接成功!\n');

    // 2. 创建数据库
    console.log('2️⃣  创建数据库...');
    const dbName = process.env.DB_DATABASE || 'fightfight_game';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`   ✅ 数据库 "${dbName}" 创建成功!\n`);

    // 3. 切换到新数据库
    await connection.query(`USE ${dbName}`);

    // 4. 读取并执行schema.sql
    console.log('3️⃣  创建数据表...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 移除CREATE DATABASE和USE语句（已经手动执行）
    schema = schema.replace(/CREATE DATABASE.*?;/gs, '');
    schema = schema.replace(/USE.*?;/g, '');
    
    await connection.query(schema);
    console.log('   ✅ 数据表创建成功!\n');

    // 5. 验证表结构
    console.log('4️⃣  验证表结构...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`   ✅ 成功创建 ${tables.length} 个表:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`      - ${tableName}`);
    });

    // 6. 关闭连接
    await connection.end();

    console.log('\n🎉 数据库安装完成！\n');
    console.log('📝 下一步:');
    console.log('   1. 检查 .env 文件中的数据库配置');
    console.log('   2. 运行 npm install 安装依赖');
    console.log('   3. 运行 npm run dev:server 启动服务器\n');

  } catch (error) {
    console.error('\n❌ 安装失败:', error.message);
    console.error('\n📝 请检查:');
    console.error('   1. MySQL 服务是否启动');
    console.error('   2. .env 文件中的数据库配置是否正确');
    console.error('   3. MySQL用户是否有CREATE权限\n');
    process.exit(1);
  }
}

// 运行安装
setupDatabase();

