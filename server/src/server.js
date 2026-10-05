const express = require('express');
const dotenv = require('dotenv');
const pool  = require('./database/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const checkDatabaseConnection = async () => {
    try {
        const [rows] = await pool.query('select 1 + 1 as result');
        console.log('database connect', rows[0].ressult);
        
    } catch (error) {
        console.error("faild to connect",error.message);
    }
}

checkDatabaseConnection();

app.get('/', (req, res) => {
    res.send('server is up and running');
})

app.get('/api/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, display_name, email, auth_provider frm user')
        res.json(users)
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});