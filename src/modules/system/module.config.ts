/** Env / feature flags for system (health + OpenAPI). None required. */
export const systemConfig = {
    healthPath: '/health',
    swaggerMount: '/api-docs',
};

export function validateSystemConfig(): void {
    if (!systemConfig.healthPath.startsWith('/')) {
        throw new Error('systemConfig.healthPath must start with /');
    }
    if (!systemConfig.swaggerMount.startsWith('/')) {
        throw new Error('systemConfig.swaggerMount must start with /');
    }
}
