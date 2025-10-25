/**
 * 诊断脚本 - 检查服务器状态和数据库连接
 */

const http = require('http');

console.log('🔍 开始诊断...\n');

// 1. 检查后端服务器是否在运行
console.log('1️⃣  检查后端服务器 (localhost:3001)...');
const backendReq = http.get('http://localhost:3001/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('   ✅ 后端服务器运行正常');
      console.log(`   响应: ${data}\n`);
    } else {
      console.log(`   ⚠️  后端服务器响应异常: ${res.statusCode}\n`);
    }
    checkFrontend();
  });
});

backendReq.on('error', (err) => {
  console.log('   ❌ 后端服务器未运行或无法连接');
  console.log(`   错误: ${err.message}`);
  console.log('   请运行: npm run dev:server\n');
  checkFrontend();
});

// 2. 检查前端服务器
function checkFrontend() {
  console.log('2️⃣  检查前端服务器 (localhost:3000)...');
  const frontendReq = http.get('http://localhost:3000', (res) => {
    if (res.statusCode === 200) {
      console.log('   ✅ 前端服务器运行正常\n');
    } else {
      console.log(`   ⚠️  前端服务器响应异常: ${res.statusCode}\n`);
    }
    checkDatabase();
  });

  frontendReq.on('error', (err) => {
    console.log('   ❌ 前端服务器未运行');
    console.log(`   错误: ${err.message}`);
    console.log('   请运行: npm run dev:client\n');
    checkDatabase();
  });
}

// 3. 检查数据库
async function checkDatabase() {
  console.log('3️⃣  检查数据库连接...');
  try {
    require('dotenv').config();
    const db = require('../server/config/database');
    
    const connected = await db.testConnection();
    if (connected) {
      console.log('   ✅ 数据库连接正常\n');
      
      // 检查表是否存在
      console.log('4️⃣  检查数据库表...');
      try {
        const tables = await db.query('SHOW TABLES');
        if (tables.length >= 12) {
          console.log(`   ✅ 数据库表完整 (${tables.length}个表)\n`);
        } else {
          console.log(`   ⚠️  数据库表不完整 (只有${tables.length}个表，应该有12个)`);
          console.log('   请运行: npm run db:setup\n');
        }
      } catch (error) {
        console.log('   ❌ 数据库表检查失败');
        console.log(`   错误: ${error.message}`);
        console.log('   请运行: npm run db:setup\n');
      }
      
      await db.close();
    } else {
      console.log('   ❌ 数据库连接失败');
      console.log('   请检查 .env 配置和MySQL服务\n');
    }
  } catch (error) {
    console.log('   ❌ 数据库检查失败');
    console.log(`   错误: ${error.message}`);
    console.log('   请运行: npm run db:setup\n');
  }
  
  printSummary();
}

function printSummary() {
  console.log('='.repeat(50));
  console.log('📋 诊断总结\n');
  console.log('如果以上有❌标记，请按提示操作：\n');
  console.log('1. 后端未运行 → npm run dev:server');
  console.log('2. 前端未运行 → npm run dev:client');
  console.log('3. 数据库未连接 → 检查MySQL服务和.env配置');
  console.log('4. 数据库表缺失 → npm run db:setup');
  console.log('='.repeat(50));
  console.log('');
  
  process.exit(0);
}

// 设置超时
setTimeout(() => {
  console.log('\n⏰ 诊断超时\n');
  process.exit(1);
}, 10000);

