const express = require('express');
const router = express.Router();
const db = require('../db');

// Lock a file
router.post('/', async (req, res) => {
  try {
    const { file_id, user_name } = req.body;
    
    // Check if file is already locked
    const [existing] = await db.query(
      'SELECT * FROM file_locks WHERE file_id = ? AND is_active = TRUE',
      [file_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'File is already locked',
        locked_by: existing[0].user_name 
      });
    }
    
    // Create lock
    const [result] = await db.query(
      'INSERT INTO file_locks (file_id, user_name) VALUES (?, ?)',
      [file_id, user_name]
    );
    
    res.json({ 
      success: true, 
      lock_id: result.insertId,
      message: 'File locked successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock a file
router.delete('/:file_id', async (req, res) => {
  try {
    const { user_name } = req.body;
    
    await db.query(
      'UPDATE file_locks SET is_active = FALSE WHERE file_id = ? AND user_name = ? AND is_active = TRUE',
      [req.params.file_id, user_name]
    );
    
    res.json({ success: true, message: 'File unlocked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active locks
router.get('/active', async (req, res) => {
  try {
    const [locks] = await db.query(`
      SELECT 
        fl.id,
        fl.file_id,
        fl.user_name,
        fl.locked_at,
        f.file_name
      FROM file_locks fl
      JOIN files f ON fl.file_id = f.id
      WHERE fl.is_active = TRUE
      ORDER BY fl.locked_at DESC
    `);
    res.json(locks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;