import { execFileSync } from 'child_process';

/**
 * Best-effort kill of a process and its children (Chrome under Puppeteer).
 * Windows: taskkill /T. Unix: signal the process group when possible.
 */
export function killProcessTree(pid: number): boolean {
    try {
        if (process.platform === 'win32') {
            execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
                stdio: 'ignore',
                windowsHide: true,
            });
            return true;
        }
        try {
            process.kill(-pid, 'SIGTERM');
        } catch {
            process.kill(pid, 'SIGTERM');
        }
        return true;
    } catch {
        return false;
    }
}
