#!/usr/bin/env node
/**
 * S4 data migration: copy per-user "${uuid}_vacancy" / "${uuid}_feedbacks"
 * into shared vacancies / feedbacks, then rename sources to _legacy_*.
 *
 *   yarn migrate:s4 --dry-run
 *   yarn migrate:s4
 *
 * Requires migration 004 applied (shared tables exist). Quiet HH window (D3).
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env') });
const { Pool } = require('pg');

const dryRun = process.argv.includes('--dry-run');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'job_search',
});

function quoteIdent(name) {
    return `"${String(name).replace(/"/g, '""')}"`;
}

function parseLegacy(tablename) {
    if (tablename.endsWith('_feedbacks')) {
        return { kind: 'feedbacks', userId: tablename.slice(0, -'_feedbacks'.length) };
    }
    if (tablename.endsWith('_vacancy')) {
        return { kind: 'vacancy', userId: tablename.slice(0, -'_vacancy'.length) };
    }
    return null;
}

async function main() {
    const client = await pool.connect();
    try {
        const shared = await client.query(`
            SELECT to_regclass('public.vacancies') AS vacancies,
                   to_regclass('public.feedbacks') AS feedbacks
        `);
        if (!shared.rows[0]?.vacancies || !shared.rows[0]?.feedbacks) {
            throw new Error('Shared tables missing — run yarn migrate first (004_vacancies_feedbacks_shared.sql)');
        }

        const { rows: tables } = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
              AND (
                tablename LIKE '%\\_vacancy' ESCAPE '\\'
                OR tablename LIKE '%\\_feedbacks' ESCAPE '\\'
              )
              AND tablename NOT LIKE '\\_legacy\\_%' ESCAPE '\\'
              AND tablename NOT IN ('vacancies', 'feedbacks')
            ORDER BY tablename
        `);

        console.log(`migrate:s4 mode=${dryRun ? 'dry-run' : 'apply'} candidates=${tables.length}`);

        let vacancySrc = 0;
        let vacancyCopied = 0;
        let feedbackSrc = 0;
        let feedbackCopied = 0;
        let renamed = 0;

        for (const { tablename } of tables) {
            const parsed = parseLegacy(tablename);
            if (!parsed || !parsed.userId) {
                console.warn(`skip unrecognized table: ${tablename}`);
                continue;
            }
            const { kind, userId } = parsed;
            const src = quoteIdent(tablename);
            const legacyName = `_legacy_${tablename}`;
            const legacy = quoteIdent(legacyName);

            const countRes = await client.query(`SELECT COUNT(*)::int AS n FROM ${src}`);
            const n = countRes.rows[0].n;

            if (kind === 'vacancy') {
                vacancySrc += n;
                console.log(`vacancy table=${tablename} user=${userId} rows=${n}`);
                if (!dryRun) {
                    await client.query('BEGIN');
                    try {
                        const ins = await client.query(
                            `
                            INSERT INTO vacancies (
                                user_id, id, title_vacancy, url_vacancy, title_company,
                                url_company, vacancy_status, response_date
                            )
                            SELECT $1::uuid, id, title_vacancy, url_vacancy, title_company,
                                   url_company, vacancy_status, response_date
                            FROM ${src}
                            ON CONFLICT (user_id, id) DO UPDATE SET
                                title_vacancy = EXCLUDED.title_vacancy,
                                url_vacancy = EXCLUDED.url_vacancy,
                                title_company = EXCLUDED.title_company,
                                url_company = EXCLUDED.url_company,
                                vacancy_status = EXCLUDED.vacancy_status,
                                response_date = EXCLUDED.response_date
                            `,
                            [userId],
                        );
                        vacancyCopied += ins.rowCount ?? 0;
                        await client.query(`ALTER TABLE ${src} RENAME TO ${legacy}`);
                        renamed += 1;
                        await client.query('COMMIT');
                    } catch (err) {
                        await client.query('ROLLBACK');
                        throw err;
                    }
                }
            } else {
                feedbackSrc += n;
                console.log(`feedback table=${tablename} user=${userId} rows=${n}`);
                if (!dryRun) {
                    const colRes = await client.query(
                        `
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = $1
                        `,
                        [tablename],
                    );
                    const cols = new Set(colRes.rows.map((r) => r.column_name));
                    const titleVac = cols.has('title_vacancy') ? 'title_vacancy' : 'NULL::varchar';
                    const titleCo = cols.has('title_company') ? 'title_company' : 'NULL::varchar';
                    await client.query('BEGIN');
                    try {
                        const ins = await client.query(
                            `
                            INSERT INTO feedbacks (
                                user_id, id, vacancy_id, feedback_text, feedback_date,
                                response_status, title_vacancy, title_company
                            )
                            SELECT $1::uuid, id, vacancy_id, feedback_text, feedback_date,
                                   response_status, ${titleVac}, ${titleCo}
                            FROM ${src}
                            ON CONFLICT (user_id, id) DO UPDATE SET
                                vacancy_id = EXCLUDED.vacancy_id,
                                feedback_text = EXCLUDED.feedback_text,
                                feedback_date = EXCLUDED.feedback_date,
                                response_status = EXCLUDED.response_status,
                                title_vacancy = EXCLUDED.title_vacancy,
                                title_company = EXCLUDED.title_company
                            `,
                            [userId],
                        );
                        feedbackCopied += ins.rowCount ?? 0;
                        await client.query(`ALTER TABLE ${src} RENAME TO ${legacy}`);
                        renamed += 1;
                        await client.query('COMMIT');
                    } catch (err) {
                        await client.query('ROLLBACK');
                        throw err;
                    }
                }
            }
        }

        const sharedVac = await client.query('SELECT COUNT(*)::int AS n FROM vacancies');
        const sharedFb = await client.query('SELECT COUNT(*)::int AS n FROM feedbacks');
        console.log(
            JSON.stringify(
                {
                    dryRun,
                    vacancySrcRows: vacancySrc,
                    feedbackSrcRows: feedbackSrc,
                    vacancyCopied,
                    feedbackCopied,
                    renamed,
                    sharedVacancies: sharedVac.rows[0].n,
                    sharedFeedbacks: sharedFb.rows[0].n,
                },
                null,
                2,
            ),
        );
        console.log(dryRun ? 'migrate:s4 dry-run OK' : 'migrate:s4 apply OK');
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
