CREATE DATABASE IF NOT EXISTS chat_app_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE chat_app_db;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
    auth_provider ENUM('google', 'guest') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_one_id VARCHAR(36) NOT NULL,
    user_two_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_pair (user_one_id, user_two_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation_history (conversation_id, created_at)
);

INSERT INTO users(id, email, display_name, avatar_url, auth_provider)
VALUES
('usr_111', 'ayush@example.com', 'Ayush', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ayush', 'google'),
('usr_222', 'alex@example.com', 'Alex', 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', 'google'),
('usr_333', NULL, 'GuestRider', 'https://api.dicebear.com/7.x/bottts/svg?seed=GuestRider', 'guest');

INSERT INTO conversations(id, user_one_id, user_two_id)
VALUES
('conv_001', 'usr_111', 'usr_222');

INSERT INTO messages (conversation_id, sender_id, message_text)
VALUES 
('conv_001', 'usr_111', 'Hey Alex, are you online?'),
('conv_001', 'usr_222', 'Yes! Just setting up the database.'),
('conv_001', 'usr_111', 'Awesome, real-time sockets next!');

SELECT 
    m.id AS message_id,
    m.message_text,
    m.created_at,
    u.display_name AS sender_name,
    u.avatar_url AS sender_avatar
FROM messages m
INNER JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = 'conv_001'
ORDER BY m.created_at ASC;

