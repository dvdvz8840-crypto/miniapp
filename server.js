require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Telegraf } = require('telegraf');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'miniapp/dist')));

app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'miniapp/dist/index.html'));
});

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.vercel.app';

// ── BOT ──────────────────────────────────────────────────────
let bot;
if (process.env.BOT_TOKEN) {
  bot = new Telegraf(process.env.BOT_TOKEN);

  bot.start(async (ctx) => {
    const payload = ctx.startPayload;
    const url = payload ? `${WEBAPP_URL}?ref=${payload}` : WEBAPP_URL;
    await ctx.replyWithPhoto(
      { url: 'https://via.placeholder.com/600x300/6C63FF/ffffff?text=Gift+Shop' },
      {
        caption: `🎁 *Добро пожаловать в Gift Shop!*\n\nПокупай анлимитные подарки Telegram за звёзды ⭐\n\n🐻 Мишки, 💎 Алмазы, 🌹 Розы и многое другое\n🎰 Розыгрыши с призами\n👥 Реферальная программа`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🛍 Открыть магазин', web_app: { url } }]]
        }
      }
    );
  });

  bot.command('admin', async (ctx) => {
    if (String(ctx.from.id) !== String(process.env.ADMIN_ID)) {
      return ctx.reply('❌ Нет доступа');
    }
    await ctx.reply('👑 Добро пожаловать, администратор!', {
      reply_markup: {
        inline_keyboard: [[
          { text: '⚙️ Админ-панель', web_app: { url: `${WEBAPP_URL}?admin=true` } }
        ]]
      }
    });
  });

  bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));

  bot.on('successful_payment', async (ctx) => {
    const amount = ctx.message.successful_payment.total_amount;
    const userId = ctx.from.id;
    try {
      const db = require('./database');
      db.prepare('UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE telegram_id = ?').run(amount, amount, userId);
      await ctx.reply(`✅ Баланс пополнен на ${amount} ⭐`);
    } catch (err) { console.error(err); }
  });
}

// Vercel: export app; local dev: listen + long-polling
if (process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server on port ${PORT}`);
    if (bot) {
      bot.launch().then(() => console.log('🤖 Bot started')).catch(console.error);
    }
  });
  if (bot) {
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
}
