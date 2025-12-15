import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Neon PostgreSQL connection (FREE)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/valtify?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Auto-create tables
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS vault_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      title TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Database initialized');
}

// Same API routes as above but with PostgreSQL
// ... (similar routes but using pool.query)

app.listen(3000, async () => {
  await initDB();
  console.log('🚀 Server running on port 3000');
});
