/**
 * Optional Seq sink (E7). Default logging stays console-only.
 * When SEQ_URL is set, best-effort CLEF POST — never throws to callers.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SEQ_LEVEL: Record<LogLevel, string> = {
    debug: 'Debug',
    info: 'Information',
    warn: 'Warning',
    error: 'Error',
};

let warnedMissing = false;
let warnedFail = false;
let seqEnabled: boolean | null = null;

/** Resolve once per process; empty/unset → sink disabled. */
export function resolveSeqUrl(): string | null {
    if (seqEnabled === false) {
        return null;
    }
    const raw = process.env.SEQ_URL?.trim();
    if (!raw) {
        seqEnabled = false;
        return null;
    }
    seqEnabled = true;
    return raw.replace(/\/$/, '');
}

/** CLEF line for Seq `/api/events/raw?clef`. Exported for unit tests. */
export function buildClefEvent(level: LogLevel, message: string, meta?: unknown, service = 'backend'): string {
    const event: Record<string, unknown> = {
        '@t': new Date().toISOString(),
        '@mt': message,
        '@l': SEQ_LEVEL[level],
        Service: service,
    };
    if (meta !== undefined) {
        event.Meta = meta;
    }
    return JSON.stringify(event);
}

/**
 * Fire-and-forget ship to Seq. Console path remains authoritative.
 * Failures: warn once, then silent (quality-bar: no ERROR spam / no crash).
 */
export function shipToSeq(level: LogLevel, message: string, meta?: unknown): void {
    const base = resolveSeqUrl();
    if (!base) {
        return;
    }

    const url = `${base}/api/events/raw?clef`;
    const body = buildClefEvent(level, message, meta);

    void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.serilog.clef' },
        body,
    }).catch((err: unknown) => {
        if (!warnedFail) {
            warnedFail = true;
            const detail = err instanceof Error ? err.message : String(err);
            // Use console directly to avoid recursive shipToSeq.
            console.warn(`[seqSink] SEQ_URL unreachable (${detail}); further Seq errors suppressed`);
        }
    });
}

/** Boot hint when SEQ_URL is configured (once). */
export function warnSeqConfiguredOnce(): void {
    const base = resolveSeqUrl();
    if (!base || warnedMissing) {
        return;
    }
    warnedMissing = true;
    console.log(`[seqSink] structured logs → Seq at ${base} (E7 optional profile)`);
}

/** Test helper: reset module latches. */
export function resetSeqSinkState(): void {
    warnedMissing = false;
    warnedFail = false;
    seqEnabled = null;
}
