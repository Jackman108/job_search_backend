#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SKIP_DIR = new Set(['node_modules', 'dist', 'coverage', '.hh-jobs']);

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        if (SKIP_DIR.has(name)) continue;
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (name.endsWith('.test.ts')) out.push(full);
    }
    return out;
}

const files = [...walk('src'), ...walk(path.join('packages', 'hh-worker', 'src'))];
if (files.length === 0) {
    console.log('No *.test.ts files found');
    process.exit(0);
}

const tsxBin = path.join('node_modules', 'tsx', 'dist', 'cli.mjs');
const result = spawnSync(process.execPath, [tsxBin, '--test', ...files], {
    stdio: 'inherit',
    env: process.env,
    shell: false,
});
process.exit(result.status ?? 1);
