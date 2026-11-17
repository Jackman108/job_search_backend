# Backend SQL migrations

Owner: backend (decision D1). Auth Prisma owns only auth-service tables.

## Layout

```
migrations/
  001_….sql
  …
```

Filenames: `NNN_snake_case.sql` (zero-padded). Applied in lexical order.

## Runner

```bash
yarn migrate          # apply pending
yarn migrate --status # show applied vs pending
```

State table: `schema_migrations(id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ)`.

Uses the same `DB_*` env as the API (via `dotenv` from backend `.env`).

## Rules

- Idempotent where practical (`IF NOT EXISTS`, guarded `ALTER`).
- One logical change per file.
- No secrets in SQL.
- Module README lists tables it owns.
