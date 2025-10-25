/**
 * 启动前检查脚本
 * 确保所有必要的配置都已完成
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查系统配置...\n');

let hasErrors = false;

// 1. 检查.env文件
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ 错误: 未找到 .env 文件');
  console.error('   请复制 .env.example 为 .env 并配置数据库信息\n');
  hasErrors = true;
} else {
  console.log('✅ .env 文件存在');
  
  // 检查必要的环境变量
  require('dotenv').config();
  
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ 错误: .env 文件缺少以下配置:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('');
    hasErrors = true;
  } else {
    console.log('✅ 环境变量配置完整\n');
  }
}

// 2. 检查node_modules
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ 错误: 未找到 node_modules 目录');
  console.error('   请运行: npm install\n');
  hasErrors = true;
} else {
  console.log('✅ 依赖已安装');
}

// 3. 检查必要的依赖
const requiredPackages = ['mysql2', 'express', 'socket.io', 'dotenv'];
const missingPackages = [];

requiredPackages.forEach(pkg => {
  try {
    require.resolve(pkg);
  } catch (e) {
    missingPackages.push(pkg);
  }
});

if (missingPackages.length > 0) {
  console.error('❌ 错误: 缺少以下依赖包:');
  missingPackages.forEach(pkg => console.error(`   - ${pkg}`));
  console.error('   请运行: npm install\n');
  hasErrors = true;
} else {
  console.log('✅ 所有依赖就绪\n');
}

// 4. 提示数据库设置
console.log('📋 下一步:');
if (hasErrors) {
  console.log('   1. 修复上述错误');
  console.log('   2. 运行: npm run db:setup  (首次安装)');
  console.log('   3. 运行: npm run dev:server\n');
  process.exit(1);
} else {
  console.log('   ✅ 配置检查通过!');
  console.log('   如果这是首次运行，请先执行:');
  console.log('      npm run db:setup');
  console.log('   然后启动服务器:');
  console.log('      npm run dev:server\n');
}

