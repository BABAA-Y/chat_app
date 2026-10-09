const pool = require('../database/db');

// @desc    Get or create a strictly private 1-on-1 conversation
// @route   POST /api/chat/conversations
const getOrCreateConversation = async (req, res) => {
  const { userOneId, userTwoId } = req.body;

  if (!userOneId || !userTwoId) {
    return res.status(400).json({ error: 'Both userOneId and userTwoId are required' });
  }

  // Sort IDs so [A, B] and [B, A] always map to the exact same room
  const [firstUser, secondUser] = [userOneId, userTwoId].sort();
  const deterministicId = `conv_${firstUser}_${secondUser}`;

  try {
    // 1. Check if this exact pair already has a conversation
    const [rows] = await pool.query(
      `SELECT id, created_at FROM conversations 
       WHERE (user_one_id = ? AND user_two_id = ?) 
          OR (user_one_id = ? AND user_two_id = ?)`,
      [firstUser, secondUser, secondUser, firstUser]
    );

    if (rows && rows.length > 0) {
      return res.status(200).json(rows[0]);
    }

    // 2. If not found, create a private room unique to these two users
    await pool.query(
      'INSERT INTO conversations (id, user_one_id, user_two_id) VALUES (?, ?, ?)',
      [deterministicId, firstUser, secondUser]
    );

    return res.status(201).json({
      id: deterministicId,
      user_one_id: firstUser,
      user_two_id: secondUser,
    });
  } catch (error) {
    console.error('Error handling conversation:', error);
    return res.status(500).json({ error: 'Failed to access conversation' });
  }
};

// @desc    Get message history for this private conversation
// @route   GET /api/chat/messages/:conversationId
const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const [messages] = await pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.message_text, m.created_at, u.display_name, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

module.exports = {
  getOrCreateConversation,
  getMessages,
};