import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Vault from './components/Vault';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('valtify_token');
    const savedUser = localStorage.getItem('valtify_user');
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('valtify_token', token);
    localStorage.setItem('valtify_user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('valtify_token');
    localStorage.removeItem('valtify_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/vault" /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
              <Navigate to="/vault" /> : 
              <Register onRegister={handleLogin} />
            } 
          />
          <Route 
            path="/vault" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Vault user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/vault" : "/login"} />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
