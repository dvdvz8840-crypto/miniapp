const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fss = require('fs');
    if (!fss.existsSync(uploadsDir)) fss.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function adminOnly(req, res, next) {
  const adminId = process.env.ADMIN_ID;
  const userId = req.headers['x-user-id'] || req.query.admin_id || req.body?.admin_id;
  if (String(userId) !== String(adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

router.use(adminOnly);

// ── PRODUCTS ──────────────────────────────────────────────────
router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(products);
});

router.post('/products', upload.single('image'), (req, res) => {
  try {
    const { name, description, price, stock, emoji } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'name and price required' });
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = db.prepare(`
      INSERT INTO products (name, description, price, image_url, emoji, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description || null, parseInt(price), imageUrl, emoji || '🎁', parseInt(stock ?? -1));
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  try {
    const { name, description, price, stock, is_active, emoji } = req.body;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.image_url;
    db.prepare(`
      UPDATE products SET name=?, description=?, price=?, image_url=?, emoji=?, stock=?, is_active=? WHERE id=?
    `).run(
      name ?? existing.name,
      description ?? existing.description,
      price !== undefined ? parseInt(price) : existing.price,
      imageUrl,
      emoji ?? existing.emoji,
      stock !== undefined ? parseInt(stock) : existing.stock,
      is_active !== undefined ? parseInt(is_active) : existing.is_active,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete (hide from shop)
router.delete('/products/:id', (req, res) => {
  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Hard delete
router.delete('/products/:id/hard', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── ORDERS ────────────────────────────────────────────────────
router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name as product_name, p.emoji,
           u.username, u.first_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN users u ON o.user_id = u.telegram_id
    ORDER BY o.created_at DESC LIMIT 300
  `).all();
  res.json(orders);
});

router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// ── USERS ─────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.*,
           (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.telegram_id) as referrals_count,
           (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.telegram_id) as orders_count,
           (SELECT 1 FROM bans b WHERE b.telegram_id = u.telegram_id) as is_banned
    FROM users u ORDER BY u.created_at DESC LIMIT 300
  `).all();
  res.json(users);
});

router.post('/users/:id/balance', (req, res) => {
  try {
    const { amount } = req.body;
    db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(parseInt(amount), req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── BANS ──────────────────────────────────────────────────────
router.get('/bans', (req, res) => {
  const bans = db.prepare(`
    SELECT b.*, u.username, u.first_name
    FROM bans b LEFT JOIN users u ON u.telegram_id = b.telegram_id
    ORDER BY b.created_at DESC
  `).all();
  res.json(bans);
});

router.post('/users/:id/ban', (req, res) => {
  try {
    const { reason, banned_until } = req.body;
    db.prepare(`
      INSERT INTO bans (telegram_id, reason, banned_until)
      VALUES (?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET reason=excluded.reason, banned_until=excluded.banned_until, created_at=CURRENT_TIMESTAMP
    `).run(req.params.id, reason || null, banned_until || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/unban', (req, res) => {
  db.prepare('DELETE FROM bans WHERE telegram_id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── GIVEAWAYS ─────────────────────────────────────────────────
router.get('/giveaways', (req, res) => {
  const giveaways = db.prepare(`
    SELECT g.*, (SELECT COUNT(*) FROM giveaway_entries e WHERE e.giveaway_id = g.id) as entries_count
    FROM giveaways g ORDER BY g.created_at DESC
  `).all();
  res.json(giveaways);
});

router.post('/giveaways', upload.single('photo'), (req, res) => {
  try {
    const { title, description, prize, ends_at, channel_username, min_deposit, conditions_text } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = db.prepare(`
      INSERT INTO giveaways (title, description, prize, photo_url, ends_at, channel_username, min_deposit, conditions_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      prize || null,
      photoUrl,
      ends_at || null,
      channel_username ? channel_username.replace('@', '') : null,
      parseInt(min_deposit || 0),
      conditions_text || null
    );
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/giveaways/:id', upload.single('photo'), (req, res) => {
  try {
    const { title, description, prize, ends_at, channel_username, min_deposit, conditions_text, is_active } = req.body;
    const existing = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : existing.photo_url;
    db.prepare(`
      UPDATE giveaways SET title=?, description=?, prize=?, photo_url=?, ends_at=?,
        channel_username=?, min_deposit=?, conditions_text=?, is_active=? WHERE id=?
    `).run(
      title ?? existing.title,
      description ?? existing.description,
      prize ?? existing.prize,
      photoUrl,
      ends_at ?? existing.ends_at,
      channel_username ? channel_username.replace('@', '') : existing.channel_username,
      min_deposit !== undefined ? parseInt(min_deposit) : existing.min_deposit,
      conditions_text ?? existing.conditions_text,
      is_active !== undefined ? parseInt(is_active) : existing.is_active,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/giveaways/:id', (req, res) => {
  db.prepare('UPDATE giveaways SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/giveaways/:id/entries', (req, res) => {
  const entries = db.prepare(`
    SELECT e.*, u.username, u.first_name
    FROM giveaway_entries e JOIN users u ON u.telegram_id = e.user_id
    WHERE e.giveaway_id = ?
  `).all(req.params.id);
  res.json(entries);
});

router.post('/giveaways/:id/draw', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ?').all(req.params.id);
    if (!entries.length) return res.status(400).json({ error: 'Нет участников' });
    const winner = entries[Math.floor(Math.random() * entries.length)];
    db.prepare('UPDATE giveaways SET is_active = 0, winner_id = ? WHERE id = ?').run(winner.user_id, req.params.id);
    const winnerUser = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(winner.user_id);
    res.json({ success: true, winner: winnerUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PROMO CODES ───────────────────────────────────────────────
router.get('/promo', (req, res) => {
  const promos = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
  res.json(promos);
});

router.post('/promo', (req, res) => {
  try {
    const { code, stars_amount, max_activations = -1, expires_at } = req.body;
    if (!code || !stars_amount) return res.status(400).json({ error: 'code and stars_amount required' });
    db.prepare(`
      INSERT INTO promo_codes (code, stars_amount, max_activations, expires_at)
      VALUES (UPPER(?), ?, ?, ?)
    `).run(code, parseInt(stars_amount), parseInt(max_activations), expires_at || null);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Промокод уже существует' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/promo/:id', (req, res) => {
  db.prepare('UPDATE promo_codes SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── STATS ─────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const totalRevenue = db.prepare('SELECT SUM(total_price) as sum FROM orders').get();
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get();
  const totalBanned = db.prepare('SELECT COUNT(*) as count FROM bans').get();
  res.json({
    total_users: totalUsers.count,
    total_orders: totalOrders.count,
    total_revenue: totalRevenue.sum || 0,
    pending_orders: pendingOrders.count,
    total_banned: totalBanned.count,
  });
});

module.exports = router;
