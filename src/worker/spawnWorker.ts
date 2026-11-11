import { spawn, type ChildProcessByStdio } from 'child_process';
import type { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { killProcessTree } from './killProcessTree.js';

/** jobId → detached worker PID (API process only). */
const workerPids = new Map<string, number>();

type PipedWorker = ChildProcessByStdio<null, Readable, Readable>;

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

/** Forward worker stdout/stderr into the API terminal (was stdio:ignore → silent HH jobs). */
function pipeWorkerLogs(jobId: string, child: PipedWorker): void {
    const flush = (stream: 'stdout' | 'stderr', chunk: Buffer | string): void => {
        const text = chunk.toString();
        for (const raw of text.split(/\r?\n/)) {
            const line = raw.trimEnd();
            if (!line) continue;
            const prefixed = `[hh-worker ${jobId}] ${line}`;
            if (stream === 'stderr') {
                logger.error(prefixed);
            } else {
                logger.info(prefixed);
            }
        }
    };

    child.stdout.on('data', (chunk: Buffer) => flush('stdout', chunk));
    child.stderr.on('data', (chunk: Buffer) => flush('stderr', chunk));
}

/** Spawn a detached worker for one job (queue mode). */
export function spawnWorker(jobId: string): void {
    const { command, args } = resolveWorkerSpawn();
    const child = spawn(command, [...args, jobId], {
        detached: true,
        // Pipe so HH progress/errors show in the API terminal; stdin ignored.
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: process.cwd(),
        env: process.env,
        windowsHide: true,
    });

    pipeWorkerLogs(jobId, child);

    if (child.pid) {
        workerPids.set(jobId, child.pid);
        logger.info(`HH worker spawned`, { jobId, pid: child.pid });
    } else {
        logger.error(`HH worker spawn returned no pid`, { jobId });
    }

    child.on('exit', (code, signal) => {
        workerPids.delete(jobId);
        if (code === 0) {
            logger.info(`HH worker exited`, { jobId, code });
        } else {
            logger.error(`HH worker exited`, { jobId, code, signal });
        }
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
