import express from 'express';
import { query } from './database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all vault items
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, category, title, encrypted_data, created_at, updated_at
       FROM vault_items 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get vault error:', error);
    res.status(500).json({ error: 'Failed to fetch vault items' });
  }
});

// Add vault item
router.post('/', async (req, res) => {
  try {
    const { category, title, encryptedData } = req.body;
    
    if (!category || !title || !encryptedData) {
      return res.status(400).json({ 
        error: 'Category, title, and encrypted data required' 
      });
    }
    
    const result = await query(
      `INSERT INTO vault_items (user_id, category, title, encrypted_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, category, title, created_at`,
      [req.user.id, category, title, encryptedData]
    );
    
    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update vault item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, encryptedData } = req.body;
    
    const result = await query(
      `UPDATE vault_items 
       SET category = $1, title = $2, encrypted_data = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, category, title, updated_at`,
      [category, title, encryptedData, id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete vault item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM vault_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT id, category, title, encrypted_data, created_at, updated_at
       FROM vault_items 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

export { router as vaultRouter };
