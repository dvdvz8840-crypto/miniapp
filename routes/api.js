const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

function generateReferralCode(telegramId) {
  return crypto.createHash('md5').update(String(telegramId)).digest('hex').slice(0, 8).toUpperCase();
}

async function checkChannelMembership(botToken, channelUsername, userId) {
  try {
    const channel = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;
    const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channel)}&user_id=${userId}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) return false;
    const status = data.result?.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (e) {
    console.error('Channel check error:', e.message);
    return false;
  }
}

// Auth & register
router.post('/auth', (req, res) => {
  try {
    const { telegram_id, username, first_name, last_name, photo_url, referral_code } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'No telegram_id' });

    // Ban check
    const ban = db.prepare('SELECT * FROM bans WHERE telegram_id = ?').get(telegram_id);
    if (ban) {
      const now = new Date();
      const until = ban.banned_until ? new Date(ban.banned_until) : null;
      if (!until || until > now) {
        return res.status(403).json({
          banned: true,
          reason: ban.reason || 'Нарушение правил',
          banned_until: ban.banned_until,
        });
      } else {
        db.prepare('DELETE FROM bans WHERE telegram_id = ?').run(telegram_id);
      }
    }

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
        UPDATE users SET username=?, first_name=?, last_name=?, photo_url=? WHERE telegram_id=?
      `).run(username || user.username, first_name || user.first_name, last_name || user.last_name, photo_url || user.photo_url, telegram_id);
      user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
    }

    const referrals = db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by = ?').get(telegram_id);
    res.json({ success: true, user: { ...user, referrals_count: referrals.count } });
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
  const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY price ASC').all();
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
      if (product.stock < quantity) return res.status(400).json({ error: 'Нет в наличии' });
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, product_id);
    }
    db.prepare('UPDATE users SET balance = balance - ? WHERE telegram_id = ?').run(totalPrice, user_id);
    const order = db.prepare(`
      INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, 'pending')
    `).run(user_id, product_id, quantity, totalPrice);
    res.json({ success: true, order_id: order.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:user_id', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, p.name as product_name, p.emoji, p.image_url
    FROM orders o JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ? ORDER BY o.created_at DESC
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
  const giveaways = db.prepare(`
    SELECT g.*, (SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = g.id) as entries_count
    FROM giveaways g WHERE g.is_active = 1 ORDER BY g.created_at DESC
  `).all();
  res.json(giveaways);
});

router.get('/giveaways/:id/my-entry', (req, res) => {
  const { user_id } = req.query;
  const entry = db.prepare('SELECT * FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?').get(req.params.id, user_id);
  res.json({ entered: !!entry });
});

router.post('/giveaways/:id/enter', async (req, res) => {
  try {
    const { user_id } = req.body;
    const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!giveaway) return res.status(404).json({ error: 'Розыгрыш не найден' });

    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(user_id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    // Check min deposit
    if (giveaway.min_deposit > 0 && user.total_deposited < giveaway.min_deposit) {
      return res.status(400).json({ error: `Минимальный депозит для участия: ${giveaway.min_deposit} ⭐` });
    }

    // Check channel subscription
    if (giveaway.channel_username) {
      const botToken = process.env.BOT_TOKEN;
      if (botToken) {
        const isMember = await checkChannelMembership(botToken, giveaway.channel_username, user_id);
        if (!isMember) {
          return res.status(400).json({
            error: `Необходимо подписаться на канал @${giveaway.channel_username}`,
            need_subscribe: true,
            channel: giveaway.channel_username,
          });
        }
      }
    }

    db.prepare('INSERT OR IGNORE INTO giveaway_entries (giveaway_id, user_id) VALUES (?, ?)').run(req.params.id, user_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/promo', (req, res) => {
  try {
    const { user_id, code } = req.body;
    const promo = db.prepare('SELECT * FROM promo_codes WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code);
    if (!promo) return res.status(404).json({ error: 'Промокод не найден или неактивен' });

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Промокод истёк' });
    }

    if (promo.max_activations !== -1 && promo.activations_count >= promo.max_activations) {
      return res.status(400).json({ error: 'Промокод больше не действителен (исчерпан лимит)' });
    }

    const alreadyUsed = db.prepare('SELECT * FROM promo_uses WHERE promo_id = ? AND user_id = ?').get(promo.id, user_id);
    if (alreadyUsed) return res.status(400).json({ error: 'Вы уже использовали этот промокод' });

    db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(promo.stars_amount, user_id);
    db.prepare('UPDATE promo_codes SET activations_count = activations_count + 1 WHERE id = ?').run(promo.id);
    db.prepare('INSERT INTO promo_uses (promo_id, user_id) VALUES (?, ?)').run(promo.id, user_id);

    res.json({ success: true, bonus: promo.stars_amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/topup', (req, res) => {
  try {
    const { user_id, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    db.prepare('UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE telegram_id = ?').run(amount, amount, user_id);
    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(user_id);
    res.json({ success: true, new_balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
