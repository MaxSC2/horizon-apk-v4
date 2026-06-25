# ГОРИЗОНТ — Деплой на Vercel (5 минут)

## Структура проекта

```
horizon/
├── src/main.jsx
├── public/icons/icon-192.png  (192×192)
├── public/icons/icon-512.png  (512×512)
├── HorizonTracker.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Команды

```bash
npm install          # установить зависимости
npm run dev          # локальный запуск → localhost:5173
npm run build        # собрать → папка dist/
```

## Деплой Vercel

1. vercel.com → New Project → выбери GitHub репо
2. Framework: Vite (автоматически)
3. Build: `npm run build`  |  Output: `dist`
4. Deploy → получишь ссылку

## После деплоя заработают

- Gemini, OpenAI, Groq, Ollama (сейчас блокирует CORS)
- PWA установка на телефон
- Офлайн режим (Service Worker)
- Уведомления о тренировке

## Обновление

```bash
git add . && git commit -m "update" && git push
# Vercel автоматически передеплоит
```
