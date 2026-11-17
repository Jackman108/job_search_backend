export interface Counters {
    successfullySubmittedCount: number;
    skippedCount: number;
    failedCount: number;
    failReasons?: Record<string, number>;
}
