import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { killProcessTree } from './killProcessTree.js';

/** jobId → detached worker PID (API process only). */
const workerPids = new Map<string, number>();

/**
 * Resolve the detached worker entry.
 * Prefer `HH_WORKER_ENTRY`, then workspace package `bin/run.mjs`.
 */
export function resolveWorkerSpawn(): { command: string; args: string[] } {
    const envEntry = process.env.HH_WORKER_ENTRY?.trim();
    if (envEntry) {
        return { command: process.execPath, args: [path.resolve(envEntry)] };
    }

    const packageBin = path.resolve(process.cwd(), 'packages', 'hh-worker', 'bin', 'run.mjs');
    if (fs.existsSync(packageBin)) {
        return { command: process.execPath, args: [packageBin] };
    }

    throw new Error('HH worker entry not found: set HH_WORKER_ENTRY or ensure packages/hh-worker/bin/run.mjs exists');
}

/** Spawn a detached worker for one job (queue mode). */
export function spawnWorker(jobId: string): void {
    const { command, args } = resolveWorkerSpawn();
    const child = spawn(command, [...args, jobId], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd(),
        env: process.env,
        windowsHide: true,
    });
    if (child.pid) {
        workerPids.set(jobId, child.pid);
    }
    child.on('exit', () => {
        workerPids.delete(jobId);
    });
    child.unref();
}

/** Best-effort tree-kill of a tracked detached worker (no-op if already exited). */
export function killWorker(jobId: string): boolean {
    const pid = workerPids.get(jobId);
    if (!pid) {
        return false;
    }
    const killed = killProcessTree(pid);
    workerPids.delete(jobId);
    return killed;
}
