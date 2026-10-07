const pool = require('../database/db');
const getOrCreateConversation = async (req, res) => {
    const { userOneId, userTwoId } = req.body;

    if (!userOneId || !userTwoId) {
        return res.status(400).json({
            error: 'both userOneId and  userTwoId are required'
        });
    }

    const [firstUser, secondUser] = [userOneId, userTwoId].sort();

    try {
        // 1. Check if conversation already exists
        const [existing] = await pool.query(
            'SELECT id, created_at from conversations WHERE user_one_id = ? AND user_two_id = ?',
            [firstUser, secondUser]
        );

        if (existing.length > 0) {
            return res.status(200).json(existing[0]);
        }

        const conversationId = `conv_${Date.now()}`;
        await pool.query(
            'INSERT INTO conversations (id, user_one_id, user_two_id) values (?, ?, ?)'
            [conversationId, firstUser, secondUser]
        );

        res.status(201).json({ id: conversationId, userOneId: firstUser, userTwoId: secondUser });
    } catch (error) {
        console.error('Error handling conversation:', error);
        res.status(500).json({ error: 'Failed to access conversation' });  
    }
};
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
        )

        return res.status(200).json(messages);

    } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
    }
}

module.exports = {
    getMessages, getOrCreateConversation
}