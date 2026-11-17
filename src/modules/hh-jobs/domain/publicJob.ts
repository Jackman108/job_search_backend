import fs from 'fs';
import type { HhJob, HhJobListItem, HhJobStatusResponse } from '@market-hunter/contracts';

/**
 * S3: map stored job → public poll DTO. Never expose payload / password / captchaAnswer.
 */
export function toPublicJobStatus(job: HhJob): HhJobStatusResponse {
    const hasCaptchaImage = Boolean(
        job.captchaImagePath && fs.existsSync(job.captchaImagePath) && fs.statSync(job.captchaImagePath).size > 32,
    );
    return {
        id: job.id,
        kind: job.kind,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        error: job.error,
        countersUpdated: job.countersUpdated === true,
        lastEvent: job.lastEvent,
        lastEventAt: job.lastEventAt,
        captchaSrc: job.captchaSrc,
        hasCaptchaImage,
        awaitingCaptcha: job.awaitingCaptcha === true,
        summary: job.summary,
    };
}

export function toPublicJobListItem(job: HhJob): HhJobListItem {
    return {
        id: job.id,
        kind: job.kind,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        error: job.error,
        lastEvent: job.lastEvent,
        summary: job.summary,
    };
}
