const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

function generateReferralCode(telegramId) {
  return crypto.createHash('md5').update(String(telegramId)).digest('hex').slice(0, 8).toUpperCase();
}

router.post('/auth', (req, res) => {
  try {
    const { telegram_id, username, first_name, last_name, photo_url, referral_code } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'No telegram_id' });

    let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);

    if (!user) {
      const myCode = generateReferralCode(telegram_id);
      let referredBy = null;

      if (referral_code) {
        const referrer = db.prepare('SELECT * FROM users WHERE referral_code = ?').get(referral_code);
        if (referrer && referrer.telegram_id !== telegram_id) {
          referredBy = referrer.telegram_id;
          db.prepare('UPDATE users SET balance = balance + 10 WHERE telegram_id = ?').run(referrer.telegram_id);
        }
      }

      db.prepare(`
        INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, referral_code, referred_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(telegram_id, username || null, first_name || null, last_name || null, photo_url || null, myCode, referredBy);

      user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
    } else {
      db.prepare(`
        UPDATE users SET username=?, first_name=?, last_name=?, photo_url=?
        WHERE telegram_id=?
      `).run(username || user.username, first_name || user.first_name, last_name || user.last_name, photo_url || user.photo_url, telegram_id);
      user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:telegram_id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(req.params.telegram_id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const referrals = db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by = ?').get(req.params.telegram_id);
  res.json({ ...user, referrals_count: referrals.count });
});

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY id').all();
  res.json(products);
});

router.post('/orders', (req, res) => {
  try {
    const { user_id, product_id, quantity = 1 } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalPrice = product.price * quantity;

    if (user.balance < totalPrice) return res.status(400).json({ error: 'Недостаточно звёзд на балансе' });

    if (product.stock !== -1) {
      if (product.stock < quantity) return res.status(400).json({ error: 'Недостаточно товара в наличии' });
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, product_id);
    }

    db.prepare('UPDATE users SET balance = balance - ? WHERE telegram_id = ?').run(totalPrice, user_id);

    const order = db.prepare(`
      INSERT INTO orders (user_id, product_id, quantity, total_price, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(user_id, product_id, quantity, totalPrice);

    res.json({ success: true, order_id: order.lastInsertRowid, message: 'Ожидайте доставку' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:user_id', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name as product_name, p.image_url
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.params.user_id);
  res.json(orders);
});

router.get('/referrals/:user_id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(req.params.user_id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const referrals = db.prepare(`
    SELECT telegram_id, username, first_name, created_at
    FROM users WHERE referred_by = ? ORDER BY created_at DESC
  `).all(req.params.user_id);
  res.json({ referral_code: user.referral_code, referrals, count: referrals.length });
});

router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const totalRevenue = db.prepare('SELECT SUM(total_price) as sum FROM orders').get();
  const activeGiveaways = db.prepare('SELECT COUNT(*) as count FROM giveaways WHERE is_active = 1').get();
  res.json({
    total_users: totalUsers.count,
    total_orders: totalOrders.count,
    total_revenue: totalRevenue.sum || 0,
    active_giveaways: activeGiveaways.count,
  });
});

router.get('/giveaways', (req, res) => {
  const giveaways = db.prepare('SELECT * FROM giveaways WHERE is_active = 1 ORDER BY created_at DESC').all();
  res.json(giveaways);
});

router.post('/giveaways/:id/enter', (req, res) => {
  try {
    const { user_id } = req.body;
    const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!giveaway) return res.status(404).json({ error: 'Розыгрыш не найден' });

    db.prepare('INSERT OR IGNORE INTO giveaway_entries (giveaway_id, user_id) VALUES (?, ?)').run(req.params.id, user_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/promo', (req, res) => {
  try {
    const { user_id, code } = req.body;
    const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(code);
    if (!promo) return res.status(404).json({ error: 'Промокод не найден или неактивен' });
    if (promo.uses_left === 0) return res.status(400).json({ error: 'Промокод использован' });

    db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(promo.discount, user_id);
    if (promo.uses_left > 0) {
      db.prepare('UPDATE promo_codes SET uses_left = uses_left - 1 WHERE id = ?').run(promo.id);
    }
    res.json({ success: true, bonus: promo.discount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/topup', (req, res) => {
  try {
    const { user_id, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(amount, user_id);
    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(user_id);
    res.json({ success: true, new_balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
