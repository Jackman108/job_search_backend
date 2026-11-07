import { logger } from './logger.js';

const MAX_QUERY_LEN = 500;

/** DB query failures — never echo secrets; truncate SQL for logs. */
export const logError = (error: Error, query: string, values: unknown[]): void => {
    const safeQuery = query.length > MAX_QUERY_LEN ? `${query.slice(0, MAX_QUERY_LEN)}…` : query;
    logger.error('Database query error', {
        message: error.message,
        query: safeQuery,
        valueCount: values.length,
    });
};
