# Market Hunter — Backend (Puppeteer + Express)

> Не путать с `Documents/job-hunt` — там канон найма/CV; этот репозиторий — API и автоотклики на [HeadHunter](https://hh.ru).

Express + TypeScript + Puppeteer + Postgres + WebSocket + Swagger.

Часть набора: [`job_search_client`](https://github.com/Jackman108/job_search_client) (UI) · [`job_search_auth`](https://github.com/Jackman108/job_search_auth) (auth) · этот репозиторий (API + автоматизация).

> Не путать с отдельным репо [`puppeteer-parser`](https://github.com/Jackman108/puppeteer-parser) — там узкий Puppeteer-скрипт под HH. Здесь полноценный backend.

## Установка

1. Node.js + npm/yarn
2. `git clone` → `cd backend`
3. `npm install` / `yarn install`
4. Скопировать `.env.example` → `.env` (HH login/пароль/письмо — из формы UI, не из secrets.ts)

## Порты (dev)

| Сервис | Порт |
|--------|------|
| HTTP API | **8000** (`API_PORT`) |
| WebSocket | **8080** (`WS_PORT`) |
| Health | `GET /health` (HTTP) · `ws://…/health` (WS, no token) |
| Swagger | `/api-docs` |
| Postgres / pgAdmin | 5432 / 5050 (`npm run docker:up`) |

Полный стек (client + auth): [`../docs/DEV_SETUP.md`](../docs/DEV_SETUP.md).

## Запуск

```bash
npm run docker:up
npm run dev
```

Сборка/прод:

```bash
npm run build
npm start
```

## Puppeteer / HH

Сценарии в `src/run/`: login HH, поиск, отклик, cover letter, feedback/chats.

Селекторы централизованы в `src/config/constants.config.ts` (`data-qa` атрибуты HH). При поломке UI HH правьте только этот файл.

Локальный `src/secrets.ts` больше не нужен (исторически мог содержать пароль HH — удалить, пароль на HH сменить).

Worker (crash isolation): default `HH_WORKER_MODE=queue` spawns workspace package `@market-hunter/hh-worker` (`packages/hh-worker/bin/run.mjs`) detached; poll `GET /jobs/:jobId`. Override entry with `HH_WORKER_ENTRY`. Legacy in-process: `HH_WORKER_MODE=sync`. Manual: `yarn worker -- <jobId>`.

## Связанные репозитории

- [job_search_client](https://github.com/Jackman108/job_search_client)
- [job_search_auth](https://github.com/Jackman108/job_search_auth)
- [puppeteer-parser](https://github.com/Jackman108/puppeteer-parser) — отдельный HH apply-скрипт

## Лицензия

[ISC](LICENSE)
