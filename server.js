{
  "name": "valtify",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "npm install && cd client && npm install && npm run build"
  },
  "dependencies": {
    "express": "^4.18.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
