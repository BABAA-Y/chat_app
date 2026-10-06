const express = require('express');
const { getOrCreateConversation, getMessages } = require('../controllers/chatController');
const router = express.Router();

router.post('/conversations', getOrCreateConversation);
router.get('/messages/:conversationId', getMessages);

module.exports = router;
