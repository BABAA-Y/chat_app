const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const pool = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Built-in middleware
app.use(express.json());

// Mount feature routes
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Root health check
app.get('/', (req, res) => {
  res.send('Server is running smoothly!');
});

// Database ping and server start
async function startServer() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log(`Database connected successfully (result: ${rows[0].result})`);

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    process.exit(1);
  }
}

startServer();