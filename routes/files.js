const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all files with lock status
router.get('/', async (req, res) => {
  try {
    const [files] = await db.query(`
      SELECT 
        f.id, 
        f.file_name, 
        f.file_path,
        f.created_at,
        fl.user_name as locked_by,
        fl.locked_at,
        fl.is_active as is_locked
      FROM files f
      LEFT JOIN file_locks fl ON f.id = fl.file_id AND fl.is_active = TRUE
      ORDER BY f.file_name
    `);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/search', async (req, res) => {
  const searchValue = req.query.q;

  if (!searchValue) {
    return res.status(400).json({ error: 'Missing search query parameter "q"' });
  }

  try {
    const [files] = await db.query(`
      SELECT 
        f.id, 
        f.file_name, 
        f.file_path,
        f.created_at,
        fl.user_name as locked_by,
        fl.locked_at,
        fl.is_active as is_locked
      FROM files f
      LEFT JOIN file_locks fl ON f.id = fl.file_id AND fl.is_active = TRUE
      WHERE f.file_name LIKE ?
      ORDER BY f.file_name
    `, [`%${searchValue}%`]);

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Add new file
router.post('/', async (req, res) => {
  try {
    const { file_name, file_path, created_by } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO files (file_name, file_path, created_by) VALUES (?, ?, ?)',
      [file_name, file_path, created_by]
    );
    
    res.json({ 
      success: true, 
      file_id: result.insertId,
      message: 'File added successfully' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'File already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM files WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;