const Database = require('better-sqlite3');
  const path = require('path');

  const db = new Database(path.join(__dirname, 'shop.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      photo_url TEXT,
      balance INTEGER DEFAULT 0,
      total_deposited INTEGER DEFAULT 0,
      referral_code TEXT UNIQUE,
      referred_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image_url TEXT,
      emoji TEXT DEFAULT '🎁',
      stock INTEGER DEFAULT -1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      total_price INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(telegram_id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      prize TEXT,
      photo_url TEXT,
      ends_at DATETIME,
      channel_username TEXT,
      min_deposit INTEGER DEFAULT 0,
      conditions_text TEXT,
      is_active INTEGER DEFAULT 1,
      winner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS giveaway_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      giveaway_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(giveaway_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      stars_amount INTEGER NOT NULL,
      max_activations INTEGER DEFAULT -1,
      activations_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS promo_uses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promo_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(promo_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS bans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      reason TEXT,
      banned_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  function seedDefaultProducts() {
    const existing = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (existing.count === 0) {
      const ins = db.prepare('INSERT INTO products (name, description, price, emoji, stock) VALUES (?, ?, ?, ?, ?)');
      ins.run('Плюшевый мишка', 'Анлимитный подарок-мишка в Telegram', 15, '🐻', -1);
      ins.run('Алмаз', 'Редкий сверкающий алмаз', 100, '💎', -1);
      ins.run('Роза', 'Нежный подарок для особых', 25, '🌹', -1);
      ins.run('Торт', 'Праздничный торт', 50, '🎂', -1);
      ins.run('Корона', 'Покажи кто тут главный', 200, '👑', -1);
      ins.run('Сердце', 'Подарок от всего сердца', 30, '❤️', -1);
    }
  }
  seedDefaultProducts();

  module.exports = db;
  