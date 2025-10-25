-- ============================================
-- 数据库初始化脚本
-- 用于首次安装时快速初始化
-- ============================================

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS fightfight_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 使用数据库
USE fightfight_game;

-- 3. 执行完整的schema
SOURCE schema.sql;

-- 4. 显示创建的表
SHOW TABLES;

-- 5. 完成提示
SELECT '数据库初始化完成！' AS status;

