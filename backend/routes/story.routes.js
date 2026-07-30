import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authRequired, asyncHandler } from '../middleware/auth.js';

const router = Router();

// GET /api/stories
router.get('/', authRequired, asyncHandler(async (req, res) => {
  const { status, category_id, privacy, tag_id, search, sort } = req.query;
  let sql = `SELECT s.*, c.name AS category_name, c.color AS category_color
             FROM stories s LEFT JOIN categories c ON c.id = s.category_id
             WHERE s.user_id = ?`;
  const params = [req.user.id];
  if (status) { sql += ' AND s.status = ?'; params.push(status); }
  if (category_id) { sql += ' AND s.category_id = ?'; params.push(category_id); }
  if (privacy) { sql += ' AND s.privacy = ?'; params.push(privacy); }
  if (search) { sql += ' AND (s.title LIKE ? OR s.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += sort === 'title' ? ' ORDER BY s.title ASC' : ' ORDER BY s.updated_at DESC';
  const [rows] = await pool.query(sql, params);
  if (tag_id) {
    const [tagged] = await pool.query(
      'SELECT story_id FROM story_tags WHERE tag_id = ?', [tag_id]
    );
    const ids = new Set(tagged.map(t => String(t.story_id)));
    return res.json(rows.filter(r => ids.has(String(r.id))));
  }
  res.json(rows);
}));

// GET /api/stories/:id
router.get('/:id', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.*, c.name AS category_name, c.color AS category_color
     FROM stories s LEFT JOIN categories c ON c.id = s.category_id
     WHERE s.id = ? AND (s.user_id = ? OR EXISTS (
       SELECT 1 FROM permissions p WHERE p.story_id = s.id AND p.shared_with = ?
     ))`,
    [req.params.id, req.user.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Access Denied' });
  res.json(rows[0]);
}));

// POST /api/stories
router.post('/', authRequired, [body('title').optional().isString()], asyncHandler(async (req, res) => {
  const { title = 'Untitled', content = '', cover_url, category_id, privacy = 'private', disable_copy, disable_download } = req.body;
  const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  const [result] = await pool.query(
    `INSERT INTO stories (user_id, category_id, title, content, excerpt, cover_url, privacy, word_count, reading_time, disable_copy, disable_download)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.id, category_id ?? null, title, content, content.slice(0, 160), cover_url ?? null, privacy, wordCount, readingTime, !!disable_copy, !!disable_download]
  );
  await pool.query('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [req.user.id, 'story_created', `Created "${title}"`]);
  res.status(201).json({ id: result.insertId });
}));

// PUT /api/stories/:id
router.put('/:id', authRequired, asyncHandler(async (req, res) => {
  const [own] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [req.params.id]);
  if (!own.length) return res.status(404).json({ error: 'Not found' });
  if (own[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { title, content, cover_url, category_id, privacy, is_favourite, status, disable_copy, disable_download } = req.body;
  const fields = [];
  const params = [];
  if (title !== undefined) { fields.push('title = ?'); params.push(title); }
  if (content !== undefined) {
    const wc = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    fields.push('content = ?', 'word_count = ?', 'reading_time = ?', 'excerpt = ?', 'last_saved_at = NOW()');
    params.push(content, wc, Math.max(1, Math.round(wc / 200)), content.slice(0, 160));
  }
  if (cover_url !== undefined) { fields.push('cover_url = ?'); params.push(cover_url); }
  if (category_id !== undefined) { fields.push('category_id = ?'); params.push(category_id); }
  if (privacy !== undefined) { fields.push('privacy = ?'); params.push(privacy); }
  if (is_favourite !== undefined) { fields.push('is_favourite = ?'); params.push(is_favourite); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (disable_copy !== undefined) { fields.push('disable_copy = ?'); params.push(disable_copy); }
  if (disable_download !== undefined) { fields.push('disable_download = ?'); params.push(disable_download); }
  if (!fields.length) return res.json({ message: 'Nothing to update' });
  params.push(req.params.id);
  await pool.query(`UPDATE stories SET ${fields.join(', ')} WHERE id = ?`, params);
  if (content !== undefined) {
    await pool.query('INSERT INTO story_versions (story_id, content, word_count) VALUES (?, ?, ?)',
      [req.params.id, content, content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length]);
  }
  await pool.query('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [req.user.id, 'story_edited', `Edited story ${req.params.id}`]);
  res.json({ message: 'Updated' });
}));

// DELETE /api/stories/:id
router.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  const [own] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [req.params.id]);
  if (!own.length) return res.status(404).json({ error: 'Not found' });
  if (own[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM stories WHERE id = ?', [req.params.id]);
  await pool.query('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [req.user.id, 'story_deleted', `Deleted story ${req.params.id}`]);
  res.json({ message: 'Deleted' });
}));

// GET /api/stories/:id/versions
router.get('/:id/versions', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM story_versions WHERE story_id = ? ORDER BY created_at DESC LIMIT 20',
    [req.params.id]
  );
  res.json(rows);
}));

// GET /api/stories/shared/me
router.get('/shared/me', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.* FROM permissions p JOIN stories s ON s.id = p.story_id
     WHERE p.shared_with = ? ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
}));

export default router;
