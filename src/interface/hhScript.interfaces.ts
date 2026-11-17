/**
 * HTTP DTOs for HH script routes — canonical home is `@market-hunter/contracts`.
 * @deprecated Prefer importing from `@market-hunter/contracts`.
 */
export type {
    CaptchaAnswerBody,
    HhJobListItem,
    HhJobQueuedResponse,
    HhJobStatusResponse,
    RefreshScriptBody,
    StartScriptBody,
    StopScriptBody,
    StopScriptResponse,
    SyncResumeBody,
} from '@market-hunter/contracts';

export type { HhJobKind as HhJobKindDto, HhJobStatus as HhJobStatusDto } from '@market-hunter/contracts';

/** @deprecated Use `HhJobQueuedResponse['mode']`. */
export type HhWorkerMode = 'queue';
