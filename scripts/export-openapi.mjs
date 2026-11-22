#!/usr/bin/env node
/**
 * E4: export OpenAPI 3 JSON from swagger-jsdoc (same sources as /api-docs).
 *
 *   yarn openapi:export
 *   yarn openapi:check   # export to temp + diff against committed openapi/openapi.json
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'openapi', 'openapi.json');
const mode = process.argv.includes('--check') ? 'check' : 'export';

const runner = `
import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerOptions } from '../src/config/swagger.config.ts';

const spec = swaggerJSDoc(swaggerOptions);
const out = path.join(process.cwd(), 'openapi', 'openapi.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
const json = JSON.stringify(spec, null, 2) + '\\n';
if (process.env.OPENAPI_OUT) {
  fs.writeFileSync(process.env.OPENAPI_OUT, json);
} else {
  fs.writeFileSync(out, json);
}
console.log('openapi paths=', Object.keys(spec.paths || {}).length, '→', process.env.OPENAPI_OUT || out);
`;

const tmp = path.join(ROOT, 'scripts', '.export-openapi-tmp.mts');
fs.writeFileSync(tmp, runner);

const env = { ...process.env };
if (mode === 'check') {
    env.OPENAPI_OUT = path.join(ROOT, 'openapi', '.openapi.check.json');
}

const r = spawnSync('yarn', ['tsx', tmp], { cwd: ROOT, env, encoding: 'utf8', shell: true });
fs.unlinkSync(tmp);
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
if (r.status !== 0) process.exit(r.status || 1);

if (mode === 'check') {
    const committed = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    const fresh = fs.readFileSync(env.OPENAPI_OUT, 'utf8');
    fs.unlinkSync(env.OPENAPI_OUT);
    if (committed !== fresh) {
        console.error('openapi:check FAIL — run yarn openapi:export and commit openapi/openapi.json');
        process.exit(1);
    }
    console.log('openapi:check OK');
}
