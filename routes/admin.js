const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function adminOnly(req, res, next) {
  const adminId = process.env.ADMIN_ID;
  const userId = req.headers['x-user-id'] || req.query.admin_id;
  if (String(userId) !== String(adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

router.use(adminOnly);

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(products);
});

router.post('/products', upload.single('image'), (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'name and price required' });
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = db.prepare(`
      INSERT INTO products (name, description, price, image_url, stock)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description || null, parseInt(price), imageUrl, parseInt(stock ?? -1));
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', upload.single('image'), (req, res) => {
  try {
    const { name, description, price, stock, is_active } = req.body;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.image_url;
    db.prepare(`
      UPDATE products SET name=?, description=?, price=?, image_url=?, stock=?, is_active=?
      WHERE id=?
    `).run(
      name ?? existing.name,
      description ?? existing.description,
      price !== undefined ? parseInt(price) : existing.price,
      imageUrl,
      stock !== undefined ? parseInt(stock) : existing.stock,
      is_active !== undefined ? parseInt(is_active) : existing.is_active,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', (req, res) => {
  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name as product_name, p.image_url,
           u.username, u.first_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN users u ON o.user_id = u.telegram_id
    ORDER BY o.created_at DESC
    LIMIT 200
  `).all();
  res.json(orders);
});

router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.*, 
           (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.telegram_id) as referrals_count,
           (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.telegram_id) as orders_count
    FROM users u ORDER BY u.created_at DESC LIMIT 200
  `).all();
  res.json(users);
});

router.post('/giveaways', (req, res) => {
  try {
    const { title, description, prize, ends_at } = req.body;
    const result = db.prepare(`
      INSERT INTO giveaways (title, description, prize, ends_at)
      VALUES (?, ?, ?, ?)
    `).run(title, description, prize, ends_at);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

router.post('/promo', (req, res) => {
  try {
    const { code, discount, uses_left = -1 } = req.body;
    db.prepare('INSERT INTO promo_codes (code, discount, uses_left) VALUES (?, ?, ?)').run(code, discount, uses_left);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

module.exports = router;
