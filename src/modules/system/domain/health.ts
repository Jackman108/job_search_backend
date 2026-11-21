export type HealthPayload = {
    status: 'ok';
    service: string;
    ts: string;
};

export const HEALTH_HTTP_PATH = '/health';
export const HEALTH_WS_PATH = '/health';

export const buildHealthPayload = (service: string): HealthPayload => ({
    status: 'ok',
    service,
    ts: new Date().toISOString(),
});
