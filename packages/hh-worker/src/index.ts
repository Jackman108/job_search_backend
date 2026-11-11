/**
 * Public API for `@market-hunter/hh-worker`.
 * Scenarios + job store + processJob (counters/broadcast/vacancy+feedback repos via ProcessJobDeps).
 */
export { getFeedback } from './run/getFeedback.js';
export { sendFeedback } from './run/sendFeedback.js';
export * from './job/index.js';
