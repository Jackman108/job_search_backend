#!/usr/bin/env node
/**
 * E8: ensure keys referenced as process.env.KEY in src/packages appear in .env.example
 * (active or commented). Report-only by default; --enforce / CHECK_ENV_EXAMPLES_ENFORCE=1 fails.
 *
 *   yarn check:env-examples
 *   yarn check:env-examples --enforce
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ENFORCE = process.argv.includes('--enforce') || process.env.CHECK_ENV_EXAMPLES_ENFORCE === '1';
const EXAMPLE = path.join(ROOT, '.env.example');
const SCAN_DIRS = ['src', 'packages'].map((d) => path.join(ROOT, d));

/** Keys that are host/CI only or intentionally undocumented in local example. */
const ALLOW_MISSING = new Set([
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'FRONTEND_URL', // alias of DOMAIN_URL in payment.config
]);

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist') continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (/\.tsx?$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
    }
    return out;
}

function keysFromCode() {
    const re = /process\.env\.([A-Z][A-Z0-9_]*)/g;
    const found = new Set();
    for (const dir of SCAN_DIRS) {
        for (const file of walk(dir)) {
            const text = fs.readFileSync(file, 'utf8');
            let m;
            while ((m = re.exec(text))) found.add(m[1]);
        }
    }
    return [...found].sort();
}

function keysFromExample(text) {
    const keys = new Set();
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const body = trimmed.startsWith('#') ? trimmed.replace(/^#\s*/, '') : trimmed;
        const m = body.match(/^([A-Z][A-Z0-9_]*)\s*=/);
        if (m) keys.add(m[1]);
    }
    return keys;
}

const codeKeys = keysFromCode();
if (!fs.existsSync(EXAMPLE)) {
    console.error('check:env-examples FAIL: missing .env.example');
    process.exit(1);
}
const exampleKeys = keysFromExample(fs.readFileSync(EXAMPLE, 'utf8'));
const missing = codeKeys.filter((k) => !exampleKeys.has(k) && !ALLOW_MISSING.has(k));
const extraNote = [...exampleKeys].filter((k) => !codeKeys.includes(k) && !ALLOW_MISSING.has(k));

console.log(`check:env-examples code=${codeKeys.length} example=${exampleKeys.size} missing=${missing.length}`);
if (missing.length) {
    console.log('missing from .env.example:');
    for (const k of missing) console.log(`  - ${k}`);
}
if (extraNote.length && process.env.CHECK_ENV_EXAMPLES_VERBOSE === '1') {
    console.log('in .env.example but not seen in scanned code (ok if docs-only):');
    for (const k of extraNote.slice(0, 30)) console.log(`  - ${k}`);
}

if (missing.length && ENFORCE) {
    console.error('check:env-examples FAIL (enforce)');
    process.exit(1);
}
if (missing.length) {
    console.log('REPORT-ONLY — add keys to .env.example or re-run with --enforce');
    process.exit(0);
}
console.log('OK');
process.exit(0);
