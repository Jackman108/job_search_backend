# Market Hunter — Backend (Puppeteer + Express)

> Не путать с `Documents/job-hunt` — там канон найма/CV; этот репозиторий — API и автоотклики на [HeadHunter](https://hh.ru).

Express + TypeScript + Puppeteer + Postgres + WebSocket + Swagger.

## Установка

1. Node.js + npm
2. `git clone` → `cd backend`
3. `npm install`
4. Скопировать `.env.example` → `.env` и `src/secrets.example.ts` → `src/secrets.ts`

## Порты (dev)

| Сервис | Порт |
|--------|------|
| HTTP API | **8000** (`API_PORT`) |
| WebSocket | **8080** (`WS_PORT`) |
| Health | `GET /health` |
| Swagger | `/api-docs` |
| Postgres / pgAdmin | 5432 / 5050 (`npm run docker:up`) |

Полный стек (client + auth): [`../docs/DEV_SETUP.md`](../docs/DEV_SETUP.md).

## Запуск

```bash
npm run docker:up
npm run dev
```

## Puppeteer / HH

Сценарии в `src/run/`: login HH, поиск, отклик, cover letter, feedback/chats.

Селекторы централизованы в `src/config/constants.config.ts` (`data-qa` атрибуты HH). При поломке UI HH правьте только этот файл.

`src/secrets.ts` **не коммитить** (пароль HH).

## Лицензия

[ISC](LICENSE)
