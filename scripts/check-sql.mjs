#!/usr/bin/env node
/**
 * Fail if per-user vacancy/feedback table naming remains in application code (S4 DoD).
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ROOTS = [path.join(ROOT, 'src'), path.join(ROOT, 'packages', 'hh-worker', 'src')];
const SKIP_DIR = new Set(['node_modules', 'dist', 'coverage', '.hh-jobs']);

/** Patterns that indicate legacy per-user tables. */
const FORBIDDEN = [
    /\$\{userId\}_vacancy/,
    /\$\{userId\}_feedbacks/,
    /`\$\{userId\}_/,
    /"\$\{userId\}_vacancy"/,
    /"\$\{userId\}_feedbacks"/,
    /userId\}_\$\{.*vacancy/,
    /_vacancy"`/,
];

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        if (SKIP_DIR.has(name)) continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (/\.(ts|js|mjs)$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
    }
    return out;
}

const hits = [];
for (const root of ROOTS) {
    for (const file of walk(root)) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        // migrate script + queryHelpers.deleteTable may still mention pattern in comments — allow helpers until phase 8
        if (rel.includes('migrate-s4-per-user-tables')) continue;
        if (rel.includes('check-sql.mjs')) continue;
        const text = fs.readFileSync(file, 'utf8');
        for (const re of FORBIDDEN) {
            if (re.test(text)) {
                hits.push(`${rel} matches ${re}`);
                break;
            }
        }
    }
}

if (hits.length === 0) {
    console.log('check:sql OK (no per-user vacancy/feedback table patterns)');
    process.exit(0);
}

console.error(`check:sql FAIL — ${hits.length} hit(s):`);
for (const h of hits) console.error(`  ${h}`);
process.exit(1);
