const pool = require('../database/db');

const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`SELECT id, display_name, email, avatar_url, auth_provider from users `)
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getAllUsers
} ;