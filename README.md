# 🔐 Valtify - Secure Personal Data Vault

Store passwords, notes, and sensitive data securely.

## Features
- 🔒 End-to-end encryption
- 👤 User authentication
- 🗄️ PostgreSQL database
- 📱 Responsive design
- 🚀 One-click deploy

## Quick Deploy

### 1. Get Free Database
1. Go to [neon.tech](https://neon.tech)
2. Sign up (free)
3. Create new project
4. Copy database URL

### 2. Deploy on Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect this GitHub repository
4. Add environment variable:
   - `DATABASE_URL` = your Neon database URL
5. Click "Create Web Service"

## Usage
1. **Register** with email/password
2. **Add items** to your vault
3. **Data encrypted** before storage
4. **Access anywhere**

## Security
- Passwords hashed with bcrypt
- JWT authentication
- HTTPS enforced
- SQL injection protection
