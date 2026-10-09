const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const pool = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Built-in middleware
app.use(cors());
app.use(express.json());

// Mount feature routes
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Root health check
app.get('/', (req, res) => {
  res.send('Server is running smoothly!');
});

// Create HTTP server and bind socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allows connection from local frontend during development
    methods: ['GET', 'POST'],
  },
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('⚡ A user connected with socket ID:', socket.id);


// Join private conversation room
  socket.on('join_room', (newRoomId) => {
    // Leave all previous conversation rooms
    for (const room of socket.rooms) {
      if (room !== socket.id && room.startsWith('conv_')) {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
      }
    }

    socket.join(newRoomId);
    console.log(`Socket ${socket.id} joined private room: ${newRoomId}`);
  });

  // Handle typing indicator
  socket.on('typing', ({ conversationId, displayName }) => {
    socket.to(conversationId).emit('user_typing', { displayName });
  });

  // Handle stop typing
  socket.on('stop_typing', ({ conversationId }) => {
    socket.to(conversationId).emit('user_stop_typing');
  });

  // Handle incoming message
  socket.on('send_message', async (data) => {
    const { conversationId, senderId, messageText } = data;

    try {
      // 1. Persist message directly into MySQL
      const [result] = await pool.query(
        'INSERT INTO messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)',
        [conversationId, senderId, messageText]
      );

      // 2. Fetch the newly inserted message with sender display details
      const [rows] = await pool.query(
        `SELECT m.id, m.conversation_id, m.sender_id, m.message_text, m.created_at, u.display_name, u.avatar_url
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      const savedMessage = rows[0];

      // 3. Broadcast to all clients inside this conversation room
      io.to(conversationId).emit('receive_message', savedMessage);
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error_message', { error: 'Failed to send message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database ping and server start
async function startServer() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log(`Database connected successfully (result: ${rows[0].result})`);

    server.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    process.exit(1);
  }
}

startServer();