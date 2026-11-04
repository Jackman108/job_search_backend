# job_search_backend

Backend сервиса поиска/откликов на вакансии (TypeScript, Express, PostgreSQL).

Часть набора: `job_search_client` (UI) · `job_search_auth` (auth) · этот репозиторий (API + автоматизация).

> Не путать с отдельным репо [`puppeteer-parser`](https://github.com/Jackman108/puppeteer-parser) — там узкий Puppeteer-скрипт под HH. Здесь полноценный backend.

## Стек

- Node.js, TypeScript, Express
- PostgreSQL (`pg`)
- JWT
- WebSocket (`ws`)
- Swagger UI
- Puppeteer (автоматизация откликов, где нужно)
- Docker Compose для Postgres

## Быстрый старт

```bash
git clone https://github.com/Jackman108/job_search_backend.git
cd job_search_backend
yarn install   # или npm install

# Postgres
yarn docker:up

# .env в корне (см. пример ниже)
yarn dev
```

Сборка/прод:

```bash
yarn build
yarn start
```

## Переменные окружения

Создай `.env` в корне (значения свои):

```env
PORT=3001
DATABASE_URL=postgres://user:pass@localhost:5432/job_search
JWT_SECRET=change-me
# при необходимости — пути/флаги Puppeteer и URL фронта для CORS
```

Не коммить `.env` и файлы с паролями HH.

## Scripts

| Script | Назначение |
| --- | --- |
| `yarn dev` | nodemon / dev-сервер |
| `yarn build` | `tsc` → `dist/` |
| `yarn start` | `node dist/server.js` |
| `yarn docker:up` | поднять Postgres |
| `yarn docker:down` | остановить Postgres |
| `yarn test` | jest |

## Связанные репозитории

- [job_search_client](https://github.com/Jackman108/job_search_client)
- [job_search_auth](https://github.com/Jackman108/job_search_auth)
- [puppeteer-parser](https://github.com/Jackman108/puppeteer-parser) — отдельный HH apply-скрипт

## Лицензия

ISC