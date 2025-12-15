import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddItemForm from './AddItemForm';
import VaultItem from './VaultItem';

function Vault({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  const fetchVaultItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('valtify_token');
      
      const response = await axios.get(`${API_URL}/vault`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setItems(response.data.items);
      setError('');
    } catch (err) {
      setError('Failed to load vault items');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const handleAddItem = async (newItem) => {
    try {
      const token = localStorage.getItem('valtify_token');
      
      await axios.post(`${API_URL}/vault`, newItem, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchVaultItems(); // Refresh list
      return true;
    } catch (err) {
      console.error('Add item error:', err);
      return false;
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const token = localStorage.getItem('valtify_token');
      
      await axios.delete(`${API_URL}/vault/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchVaultItems(); // Refresh list
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="vault-container">
      <header className="vault-header">
        <div className="user-info">
          <h2>🔐 Your Valtify Vault</h2>
          <p>Welcome, {user?.email}</p>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {error && <div className="message error">{error}</div>}

      <AddItemForm onAddItem={handleAddItem} />

      <div className="vault-items">
        <h3>Your Stored Items ({items.length})</h3>
        
        {loading ? (
          <div className="loading">Loading your vault...</div>
        ) : items.length === 0 ? (
          <div className="empty-vault">
            <p>Your vault is empty. Add your first secure item!</p>
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <VaultItem
                key={item.id}
                item={item}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Vault;
