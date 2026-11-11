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

## Postgres tables

Per-user vacancy/feedback tables are created on first read. Shared `vacancy_auth` and `vacancy_submit` (HH login + search fields for `/vacancy-auth` and `/vacancy-field`) are ensured the same way and listed in `postgres/postgres/init.sql` for fresh Docker volumes. Empty lists return **200 + `[]`**.

## Порты (dev)

| Сервис             | Порт                                                  |
| ------------------ | ----------------------------------------------------- |
| HTTP API           | **8000** (`API_PORT`)                                 |
| WebSocket          | **8080** (`WS_PORT`)                                  |
| Health             | `GET /health` (HTTP) · `ws://…/health` (WS, no token) |
| Swagger            | `/api-docs`                                           |
| Postgres / pgAdmin | 5432 / 5050 (`npm run docker:up`)                     |

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

Сценарии в `packages/hh-worker/src/run/` (import alias `@run`): login HH, поиск, отклик, cover letter, feedback/chats.

Селекторы централизованы в `src/config/constants.config.ts` (`data-qa` атрибуты HH). При поломке UI HH правьте только этот файл.

Локальный `src/secrets.ts` больше не нужен (исторически мог содержать пароль HH — удалить, пароль на HH сменить).

Worker (crash isolation): `/start` and `/refresh` always queue — spawn `@market-hunter/hh-worker` (`packages/hh-worker/bin/run.mjs`) detached; poll `GET /jobs/:jobId` (source of truth — CAPTCHA/errors persist on the job record; base broadcast is WS-noop). Override entry with `HH_WORKER_ENTRY`. Manual: `yarn worker -- <jobId>`. Requires **Node >=20** (`engines.node`; CI uses 20, local 24 OK).

## Связанные репозитории

- [job_search_client](https://github.com/Jackman108/job_search_client)
- [job_search_auth](https://github.com/Jackman108/job_search_auth)
- [puppeteer-parser](https://github.com/Jackman108/puppeteer-parser) — отдельный HH apply-скрипт

## Лицензия

[ISC](LICENSE)
