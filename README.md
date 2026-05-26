# 🎁 Gift Shop — Telegram Mini App v2.0

Магазин анлимитных подарков для Telegram с Mini App.

## Возможности v2.0

### Пользователи
- 🛍 Магазин подарков (мишки, алмазы, розы и т.д.)
- 🎰 Розыгрыши с фото, условиями, проверкой подписки на канал
- 👥 Реферальная программа (+10 ⭐ за каждого)
- 🏷 Промокоды на звёзды
- ⭐ Пополнение баланса через Telegram Stars
- 🚫 Отображение причины и срока блокировки

### Администратор (/admin в боте)
- 📦 Товары — добавить/редактировать/скрыть/удалить
- 📋 Заказы — доставить/отменить
- 👤 Пользователи — баланс, забанить/разбанить (с причиной и сроком)
- 🏆 Розыгрыши — фото, условия, канал для подписки, мин. депозит, дата, розыгрыш победителя
- 🏷 Промокоды — звёзды, лимит активаций, срок действия
- 🛡 Баны — список заблокированных, разблокировка

## Деплой на Vercel (рекомендуется)

### 1. Создайте бота в @BotFather
- Отправьте `/newbot`, следуйте инструкциям
- Узнайте свой ID через @userinfobot → `ADMIN_ID`

### 2. Установите Vercel CLI и задеплойте
```bash
npm i -g vercel
npm run build        # собрать фронтенд
vercel               # запустить деплой
```

### 3. Переменные окружения в Vercel Dashboard
Settings → Environment Variables:

| Переменная | Значение |
|-----------|----------|
| `BOT_TOKEN` | Токен от @BotFather |
| `ADMIN_ID` | Ваш Telegram ID |
| `WEBAPP_URL` | `https://ваш-проект.vercel.app` |

### 4. Настройте Mini App в @BotFather
`/mybots` → Bot Settings → Menu Button → вставьте URL Vercel

### ⚠️ Важно о данных на Vercel
SQLite на Vercel **сбрасывается при каждом деплое** (serverless).  
Для постоянного хранения данных используйте **Railway** или **Render**:
- [railway.app](https://railway.app) — прямой деплой из папки, $5 кредит бесплатно

## Локальный запуск

```bash
cp .env.example .env   # заполнить BOT_TOKEN, ADMIN_ID, WEBAPP_URL
npm install
npm run build          # собрать фронтенд
npm start              # запустить
```

Бот запустится в режиме long-polling, откройте http://localhost:3000

## Структура

```
tg-gift-shop/
├── server.js          # Express + Telegraf
├── database.js        # SQLite схема
├── routes/
│   ├── api.js         # API пользователей
│   └── admin.js       # API администратора
├── miniapp/src/pages/ # Home, Shop, Referral, Profile, AdminPanel
├── uploads/           # Загруженные фото
├── vercel.json        # Настройки Vercel
└── .env.example
```
