-- ============================================
-- FightFight RPG 游戏数据库结构
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS fightfight_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fightfight_game;

-- ============================================
-- 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY COMMENT '用户ID (UUID)',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码 (bcrypt加密)',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    session_id VARCHAR(100) COMMENT '会话ID',
    last_login DATETIME COMMENT '最后登录时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基本信息表';

-- ============================================
-- 用户档案表 (user_profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    level INT DEFAULT 1 COMMENT '等级',
    experience INT DEFAULT 0 COMMENT '当前经验值',
    attribute_points INT DEFAULT 5 COMMENT '可用属性点',
    power INT DEFAULT 0 COMMENT '战力值',
    current_scene VARCHAR(50) DEFAULT 'forest' COMMENT '当前场景',
    stats JSON COMMENT '统计数据 (登录次数、完成任务数等)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_level (level),
    INDEX idx_power (power)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户档案表';

-- ============================================
-- 用户属性表 (user_attributes)
-- ============================================
CREATE TABLE IF NOT EXISTS user_attributes (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    strength INT DEFAULT 10 COMMENT '力量',
    agility INT DEFAULT 10 COMMENT '敏捷',
    intelligence INT DEFAULT 10 COMMENT '智力',
    endurance INT DEFAULT 10 COMMENT '耐力',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户属性表';

-- ============================================
-- 用户背包表 (user_inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS user_inventory (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    slots INT DEFAULT 10 COMMENT '背包格子数',
    items JSON COMMENT '物品列表 (JSON数组)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户背包表';

-- ============================================
-- 用户技能表 (user_skills)
-- ============================================
CREATE TABLE IF NOT EXISTS user_skills (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    unlocked JSON COMMENT '已解锁的技能列表',
    active JSON COMMENT '当前激活的技能',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户技能表';

-- ============================================
-- 用户任务表 (user_quests)
-- ============================================
CREATE TABLE IF NOT EXISTS user_quests (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    daily JSON COMMENT '每日任务',
    weekly JSON COMMENT '每周任务',
    main JSON COMMENT '主线任务',
    side JSON COMMENT '支线任务',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户任务表';

-- ============================================
-- 用户成就表 (user_achievements)
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    achievements JSON COMMENT '成就列表',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就表';

-- ============================================
-- 用户签到表 (user_checkin)
-- ============================================
CREATE TABLE IF NOT EXISTS user_checkin (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    last_date DATE COMMENT '最后签到日期',
    consecutive_days INT DEFAULT 0 COMMENT '连续签到天数',
    total_days INT DEFAULT 0 COMMENT '总签到天数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户签到表';

-- ============================================
-- 好友关系表 (friendships)
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关系ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    friend_id VARCHAR(36) NOT NULL COMMENT '好友ID',
    status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending' COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (user_id, friend_id),
    INDEX idx_user (user_id),
    INDEX idx_friend (friend_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- ============================================
-- 排行榜表 (rankings)
-- ============================================
CREATE TABLE IF NOT EXISTS rankings (
    user_id VARCHAR(36) PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    level INT DEFAULT 1 COMMENT '等级',
    power INT DEFAULT 0 COMMENT '战力',
    rank INT COMMENT '排名',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_power (power DESC),
    INDEX idx_rank (rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排行榜表';

-- ============================================
-- PVP房间表 (pvp_rooms)
-- ============================================
CREATE TABLE IF NOT EXISTS pvp_rooms (
    id VARCHAR(36) PRIMARY KEY COMMENT '房间ID',
    host_id VARCHAR(36) NOT NULL COMMENT '房主ID',
    guest_id VARCHAR(36) COMMENT '客人ID',
    status ENUM('waiting', 'ready', 'playing', 'finished') DEFAULT 'waiting' COMMENT '状态',
    room_data JSON COMMENT '房间数据',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_host (host_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PVP房间表';

-- ============================================
-- PVP对战记录表 (pvp_matches)
-- ============================================
CREATE TABLE IF NOT EXISTS pvp_matches (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '对战ID',
    room_id VARCHAR(36) NOT NULL COMMENT '房间ID',
    player1_id VARCHAR(36) NOT NULL COMMENT '玩家1 ID',
    player2_id VARCHAR(36) NOT NULL COMMENT '玩家2 ID',
    winner_id VARCHAR(36) COMMENT '胜利者ID',
    match_data JSON COMMENT '对战数据',
    duration INT COMMENT '对战时长(秒)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES pvp_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room (room_id),
    INDEX idx_player1 (player1_id),
    INDEX idx_player2 (player2_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PVP对战记录表';

-- ============================================
-- 创建视图：用户完整信息
-- ============================================
CREATE OR REPLACE VIEW view_user_full AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.session_id,
    u.last_login,
    u.created_at as registered_at,
    p.level,
    p.experience,
    p.attribute_points,
    p.power,
    p.current_scene,
    p.stats,
    a.strength,
    a.agility,
    a.intelligence,
    a.endurance,
    i.slots,
    i.items,
    s.unlocked as skills_unlocked,
    s.active as skills_active
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_attributes a ON u.id = a.user_id
LEFT JOIN user_inventory i ON u.id = i.user_id
LEFT JOIN user_skills s ON u.id = s.user_id;

-- ============================================
-- 初始化测试数据（可选）
-- ============================================
-- 注意：密码是 'password123' 的bcrypt哈希值
-- INSERT INTO users (id, username, password, email) VALUES
-- ('test-user-001', 'testuser1', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'test1@example.com'),
-- ('test-user-002', 'testuser2', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'test2@example.com');

