#!/usr/bin/env node
/**
 * Tiny SQL migration runner (no new deps). Uses pg + dotenv like the API.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

require('dotenv').config({ path: path.join(ROOT, '.env') });
const { Pool } = require('pg');

const MIGRATIONS_DIR = path.join(ROOT, 'migrations');
const statusOnly = process.argv.includes('--status');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'job_search',
});

async function ensureTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

function listSqlFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) return [];
    return fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((n) => /^\d+_.*\.sql$/i.test(n))
        .sort();
}

async function main() {
    const client = await pool.connect();
    try {
        await ensureTable(client);
        const { rows } = await client.query('SELECT id FROM schema_migrations');
        const applied = new Set(rows.map((r) => r.id));
        const files = listSqlFiles();

        if (statusOnly) {
            for (const f of files) {
                console.log(`${applied.has(f) ? 'applied' : 'pending'}\t${f}`);
            }
            return;
        }

        for (const f of files) {
            if (applied.has(f)) continue;
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
            console.log(`Applying ${f}…`);
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [f]);
                await client.query('COMMIT');
                console.log(`Applied ${f}`);
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
        }
        console.log('migrate: OK');
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((err) => {
    console.error('migrate FAILED:', err.message || err);
    process.exit(1);
});
