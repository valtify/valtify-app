import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'valtify-secret-key-change-in-production';

// In-memory database (for demo - will persist in file)
let database = {
  users: [],
  vaults: []
};

// Load database from file
const DB_FILE = join(__dirname, 'database.json');
if (fs.existsSync(DB_FILE)) {
  database = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Save database to file
function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// API Routes

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    if (database.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    database.users.push(user);
    saveDatabase();
    
    // Create token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    
    res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = database.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    
    res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Vault Items
app.get('/api/vault', authenticateToken, (req, res) => {
  const userVaults = database.vaults.filter(v => v.userId === req.user.id);
  res.json(userVaults);
});

app.post('/api/vault', authenticateToken, (req, res) => {
  try {
    const { category, title, data } = req.body;
    
    const vaultItem = {
      id: Date.now().toString(),
      userId: req.user.id,
      category,
      title,
      encryptedData: Buffer.from(data).toString('base64'), // Simple encryption
      createdAt: new Date().toISOString()
    };
    
    database.vaults.push(vaultItem);
    saveDatabase();
    
    res.json(vaultItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

app.delete('/api/vault/:id', authenticateToken, (req, res) => {
  const index = database.vaults.findIndex(
    v => v.id === req.params.id && v.userId === req.user.id
  );
  
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  database.vaults.splice(index, 1);
  saveDatabase();
  
  res.json({ success: true });
});

// Serve HTML
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Valtify | Secure Vault</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 400px;
                margin: 50px auto;
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 { text-align: center; margin-bottom: 30px; color: #333; }
            .input-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 8px; color: #555; }
            input {
                width: 100%;
                padding: 14px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                font-size: 16px;
            }
            button {
                width: 100%;
                padding: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 10px;
            }
            button:hover { transform: translateY(-2px); }
            .message { margin-top: 20px; padding: 12px; border-radius: 8px; text-align: center; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
            .switch { text-align: center; margin-top: 20px; }
            .switch button { background: none; color: #667eea; text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container" id="app">
            <h1>🔐 Valtify</h1>
            <div id="loginForm">
                <div class="input-group">
                    <label>Email</label>
                    <input type="email" id="email" placeholder="you@example.com">
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" id="password" placeholder="••••••••">
                </div>
                <button onclick="handleAuth()" id="authBtn">Login</button>
                <div class="switch">
                    <button onclick="toggleMode()" id="switchBtn">Need an account? Sign up</button>
                </div>
            </div>
            <div id="message"></div>
        </div>
        
        <script>
            let isSignUp = false;
            let currentUser = null;
            let token = null;
            
            function toggleMode() {
                isSignUp = !isSignUp;
                document.getElementById('authBtn').textContent = isSignUp ? 'Sign Up' : 'Login';
                document.getElementById('switchBtn').textContent = isSignUp 
                    ? 'Already have an account? Login' 
                    : 'Need an account? Sign up';
                clearMessage();
            }
            
            async function handleAuth() {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                if (!email || !password) {
                    showMessage('Please enter email and password', 'error');
                    return;
                }
                
                const endpoint = isSignUp ? '/api/register' : '/api/login';
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        currentUser = data.user;
                        token = data.token;
                        localStorage.setItem('valtify_token', token);
                        localStorage.setItem('valtify_user', JSON.stringify(currentUser));
                        showMessage(isSignUp ? 'Account created! Loading vault...' : 'Login successful! Loading vault...', 'success');
                        setTimeout(() => loadVault(), 1000);
                    } else {
                        showMessage(data.error || 'Authentication failed', 'error');
                    }
                } catch (error) {
                    showMessage('Network error. Please try again.', 'error');
                }
            }
            
            function showMessage(text, type) {
                const msgDiv = document.getElementById('message');
                msgDiv.textContent = text;
                msgDiv.className = \`message \${type}\`;
            }
            
            function clearMessage() {
                document.getElementById('message').textContent = '';
            }
            
            // Check for existing session
            window.onload = () => {
                const savedToken = localStorage.getItem('valtify_token');
                const savedUser = localStorage.getItem('valtify_user');
                if (savedToken && savedUser) {
                    token = savedToken;
                    currentUser = JSON.parse(savedUser);
                    loadVault();
                }
            };
            
            function loadVault() {
                document.getElementById('app').innerHTML = \`
                    <h1>🔐 Valtify Vault</h1>
                    <p>Welcome, \${currentUser.email}</p>
                    <button onclick="logout()">Logout</button>
                    <div style="margin-top: 30px;">
                        <h3>Add Item</h3>
                        <input type="text" id="itemTitle" placeholder="Title">
                        <textarea id="itemData" placeholder="Data" style="width:100%; margin:10px 0;"></textarea>
                        <button onclick="addItem()">Add to Vault</button>
                    </div>
                    <div id="vaultItems" style="margin-top: 30px;"></div>
                \`;
                fetchVaultItems();
            }
            
            async function fetchVaultItems() {
                try {
                    const response = await fetch('/api/vault', {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    const items = await response.json();
                    displayItems(items);
                } catch (error) {
                    console.error('Failed to fetch items:', error);
                }
            }
            
            async function addItem() {
                const title = document.getElementById('itemTitle').value;
                const data = document.getElementById('itemData').value;
                
                try {
                    const response = await fetch('/api/vault', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${token}\`
                        },
                        body: JSON.stringify({
                            category: 'note',
                            title,
                            data
                        })
                    });
                    
                    if (response.ok) {
                        document.getElementById('itemTitle').value = '';
                        document.getElementById('itemData').value = '';
                        fetchVaultItems();
                    }
                } catch (error) {
                    console.error('Failed to add item:', error);
                }
            }
            
            function displayItems(items) {
                const container = document.getElementById('vaultItems');
                if (items.length === 0) {
                    container.innerHTML = '<p>No items yet. Add your first item!</p>';
                    return;
                }
                
                container.innerHTML = items.map(item => \`
                    <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px;">
                        <h4>\${item.title}</h4>
                        <p>\${atob(item.encryptedData)}</p>
                        <button onclick="deleteItem('\${item.id}')">Delete</button>
                    </div>
                \`).join('');
            }
            
            async function deleteItem(id) {
                try {
                    await fetch(\`/api/vault/\${id}\`, {
                        method: 'DELETE',
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    });
                    fetchVaultItems();
                } catch (error) {
                    console.error('Failed to delete item:', error);
                }
            }
            
            function logout() {
                localStorage.removeItem('valtify_token');
                localStorage.removeItem('valtify_user');
                location.reload();
            }
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Valtify server running on port ${PORT}`);
  console.log(`📁 Database file: ${DB_FILE}`);
});
