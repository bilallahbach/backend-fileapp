const express = require('express');
const router = express.Router();
const db = require('../db');

// Create unlock request
router.post('/', async (req, res) => {
  try {
    const { file_id, requester_name, request_message } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO unlock_requests (file_id, requester_name, request_message) VALUES (?, ?, ?)',
      [file_id, requester_name, request_message]
    );
    
    res.json({ 
      success: true, 
      request_id: result.insertId,
      message: 'Request sent successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending requests for a user
router.get('/pending/:user_name', async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT 
        ur.id,
        ur.file_id,
        ur.requester_name,
        ur.request_message,
        ur.requested_at,
        f.file_name
      FROM unlock_requests ur
      JOIN files f ON ur.file_id = f.id
      JOIN file_locks fl ON f.id = fl.file_id
      WHERE fl.user_name = ? 
        AND fl.is_active = TRUE 
        AND ur.status = 'pending'
      ORDER BY ur.requested_at DESC
    `, [req.params.user_name]);
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to unlock request
router.put('/:request_id', async (req, res) => {
  try {
    const { status, user_name } = req.body; // status: 'approved' or 'rejected'
    
    // Update request status
    await db.query(
      'UPDATE unlock_requests SET status = ? WHERE id = ?',
      [status, req.params.request_id]
    );
    
    // If approved, unlock the file
    if (status === 'approved') {
      const [request] = await db.query(
        'SELECT file_id FROM unlock_requests WHERE id = ?',
        [req.params.request_id]
      );
      
      if (request.length > 0) {
        await db.query(
          'UPDATE file_locks SET is_active = FALSE WHERE file_id = ? AND user_name = ?',
          [request[0].file_id, user_name]
        );
      }
    }
    
    res.json({ success: true, message: `Request ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;