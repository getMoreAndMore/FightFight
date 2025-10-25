/**
 * 数据库配置和连接池
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'fightfight_game',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功!');
    console.log(`   数据库: ${dbConfig.database}`);
    console.log(`   主机: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('   请检查：');
    console.error('   1. MySQL 服务是否启动');
    console.error('   2. .env 配置是否正确');
    console.error('   3. 数据库是否已创建 (运行 database/schema.sql)');
    return false;
  }
}

/**
 * 执行查询
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('SQL执行错误:', error.message);
    console.error('SQL:', sql);
    console.error('参数:', params);
    throw error;
  }
}

/**
 * 执行事务
 * @param {Function} callback - 事务回调函数
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 关闭连接池
 */
async function close() {
  await pool.end();
  console.log('数据库连接池已关闭');
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  close
};

