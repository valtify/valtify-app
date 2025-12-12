import React from 'react';
import './App.css';

function App() {
    return (
        <div className="app">
            <header className="header">
                <div className="logo">
                    <h1>🔐 Valtify</h1>
                </div>
                <nav>
                    <button className="nav-btn">Features</button>
                    <button className="nav-btn">Security</button>
                    <button className="login-btn">Get Started</button>
                </nav>
            </header>
            
            <main className="hero">
                <div className="hero-content">
                    <h2>Your Personal Data Vault</h2>
                    <p className="subtitle">
                        Store passwords, documents, notes, and sensitive information 
                        with military-grade encryption. Your data, your control.
                    </p>
                    
                    <div className="cta-section">
                        <button className="primary-btn">Start Free Trial</button>
                        <button className="secondary-btn">See How It Works</button>
                    </div>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>End-to-End Encryption</h3>
                            <p>Your data is encrypted before it leaves your device</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>Instant Access</h3>
                            <p>Access your data from any device, anywhere</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🛡️</div>
                            <h3>Zero-Knowledge</h3>
                            <p>We never see your data. Only you hold the keys</p>
                        </div>
                    </div>
                </div>
            </main>
            
            <footer className="footer">
                <p>© 2024 Valtify. All rights reserved. Your privacy is our priority.</p>
            </footer>
        </div>
    );
}

export default App;
