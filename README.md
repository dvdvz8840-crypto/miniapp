# 🎁 Gift Shop — Render Deployment

  ## Деплой на Render

  1. Загрузи проект на GitHub
  2. Зайди на render.com → New Web Service → выбери репозиторий
  3. Настройки:
     - Build Command: `npm run build`
     - Start Command: `npm start`
  4. Environment Variables:
     - BOT_TOKEN — токен от @BotFather
     - ADMIN_ID — твой Telegram ID
     - WEBAPP_URL — URL сервиса на Render (узнаешь после деплоя)
  5. Deploy → скопируй URL → вставь в WEBAPP_URL
  6. Настрой Mini App в @BotFather: /mybots → Menu Button → вставь URL

  ## Локальный запуск
  ```
  cp .env.example .env   # заполнить
  npm run build          # собрать фронтенд
  npm start
  ```
  