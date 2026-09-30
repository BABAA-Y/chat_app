USE chat_app_db;

-- 1. Insert Mock Users

INSERT INTO users (id, email, display_name, avatar_url, auth_provider)
VALUES 
('usr_111', 'ayush@example.com', 'Ayush', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ayush', 'google'),
('usr_222', 'alex@example.com', 'Alex', 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', 'google'),
('usr_333', NULL, 'GuestRider', 'https://api.dicebear.com/7.x/bottts/svg?seed=GuestRider', 'guest')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- 2. Insert Mock Conversation

INSERT INTO conversations (id, user_one_id, user_two_id)
VALUES ('conv_001', 'usr_111', 'usr_222')
ON DUPLICATE KEY UPDATE id = id;

-- 3. Insert Mock Messages

INSERT INTO messages (conversation_id, sender_id, message_text)
VALUES 
('conv_001', 'usr_111', 'Hey Alex, are you online?'),
('conv_001', 'usr_222', 'Yes! Just setting up the database.'),
('conv_001', 'usr_111', 'Awesome, real-time sockets next!');

