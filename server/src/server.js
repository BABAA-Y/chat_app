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


// create http server and bind socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allows connection form local frontend during devlopment
    methods: ['GET','POST']
  },
});

// socket.io connection logic
io.on('connection', (socket) =>{
  console.log('⚡ A user connected with socket ID:', socket.id);
  
  // join a specific chat room 
  socket.on('join_room', (conversationId) => {
  socket.join(conversationId);
  console.log(`user ${socket.id} joined room: ${conversationId}`);
});

// handle incoming message 
socket.on('send_message', async (data) => {
  const { conversationId, senderId, messageText } = data;
  
  try {
    // 1. persist message directly  into my sql 
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

    // 3. broadcast to all client inside this convo room 
    io.to(conversationId).emit('receive_message', savedMessage);
  } catch (error) {
    console.error('Socket message error: ', error);
    socket.emit('error_message', {error: 'failed to send message'})
  }
  });

  // handle disconnection 
socket.on('disconnect', () => {
  console.log('user disconnect: ', socket.id);
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