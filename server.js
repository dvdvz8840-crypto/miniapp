require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Telegraf } = require('telegraf');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'miniapp/dist')));

app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'miniapp/dist/index.html'));
});

const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.com';

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload;
  let webappUrl = WEBAPP_URL;
  if (startPayload) {
    webappUrl = `${WEBAPP_URL}?ref=${startPayload}`;
  }

  await ctx.replyWithPhoto(
    { url: 'https://via.placeholder.com/600x300/6C63FF/ffffff?text=Gift+Shop' },
    {
      caption: `🎁 *Добро пожаловать в Gift Shop!*\n\nПокупай анлимитные подарки для друзей в Telegram за звёзды ⭐\n\n✨ Мишки, алмазы, розы и многое другое\n🎰 Участвуй в розыгрышах\n👥 Приглашай друзей и получай бонусы`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🛍 Открыть магазин', web_app: { url: webappUrl } }
        ]]
      }
    }
  );
});

bot.command('admin', async (ctx) => {
  if (String(ctx.from.id) !== String(process.env.ADMIN_ID)) {
    return ctx.reply('❌ У вас нет доступа к админ-панели');
  }
  await ctx.reply('👑 Добро пожаловать, администратор!', {
    reply_markup: {
      inline_keyboard: [[
        { text: '⚙️ Открыть админ-панель', web_app: { url: `${WEBAPP_URL}?admin=true` } }
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
    db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(amount, userId);
    await ctx.reply(`✅ Баланс пополнен на ${amount} ⭐\nТеперь вы можете покупать подарки в магазине!`);
  } catch (err) {
    console.error(err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  bot.launch().then(() => console.log('Bot started')).catch(console.error);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
