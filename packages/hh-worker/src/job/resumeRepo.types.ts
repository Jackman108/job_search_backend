import type { MappedHhResume } from '@market-hunter/hh-worker/types';

/** Persist HH-mapped resume stack into Market Hunter DB. */
export type ResumeRepo = {
    upsertFromHh: (userId: string, mapped: MappedHhResume) => Promise<void>;
};
