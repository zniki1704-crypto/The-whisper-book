import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import pool from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { authRequired, asyncHandler } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').trim().isLength({ min: 2 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, username } = req.body;
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]
  );
  const userId = result.insertId;
  await pool.query(
    'INSERT INTO profiles (user_id, username) VALUES (?, ?)', [userId, username]
  );
  await pool.query(
    'INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)',
    [userId, 'register', 'Account created']
  );
  const token = signToken({ id: userId, email });
  res.status(201).json({ token, user: { id: userId, email, username } });
}));

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query(
    'SELECT u.id, u.email, u.password_hash, p.username FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.email = ?',
    [email]
  );
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  await pool.query(
    'INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)',
    [user.id, 'login', 'Signed in']
  );
  await pool.query(
    'INSERT INTO notifications (user_id, type, title) VALUES (?, ?, ?)',
    [user.id, 'new_login', 'New login detected']
  );
  const token = signToken({ id: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
}));

// POST /api/auth/logout
router.post('/logout', authRequired, asyncHandler(async (req, res) => {
  await pool.query(
    'INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)',
    [req.user.id, 'logout', 'Signed out']
  );
  res.json({ message: 'Signed out' });
}));

// POST /api/auth/forgot
router.post('/forgot', [body('email').isEmail().normalizeEmail()], asyncHandler(async (req, res) => {
  const { email } = req.body;
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', [token, expires, rows[0].id]);
    // In production, email the token. Here we just acknowledge.
  }
  res.json({ message: 'If that email exists, a reset link has been sent' });
}));

// POST /api/auth/reset
router.post('/reset', [body('password').isLength({ min: 6 }), body('token').notEmpty()], asyncHandler(async (req, res) => {
  const { password, token } = req.body;
  const [rows] = await pool.query('SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()', [token]);
  if (!rows.length) return res.status(400).json({ error: 'Invalid or expired token' });
  const hash = await bcrypt.hash(password, 12);
  await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hash, rows[0].id]);
  await pool.query('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [rows[0].id, 'password_changed']);
  res.json({ message: 'Password updated' });
}));

// POST /api/auth/change-password
router.post('/change-password', authRequired, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  await pool.query('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [req.user.id, 'password_changed']);
  await pool.query('INSERT INTO notifications (user_id, type, title, body) VALUES (?, ?, ?, ?)',
    [req.user.id, 'password_changed', 'Password changed', 'Your password was updated successfully.']);
  res.json({ message: 'Password changed' });
}));

export default router;
