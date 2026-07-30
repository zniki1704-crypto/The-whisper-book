import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { authRequired, asyncHandler } from '../middleware/auth.js';

const router = Router();

// ===== Categories =====
router.get('/categories', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE user_id = ? ORDER BY name', [req.user.id]);
  res.json(rows);
}));
router.post('/categories', authRequired, [body('name').trim().isLength({ min: 1 })], asyncHandler(async (req, res) => {
  const { name, color = '#8a7a4a' } = req.body;
  const [r] = await pool.query('INSERT INTO categories (user_id, name, color) VALUES (?,?,?)', [req.user.id, name, color]);
  res.status(201).json({ id: r.insertId });
}));
router.put('/categories/:id', authRequired, asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  await pool.query('UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?', [name, color, req.params.id, req.user.id]);
  res.json({ message: 'Updated' });
}));
router.delete('/categories/:id', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
}));

// ===== Tags =====
router.get('/tags', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tags WHERE user_id = ? ORDER BY name', [req.user.id]);
  res.json(rows);
}));
router.post('/tags', authRequired, [body('name').trim().isLength({ min: 1 })], asyncHandler(async (req, res) => {
  const { name } = req.body;
  const [exist] = await pool.query('SELECT id FROM tags WHERE user_id = ? AND name = ?', [req.user.id, name]);
  if (exist.length) return res.json({ id: exist[0].id });
  const [r] = await pool.query('INSERT INTO tags (user_id, name) VALUES (?,?)', [req.user.id, name]);
  res.status(201).json({ id: r.insertId });
}));
router.delete('/tags/:id', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tags WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
}));

// ===== Collections =====
router.get('/collections', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM collection_stories cs WHERE cs.collection_id = c.id) AS story_count
     FROM collections c WHERE c.user_id = ? ORDER BY c.created_at DESC`, [req.user.id]
  );
  res.json(rows);
}));
router.post('/collections', authRequired, [body('name').trim().isLength({ min: 1 })], asyncHandler(async (req, res) => {
  const { name, description, cover_url } = req.body;
  const [r] = await pool.query('INSERT INTO collections (user_id, name, description, cover_url) VALUES (?,?,?,?)', [req.user.id, name, description ?? null, cover_url ?? null]);
  res.status(201).json({ id: r.insertId });
}));
router.put('/collections/:id', authRequired, asyncHandler(async (req, res) => {
  const { name, description, cover_url } = req.body;
  await pool.query('UPDATE collections SET name = ?, description = ?, cover_url = ? WHERE id = ? AND user_id = ?', [name, description, cover_url, req.params.id, req.user.id]);
  res.json({ message: 'Updated' });
}));
router.delete('/collections/:id', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM collections WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
}));
router.post('/collections/:id/stories/:storyId', authRequired, asyncHandler(async (req, res) => {
  await pool.query('INSERT IGNORE INTO collection_stories (collection_id, story_id) VALUES (?,?)', [req.params.id, req.params.storyId]);
  res.status(201).json({ message: 'Added' });
}));
router.delete('/collections/:id/stories/:storyId', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM collection_stories WHERE collection_id = ? AND story_id = ?', [req.params.id, req.params.storyId]);
  res.json({ message: 'Removed' });
}));
router.get('/collections/:id/stories', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.* FROM collection_stories cs JOIN stories s ON s.id = cs.story_id
     WHERE cs.collection_id = ? ORDER BY cs.added_at DESC`, [req.params.id]
  );
  res.json(rows);
}));

// ===== Permissions =====
router.get('/stories/:id/permissions', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, u.email, pr.username FROM permissions p
     JOIN users u ON u.id = p.shared_with
     JOIN profiles pr ON pr.user_id = p.shared_with
     WHERE p.story_id = ?`, [req.params.id]
  );
  res.json(rows);
}));
router.post('/stories/:id/permissions', authRequired, [body('shared_with').isInt(), body('permission_level').isIn(['view','comment','edit','owner'])], asyncHandler(async (req, res) => {
  const { shared_with, permission_level } = req.body;
  const [own] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [req.params.id]);
  if (!own.length || own[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('INSERT INTO permissions (story_id, shared_with, permission_level) VALUES (?,?,?) ON DUPLICATE KEY UPDATE permission_level = VALUES(permission_level)', [req.params.id, shared_with, permission_level]);
  await pool.query('INSERT INTO notifications (user_id, type, title, body) VALUES (?, ?, ?, ?)', [shared_with, 'story_shared', 'A story was shared with you', 'You have been granted access to a new story.']);
  res.status(201).json({ message: 'Permission granted' });
}));
router.put('/permissions/:id', authRequired, [body('permission_level').isIn(['view','comment','edit','owner'])], asyncHandler(async (req, res) => {
  await pool.query('UPDATE permissions SET permission_level = ? WHERE id = ?', [req.body.permission_level, req.params.id]);
  res.json({ message: 'Updated' });
}));
router.delete('/permissions/:id', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM permissions WHERE id = ?', [req.params.id]);
  res.json({ message: 'Removed' });
}));

// ===== Comments =====
router.get('/stories/:id/comments', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.*, pr.username, pr.avatar_url FROM comments c
     JOIN profiles pr ON pr.user_id = c.user_id
     WHERE c.story_id = ? ORDER BY c.created_at ASC`, [req.params.id]
  );
  res.json(rows);
}));
router.post('/stories/:id/comments', authRequired, [body('body').trim().isLength({ min: 1 })], asyncHandler(async (req, res) => {
  const { body } = req.body;
  const [r] = await pool.query('INSERT INTO comments (story_id, user_id, body) VALUES (?,?,?)', [req.params.id, req.user.id, body]);
  res.status(201).json({ id: r.insertId });
}));
router.delete('/comments/:id', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM comments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
}));

// ===== Bookmarks =====
router.get('/bookmarks', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT b.*, s.title FROM bookmarks b JOIN stories s ON s.id = b.story_id WHERE b.user_id = ?', [req.user.id]);
  res.json(rows);
}));
router.post('/stories/:id/bookmark', authRequired, asyncHandler(async (req, res) => {
  await pool.query('INSERT IGNORE INTO bookmarks (user_id, story_id) VALUES (?,?)', [req.user.id, req.params.id]);
  res.status(201).json({ message: 'Bookmarked' });
}));
router.delete('/stories/:id/bookmark', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND story_id = ?', [req.user.id, req.params.id]);
  res.json({ message: 'Removed' });
}));

// ===== Notifications =====
router.get('/notifications', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
  res.json(rows);
}));
router.put('/notifications/:id/read', authRequired, asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Marked read' });
}));
router.put('/notifications/read-all', authRequired, asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
  res.json({ message: 'All marked read' });
}));

// ===== Activity Logs =====
router.get('/activity', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [req.user.id]);
  res.json(rows);
}));

// ===== Themes =====
router.get('/themes', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM themes ORDER BY id');
  res.json(rows);
}));

// ===== Shared Links =====
router.post('/stories/:id/shared-links', authRequired, asyncHandler(async (req, res) => {
  const { password, expires_at, max_views } = req.body;
  const crypto = await import('crypto');
  const token = crypto.randomBytes(16).toString('hex');
  let hash = null;
  if (password) hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    'INSERT INTO shared_links (story_id, token, password_hash, expires_at, max_views) VALUES (?,?,?,?,?)',
    [req.params.id, token, hash, expires_at ?? null, max_views ?? null]
  );
  res.status(201).json({ id: r.insertId, token });
}));
router.get('/shared/:token', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM shared_links WHERE token = ?', [req.params.token]);
  if (!rows.length) return res.status(404).json({ error: 'Access Denied' });
  const link = rows[0];
  if (!link.is_active) return res.status(403).json({ error: 'Access Denied' });
  if (link.expires_at && new Date(link.expires_at) < new Date()) return res.status(403).json({ error: 'Link expired' });
  if (link.max_views && link.views >= link.max_views) return res.status(403).json({ error: 'View limit reached' });
  await pool.query('UPDATE shared_links SET views = views + 1 WHERE id = ?', [link.id]);
  const [story] = await pool.query('SELECT * FROM stories WHERE id = ?', [link.story_id]);
  if (!story.length) return res.status(404).json({ error: 'Access Denied' });
  res.json(story[0]);
}));
router.delete('/shared-links/:id', authRequired, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM shared_links WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
}));

// ===== Profile =====
router.get('/profile', authRequired, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT p.*, u.email FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?', [req.user.id]);
  res.json(rows[0] || null);
}));
router.put('/profile', authRequired, asyncHandler(async (req, res) => {
  const { username, full_name, bio, avatar_url, favorite_theme } = req.body;
  await pool.query(
    'UPDATE profiles SET username = ?, full_name = ?, bio = ?, avatar_url = ?, favorite_theme = ? WHERE user_id = ?',
    [username, full_name ?? null, bio ?? null, avatar_url ?? null, favorite_theme ?? 'light', req.user.id]
  );
  res.json({ message: 'Profile updated' });
}));

export default router;
