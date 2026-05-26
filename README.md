# 🎁 Gift Shop — Telegram Mini App Bot

Магазин анлимитных подарков для Telegram с Mini App.

## Структура проекта

```
tg-gift-shop/
├── server.js          — Express сервер + Telegram бот
├── database.js        — SQLite база данных
├── routes/
│   ├── api.js         — API для мини-приложения
│   └── admin.js       — API для администратора
├── uploads/           — Загруженные изображения товаров
├── miniapp/           — React фронтенд мини-приложения
│   ├── src/pages/     — Страницы: Home, Shop, Referral, Profile, AdminPanel
│   └── src/components/ — Компоненты: BottomNav
├── .env.example       — Пример переменных окружения
└── package.json
```

## Быстрый старт

### 1. Создайте бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Скопируйте токен бота

### 2. Настройка

```bash
# Скопируйте .env.example в .env
cp .env.example .env
```

Заполните `.env`:

```env
BOT_TOKEN=ваш_токен_бота
ADMIN_ID=ваш_telegram_id
WEBAPP_URL=https://ваш-домен.com
PORT=3000
```

> **Как узнать свой ADMIN_ID:** напишите @userinfobot в Telegram

### 3. Установка зависимостей

```bash
# Бэкенд
npm install

# Фронтенд
cd miniapp
npm install
npm run build
cd ..
```

### 4. Запуск

```bash
npm start
```

## Деплой (рекомендуется)

### Railway / Render / VPS

1. Загрузите проект на сервер
2. Настройте `.env`
3. Соберите фронтенд: `cd miniapp && npm install && npm run build`
4. Запустите: `npm start`
5. Настройте Mini App в @BotFather: `/newapp` → укажите URL вашего сервера

### Настройка Mini App в BotFather

1. Откройте @BotFather
2. Отправьте `/mybots` → выберите бота → `Bot Settings` → `Menu Button`
3. Укажите URL: `https://ваш-домен.com`

## Возможности

### Для пользователей
- 🏠 **Главная** — статистика, активные розыгрыши
- 🛍 **Магазин** — покупка подарков за звёзды Telegram
- 👥 **Рефералка** — реферальная программа (+10 ⭐ за приглашение)
- 👤 **Профиль** — баланс, пополнение, промокоды

### Для администратора (откройте `/admin` в боте)
- ➕ Добавление / редактирование товаров с ценой, фото и лимитом
- 📋 История всех заказов с возможностью изменить статус
- 👥 Список пользователей с балансом
- 🏆 Создание розыгрышей
- 🏷 Создание промокодов

## Платежи

Пополнение баланса работает через стандартный механизм **Telegram Stars**.
Для интеграции реальных платежей нужно:
1. Получить `PAYMENT_TOKEN` от @BotFather (через `Payments`)
2. Добавить invoice в bot.js при нажатии "Пополнить баланс"

## Переменные окружения

| Переменная | Описание |
|-----------|---------|
| `BOT_TOKEN` | Токен бота от @BotFather |
| `ADMIN_ID` | Telegram ID администратора |
| `WEBAPP_URL` | URL вашего сервера (без / в конце) |
| `PORT` | Порт сервера (по умолчанию 3000) |
