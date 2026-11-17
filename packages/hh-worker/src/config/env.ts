export type Environment = 'production' | 'development' | 'test';

/** Slim env flags for the detached worker (no dotenv / upload paths). */
export const ENV = {
    NODE_ENV: (process.env.NODE_ENV || 'development') as Environment,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
};
