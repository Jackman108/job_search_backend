#!/usr/bin/env node
/**
 * Fail if any .ts/.tsx under watched dirs exceeds MAX_LINES (default 300).
 * Aligns with file-structure / DEV_CHECKLIST rules.
 */
import fs from 'fs';
import path from 'path';

const MAX_LINES = Number(process.env.MAX_FILE_LINES || 300);
const ROOTS = ['src', path.join('packages', 'hh-worker', 'src')];
const SKIP_DIR = new Set(['node_modules', 'dist', 'coverage', '.hh-jobs']);
/** Known debt (QUALITY-MATRIX) — warn only; new offenders still fail. */
const ALLOWLIST = new Set([
    'src/routes/integration.routes.ts',
    'src/routes/user.routes.ts',
    'src/services/integrations/crypto/cryptoIntegrationService.ts',
    'src/services/integrations/webpay/webpayIntegrationService.ts',
    'src/services/integrations/common/signatureValidator.ts',
]);

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        if (SKIP_DIR.has(name)) continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
    }
    return out;
}

const offenders = [];
const allowed = [];
for (const root of ROOTS) {
    for (const file of walk(root)) {
        const rel = file.replace(/\\/g, '/');
        const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
        if (lines <= MAX_LINES) continue;
        if (ALLOWLIST.has(rel)) allowed.push({ file: rel, lines });
        else offenders.push({ file: rel, lines });
    }
}

for (const { file, lines } of allowed.sort((a, b) => b.lines - a.lines)) {
    console.warn(`check:structure WARN (allowlisted): ${lines}\t${file}`);
}

if (offenders.length === 0) {
    console.log(`check:structure OK (≤${MAX_LINES} lines; ${allowed.length} allowlisted)`);
    process.exit(0);
}

console.error(`check:structure FAIL — ${offenders.length} file(s) >${MAX_LINES} lines:`);
for (const { file, lines } of offenders.sort((a, b) => b.lines - a.lines)) {
    console.error(`  ${lines}\t${file}`);
}
process.exit(1);
