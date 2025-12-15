import React from 'react';

function VaultItem({ item, onDelete }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      password: '🔑',
      note: '📝',
      document: '📄',
      card: '💳',
      identity: '🆔'
    };
    return icons[category] || '📁';
  };

  // Simple decryption (base64)
  const decryptData = (encrypted) => {
    try {
      return decodeURIComponent(escape(atob(encrypted)));
    } catch {
      return '[Encrypted Data]';
    }
  };

  return (
    <div className="vault-item">
      <div className="item-header">
        <span className="item-type">
          {getCategoryIcon(item.category)} {item.category}
        </span>
        <button 
          className="delete-btn"
          onClick={() => onDelete(item.id)}
          title="Delete item"
        >
          ×
        </button>
      </div>
      
      <h4>{item.title}</h4>
      
      <div className="encrypted-data">
        {decryptData(item.encrypted_data)}
      </div>
      
      <div className="item-footer">
        <small>Added: {formatDate(item.created_at)}</small>
      </div>
    </div>
  );
}

export default VaultItem;
