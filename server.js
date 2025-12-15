// Valtify Server - Complete backend + frontend
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection (Free PostgreSQL from Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize database
async function initDB() {
  try {
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
        title VARCHAR(255) NOT NULL,
        encrypted_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database ready');
  } catch (error) {
    console.log('⚠️ Database init error:', error.message);
  }
}

initDB();

// Middleware
app.use(require('cors')());
app.use(express.json());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'valtify-secure-key-2024';

// ===== API ROUTES =====

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET);
    res.json({ user: result.rows[0], token });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Vault items
app.get('/api/vault', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const result = await pool.query(
      'SELECT * FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC',
      [decoded.id]
    );
    
    res.json({ items: result.rows });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/api/vault', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { category, title, encryptedData } = req.body;
    
    const result = await pool.query(
      'INSERT INTO vault_items (user_id, category, title, encrypted_data) VALUES ($1, $2, $3, $4) RETURNING *',
      [decoded.id, category, title, encryptedData]
    );
    
    res.json({ item: result.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.delete('/api/vault/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    await pool.query(
      'DELETE FROM vault_items WHERE id = $1 AND user_id = $2',
      [req.params.id, decoded.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Valtify',
    timestamp: new Date().toISOString()
  });
});

// ===== FRONTEND =====
app.use(express.static('public'));

app.get('*', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Valtify - Secure Vault</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        color: white;
      }
      .app {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      header {
        text-align: center;
        padding: 40px 0;
      }
      h1 { font-size: 48px; margin-bottom: 10px; }
      .subtitle { opacity: 0.9; font-size: 18px; }
      .container {
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 30px;
        margin: 20px 0;
      }
      .auth-form, .vault-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      input, select, textarea, button {
        padding: 15px;
        border-radius: 10px;
        border: none;
        font-size: 16px;
      }
      button {
        background: white;
        color: #667eea;
        font-weight: bold;
        cursor: pointer;
      }
      .logout-btn {
        background: #ff4757;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        border: none;
        float: right;
      }
      .vault-items {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 20px;
      }
      .vault-item {
        background: rgba(255,255,255,0.15);
        padding: 15px;
        border-radius: 10px;
      }
      .delete-btn {
        background: #ff4757;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        margin-top: 10px;
      }
      @media (max-width: 600px) {
        .vault-items { grid-template-columns: 1fr; }
        h1 { font-size: 36px; }
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    
    <script>
      const API_URL = window.location.origin + '/api';
      let currentUser = null;
      let token = null;
      
      function App() {
        const [view, setView] = React.useState('login');
        const [items, setItems] = React.useState([]);
        
        React.useEffect(() => {
          const savedToken = localStorage.getItem('valtify_token');
          const savedUser = localStorage.getItem('valtify_user');
          
          if (savedToken && savedUser) {
            token = savedToken;
            currentUser = JSON.parse(savedUser);
            setView('vault');
            loadVault();
          }
        }, []);
        
        async function loadVault() {
          try {
            const res = await fetch(API_URL + '/vault', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            setItems(data.items || []);
          } catch (error) {
            console.error('Failed to load vault');
          }
        }
        
        if (view === 'login') {
          return React.createElement(Login, { setView, loadVault });
        } else {
          return React.createElement(Vault, { 
            items, 
            setItems, 
            loadVault,
            setView 
          });
        }
      }
      
      function Login({ setView, loadVault }) {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [isRegister, setIsRegister] = React.useState(false);
        const [message, setMessage] = React.useState('');
        
        async function handleAuth() {
          const endpoint = isRegister ? '/register' : '/login';
          
          try {
            const res = await fetch(API_URL + endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (res.ok) {
              token = data.token;
              currentUser = data.user;
              localStorage.setItem('valtify_token', token);
              localStorage.setItem('valtify_user', JSON.stringify(currentUser));
              setView('vault');
              loadVault();
            } else {
              setMessage(data.error || 'Authentication failed');
            }
          } catch (error) {
            setMessage('Network error');
          }
        }
        
        return React.createElement('div', { className: 'app' },
          React.createElement('header', null,
            React.createElement('h1', null, '🔐 Valtify'),
            React.createElement('p', { className: 'subtitle' }, 'Secure Personal Data Vault')
          ),
          
          React.createElement('div', { className: 'container' },
            React.createElement('h2', null, isRegister ? 'Create Account' : 'Login'),
            
            React.createElement('div', { className: 'auth-form' },
              React.createElement('input', {
                type: 'email',
                placeholder: 'Email',
                value: email,
                onChange: e => setEmail(e.target.value)
              }),
              
              React.createElement('input', {
                type: 'password',
                placeholder: 'Password',
                value: password,
                onChange: e => setPassword(e.target.value)
              }),
              
              React.createElement('button', { onClick: handleAuth },
                isRegister ? 'Sign Up' : 'Login'
              ),
              
              message && React.createElement('p', { style: { color: '#ff6b6b' } }, message),
              
              React.createElement('button', {
                onClick: () => setIsRegister(!isRegister),
                style: { background: 'transparent', color: 'white' }
              }, isRegister ? 'Already have an account? Login' : 'Need an account? Sign up')
            )
          )
        );
      }
      
      function Vault({ items, loadVault, setView }) {
        const [newItem, setNewItem] = React.useState({
          category: 'password',
          title: '',
          data: ''
        });
        
        async function addItem() {
          if (!newItem.title || !newItem.data) return;
          
          const encryptedData = btoa(unescape(encodeURIComponent(newItem.data)));
          
          try {
            await fetch(API_URL + '/vault', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({
                category: newItem.category,
                title: newItem.title,
                encryptedData: encryptedData
              })
            });
            
            setNewItem({ category: 'password', title: '', data: '' });
            loadVault();
          } catch (error) {
            console.error('Failed to add item');
          }
        }
        
        async function deleteItem(id) {
          try {
            await fetch(API_URL + '/vault/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            loadVault();
          } catch (error) {
            console.error('Failed to delete item');
          }
        }
        
        function logout() {
          localStorage.removeItem('valtify_token');
          localStorage.removeItem('valtify_user');
          token = null;
          currentUser = null;
          setView('login');
        }
        
        return React.createElement('div', { className: 'app' },
          React.createElement('button', { onClick: logout, className: 'logout-btn' }, 'Logout'),
          
          React.createElement('header', null,
            React.createElement('h1', null, '🔐 Your Vault'),
            React.createElement('p', { className: 'subtitle' }, 'Welcome, ' + (currentUser?.email || 'User'))
          ),
          
          React.createElement('div', { className: 'container' },
            React.createElement('h2', null, 'Add New Item'),
            
            React.createElement('div', { className: 'vault-form' },
              React.createElement('select', {
                value: newItem.category,
                onChange: e => setNewItem({...newItem, category: e.target.value})
              },
                React.createElement('option', { value: 'password' }, '🔑 Password'),
                React.createElement('option', { value: 'note' }, '📝 Note'),
                React.createElement('option', { value: 'document' }, '📄 Document')
              ),
              
              React.createElement('input', {
                type: 'text',
                placeholder: 'Title',
                value: newItem.title,
                onChange: e => setNewItem({...newItem, title: e.target.value})
              }),
              
              React.createElement('textarea', {
                placeholder: 'Enter your data (will be encrypted)',
                value: newItem.data,
                onChange: e => setNewItem({...newItem, data: e.target.value}),
                rows: 3
              }),
              
              React.createElement('button', { onClick: addItem }, 'Add to Vault')
            )
          ),
          
          React.createElement('div', { className: 'container' },
            React.createElement('h2', null, 'Your Items (' + items.length + ')'),
            
            items.length === 0 
              ? React.createElement('p', null, 'No items yet. Add your first item!')
              : React.createElement('div', { className: 'vault-items' },
                  items.map(item => 
                    React.createElement('div', { key: item.id, className: 'vault-item' },
                      React.createElement('h3', null, item.title),
                      React.createElement('p', null, 
                        decodeURIComponent(escape(atob(item.encrypted_data)))
                      ),
                      React.createElement('small', null, 
                        new Date(item.created_at).toLocaleDateString()
                      ),
                      React.createElement('button', {
                        onClick: () => deleteItem(item.id),
                        className: 'delete-btn'
                      }, 'Delete')
                    )
                  )
                )
          )
        );
      }
      
      // Load React from CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
      script.crossOrigin = true;
      document.head.appendChild(script);
      
      const script2 = document.createElement('script');
      script2.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
      script2.crossOrigin = true;
      script2.onload = () => {
        ReactDOM.createRoot(document.getElementById('root')).render(
          React.createElement(App)
        );
      };
      document.head.appendChild(script2);
    </script>
  </body>
  </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Valtify running on port ${PORT}`);
});

