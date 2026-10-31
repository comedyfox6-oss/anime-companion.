# Anime Companion

Ранняя основа: чат на русском, Three.js VRM 1.0 viewer и Cloudflare Worker API. В репозитории пока **нет готовой VRM-модели**, а AI требует настройки провайдера.

## Локальный запуск

Нужен Node.js 20.19+ или 22.12+. Выполни npm install, затем npm run dev. Для локального Worker запусти npx wrangler dev --port 8787. Скопируй .env.example в .env.local и укажи VITE_API_URL на Worker endpoint.

## AI provider

Можно настроить OpenAI-compatible endpoint через Worker secrets OPENAI_API_KEY и OPENAI_BASE_URL (base URL без /chat/completions), плюс var OPENAI_MODEL. Альтернатива — Cloudflare Workers AI binding AI и var WORKERS_AI_MODEL. Секреты нельзя помещать во frontend или Git.

Worker проверяет метод, origin и структуру сообщений, ограничивает контекст, возвращает явные ошибки. Это ранний API без полноценной аутентификации, сохранения переписки и D1-памяти; не используй его как приватный многопользовательский сервис до добавления проверенной сессии/JWT.

## Deploy

Выполни npm install, npm run build, настрой secrets через npx wrangler secret put OPENAI_API_KEY и OPENAI_BASE_URL, затем npx wrangler deploy. Укажи реальный frontend origin в ALLOWED_ORIGINS. Для Workers AI включи binding AI в настройках Worker.

## VRM

Настоящий VRM 1.0 можно загрузить кнопкой в приложении либо положить в public/models/boy.vrm. Файл обрабатывается локально. Референс лежит в references/blue-boy.jpg и не заменяет VRM.

## Memory roadmap

SQL-заготовка находится в migrations/0001_initial.sql, но D1 ещё не подключена. Перед реализацией памяти нужно добавить D1 binding и проверку сессии/JWT. user_id должен извлекаться только из проверенной сервером личности, а не из тела запроса. Удаление истории и долгосрочных воспоминаний должно быть раздельным.

## Checks

npm run build — production build. Ручная проверка: mobile/desktop, VRM upload (валидный и ошибочный файл), API success/provider failure, неверные сообщения, отсутствие VRM. Настоящий AI требует настроенного Worker/provider; 3D-персонаж требует отдельного VRM asset.