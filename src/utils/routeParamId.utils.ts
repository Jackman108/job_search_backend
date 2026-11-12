/** Prefer URL :id; 400 if body.id is present and disagrees. */
export function resolveRouteParamId(param: string | undefined, bodyId: unknown, label = 'id'): number {
    const paramId = Number(param);
    if (!Number.isFinite(paramId) || paramId <= 0) {
        const err = new Error(`Invalid ${label}`);
        (err as Error & { status?: number }).status = 400;
        throw err;
    }
    if (bodyId !== undefined && bodyId !== null && String(bodyId) !== '') {
        const fromBody = Number(bodyId);
        if (Number.isFinite(fromBody) && fromBody !== paramId) {
            const err = new Error(`URL ${label} does not match body.id`);
            (err as Error & { status?: number }).status = 400;
            throw err;
        }
    }
    return paramId;
}
