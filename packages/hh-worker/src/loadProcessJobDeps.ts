import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ProcessJobDeps } from './job/processJob.deps.js';

export type ProcessJobDepsFactory = () => ProcessJobDeps;

/** Default: API composition root (counters / repos / broadcast adapters). */
function defaultFactoryPath(): string {
    const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const backendRoot = path.resolve(packageRoot, '../..');
    return path.join(backendRoot, 'src', 'worker', 'createProcessJobDeps.ts');
}

/**
 * Resolve injectable ProcessJobDeps factory.
 * Override with `HH_WORKER_DEPS_FACTORY` (absolute or cwd-relative module path).
 */
export async function loadProcessJobDepsFactory(): Promise<ProcessJobDepsFactory> {
    const override = process.env.HH_WORKER_DEPS_FACTORY?.trim();
    const factoryFile = override ? path.resolve(override) : defaultFactoryPath();

    if (!fs.existsSync(factoryFile)) {
        throw new Error(`HH worker deps factory not found: ${factoryFile}`);
    }

    const mod = (await import(pathToFileURL(factoryFile).href)) as {
        createProcessJobDeps?: ProcessJobDepsFactory;
        default?: ProcessJobDepsFactory;
    };
    const factory = mod.createProcessJobDeps ?? mod.default;
    if (typeof factory !== 'function') {
        throw new Error(`HH worker deps factory must export createProcessJobDeps: ${factoryFile}`);
    }
    return factory;
}

export async function loadProcessJobDeps(): Promise<ProcessJobDeps> {
    const factory = await loadProcessJobDepsFactory();
    return factory();
}
