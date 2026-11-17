import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '@interface';
import { hhJobsConfig } from '../module.config.js';

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

/**
 * S10: per-user sliding-window limit on HH enqueue routes
 * (/start, /refresh, /sync-resume).
 */
export function hhEnqueueRateLimit(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const userId = req.userId;
    if (!userId) {
        next();
        return;
    }
    const now = Date.now();
    const windowMs = hhJobsConfig.enqueueWindowMs;
    const max = hhJobsConfig.enqueueMaxPerWindow;
    const bucket = buckets.get(userId) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length >= max) {
        const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - bucket.timestamps[0]!)) / 1000));
        res.setHeader('Retry-After', String(retryAfterSec));
        res.status(429).json({
            code: 'HH_ENQUEUE_RATE_LIMIT',
            message: `Too many HH jobs. Retry in ~${retryAfterSec}s.`,
        });
        return;
    }
    bucket.timestamps.push(now);
    buckets.set(userId, bucket);
    next();
}

/** Test helper — clear in-memory buckets. */
export function resetHhEnqueueRateLimit(): void {
    buckets.clear();
}
