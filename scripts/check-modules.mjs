#!/usr/bin/env node
/**
 * Modular-monolith boundary checker.
 * Default: report-only (exit 0) until modules are extracted.
 * Enforce: CHECK_MODULES_ENFORCE=1 or --enforce (fails on violations for known modules).
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const MODULES_DIR = path.join(SRC, 'modules');
const ENFORCE = process.argv.includes('--enforce') || process.env.CHECK_MODULES_ENFORCE === '1';
/** Modules that must pass scaffold + deep-import rules even in report-only mode. */
const ENFORCE_MODULES = new Set(
    (
        process.env.CHECK_MODULES_ENFORCE_LIST ||
        'notifications,search-profile,hh-jobs,vacancies,feedback,resume,profile,subscriptions,payments'
    )
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
);

const REQUIRED_README_SECTIONS = ['## Public API', '## Tables', '## Env', '## Routes', '## Security'];

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

function listModules() {
    if (!fs.existsSync(MODULES_DIR)) return [];
    return fs
        .readdirSync(MODULES_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
}

function checkModuleScaffold(name) {
    const base = path.join(MODULES_DIR, name);
    const issues = [];
    for (const req of ['README.md', 'index.ts', 'module.config.ts']) {
        if (!fs.existsSync(path.join(base, req))) {
            issues.push(`missing ${req}`);
        }
    }
    const readmePath = path.join(base, 'README.md');
    if (fs.existsSync(readmePath)) {
        const text = fs.readFileSync(readmePath, 'utf8');
        for (const section of REQUIRED_README_SECTIONS) {
            if (!text.includes(section)) {
                issues.push(`README missing section "${section}"`);
            }
        }
    }
    return issues;
}

/** Detect deep imports into another module (not via index). */
function findDeepModuleImports(file) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const src = fs.readFileSync(file, 'utf8');
    const issues = [];
    const re = /from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(src))) {
        const spec = m[1];
        const match = spec.match(/(?:^|\/)modules\/([a-z0-9-]+)\/(.+)$/);
        if (!match) continue;
        const [, mod, rest] = match;
        if (rest === 'index' || rest === 'index.js' || rest === 'index.ts') continue;
        // allow importing within same module
        if (rel.includes(`/modules/${mod}/`)) continue;
        issues.push(`${rel} imports modules/${mod}/${rest} (use modules/${mod} public API)`);
    }
    return issues;
}

const modules = listModules();
const scaffoldIssues = [];
for (const name of modules) {
    for (const issue of checkModuleScaffold(name)) {
        scaffoldIssues.push(`modules/${name}: ${issue}`);
    }
}

const deepIssues = [];
for (const file of walk(SRC)) {
    deepIssues.push(...findDeepModuleImports(file));
}

const report = [];
report.push(`check:modules modules=${modules.length || 0} [${modules.join(', ') || 'none yet'}]`);
if (scaffoldIssues.length) {
    report.push(`scaffold issues (${scaffoldIssues.length}):`);
    for (const i of scaffoldIssues) report.push(`  - ${i}`);
}
if (deepIssues.length) {
    report.push(`deep-import issues (${deepIssues.length}):`);
    for (const i of deepIssues) report.push(`  - ${i}`);
}

const enforcedScaffold = scaffoldIssues.filter((i) => [...ENFORCE_MODULES].some((m) => i.startsWith(`modules/${m}:`)));
const enforcedDeep = deepIssues.filter((i) =>
    [...ENFORCE_MODULES].some((m) => i.includes(`/modules/${m}/`) || i.includes(`modules/${m}/`)),
);

const hasProblems = scaffoldIssues.length > 0 || deepIssues.length > 0;
const hasEnforcedProblems = enforcedScaffold.length > 0 || enforcedDeep.length > 0;

if (!hasProblems) {
    report.push(ENFORCE ? 'OK (enforce all)' : `OK (report-only; enforced=[${[...ENFORCE_MODULES]}])`);
    console.log(report.join('\n'));
    process.exit(0);
}

if (!ENFORCE && !hasEnforcedProblems) {
    report.push(
        `REPORT-ONLY — not failing CI for non-enforced modules (enforced=[${[...ENFORCE_MODULES]}]; set CHECK_MODULES_ENFORCE=1 or --enforce for all)`,
    );
    console.log(report.join('\n'));
    process.exit(0);
}

console.error(report.join('\n'));
if (ENFORCE || hasEnforcedProblems) {
    process.exit(1);
}
process.exit(0);
