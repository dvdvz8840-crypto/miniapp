require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'miniapp/src/dist')));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'miniapp/src/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Gift Shop API running');
  }
});

// Bot setup
if (process.env.BOT_TOKEN && !isVercel) {
  try {
    const { Telegraf } = require('telegraf');
    const bot = new Telegraf(process.env.BOT_TOKEN);
    const WEBAPP_URL = process.env.WEBAPP_URL || 'https://localhost:3000';

    bot.start(async (ctx) => {
      const url = ctx.startPayload ? `${WEBAPP_URL}?ref=${ctx.startPayload}` : WEBAPP_URL;
      await ctx.reply('🛍 Открыть магазин:', {
        reply_markup: { inline_keyboard: [[{ text: '🛍 Открыть', web_app: { url } }]] }
      });
    });

    bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));
    bot.on('successful_payment', async (ctx) => {
      const amount = ctx.message.successful_payment.total_amount;
      const db = require('./database');
      db.prepare('UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE telegram_id = ?')
        .run(amount, amount, ctx.from.id);
      await ctx.reply(`✅ +${amount} ⭐`);
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Server on port ${PORT}`);
      bot.launch().then(() => console.log('🤖 Bot started')).catch(console.error);
    });
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (err) {
    console.error('Bot error:', err.message);
  }
}

module.exports = app;
