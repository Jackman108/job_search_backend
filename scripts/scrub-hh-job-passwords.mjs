#!/usr/bin/env node
/**
 * One-shot: clear payload.password on all `.hh-jobs/*.json` (S2 cleanup of legacy files).
 */
import fs from 'fs';
import path from 'path';

const dir = process.env.HH_JOBS_DIR
    ? path.resolve(process.env.HH_JOBS_DIR)
    : path.resolve(process.cwd(), '.hh-jobs');

if (!fs.existsSync(dir)) {
    console.log(`scrub-hh-job-passwords: no dir ${dir}`);
    process.exit(0);
}

let scrubbed = 0;
for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const full = path.join(dir, name);
    let job;
    try {
        job = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch {
        console.warn(`skip corrupt ${name}`);
        continue;
    }
    if (!job?.payload || typeof job.payload !== 'object') continue;
    if (!job.payload.password) continue;
    job.payload.password = '';
    fs.writeFileSync(full, JSON.stringify(job, null, 2), 'utf8');
    scrubbed += 1;
    console.log(`scrubbed ${name}`);
}
console.log(`scrub-hh-job-passwords: done (${scrubbed} files)`);
