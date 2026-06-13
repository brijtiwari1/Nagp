const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Database connection config using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

app.get('/api/items', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM  employees;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.listen(process.env.PORT || 3000);
