import React, { useState } from 'react';

function AddItemForm({ onAddItem }) {
  const [category, setCategory] = useState('password');
  const [title, setTitle] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !data.trim()) {
      setMessage('Please enter both title and data');
      return;
    }

    setLoading(true);
    setMessage('');

    // Simple base64 encryption (in real app, use crypto-js)
    const encryptedData = btoa(unescape(encodeURIComponent(data)));

    const success = await onAddItem({
      category,
      title,
      encryptedData
    });

    if (success) {
      setTitle('');
      setData('');
      setMessage('Item added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Failed to add item. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="add-item-section">
      <h3>Add Secure Item</h3>
      
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      <form className="add-item-form" onSubmit={handleSubmit}>
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        >
          <option value="password">🔑 Password</option>
          <option value="note">📝 Secure Note</option>
          <option value="document">📄 Document</option>
          <option value="card">💳 Credit Card</option>
          <option value="identity">🆔 Identity</option>
        </select>
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g., 'Gmail Password')"
          disabled={loading}
          required
        />
        
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Enter your sensitive data here..."
          rows="3"
          disabled={loading}
          required
        />
        
        <button 
          type="submit" 
          className="add-btn"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add to Vault'}
        </button>
      </form>
    </div>
  );
}

export default AddItemForm;
